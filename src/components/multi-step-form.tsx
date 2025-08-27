"use client"

import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { FormInput } from "@/src/components/ui/form-input"
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react"
import { ThemeToggle } from "@/src/components/theme-toggle"
import { Logo } from "@/src/components/logo"
import { useFormData } from "@/lib/hooks/useFormData"
import { useFormValidation } from "@/lib/hooks/useFormValidation"
import { DynamicQuestion } from "@/src/components/dynamic-question"
import { AnswersSummary } from "@/src/components/answers-summary"
import { submitForm } from "@/lib/services/submission"
import { SubmissionResponse } from "@/lib/types/database"
import { formatPhoneMask, removePhoneMask } from "@/lib/schemas/form-validation"
import { z } from "zod"

export default function MultiStepForm() {
  const {
    steps,
    currentStep,
    isLoading,
    isTransitioning,
    formData,

    nextStep,
    prevStep,
    updateAnswer,
    updateCandidateInfo,
    isStepCompleted,
    canProceed,

    isFormValid,
    validateCurrentStep
  } = useFormData()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<SubmissionResponse | null>(null)
  

  const { getFieldError, validateField } = useFormValidation()


  const nameSchema = z.string().min(2, "Nome deve ter pelo menos 2 caracteres")
  const emailSchema = z.string().email("Email inválido")
  const phoneSchema = z.string().min(10, "Telefone deve ter pelo menos 10 dígitos")

  const handleSubmit = async () => {
    if (!canProceed() || isSubmitting) return


    const validation = isFormValid()
    if (!validation.isValid) {
      const errorMessage = validation.errors?.join('\n') || validation.message
      toast.error(`Formulário inválido: ${errorMessage}`)
      return
    }


    const stepValidation = validateCurrentStep()
    if (!stepValidation.isValid) {
      toast.error(`Erros no formulário: ${stepValidation.errors.join(', ')}`)
      return
    }

    try {
      setIsSubmitting(true)
      const result = await submitForm(formData)
      

      if (!result.success && result.errors) {

      }
      
      setSubmissionResult(result)
    } catch (error) {

      setSubmissionResult({
        success: false,
        message: 'Erro inesperado. Tente novamente.',
        errors: [error instanceof Error ? error.message : 'Erro desconhecido']
      })
    } finally {
      setIsSubmitting(false)
    }
  }


  if (submissionResult) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-6" />
          <Card className="shadow-xl border-0">
            <CardContent className="p-8 text-center">
              {submissionResult.success ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-green-900/30">
                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                    Formulário Enviado!
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {submissionResult.message}
                  </p>
                  {submissionResult.fit_score !== undefined && (
                    <div className="bg-muted rounded-lg p-4 mb-6">
                      <p className="text-sm text-muted-foreground mb-1">Seu FitScore</p>
                      <p className="text-3xl font-bold text-primary">
                        {submissionResult.fit_score}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        {submissionResult.fit_label}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-red-900/30">
                    <ChevronRight className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">
                    Erro no Envio
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {submissionResult.message}
                  </p>
                  
                  {submissionResult.errors && submissionResult.errors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4 text-left">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                        Erros encontrados:
                      </h3>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        {submissionResult.errors.map((error, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-1">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => setSubmissionResult(null)}
                    variant="outline"
                  >
                    Tentar Novamente
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>


        {submissionResult.success && (
          <div className="mt-8">
            <AnswersSummary formData={formData} steps={steps} />
            

            <div className="text-center mt-8">
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border-primary/20 hover:border-primary/30"
              >
                Fazer Nova Avaliação
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }


  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-20">
          <Logo size="lg" className="justify-center mb-8" />
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Carregando perguntas...</span>
          </div>
        </div>
      </div>
    )
  }


  if (steps.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-20">
          <Logo size="lg" className="justify-center mb-8" />
          <p className="text-muted-foreground">
            Não foi possível carregar as perguntas. Tente recarregar a página.
          </p>
        </div>
      </div>
    )
  }

  const currentStepData = steps[currentStep - 1]

  const renderStepIndicator = () => {

    const allSteps = [
      { title: 'Dados', category: 'pessoais' },
      ...steps
    ]

    return (
      <div className="flex justify-center items-center space-x-4 mb-8">
        {allSteps.map((step, index) => (
          <div key={step.category} className="flex items-center">
            <div className={`
              flex items-center justify-center w-12 h-12 rounded-full border-2 
              transition-all duration-500 ease-out transform hover:scale-105 
              ${currentStep === index
                ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25' 
                : isStepCompleted(index)
                  ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-500/20 scale-105'
                  : currentStep > index
                    ? 'bg-muted border-muted-foreground text-muted-foreground'
                    : 'bg-background border-muted-foreground text-muted-foreground opacity-60'
              }
            `}>
              {isStepCompleted(index) && currentStep !== index ? (
                <Check className="w-5 h-5 animate-in zoom-in duration-300" />
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>
            {index < allSteps.length - 1 && (
              <div className="relative mx-3">
                <div className="w-16 h-0.5 bg-muted rounded-full" />
                <div className={`
                  absolute top-0 left-0 h-0.5 bg-gradient-to-r from-primary to-green-500 rounded-full 
                  transition-all duration-700 ease-out
                  ${currentStep > index ? 'w-full' : 'w-0'}
                `} />
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderQuestionsStep = () => {
    if (!currentStepData) return null
    
    return (
      <div className={`transform transition-all duration-300 ease-in-out ${
        isTransitioning 
          ? 'opacity-0 translate-x-4 scale-95' 
          : 'opacity-100 translate-x-0 scale-100'
      }`}>
        <div className="space-y-8">
          {currentStepData.questions.map((question, index) => {
            const answer = formData.answers.find(a => a.question_id === question.id)
            
            return (
              <DynamicQuestion
                key={question.id}
                question={question}
                answer={answer}
                onAnswerChange={updateAnswer}
                index={index}
              />
            )
          })}
        </div>
      </div>
    )
  }

  const renderCurrentStep = () => {
    if (currentStep === 0) {
      return renderCandidateInfoStep()
    }
    return renderQuestionsStep()
  }


  const renderCandidateInfoStep = () => (
    <div className={`transform transition-all duration-300 ease-in-out ${
      isTransitioning 
        ? 'opacity-0 translate-x-4 scale-95' 
        : 'opacity-100 translate-x-0 scale-100'
    }`}>
      <div className="space-y-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <FormInput
            id="candidate-name"
            type="text"
            label="Nome completo"
            placeholder="Digite seu nome completo"
            value={formData.candidate.name}
            onChange={(e) => {
              const value = e.target.value
              updateCandidateInfo({ name: value })

              validateField('name', value, nameSchema)
            }}
            onBlur={(e) => {

              validateField('name', e.target.value, nameSchema)
            }}
            error={getFieldError('name')}
            required
            className="w-full transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:border-primary/50 hover:border-primary/30"
          />
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
          <FormInput
            id="candidate-email"
            type="email"
            label="E-mail"
            placeholder="Digite seu e-mail"
            value={formData.candidate.email}
            onChange={(e) => {
              const value = e.target.value
              updateCandidateInfo({ email: value })

              validateField('email', value, emailSchema)
            }}
            onBlur={(e) => {

              validateField('email', e.target.value, emailSchema)
            }}
            error={getFieldError('email')}
            required
            className="w-full transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:border-primary/50 hover:border-primary/30"
          />
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms' }}>
          <FormInput
            id="candidate-phone"
            type="tel"
            label="Telefone"
            placeholder="(12) 1 1234-1234"
            value={formatPhoneMask(formData.candidate.phone || '')}
            onChange={(e) => {
              const formatted = formatPhoneMask(e.target.value)
              const unmasked = removePhoneMask(formatted)
              updateCandidateInfo({ phone: unmasked })

              validateField('phone', unmasked, phoneSchema)
            }}
            onBlur={(e) => {

              const unmasked = removePhoneMask(e.target.value)
              validateField('phone', unmasked, phoneSchema)
            }}
            error={getFieldError('phone')}
            required
            maxLength={16}
            className="w-full transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:border-primary/50 hover:border-primary/30"
          />
        </div>
      </div>
    </div>
  )

  const totalSteps = steps.length + 1
  const isLastStep = currentStep === totalSteps - 1

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
        <div className="text-center sm:text-left flex-1">
          <div className="flex justify-center sm:justify-start mb-6">
            <Logo size="lg" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent dark:from-white dark:to-gray-200">
            Avaliação Fit Score
          </h1>
          <p className="text-muted-foreground">
            Complete as etapas para avaliar seu desempenho, energia e cultura
          </p>
        </div>
        <div className="flex justify-center sm:justify-end">
          <ThemeToggle />
        </div>
      </div>

      {renderStepIndicator()}

      <Card className={`
        shadow-xl border-0 bg-gradient-to-br from-background to-background/90 backdrop-blur-sm 
        transition-all duration-500 transform hover:shadow-2xl
        ${isTransitioning ? 'scale-98 opacity-95' : 'scale-100 opacity-100'}
      `}>
        <CardHeader className="text-center pb-6">
          <CardTitle className={`
            text-2xl font-semibold transition-all duration-500 
            ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
          `}>
            {currentStepData?.title || 'Informações Pessoais'}
          </CardTitle>
          <CardDescription className={`
            text-base transition-all duration-500 delay-100
            ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
          `}>
            {currentStepData?.description || 'Complete suas informações para começar'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderCurrentStep()}
          
          <div className="flex justify-between pt-6 border-t border-border/50">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0 || isTransitioning}
              className={`
                flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 
                ${currentStep === 0 ? 'opacity-50' : 'hover:shadow-lg hover:border-primary/30'}
              `}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isTransitioning ? '-translate-x-1' : ''}`} />
              <span>Anterior</span>
            </Button>
            
            {!isLastStep ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed() || isTransitioning}
                className="flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
              >
                <span>Próximo</span>
                <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isTransitioning ? 'translate-x-1' : ''}`} />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isTransitioning || isSubmitting}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Finalizar Avaliação</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6 text-center text-sm text-muted-foreground animate-in fade-in duration-1000 delay-500">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-background/50 backdrop-blur-sm border border-border/30">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Seus dados são confidenciais e utilizados apenas para gerar seu Fit Score personalizado</span>
        </div>
      </div>
    </div>
  )
}
