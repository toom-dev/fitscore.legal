"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/src/components/ui/button"
import { FormInput } from "@/src/components/ui/form-input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { createClient } from '@/lib/supabase/client'
import { toast } from "sonner"
import Link from 'next/link'
import { useFormValidation } from '@/lib/hooks/useFormValidation'
import { z } from 'zod'

export function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  
  // Hook de validação visual
  const { getFieldError, validateField } = useFormValidation()
  
  // Schemas de validação
  const emailSchema = z.string().email("Email inválido")
  const passwordSchema = z.string().min(6, "Senha deve ter pelo menos 6 caracteres")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })

      if (error) {
        toast.error('Erro ao criar conta')
      } else {
        toast.success('Conta criada! Verifique seu email para confirmar.')
        router.push('/auth/sign-up-success')
      }
    } catch {
      toast.error('Erro inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Conta</CardTitle>
        <CardDescription>
          Crie uma conta para acessar o painel administrativo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => {
              const value = e.target.value
              setEmail(value)
              // Validação imediata em tempo real
              validateField('email', value, emailSchema)
            }}
            error={getFieldError('email')}
            placeholder="seu@email.com"
            required
          />
          <FormInput
            id="password"
            type="password"
            label="Senha"
            value={password}
            onChange={(e) => {
              const value = e.target.value
              setPassword(value)
              // Validação imediata em tempo real
              validateField('password', value, passwordSchema)
              // Revalidar confirmação de senha se já foi preenchida
              if (confirmPassword) {
                const updatedConfirmSchema = z.string().refine((val) => val === value, {
                  message: "As senhas não coincidem"
                })
                validateField('confirmPassword', confirmPassword, updatedConfirmSchema)
              }
            }}
            error={getFieldError('password')}
            placeholder="••••••••"
            required
          />
          <FormInput
            id="confirmPassword"
            type="password"
            label="Confirmar Senha"
            value={confirmPassword}
            onChange={(e) => {
              const value = e.target.value
              setConfirmPassword(value)
              // Validação imediata em tempo real
              const updatedConfirmSchema = z.string().refine((val) => val === password, {
                message: "As senhas não coincidem"
              })
              validateField('confirmPassword', value, updatedConfirmSchema)
            }}
            error={getFieldError('confirmPassword')}
            placeholder="••••••••"
            required
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Criando...' : 'Criar Conta'}
          </Button>
          <div className="text-center text-sm">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Fazer login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
