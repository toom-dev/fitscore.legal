import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const fitFilter = searchParams.get('fitFilter')?.split(',').filter(Boolean) || []
    
    const offset = (page - 1) * limit

    let query = supabase
      .from('candidates')
      .select(`
        id,
        name,
        email,
        phone,
        fit_score,
        fit_label,
        completed_at,
        created_at,
        updated_at,
        answers:answers(id, question_id)
      `, { count: 'exact' })

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (fitFilter.length > 0 && !fitFilter.includes('all')) {
      if (fitFilter.includes('pending')) {
        const otherFilters = fitFilter.filter(f => f !== 'pending')
        if (otherFilters.length > 0) {
          query = query.or(`fit_label.in.(${otherFilters.join(',')}),fit_label.is.null`)
        } else {
          query = query.is('fit_label', null)
        }
      } else {
        query = query.in('fit_label', fitFilter)
      }
    }

    const { data: candidatesData, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const candidatesWithAnswers = (candidatesData || []).map(candidate => {
      const answers = candidate.answers || []
      const uniqueQuestions = new Set(answers.map((a: any) => a.question_id))
      
      return {
        ...candidate,
        total_answers: answers.length,
        answered_questions: uniqueQuestions.size
      }
    })

    return NextResponse.json({
      candidates: candidatesWithAnswers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

      } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
