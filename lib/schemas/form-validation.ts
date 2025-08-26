import { z } from 'zod'

// ===============================================
// SCHEMAS ZOD PARA VALIDAÇÃO DO FORMULÁRIO
// ===============================================

// Schema para dados do candidato
export const candidateSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  
  email: z
    .string()
    .email('E-mail inválido')
    .max(255, 'E-mail deve ter no máximo 255 caracteres')
    .toLowerCase(),
  
  phone: z
    .string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .regex(/^[\d\s\(\)\-\+]+$/, 'Telefone deve conter apenas números, espaços e caracteres de formatação')
    .refine(
      (val) => {
        // Remove caracteres não numéricos para validar comprimento
        const cleanPhone = val.replace(/\D/g, '')
        return cleanPhone.length >= 10 && cleanPhone.length <= 11
      },
      'Telefone deve ter entre 10 e 11 dígitos'
    )
})

// Schema para uma resposta de pergunta single choice
export const singleChoiceAnswerSchema = z.object({
  question_id: z.string().uuid('ID da pergunta deve ser um UUID válido'),
  alternative_id: z.string().uuid('ID da alternativa deve ser um UUID válido'),
  text_answer: z.undefined().optional(),
  score: z.number().min(0, 'Pontuação não pode ser negativa')
})

// Schema para uma resposta de pergunta multiple choice
export const multipleChoiceAnswerSchema = z.object({
  question_id: z.string().uuid('ID da pergunta deve ser um UUID válido'),
  alternative_id: z
    .array(z.string().uuid('ID da alternativa deve ser um UUID válido'))
    .min(1, 'Pelo menos uma alternativa deve ser selecionada')
    .max(10, 'Máximo de 10 alternativas permitidas'),
  text_answer: z.undefined().optional(),
  score: z.number().min(0, 'Pontuação não pode ser negativa')
})

// Schema para uma resposta de pergunta open text
export const openTextAnswerSchema = z.object({
  question_id: z.string().uuid('ID da pergunta deve ser um UUID válido'),
  alternative_id: z.undefined().optional(),
  text_answer: z
    .string()
    .min(10, 'Resposta deve ter pelo menos 10 caracteres')
    .max(1000, 'Resposta deve ter no máximo 1000 caracteres'),
  score: z.number().min(0, 'Pontuação não pode ser negativa')
})

// Schema genérico para qualquer tipo de resposta
export const formAnswerSchema = z.discriminatedUnion('type', [
  singleChoiceAnswerSchema.extend({ type: z.literal('single_choice') }),
  multipleChoiceAnswerSchema.extend({ type: z.literal('multiple_choice') }),
  openTextAnswerSchema.extend({ type: z.literal('open_text') })
]).or(
  // Versão mais flexível para quando não temos o tipo explícito
  z.object({
    question_id: z.string().uuid(),
    alternative_id: z.union([
      z.string().uuid(),
      z.array(z.string().uuid()),
      z.undefined()
    ]).optional(),
    text_answer: z.string().optional(),
    score: z.number().min(0)
  })
)

// Schema para o formulário completo
export const formDataSchema = z.object({
  candidate: candidateSchema,
  answers: z
    .array(formAnswerSchema)
    .min(1, 'Pelo menos uma resposta é obrigatória')
    .max(50, 'Máximo de 50 respostas permitidas')
})

// Schema para validação de step específico
export const stepValidationSchema = z.object({
  stepIndex: z.number().min(0).max(10),
  isPersonalInfo: z.boolean(),
  candidate: candidateSchema.optional(),
  answers: z.array(formAnswerSchema).optional()
})

// ===============================================
// SCHEMAS PARA QUESTÕES (DATABASE)
// ===============================================

export const questionTypeSchema = z.enum(['single_choice', 'multiple_choice', 'open_text'])

export const alternativeSchema = z.object({
  id: z.string().uuid(),
  question_id: z.string().uuid(),
  text: z.string().min(1, 'Texto da alternativa é obrigatório').max(500),
  value: z.number().int().min(0).max(100),
  order_index: z.number().int().min(0)
})

export const questionSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(['performance', 'energia', 'cultura']),
  title: z.string().min(1, 'Título da pergunta é obrigatório').max(500),
  description: z.string().max(1000).optional(),
  type: questionTypeSchema,
  order_index: z.number().int().min(0),
  is_active: z.boolean(),
  alternatives: z.array(alternativeSchema).optional()
})

// ===============================================
// SCHEMAS PARA SUBMISSÃO E RESULTADO
// ===============================================

export const fitLabelSchema = z.enum(['Fit Altíssimo', 'Fit Aprovado', 'Fit Questionável', 'Fora do Perfil'])

export const submissionResponseSchema = z.object({
  success: z.boolean(),
  candidate_id: z.string().uuid().optional(),
  fit_score: z.number().int().min(0).max(200).optional(),
  fit_label: fitLabelSchema.optional(),
  message: z.string(),
  errors: z.array(z.string()).optional()
})

// ===============================================
// FUNÇÕES DE VALIDAÇÃO
// ===============================================

/**
 * Valida dados do candidato
 */
export function validateCandidate(data: unknown) {
  return candidateSchema.safeParse(data)
}

/**
 * Valida uma resposta específica
 */
export function validateFormAnswer(data: unknown) {
  return formAnswerSchema.safeParse(data)
}

/**
 * Valida formulário completo
 */
export function validateFormData(data: unknown) {
  return formDataSchema.safeParse(data)
}

/**
 * Valida resposta baseada no tipo da pergunta
 */
export function validateAnswerByType(
  data: unknown, 
  questionType: 'single_choice' | 'multiple_choice' | 'open_text'
) {
  switch (questionType) {
    case 'single_choice':
      return singleChoiceAnswerSchema.safeParse(data)
    case 'multiple_choice':
      return multipleChoiceAnswerSchema.safeParse(data)
    case 'open_text':
      return openTextAnswerSchema.safeParse(data)
    default:
      return { success: false, error: new Error('Tipo de pergunta inválido') }
  }
}

/**
 * Valida se o email tem formato correto (mais rigoroso)
 */
export function validateEmail(email: string) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email)
}

/**
 * Aplica máscara de telefone brasileiro (12) 1 1234-1234
 */
export function formatPhoneMask(value: string): string {
  if (!value) return ''
  
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '')
  
  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11)
  
  // Aplica a máscara baseado no comprimento
  if (limited.length <= 2) {
    return `(${limited}`
  } else if (limited.length <= 3) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
  } else if (limited.length <= 7) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 3)} ${limited.slice(3)}`
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 3)} ${limited.slice(3, 7)}-${limited.slice(7)}`
  }
}

/**
 * Remove máscara do telefone, deixando apenas números
 */
export function removePhoneMask(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Valida telefone brasileiro
 */
export function validateBrazilianPhone(phone: string) {
  if (!phone) return false // Telefone é obrigatório
  
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Verifica se tem 10 ou 11 dígitos (com ou sem 9º dígito)
  return cleanPhone.length >= 10 && cleanPhone.length <= 11
}

/**
 * Sanitiza e formata dados do candidato
 */
export function sanitizeCandidate(data: unknown) {
  const result = candidateSchema.safeParse(data)
  if (!result.success) return null
  
  return {
    ...result.data,
    name: result.data.name.trim(),
    email: result.data.email.trim().toLowerCase(),
    phone: result.data.phone.replace(/\D/g, '') // Remove formatação, mantém apenas números
  }
}

/**
 * Valida e limita seleções múltiplas
 */
export function validateMultipleChoiceLimit(
  selectedIds: string[], 
  maxSelections: number = 10
) {
  if (selectedIds.length === 0) {
    return { success: false, error: 'Pelo menos uma opção deve ser selecionada' }
  }
  
  if (selectedIds.length > maxSelections) {
    return { 
      success: false, 
      error: `Máximo de ${maxSelections} opções permitidas` 
    }
  }
  
  // Verificar se não há duplicatas
  const uniqueIds = [...new Set(selectedIds)]
  if (uniqueIds.length !== selectedIds.length) {
    return { success: false, error: 'Opções duplicadas detectadas' }
  }
  
  return { success: true, data: uniqueIds }
}

// ===============================================
// TIPOS TYPESCRIPT INFERIDOS DOS SCHEMAS
// ===============================================

export type CandidateData = z.infer<typeof candidateSchema>
export type FormAnswerData = z.infer<typeof formAnswerSchema>
export type FormData = z.infer<typeof formDataSchema>
export type QuestionData = z.infer<typeof questionSchema>
export type AlternativeData = z.infer<typeof alternativeSchema>
export type SubmissionResponseData = z.infer<typeof submissionResponseSchema>
export type FitLabel = z.infer<typeof fitLabelSchema>

// ===============================================
// MENSAGENS DE ERRO CUSTOMIZADAS
// ===============================================

export const errorMessages = {
  required: 'Este campo é obrigatório',
  email: 'Digite um e-mail válido',
  minLength: (min: number) => `Mínimo de ${min} caracteres`,
  maxLength: (max: number) => `Máximo de ${max} caracteres`,
  phone: 'Digite um telefone válido no formato (12) 1 1234-1234',
  uuid: 'Identificador inválido',
  positiveNumber: 'Valor deve ser positivo',
  selection: 'Selecione uma opção',
  multipleSelection: (min: number, max: number) => 
    `Selecione entre ${min} e ${max} opções`
} as const
