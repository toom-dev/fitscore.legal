import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SubmissionData {
  candidateId: string
  answers: Array<{
    questionId: string
    alternativeId?: string
    textValue?: string
    score: number
  }>
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { candidateId, answers }: SubmissionData = await request.json()

    if (!candidateId || !answers || answers.length === 0) {
      return NextResponse.json(
        { error: 'Dados de submissão inválidos' },
        { status: 400 }
      )
    }

    const answersToInsert = answers.map(answer => ({
      candidate_id: candidateId,
      question_id: answer.questionId,
      alternative_id: answer.alternativeId || null,
      text_value: answer.textValue || null,
      score: answer.score,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { error: insertError } = await supabase
      .from('answers')
      .insert(answersToInsert)

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0)
    
    let fitLabel = 'baixo'
    if (totalScore >= 80) {
      fitLabel = 'alto'
    } else if (totalScore >= 60) {
      fitLabel = 'médio'
    }

    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        fit_score: totalScore,
        fit_label: fitLabel,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      totalScore,
      fitLabel
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
