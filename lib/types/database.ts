export interface Question {
  id: string
  category: 'performance' | 'energia' | 'cultura'
  title: string
  description?: string
  type: 'single_choice' | 'multiple_choice' | 'open_text'
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Alternative {
  id: string
  question_id: string
  text: string
  value: number
  order_index: number
  created_at: string
}

export interface QuestionWithAlternatives extends Question {
  alternatives: Alternative[]
}

export interface Candidate {
  id: string
  name: string
  email: string
  phone?: string
  fit_score?: number
  fit_label?: FitLabel
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Answer {
  id: string
  candidate_id: string
  question_id: string
  alternative_id?: string
  text_answer?: string
  score: number
  created_at: string
}

export type FitLabel = 'Fit Altíssimo' | 'Fit Aprovado' | 'Fit Questionável' | 'Fora do Perfil'

export interface FormAnswer {
  question_id: string
  alternative_id?: string | string[]
  text_answer?: string
  score: number
}

export interface FormData {
  candidate: {
    name: string
    email: string
    phone: string
  }
  answers: FormAnswer[]
}

export function calculateFitLabel(score: number): FitLabel {
  if (score >= 80) return 'Fit Altíssimo'
  if (score >= 60) return 'Fit Aprovado' 
  if (score >= 40) return 'Fit Questionável'
  return 'Fora do Perfil'
}

export const fitLabelColors = {
  'Fit Altíssimo': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', border: 'border-green-200 dark:border-green-800' },
  'Fit Aprovado': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-200 dark:border-blue-800' },
  'Fit Questionável': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-200 dark:border-yellow-800' },
  'Fora do Perfil': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', border: 'border-red-200 dark:border-red-800' }
}

export interface QuestionWithAlternativesView {
  id: string
  category: string
  title: string
  description?: string
  type: string
  order_index: number
  is_active: boolean
  alternatives: Alternative[]
}

export interface CandidateSummaryView extends Candidate {
  total_answers: number
  answered_questions: number
}

export interface StepData {
  category: 'performance' | 'energia' | 'cultura'
  title: string
  description: string
  questions: QuestionWithAlternatives[]
}

export interface SubmissionResponse {
  success: boolean
  candidate_id?: string
  fit_score?: number
  fit_label?: FitLabel
  message: string
  errors?: string[]
}
