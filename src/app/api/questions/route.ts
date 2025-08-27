import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: viewData, error: viewError } = await supabase
      .from('questions_with_alternatives')
      .select('*')
      .order('category', { ascending: true })
      .order('order_index', { ascending: true })

    if (viewError) {
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .order('category', { ascending: true })
        .order('order_index', { ascending: true })

      if (questionsError) {
        return NextResponse.json({ error: questionsError.message }, { status: 500 })
      }

      const questionsWithAlternatives = await Promise.all(
        (questionsData || []).map(async (question) => {
          const { data: alternatives, error: altError } = await supabase
            .from('alternatives')
            .select('*')
            .eq('question_id', question.id)
            .order('order_index', { ascending: true })

          if (altError) {
            return {
              ...question,
              alternatives: []
            }
          }

          return {
            ...question,
            alternatives: alternatives || []
          }
        })
      )

      return NextResponse.json({ questions: questionsWithAlternatives })
    }

    return NextResponse.json({ questions: viewData || [] })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { questionId, is_active } = await request.json()

    const { error } = await supabase
      .from('questions')
      .update({ is_active })
      .eq('id', questionId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
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
    const questionId = searchParams.get('id')

    if (!questionId) {
      return NextResponse.json({ error: 'ID da pergunta é obrigatório' }, { status: 400 })
    }

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
