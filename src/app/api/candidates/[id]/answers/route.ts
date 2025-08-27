import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: candidateId } = await params

    const { data: answersData, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: true })

    if (answersError) {
      return NextResponse.json({ error: answersError.message }, { status: 500 })
    }

    if (!answersData || answersData.length === 0) {
      return NextResponse.json({ answers: [] })
    }

    const questionIds = [...new Set(answersData.map(a => a.question_id))]
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .in('id', questionIds)

    if (questionsError) {
      return NextResponse.json({ error: questionsError.message }, { status: 500 })
    }

    const alternativeIds = answersData
      .filter(a => a.alternative_id)
      .map(a => a.alternative_id)
    
    let alternativesData = []
    if (alternativeIds.length > 0) {
      const { data: altData, error: altError } = await supabase
        .from('alternatives')
        .select('*')
        .in('id', alternativeIds)
      
      if (altError) {
        return NextResponse.json({ error: altError.message }, { status: 500 })
      }
      
      alternativesData = altData || []
    }

    const questionsMap = new Map(questionsData?.map(q => [q.id, q]) || [])
    const alternativesMap = new Map(alternativesData.map(a => [a.id, a]))

    const groupedAnswers = new Map()
    
    answersData.forEach(answer => {
      const question = questionsMap.get(answer.question_id)
      if (!question) return

      const key = answer.question_id
      if (!groupedAnswers.has(key)) {
        groupedAnswers.set(key, {
          question,
          answers: []
        })
      }

      const alternative = answer.alternative_id ? alternativesMap.get(answer.alternative_id) : null
      
      groupedAnswers.get(key).answers.push({
        ...answer,
        alternative
      })
    })

    const formattedAnswers = Array.from(groupedAnswers.values())

    return NextResponse.json({ answers: formattedAnswers })

      } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
