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

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error('Email ou senha incorretos')
      } else {
        toast.success('Login realizado com sucesso!')
        router.push('/admin')
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
        <CardTitle>Entrar</CardTitle>
        <CardDescription>
          Faça login para acessar o painel administrativo
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
            onBlur={(e) => validateField('email', e.target.value, emailSchema)}
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
            }}
            onBlur={(e) => validateField('password', e.target.value, passwordSchema)}
            error={getFieldError('password')}
            placeholder="••••••••"
            required
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
          <div className="text-center text-sm">
            <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">
              Esqueceu sua senha?
            </Link>
          </div>
          <div className="text-center text-sm">
            Não tem conta?{' '}
            <Link href="/auth/sign-up" className="text-blue-600 hover:underline">
              Criar conta
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
