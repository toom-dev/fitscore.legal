"use client"

import { useState, useEffect } from 'react'
import { StepData, FormData as FormDataType, FormAnswer } from '@/lib/types/database'
import { getQuestionsForForm } from '@/lib/services/questions'
import { calculateAnswerScore, validateCompleteForm } from '@/lib/services/submission'
import { 
  validateCandidate, 
  validateFormAnswer
} from '@/lib/schemas/form-validation'

interface UseFormDataReturn {
  // Estados
  steps: StepData[]
  currentStep: number
  isLoading: boolean
  isTransitioning: boolean
  formData: FormDataType
  
  // Ações
  setCurrentStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  updateAnswer: (questionId: string, answer: Partial<FormAnswer>) => void
  updateCandidateInfo: (info: Partial<FormDataType['candidate']>) => void
  
  // Validações
  isStepCompleted: (stepIndex: number) => boolean
  canProceed: () => boolean
  getTotalQuestions: () => number
  getTotalSteps: () => number
  isFormValid: () => { isValid: boolean; message?: string; errors?: string[] }
  validateCurrentStep: () => { isValid: boolean; errors: string[] }
}

export function useFormData(): UseFormDataReturn {
  const [steps, setSteps] = useState<StepData[]>([])
  const [currentStep, setCurrentStep] = useState(0) // Começar no step 0 (informações pessoais)
  const [isLoading, setIsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [formData, setFormData] = useState<FormDataType>({
    candidate: {
      name: '',
      email: '',
      phone: ''
    },
    answers: []
  })

  // Carregar perguntas do Supabase
  useEffect(() => {
    async function loadQuestions() {
      try {
        setIsLoading(true)
        const questionsData = await getQuestionsForForm()
        setSteps(questionsData)
        
        // Inicializar respostas vazias para todas as perguntas
        const initialAnswers: FormAnswer[] = []
        questionsData.forEach(step => {
          step.questions.forEach(question => {
            initialAnswers.push({
              question_id: question.id,
              score: 0
            })
          })
        })
        
        setFormData(prev => ({
          ...prev,
          answers: initialAnswers
        }))
      } catch (error) {

      } finally {
        setIsLoading(false)
      }
    }

    loadQuestions()
  }, [])

  // Navegação entre steps (incluindo step 0 para informações pessoais)
  const totalSteps = steps.length + 1 // +1 para o step de informações pessoais
  
  const handleNextStep = () => {
    if (currentStep < totalSteps - 1 && !isTransitioning) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        setTimeout(() => setIsTransitioning(false), 50)
      }, 150)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 0 && !isTransitioning) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setTimeout(() => setIsTransitioning(false), 50)
      }, 150)
    }
  }

  // Atualizar resposta de uma pergunta com validação
  const updateAnswer = (questionId: string, answer: Partial<FormAnswer>) => {
    setFormData(prev => {
      const existingAnswerIndex = prev.answers.findIndex(a => a.question_id === questionId)
      const updatedAnswers = [...prev.answers]
      
      // Preparar nova resposta
      const newAnswer = {
        question_id: questionId,
        score: 0,
        ...answer
      }

      // Validar a resposta antes de salvar
      const validation = validateFormAnswer(newAnswer)
      if (!validation.success) {
        // Ainda assim vamos salvar para não quebrar a UX, mas loggar o erro
      }

      if (existingAnswerIndex >= 0) {
        updatedAnswers[existingAnswerIndex] = {
          ...updatedAnswers[existingAnswerIndex],
          ...newAnswer
        }
      } else {
        updatedAnswers.push(newAnswer)
      }
      
      return {
        ...prev,
        answers: updatedAnswers
      }
    })
  }

  // Atualizar informações do candidato com validação
  const updateCandidateInfo = (info: Partial<FormDataType['candidate']>) => {
    setFormData(prev => {
      const updatedCandidate = {
        ...prev.candidate,
        ...info
      }

      // Validar dados do candidato
      const validation = validateCandidate(updatedCandidate)
      if (!validation.success) {
        // Ainda assim vamos salvar para não quebrar a UX, mas loggar o erro
      }

      return {
        ...prev,
        candidate: updatedCandidate
      }
    })
  }

  // Verificar se um step está completo usando validação Zod
  const isStepCompleted = (stepIndex: number): boolean => {
    // Step 0: Informações pessoais
    if (stepIndex === 0) {
      const candidateValidation = validateCandidate(formData.candidate)
      return candidateValidation.success
    }
    
    // Steps das perguntas técnicas (1, 2, 3...)
    const questionStepIndex = stepIndex - 1
    if (questionStepIndex < 0 || questionStepIndex >= steps.length) return false
    
    const step = steps[questionStepIndex]
    if (!step) return false

    // Verificar se todas as perguntas do step foram respondidas usando validação Zod
    return step.questions.every(question => {
      const answer = formData.answers.find(a => a.question_id === question.id)
      if (!answer) return false
      
      // Usar validação Zod para cada resposta
      const answerValidation = validateFormAnswer(answer)
      if (!answerValidation.success) return false
      
      // Validações específicas por tipo de pergunta
      if (question.type === 'open_text') {
        return !!(answer.text_answer && answer.text_answer.trim().length >= 10)
      }
      
      if (question.type === 'multiple_choice') {
        return Array.isArray(answer.alternative_id) && answer.alternative_id.length > 0
      }
      
      return !!(answer.alternative_id && typeof answer.alternative_id === 'string')
    })
  }

  // Verificar se pode prosseguir
  const canProceed = (): boolean => {
    return isStepCompleted(currentStep)
  }

  // Obter total de perguntas (sem contar o step de informações pessoais)
  const getTotalQuestions = (): number => {
    return steps.reduce((total, step) => total + step.questions.length, 0)
  }

  // Obter total de steps (incluindo informações pessoais)
  const getTotalSteps = (): number => {
    return totalSteps
  }

  // Validar formulário completo usando Zod
  const isFormValid = () => {
    return validateCompleteForm(formData, getTotalQuestions())
  }

  // Validar step específico com mensagens detalhadas
  const validateCurrentStep = (): { isValid: boolean, errors: string[] } => {
    const errors: string[] = []

    if (currentStep === 0) {
      // Validar informações pessoais
      const candidateValidation = validateCandidate(formData.candidate)
      if (!candidateValidation.success) {
        candidateValidation.error.issues.forEach(err => {
          errors.push(`${err.path.join('.')}: ${err.message}`)
        })
      }
    } else {
      // Validar perguntas do step atual
      const questionStepIndex = currentStep - 1
      if (questionStepIndex >= 0 && questionStepIndex < steps.length) {
        const step = steps[questionStepIndex]
        
        step.questions.forEach(question => {
          const answer = formData.answers.find(a => a.question_id === question.id)
          if (!answer) {
            errors.push(`Pergunta "${question.title}" deve ser respondida`)
            return
          }

          const answerValidation = validateFormAnswer(answer)
          if (!answerValidation.success) {
            answerValidation.error.issues.forEach(err => {
              errors.push(`Pergunta "${question.title}" - ${err.message}`)
            })
          }
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Calcular pontuação automática quando resposta muda (com validação)
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      answers: prev.answers.map(answer => {
        // Encontrar a pergunta correspondente
        const question = steps.flatMap(s => s.questions).find(q => q.id === answer.question_id)
        if (!question) return answer

        // Calcular pontuação baseada na resposta com validação
        const score = calculateAnswerScore(
          question.type,
          answer.alternative_id,
          question.alternatives,
          answer.text_answer
        )

        // Validar pontuação calculada
        if (typeof score !== 'number' || score < 0) {

          return { ...answer, score: 0 }
        }

        return {
          ...answer,
          score
        }
      })
    }))
  }, [formData.answers.map(a => `${a.question_id}-${JSON.stringify(a.alternative_id)}-${a.text_answer}`).join(''), steps])

  return {
    // Estados
    steps,
    currentStep,
    isLoading,
    isTransitioning,
    formData,
    
    // Ações
    setCurrentStep,
    nextStep: handleNextStep,
    prevStep: handlePrevStep,
    updateAnswer,
    updateCandidateInfo,
    
    // Validações
    isStepCompleted,
    canProceed,
    getTotalQuestions,
    getTotalSteps,
    isFormValid,
    validateCurrentStep
  }
}
