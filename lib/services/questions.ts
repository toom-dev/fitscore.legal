import { createClient } from '@/lib/supabase/client'
import { QuestionWithAlternatives, StepData } from '@/lib/types/database'

const supabase = createClient()

/**
 * Busca todas as perguntas ativas com suas alternativas
 * Organiza por categoria para os steps do formulário
 */
export async function getQuestionsForForm(): Promise<StepData[]> {
  try {
    const { data, error } = await supabase
      .from('questions_with_alternatives')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('order_index')

    if (error) {
      console.error('Erro ao buscar perguntas:', error)
      return []
    }

    // Organizar por categorias
    const questionsByCategory = data.reduce((acc, question) => {
      if (!acc[question.category]) {
        acc[question.category] = []
      }
      acc[question.category].push(question as QuestionWithAlternatives)
      return acc
    }, {} as Record<string, QuestionWithAlternatives[]>)

    // Converter para formato StepData
    const steps: StepData[] = [
      {
        category: 'performance',
        title: 'Performance',
        description: 'Avalie aspectos de desempenho profissional',
        questions: questionsByCategory.performance || []
      },
      {
        category: 'energia', 
        title: 'Energia',
        description: 'Avalie aspectos energéticos e motivacionais',
        questions: questionsByCategory.energia || []
      },
      {
        category: 'cultura',
        title: 'Cultura',
        description: 'Avalie aspectos culturais e valores',
        questions: questionsByCategory.cultura || []
      }
    ]

    return steps.filter(step => step.questions.length > 0)

  } catch (error) {
    console.error('Erro inesperado ao buscar perguntas:', error)
    return []
  }
}

/**
 * Busca uma pergunta específica com suas alternativas
 */
export async function getQuestionById(id: string): Promise<QuestionWithAlternatives | null> {
  try {
    const { data, error } = await supabase
      .from('questions_with_alternatives')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('Erro ao buscar pergunta:', error)
      return null
    }

    return data as QuestionWithAlternatives

  } catch (error) {
    console.error('Erro inesperado ao buscar pergunta:', error)
    return null
  }
}

/**
 * Busca perguntas de uma categoria específica
 */
export async function getQuestionsByCategory(category: 'performance' | 'energia' | 'cultura'): Promise<QuestionWithAlternatives[]> {
  try {
    const { data, error } = await supabase
      .from('questions_with_alternatives')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('order_index')

    if (error) {
      console.error(`Erro ao buscar perguntas da categoria ${category}:`, error)
      return []
    }

    return (data || []) as QuestionWithAlternatives[]

  } catch (error) {
    console.error(`Erro inesperado ao buscar perguntas da categoria ${category}:`, error)
    return []
  }
}
