import { createClient } from '@/lib/supabase/client'
import { FormData, calculateFitLabel, SubmissionResponse } from '@/lib/types/database'
import { 
  validateFormData, 
  validateFormAnswer,
  sanitizeCandidate,
  validateMultipleChoiceLimit 
} from '@/lib/schemas/form-validation'
import { NotificationService } from '@/lib/services/notifications'
import { toast } from 'sonner'

const supabase = createClient()

async function updateCandidateCompletion(
  candidateId: string, 
  totalScore: number, 
  fitLabel: string
): Promise<boolean> {
  const { data: candidate, error } = await supabase
    .from('candidates')
    .update({
      fit_score: totalScore,
      fit_label: fitLabel,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', candidateId)

  if (error) {
    return false
  }

  return true
}

export async function submitForm(formData: FormData): Promise<SubmissionResponse> {
  try {
    const formValidation = validateFormData(formData)
    if (!formValidation.success) {
      const errors = formValidation.error.issues.map(err => 
        `${err.path.join('.')}: ${err.message}`
      )
      toast.error('Dados do formulário inválidos')
      return {
        success: false,
        message: 'Dados do formulário inválidos',
        errors
      }
    }


    const candidateData = sanitizeCandidate(formData.candidate)
    if (!candidateData) {
      toast.error('Dados do candidato inválidos')
      return {
        success: false,
        message: 'Dados do candidato inválidos'
      }
    }


    const validationErrors: string[] = []
    for (const [index, answer] of formData.answers.entries()) {
      const answerValidation = validateFormAnswer(answer)
      if (!answerValidation.success) {
        const errors = answerValidation.error.issues.map(err => 
          `Resposta ${index + 1} - ${err.path.join('.')}: ${err.message}`
        )
        validationErrors.push(...errors)
      }
    }

    if (validationErrors.length > 0) {
      toast.error('Algumas respostas são inválidas')
      return {
        success: false,
        message: 'Algumas respostas são inválidas',
        errors: validationErrors
      }
    }


    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .insert(candidateData)
      .select()
      .single()

    if (candidateError || !candidate) {
      // Verificar se é erro de duplicação de email
      if (candidateError?.code === '23505' && candidateError?.details?.includes('email')) {
        toast.error('Este e-mail já foi utilizado. Tente com outro e-mail.')
        return {
          success: false,
          message: 'Este e-mail já foi utilizado. Tente com outro e-mail.'
        }
      }
      
      toast.error('Erro ao salvar dados do candidato. Verifique os dados e tente novamente.')
      return {
        success: false,
        message: 'Erro ao salvar dados do candidato. Verifique os dados e tente novamente.'
      }
    }


    let totalScore = 0
    const answersToInsert = []
    
    for (const answer of formData.answers) {

      if (typeof answer.score !== 'number' || answer.score < 0) {
        toast.error('Pontuação inválida detectada')
        return {
          success: false,
          message: 'Pontuação inválida detectada'
        }
      }
      
      totalScore += answer.score
      

      if (Array.isArray(answer.alternative_id)) {

        for (const altId of answer.alternative_id) {
          const answerData = {
            candidate_id: candidate.id,
            question_id: answer.question_id,
            alternative_id: altId,
            text_answer: null,
            score: Math.round(answer.score / answer.alternative_id.length)
          }
          answersToInsert.push(answerData)
        }
      } else {

        const answerData = {
          candidate_id: candidate.id,
          question_id: answer.question_id,
          alternative_id: answer.alternative_id || null,
          text_answer: answer.text_answer || null,
          score: answer.score
        }
        answersToInsert.push(answerData)
      }
    }
    

    if (totalScore < 0 || totalScore > 200) {
      toast.error('Pontuação total inválida')
      return {
        success: false,
        message: 'Pontuação total inválida'
      }
    }


    const { error: answersError } = await supabase
      .from('answers')
      .insert(answersToInsert)

    if (answersError) {

      

      await supabase.from('candidates').delete().eq('id', candidate.id)
      
      toast.error('Erro ao salvar respostas. Tente novamente.')
      return {
        success: false,
        message: 'Erro ao salvar respostas. Tente novamente.'
      }
    }

    const fitLabel = calculateFitLabel(totalScore);
    
    const updateSuccess = await updateCandidateCompletion(
      candidate.id,
      totalScore,
      fitLabel
    )

    if (!updateSuccess) {

    }
    toast.success('Formulário enviado com sucesso!')

    return {
      success: true,
      candidate_id: candidate.id,
      fit_score: totalScore,
      fit_label: fitLabel,
      message: 'Formulário enviado com sucesso!'
    }

  } catch (error) {

    toast.error('Erro inesperado. Tente novamente mais tarde.')
    return {
      success: false,
      message: 'Erro inesperado. Tente novamente mais tarde.'
    }
  }
}


export function calculateAnswerScore(
  questionType: string,
  alternativeId?: string | string[],
  alternatives: Array<{ id: string; value: number }> = [],
  textAnswer?: string
): number {
  if (!alternativeId && !textAnswer) return 0

  switch (questionType) {
    case 'single_choice':
      if (typeof alternativeId === 'string') {
        const alternative = alternatives.find(alt => alt.id === alternativeId)
        const score = alternative?.value || 0
        
        // Validar se a pontuação é válida
        if (typeof score !== 'number' || score < 0 || score > 100) {

          return 0
        }
        
        return score
      }
      return 0

    case 'multiple_choice':
      if (Array.isArray(alternativeId)) {
        // Validar limite de seleções
        const limitValidation = validateMultipleChoiceLimit(alternativeId, 10)
        if (!limitValidation.success) {

          return 0
        }
        
        let totalScore = 0
        for (const id of alternativeId) {
          const alternative = alternatives.find(alt => alt.id === id)
          const score = alternative?.value || 0
          
          if (typeof score === 'number' && score >= 0 && score <= 100) {
            totalScore += score
          }
        }
        
        // Aplicar limite máximo de pontuação para multiple choice (evita gaming)
        return Math.min(totalScore, 50) // Máximo 50 pontos por pergunta múltipla
      }
      return 0

    case 'open_text':
      if (!textAnswer?.trim()) return 0
      
      // Validar comprimento mínimo
      if (textAnswer.trim().length < 10) return 0
      
      // Pontuação baseada na qualidade da resposta (pode ser expandido)
      const length = textAnswer.trim().length
      if (length < 50) return 5   // Resposta curta
      if (length < 100) return 8  // Resposta média
      return 10                   // Resposta completa

    default:

      return 0
  }
}

/**
 * Valida pontuação calculada
 */
export function validateCalculatedScore(score: number, questionType: string): boolean {
  if (typeof score !== 'number' || isNaN(score) || score < 0) {
    return false
  }
  
  // Limites por tipo de pergunta
  const maxScores = {
    'single_choice': 100,
    'multiple_choice': 50, // Limitado para evitar inflação
    'open_text': 10
  }
  
  const maxScore = maxScores[questionType as keyof typeof maxScores] || 0
  return score <= maxScore
}

/**
 * Valida se todas as perguntas obrigatórias foram respondidas
 * Agora usa Zod para validação mais robusta
 */
export function validateFormDataLegacy(formData: FormData, totalQuestions: number): { isValid: boolean, message?: string } {
  // Usar validação Zod primeiro
  const zodValidation = validateFormData(formData)
  if (!zodValidation.success) {
    const firstError = zodValidation.error.issues[0]
    return { 
      isValid: false, 
      message: `${firstError.path.join('.')}: ${firstError.message}` 
    }
  }

  // Validações específicas adicionais
  if (formData.answers.length !== totalQuestions) {
    return { isValid: false, message: 'Todas as perguntas devem ser respondidas' }
  }

  // Verificar se todas as respostas têm conteúdo adequado
  for (const [index, answer] of formData.answers.entries()) {
    if (!answer.alternative_id && !answer.text_answer?.trim()) {
      return { isValid: false, message: `Pergunta ${index + 1} deve ser respondida` }
    }
    
    // Validar text_answer se presente
    if (answer.text_answer && answer.text_answer.trim().length < 10) {
      return { isValid: false, message: `Resposta da pergunta ${index + 1} muito curta (mínimo 10 caracteres)` }
    }
    
    // Validar multiple choice limits
    if (Array.isArray(answer.alternative_id)) {
      const limitValidation = validateMultipleChoiceLimit(answer.alternative_id, 10)
      if (!limitValidation.success) {
        return { isValid: false, message: `Pergunta ${index + 1}: ${limitValidation.error}` }
      }
    }
  }

  return { isValid: true }
}

/**
 * Nova função de validação principal usando Zod
 */
export function validateCompleteForm(formData: FormData, totalQuestions: number): { isValid: boolean, message?: string, errors?: string[] } {
  const zodValidation = validateFormData(formData)
  
  if (!zodValidation.success) {
    const errors = zodValidation.error.issues.map(err => 
      `${err.path.join('.')}: ${err.message}`
    )
    
    return {
      isValid: false,
      message: 'Formulário contém erros de validação',
      errors
    }
  }

  // Validação de contagem de perguntas
  if (formData.answers.length !== totalQuestions) {
    return {
      isValid: false,
      message: `Esperado ${totalQuestions} respostas, recebido ${formData.answers.length}`
    }
  }

  return { isValid: true }
}
