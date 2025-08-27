"use client"

import { useState, useCallback } from 'react'
import { ZodError, ZodSchema } from 'zod'

interface ValidationState {
  [key: string]: string | undefined
}

interface UseFormValidationReturn {
  errors: ValidationState
  validateField: (fieldName: string, value: unknown, schema: ZodSchema) => boolean
  validateForm: (data: unknown, schema: ZodSchema) => boolean
  clearError: (fieldName: string) => void
  clearAllErrors: () => void
  hasErrors: boolean
  getFieldError: (fieldName: string) => string | undefined
}

export function useFormValidation(): UseFormValidationReturn {
  const [errors, setErrors] = useState<ValidationState>({})

  const validateField = useCallback((fieldName: string, value: unknown, schema: ZodSchema): boolean => {
    try {
      schema.parse(value)
      // Se passou na validação, limpar erro do campo
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
      return true
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0]
        setErrors(prev => ({
          ...prev,
          [fieldName]: firstError.message
        }))
      }
      return false
    }
  }, [])

  const validateForm = useCallback((data: unknown, schema: ZodSchema): boolean => {
    try {
      schema.parse(data)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: ValidationState = {}
        error.issues.forEach(issue => {
          const fieldName = issue.path.join('.')
          if (!newErrors[fieldName]) {
            newErrors[fieldName] = issue.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }, [])

  const clearError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return errors[fieldName]
  }, [errors])

  const hasErrors = Object.keys(errors).length > 0

  return {
    errors,
    validateField,
    validateForm,
    clearError,
    clearAllErrors,
    hasErrors,
    getFieldError
  }
}
