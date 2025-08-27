import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: candidatesData, error } = await supabase
      .from('candidates')
      .select(`
        id,
        name,
        email,
        fit_score,
        fit_label,
        completed_at,
        created_at,
        answers:answers(id, question_id)
      `)

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

    const total = candidatesWithAnswers.length
    const completed = candidatesWithAnswers.filter(c => c.completed_at).length
    const completedCandidates = candidatesWithAnswers.filter(c => c.fit_score !== null)
    const avgScore = completedCandidates.length > 0 
      ? Math.round(completedCandidates.reduce((sum, c) => sum + (c.fit_score || 0), 0) / completedCandidates.length)
      : 0

    const classification = {
      alto: candidatesWithAnswers.filter(c => c.fit_label === 'alto').length,
      médio: candidatesWithAnswers.filter(c => c.fit_label === 'médio').length,
      baixo: candidatesWithAnswers.filter(c => c.fit_label === 'baixo').length,
      pending: candidatesWithAnswers.filter(c => !c.fit_label).length
    }

    const recentCandidates = candidatesWithAnswers
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

    return NextResponse.json({
      stats: { total, completed, avgScore },
      classification,
      recentCandidates
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
