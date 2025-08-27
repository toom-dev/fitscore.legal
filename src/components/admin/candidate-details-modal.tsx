"use client"

import React, { useState, useEffect } from 'react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Separator } from "@/src/components/ui/separator"
import { Skeleton } from "@/src/components/ui/skeleton"
import { createClient } from '@/lib/supabase/client'
import { CandidateSummaryView, fitLabelColors } from '@/lib/types/database'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Award,
  MessageSquare,
  Target,
  // Loader2,
  X
} from 'lucide-react'

interface CandidateAnswer {
  id: string
  question_id: string
  alternative_id?: string
  text_answer?: string
  score: number
  created_at: string
  question: {
    id: string
    title: string
    description?: string
    category: string
    type: string
  }
  alternative?: {
    id: string
    text: string
    value: number
  }
  multipleAlternatives?: {
    id: string
    text: string
    value: number
  }[]
}

interface CandidateDetailsModalProps {
  candidate: CandidateSummaryView | null
  isOpen: boolean
  onClose: () => void
}

export function CandidateDetailsModal({ candidate, isOpen, onClose }: CandidateDetailsModalProps) {
  const [answers, setAnswers] = useState<CandidateAnswer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  React.useEffect(() => {
    if (isOpen) {
      const style = document.createElement('style')
      style.textContent = `
        [data-radix-popper-content-wrapper] {
          width: 100vw !important;
          height: 100vh !important;
          max-width: none !important;
          left: 0 !important;
          top: 0 !important;
          transform: none !important;
          margin: 0 !important;
        }
        [data-slot="dialog-content"] {
          width: 100vw !important;
          height: 100vh !important;
          max-width: none !important;
          left: 0 !important;
          top: 0 !important;
          transform: none !important;
          margin: 0 !important;
          position: fixed !important;
          inset: 0 !important;
        }
      `
      document.head.appendChild(style)
      return () => {
        document.head.removeChild(style)
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && candidate) {
      loadCandidateAnswers()
    }
  }, [isOpen, candidate])

  const loadCandidateAnswers = async () => {
    if (!candidate) return

    try {
      setIsLoading(true)
      

      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('candidate_id', candidate.id)
        .order('created_at', { ascending: true })

      if (answersError) {
        return
      }

      if (!answersData || answersData.length === 0) {
        setAnswers([])
        return
      }


      const questionIds = [...new Set(answersData.map(a => a.question_id))]
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds)


      const alternativeIds = answersData
        .filter(a => a.alternative_id)
        .map(a => a.alternative_id)
      
      let alternativesData = []
      if (alternativeIds.length > 0) {
        const { data: altData, error: altError } = await supabase
          .from('alternatives')
          .select('*')
          .in('id', alternativeIds)

        
        alternativesData = altData || []
      }


      const answersMap = new Map<string, CandidateAnswer>()
      
      answersData.forEach(answer => {
        const question = questionsData?.find(q => q.id === answer.question_id)
        const alternative = alternativesData.find(alt => alt.id === answer.alternative_id)
        
        const questionKey = answer.question_id
        
        if (answersMap.has(questionKey)) {
          const existingAnswer = answersMap.get(questionKey)!
          
          if (!existingAnswer.multipleAlternatives) {
            existingAnswer.multipleAlternatives = existingAnswer.alternative ? [existingAnswer.alternative] : []
          }
          
          if (alternative) {
            existingAnswer.multipleAlternatives.push(alternative)
          }
          
          existingAnswer.score += answer.score
          
        } else {
          const formattedAnswer: CandidateAnswer = {
            id: answer.id,
            question_id: answer.question_id,
            alternative_id: answer.alternative_id,
            text_answer: answer.text_answer,
            score: answer.score,
            created_at: answer.created_at,
            question: question || {
              id: answer.question_id,
              title: 'Pergunta não encontrada',
              description: '',
              category: 'unknown',
              type: 'single_choice'
            },
            alternative: alternative,
            multipleAlternatives: question?.type === 'multiple_choice' && alternative ? [alternative] : undefined
          }
          
          answersMap.set(questionKey, formattedAnswer)
        }
      })

      const formattedAnswers = Array.from(answersMap.values())
      setAnswers(formattedAnswers)
      
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFitLabelStyle = (label: string | null) => {
    if (!label) return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' }
    return fitLabelColors[label as keyof typeof fitLabelColors] || fitLabelColors['Fora do Perfil']
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Target className="w-4 h-4" />
      case 'energia': return <Award className="w-4 h-4" />
      case 'cultura': return <MessageSquare className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'performance': return 'Performance'
      case 'energia': return 'Energia'
      case 'cultura': return 'Cultura'
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
      case 'energia': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
      case 'cultura': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
    }
  }

  const groupedAnswers = answers.reduce((acc, answer) => {
    const category = answer.question.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(answer)
    return acc
  }, {} as Record<string, CandidateAnswer[]>)

  if (!candidate) return null

  const fitStyle = getFitLabelStyle(candidate.fit_label || null)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-none w-screen h-screen m-0 rounded-none border-0 p-0 fixed inset-0 translate-x-0 translate-y-0 left-0 top-0" 
        showCloseButton={false}
        style={{
          width: '100vw',
          height: '100vh',
          maxWidth: 'none',
          left: '0',
          top: '0',
          transform: 'none',
          margin: '0'
        }}
      >
        <div 
          className="flex flex-col h-full bg-background w-full"
          style={{ width: '100vw', height: '100vh' }}
        >
          <DialogHeader className="px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <User className="w-6 h-6" />
                  {candidate.name}
                </DialogTitle>
                <DialogDescription className="text-base">
                  Detalhes completos do candidato e suas respostas
                </DialogDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">

        <div className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{candidate.email}</p>
                  </div>
                </div>
                
                {candidate.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{candidate.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cadastrado em</p>
                    <p className="font-medium">{formatDate(candidate.created_at)}</p>
                  </div>
                </div>

                {candidate.completed_at && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Completado em</p>
                      <p className="font-medium">{formatDate(candidate.completed_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Resultado da Avaliação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.fit_score !== null ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {candidate.fit_score}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`${fitStyle.bg} ${fitStyle.text} ${fitStyle.border} text-sm px-3 py-1`}
                    >
                      {candidate.fit_label}
                    </Badge>
                  </div>
                  <div className="text-right text-muted-foreground">
                    <p className="text-sm">Total de respostas</p>
                    <p className="text-2xl font-semibold">{candidate.total_answers}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Avaliação em andamento</p>
                    <p className="text-sm">O candidato ainda não completou todas as respostas</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Respostas Detalhadas
              </CardTitle>
              <CardDescription>
                {isLoading ? 'Carregando respostas...' : `${answers.length} respostas encontradas`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : answers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma resposta encontrada</p>
                  <p className="text-sm">O candidato ainda não respondeu nenhuma pergunta</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedAnswers).map(([category, categoryAnswers]) => (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-4">
                        {getCategoryIcon(category)}
                        <Badge className={getCategoryColor(category)}>
                          {getCategoryLabel(category)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ({categoryAnswers.length} respostas)
                        </span>
                      </div>
                      
                      <div className="space-y-4 pl-6">
                        {categoryAnswers.map((answer, index) => (
                          <div key={answer.id} className="border-l-2 border-muted pl-4 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm mb-1">
                                  {index + 1}. {answer.question.title}
                                </h4>
                                {answer.question.description && (
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {answer.question.description}
                                  </p>
                                )}
                                
                                <div className="bg-muted/50 rounded-md p-3 mt-2">
                                  {answer.multipleAlternatives && answer.multipleAlternatives.length > 0 ? (
                                    <div className="text-sm">
                                      <span className="font-medium">Respostas (múltipla escolha):</span>
                                      <ul className="mt-1 space-y-1">
                                        {answer.multipleAlternatives.map((alt) => (
                                          <li key={alt.id} className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                                            {alt.text}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : answer.alternative ? (
                                    <p className="text-sm">
                                      <span className="font-medium">Resposta:</span> {answer.alternative.text}
                                    </p>
                                  ) : answer.text_answer ? (
                                    <p className="text-sm">
                                      <span className="font-medium">Resposta:</span> {answer.text_answer}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">Sem resposta</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-right ml-4">
                                <div className="text-lg font-bold text-primary">
                                  {answer.score}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  pontos
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {category !== Object.keys(groupedAnswers)[Object.keys(groupedAnswers).length - 1] && (
                        <Separator className="mt-6" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
