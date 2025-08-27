import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const now = new Date()
    
    // Buscar relatórios que precisam ser executados
    const { data: pendingReports, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('config->enabled', true)
      .lte('next_run', now.toISOString())

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const results = []

    for (const report of pendingReports || []) {
      try {
        let executionResult

        switch (report.type) {
          case 'approved_candidates':
            executionResult = await executeApprovedCandidatesReport(report, request.nextUrl.origin)
            break
          
          case 'daily_summary':
            executionResult = await executeDailySummaryReport(report, request.nextUrl.origin)
            break
            
          case 'weekly_summary':
            executionResult = await executeWeeklySummaryReport(report, request.nextUrl.origin)
            break
            
          default:
            throw new Error(`Tipo de relatório não suportado: ${report.type}`)
        }

        // Atualizar last_run e calcular next_run
        const nextRun = calculateNextRun(report.schedule)
        
        await supabase
          .from('scheduled_reports')
          .update({
            last_run: now.toISOString(),
            next_run: nextRun,
            updated_at: now.toISOString()
          })
          .eq('id', report.id)

        results.push({
          reportId: report.id,
          reportName: report.name,
          success: true,
          result: executionResult
        })

      } catch (error) {
        console.error(`Erro ao executar relatório ${report.id}:`, error)
        
        results.push({
          reportId: report.id,
          reportName: report.name,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    return NextResponse.json({
      success: true,
      executedReports: results.length,
      results
    })

  } catch (error) {
    console.error('Erro ao executar relatórios programados:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function executeApprovedCandidatesReport(report: any, baseUrl: string) {
  const config = report.config || {}
  const hours = config.hours || 12
  const minScore = config.minScore || 80
  
  const response = await fetch(`${baseUrl}/api/reports/approved`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      hours,
      minScore,
      notifyManager: config.notifyManager || true,
      managerEmail: config.managerEmail
    })
  })

  if (!response.ok) {
    throw new Error(`Erro na API de aprovados: ${response.statusText}`)
  }

  return await response.json()
}

async function executeDailySummaryReport(report: any, baseUrl: string) {
  // Implementar relatório diário
  const response = await fetch(`${baseUrl}/api/reports/daily-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(report.config || {})
  })

  if (!response.ok) {
    throw new Error(`Erro na API de resumo diário: ${response.statusText}`)
  }

  return await response.json()
}

async function executeWeeklySummaryReport(report: any, baseUrl: string) {
  // Implementar relatório semanal
  const response = await fetch(`${baseUrl}/api/reports/weekly-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(report.config || {})
  })

  if (!response.ok) {
    throw new Error(`Erro na API de resumo semanal: ${response.statusText}`)
  }

  return await response.json()
}

function calculateNextRun(cronExpression: string): string {
  const now = new Date()
  
  switch (cronExpression) {
    case '0 */12 * * *': // A cada 12 horas
      const next12h = new Date(now)
      next12h.setHours(next12h.getHours() + 12, 0, 0, 0)
      return next12h.toISOString()
      
    case '0 9 * * *': // Diário às 9h
      const nextDaily = new Date(now)
      nextDaily.setDate(nextDaily.getDate() + 1)
      nextDaily.setHours(9, 0, 0, 0)
      return nextDaily.toISOString()
      
    case '0 9 * * 1': // Semanal às segundas 9h
      const nextWeekly = new Date(now)
      const daysUntilMonday = (1 + 7 - nextWeekly.getDay()) % 7 || 7
      nextWeekly.setDate(nextWeekly.getDate() + daysUntilMonday)
      nextWeekly.setHours(9, 0, 0, 0)
      return nextWeekly.toISOString()
      
    default:
      const nextHour = new Date(now)
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
      return nextHour.toISOString()
  }
}
