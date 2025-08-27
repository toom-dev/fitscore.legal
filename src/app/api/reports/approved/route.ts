import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NotificationService } from '@/lib/services/notifications'

interface ApprovedCandidate {
  id: string
  name: string
  email: string
  phone: string | null
  fit_score: number
  fit_label: string
  completed_at: string
  created_at: string
}

interface ApprovedReport {
  reportDate: string
  period: string
  totalApproved: number
  candidates: ApprovedCandidate[]
  summary: {
    highFit: number
    averageScore: number
    completionRate: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Parâmetros opcionais para customizar o período
    const hoursBack = parseInt(searchParams.get('hours') || '12')
    const minScore = parseInt(searchParams.get('minScore') || '80')
    const notify = searchParams.get('notify') === 'true'
    
    // Calcular data de início do período (últimas X horas)
    const startDate = new Date(Date.now() - (hoursBack * 60 * 60 * 1000))
    
    // Buscar candidatos aprovados no período
    const { data: approvedCandidates, error } = await supabase
      .from('candidates')
      .select('id, name, email, phone, fit_score, fit_label, completed_at, created_at')
      .gte('fit_score', minScore)
      .gte('completed_at', startDate.toISOString())
      .order('fit_score', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calcular estatísticas do relatório
    const totalApproved = approvedCandidates?.length || 0
    const highFit = approvedCandidates?.filter(c => c.fit_score >= 90).length || 0
    const averageScore = totalApproved > 0 
      ? Math.round(approvedCandidates!.reduce((sum, c) => sum + c.fit_score, 0) / totalApproved)
      : 0

    // Buscar total de candidatos completados no período para taxa de aprovação
    const { count: totalCompleted } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .not('completed_at', 'is', null)
      .gte('completed_at', startDate.toISOString())

    const completionRate = totalCompleted && totalCompleted > 0 
      ? Math.round((totalApproved / totalCompleted) * 100)
      : 0

    const report: ApprovedReport = {
      reportDate: new Date().toISOString(),
      period: `Últimas ${hoursBack} horas`,
      totalApproved,
      candidates: approvedCandidates || [],
      summary: {
        highFit,
        averageScore,
        completionRate
      }
    }

    // Armazenar relatório gerado
    const { data: savedReport, error: saveError } = await supabase
      .from('generated_reports')
      .insert([{
        title: `Relatório de Candidatos Aprovados - ${new Date().toLocaleDateString('pt-BR')}`,
        type: 'approved_candidates',
        period_start: startDate.toISOString(),
        period_end: new Date().toISOString(),
        parameters: {
          hours: hoursBack,
          minScore,
          notify
        },
        summary: {
          totalApproved,
          highFit,
          averageScore,
          completionRate
        },
        data: {
          candidates: approvedCandidates || [],
          generatedAt: new Date().toISOString(),
          period: `Últimas ${hoursBack} horas`,
          criteria: `Score ≥ ${minScore}`
        },
        generated_by: 'system'
      }])
      .select()
      .single()

    if (saveError) {
      console.error('Erro ao salvar relatório:', saveError)
    }

    // Criar notificação sempre que um relatório for gerado
    if (totalApproved > 0) {
      await NotificationService.createNotification(
        `📊 Relatório de Aprovados Gerado`,
        `${totalApproved} candidatos aprovados encontrados nas últimas ${hoursBack}h com score ≥ ${minScore}. Score médio: ${averageScore} pontos.`,
        'success',
        'export_ready',
        {
          reportType: 'approved_candidates',
          reportId: savedReport?.id,
          period: `${hoursBack}h`,
          totalApproved,
          averageScore,
          highFit,
          completionRate
        }
      )
    } else {
      await NotificationService.createNotification(
        `📊 Relatório de Aprovados Gerado`,
        `Nenhum candidato aprovado encontrado nas últimas ${hoursBack}h com score ≥ ${minScore}.`,
        'info',
        'export_ready',
        {
          reportType: 'approved_candidates',
          reportId: savedReport?.id,
          period: `${hoursBack}h`,
          totalApproved: 0,
          minScore
        }
      )
    }

    return NextResponse.json({
      success: true,
      report
    })

  } catch (error) {
    console.error('Erro ao gerar relatório de aprovados:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { 
      hours = 12, 
      minScore = 80, 
      notifyManager = true,
      managerEmail 
    } = await request.json()

    // Gerar relatório
    const reportResponse = await fetch(`${request.nextUrl.origin}/api/reports/approved?hours=${hours}&minScore=${minScore}&notify=${notifyManager}`, {
      method: 'GET'
    })

    if (!reportResponse.ok) {
      throw new Error('Erro ao gerar relatório')
    }

    const { report } = await reportResponse.json()

    // Armazenar relatório gerado manualmente
    const { data: savedReport, error: saveError } = await supabase
      .from('generated_reports')
      .insert([{
        title: `Relatório Manual - Candidatos Aprovados - ${new Date().toLocaleDateString('pt-BR')}`,
        type: 'approved_candidates',
        period_start: new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString(),
        period_end: new Date().toISOString(),
        parameters: {
          hours,
          minScore,
          notifyManager,
          managerEmail
        },
        summary: report.summary,
        data: {
          ...report,
          generatedAt: new Date().toISOString(),
          generatedBy: 'manual'
        },
        generated_by: 'manual'
      }])
      .select()
      .single()

    if (saveError) {
      console.error('Erro ao salvar relatório manual:', saveError)
    }

    // Atualizar last_run do relatório programado correspondente (se existir)
    const { data: scheduledReports } = await supabase
      .from('scheduled_reports')
      .select('id')
      .eq('type', 'approved_candidates')
      .eq('config->enabled', true)
      .limit(1)

    if (scheduledReports && scheduledReports.length > 0) {
      await supabase
        .from('scheduled_reports')
        .update({
          last_run: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', scheduledReports[0].id)
    }

    // Se há candidatos aprovados, criar notificação detalhada
    if (report.totalApproved > 0) {
      const candidatesList = report.candidates
        .slice(0, 5) // Mostrar apenas os 5 primeiros
        .map((c: ApprovedCandidate) => `• ${c.name} (${c.fit_score} pts)`)
        .join('\n')

      const moreText = report.candidates.length > 5 
        ? `\n... e mais ${report.candidates.length - 5} candidatos`
        : ''

      await NotificationService.createNotification(
        '🎯 Relatório Executivo - Candidatos Aprovados',
        `Relatório das últimas ${hours}h:\n\n` +
        `✅ ${report.totalApproved} candidatos aprovados\n` +
        `⭐ ${report.summary.highFit} com score ≥ 90\n` +
        `📊 Score médio: ${report.summary.averageScore} pontos\n` +
        `📈 Taxa de aprovação: ${report.summary.completionRate}%\n\n` +
        `Top candidatos:\n${candidatesList}${moreText}`,
        'info',
        'system_alert',
        {
          reportType: 'executive_summary',
          reportId: savedReport?.id,
          period: `${hours}h`,
          ...report.summary,
          totalApproved: report.totalApproved,
          managerEmail
        }
      )
    } else {
      // Notificação quando não há aprovados
      await NotificationService.createNotification(
        '📊 Relatório de Aprovados - Sem novos candidatos',
        `Nenhum candidato foi aprovado nas últimas ${hours}h com score ≥ ${minScore}.`,
        'info',
        'system_alert',
        {
          reportType: 'no_approved',
          reportId: savedReport?.id,
          period: `${hours}h`,
          minScore
        }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Relatório gerado e notificação enviada',
      report
    })

  } catch (error) {
    console.error('Erro ao processar relatório:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
