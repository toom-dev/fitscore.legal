import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || ''
    const generatedBy = searchParams.get('generatedBy') || ''
    
    const offset = (page - 1) * limit

    let query = supabase
      .from('generated_reports')
      .select('*', { count: 'exact' })

    // Filtros opcionais
    if (type) {
      query = query.eq('type', type)
    }

    if (generatedBy) {
      query = query.eq('generated_by', generatedBy)
    }

    const { data: reports, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Buscar estatísticas
    const { data: stats } = await supabase
      .from('generated_reports_stats')
      .select('*')
      .single()

    return NextResponse.json({
      success: true,
      reports: reports || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: stats || {}
    })

  } catch (error) {
    console.error('Erro ao buscar relatórios gerados:', error)
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
      .from('generated_reports')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Relatório excluído com sucesso'
    })

  } catch (error) {
    console.error('Erro ao excluir relatório:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
