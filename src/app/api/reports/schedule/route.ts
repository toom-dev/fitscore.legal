import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ScheduledReport {
  id: string
  name: string
  type: 'approved_candidates' | 'daily_summary' | 'weekly_summary'
  schedule: string // cron expression
  config: {
    hours?: number
    minScore?: number
    notifyManager?: boolean
    managerEmail?: string
    enabled?: boolean
  }
  lastRun?: string
  nextRun?: string
  created_at: string
  updated_at: string
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: scheduledReports, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      reports: scheduledReports || []
    })

      } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const reportData = await request.json()

    // Validar dados obrigatórios
    if (!reportData.name || !reportData.type || !reportData.schedule) {
      return NextResponse.json(
        { error: 'Nome, tipo e agendamento são obrigatórios' },
        { status: 400 }
      )
    }

    // Calcular próxima execução baseada no cron
    const nextRun = calculateNextRun(reportData.schedule)

    const { data, error } = await supabase
      .from('scheduled_reports')
      .insert([{
        ...reportData,
        id: crypto.randomUUID(),
        next_run: nextRun,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      report: data
    })

      } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID do relatório é obrigatório' },
        { status: 400 }
      )
    }

    // Recalcular próxima execução se o schedule foi alterado
    if (updateData.schedule) {
      updateData.next_run = calculateNextRun(updateData.schedule)
    }

    const { data, error } = await supabase
      .from('scheduled_reports')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      report: data
    })

      } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do relatório é obrigatório' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('scheduled_reports')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Relatório removido com sucesso'
    })

      } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função auxiliar para calcular próxima execução
function calculateNextRun(cronExpression: string): string {
  // Implementação simplificada para alguns casos comuns
  // Em produção, use uma biblioteca como 'node-cron' ou 'cron-parser'
  
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
      // Fallback: próxima hora
      const nextHour = new Date(now)
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
      return nextHour.toISOString()
  }
}
