"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Separator } from "@/src/components/ui/separator"
import { FormData, StepData, FormAnswer, Alternative } from "@/lib/types/database"
import { CheckCircle, MessageSquare, List } from "lucide-react"

interface AnswersSummaryProps {
  formData: FormData
  steps: StepData[]
}

export function AnswersSummary({ formData, steps }: AnswersSummaryProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance':
        return '📊'
      case 'energia':
        return '⚡'
      case 'cultura':
        return '🏢'
      default:
        return '📝'
    }
  }

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'performance':
        return 'Performance'
      case 'energia':
        return 'Energia'
      case 'cultura':
        return 'Cultura'
      default:
        return category
    }
  }

  const getAnswerText = (answer: FormAnswer, question: any): string => {
    if (question.type === 'open_text') {
      return answer.text_answer || 'Não respondido'
    }

    if (question.type === 'multiple_choice' && Array.isArray(answer.alternative_id)) {
      const selectedAlternatives = question.alternatives.filter((alt: Alternative) => 
        answer.alternative_id?.includes(alt.id)
      )
      return selectedAlternatives.map((alt: Alternative) => alt.text).join(', ') || 'Não respondido'
    }

    if (question.type === 'single_choice' && typeof answer.alternative_id === 'string') {
      const selectedAlternative = question.alternatives.find((alt: Alternative) => 
        alt.id === answer.alternative_id
      )
      return selectedAlternative?.text || 'Não respondido'
    }

    return 'Não respondido'
  }

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'open_text':
        return <MessageSquare className="w-4 h-4" />
      case 'multiple_choice':
        return <List className="w-4 h-4" />
      case 'single_choice':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <CheckCircle className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Resumo das suas respostas</h3>
        <p className="text-muted-foreground">
          Confira suas respostas organizadas por categoria
        </p>
      </div>


      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            👤 Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome</p>
              <p className="font-medium">{formData.candidate.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">E-mail</p>
              <p className="font-medium">{formData.candidate.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Telefone</p>
              <p className="font-medium">{formData.candidate.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>


      {steps.map((step) => {
        const categoryAnswers = step.questions.map(question => {
          const answer = formData.answers.find(a => a.question_id === question.id)
          return { question, answer }
        }).filter(({ answer }) => answer)

        if (categoryAnswers.length === 0) return null

        return (
          <Card key={step.category} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-xl">{getCategoryIcon(step.category)}</span>
                {getCategoryTitle(step.category)}
                <Badge variant="secondary" className="ml-auto">
                  {categoryAnswers.length} {categoryAnswers.length === 1 ? 'resposta' : 'respostas'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryAnswers.map(({ question, answer }, index) => (
                <div key={question.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
                        {getQuestionIcon(question.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm leading-relaxed">
                          {question.title}
                        </h4>
                        {question.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {question.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-6 p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg border border-muted/20">
                      <p className="text-sm leading-relaxed text-foreground/90">
                        {answer ? getAnswerText(answer, question) : 'Não respondido'}
                      </p>
                      {answer && answer.score > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="outline" className="text-xs bg-primary/10 border-primary/20 text-primary">
                            {answer.score} {answer.score === 1 ? 'ponto' : 'pontos'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
