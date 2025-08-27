"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { ApiService } from '@/lib/services/api'
import { QuestionWithAlternatives } from '@/lib/types/database'
import { QuestionFormModal } from '@/src/components/admin/question-form-modal'
import { QuestionsSkeleton } from '@/src/components/admin/skeletons'
import { HelpCircle, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function PerguntasPage() {
  const [questions, setQuestions] = useState<QuestionWithAlternatives[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithAlternatives | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    byCategory: {
      performance: 0,
      energia: 0,
      cultura: 0
    }
  })

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      setIsLoading(true)
      
      const response = await ApiService.getQuestions()
      
      if (response.success && response.data) {
        setQuestions(response.data.questions as any)
      }
      
    } catch {
    } finally {
      setIsLoading(false)
    }
  }


  useEffect(() => {
    if (questions.length > 0) {
      const total = questions.length
      const active = questions.filter(q => q.is_active).length
      const byCategory = {
        performance: questions.filter(q => q.category === 'performance').length,
        energia: questions.filter(q => q.category === 'energia').length,
        cultura: questions.filter(q => q.category === 'cultura').length
      }

      setStats({ total, active, byCategory })
    }
  }, [questions])

  const toggleQuestionStatus = async (questionId: string, currentStatus: boolean) => {
    try {
      const response = await ApiService.toggleQuestionStatus(questionId, !currentStatus)

      if (!response.success) {
        toast.error(`Erro ao ${currentStatus ? 'desativar' : 'ativar'} pergunta: ${response.error}`)
        return
      }

      toast.success(`Pergunta ${currentStatus ? 'desativada' : 'ativada'} com sucesso`)
      loadQuestions()
    } catch {
      toast.error('Erro inesperado. Tente novamente.')
    }
  }

  const deleteQuestion = async (questionId: string, questionTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir a pergunta "${questionTitle}"?\n\nEsta ação não pode ser desfeita e também excluirá todas as alternativas e respostas relacionadas.`)) {
      return
    }

    try {
      const response = await ApiService.deleteQuestion(questionId)

      if (!response.success) {
        toast.error(`Erro ao excluir pergunta: ${response.error}`)
        return
      }

      toast.success('Pergunta excluída com sucesso')
      loadQuestions()
    } catch {
      toast.error('Erro inesperado. Tente novamente.')
    }
  }

  const openCreateModal = () => {
    setEditingQuestion(null)
    setIsModalOpen(true)
  }

  const openEditModal = (question: QuestionWithAlternatives) => {
    setEditingQuestion(question)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingQuestion(null)
  }

  const handleSave = () => {
    loadQuestions()
  }

  const getCategoryName = (category: string) => {
    const names = {
      performance: 'Performance',
      energia: 'Energia', 
      cultura: 'Cultura'
    }
    return names[category as keyof typeof names] || category
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      performance: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      energia: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      cultura: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      single_choice: 'Única Escolha',
      multiple_choice: 'Múltipla Escolha',
      open_text: 'Texto Aberto'
    }
    return labels[type as keyof typeof labels] || type
  }

  if (isLoading) {
    return <QuestionsSkeleton />
  }

  return (
    <div className="space-y-8">

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent dark:from-white dark:to-gray-200">
            Perguntas
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as perguntas do questionário FitScore
          </p>
        </div>
        
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Pergunta
        </Button>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <HelpCircle className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">perguntas cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <Eye className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">perguntas ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.byCategory.performance}</div>
            <p className="text-xs text-muted-foreground mt-1">perguntas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energia + Cultura</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full flex items-center justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.byCategory.energia + stats.byCategory.cultura}</div>
            <p className="text-xs text-muted-foreground mt-1">perguntas</p>
          </CardContent>
        </Card>
      </div>


      {['performance', 'energia', 'cultura'].map(category => {
        const categoryQuestions = questions.filter(q => q.category === category)
        
        if (categoryQuestions.length === 0) return null

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  category === 'performance' ? 'bg-blue-500' :
                  category === 'energia' ? 'bg-green-500' : 'bg-purple-500'
                }`}></div>
                {getCategoryName(category)} ({categoryQuestions.length})
              </CardTitle>
              <CardDescription>
                Perguntas da categoria {getCategoryName(category).toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryQuestions.map((question) => (
                  <div key={question.id} className="flex flex-col lg:flex-row lg:items-start justify-between p-4 md:p-6 border rounded-lg hover:bg-muted/30 transition-colors bg-card gap-4">
                    <div className="flex-1 lg:pr-4">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className={getCategoryColor(question.category)}>
                          {getCategoryName(question.category)}
                        </Badge>
                        <Badge variant="outline">
                          {getTypeLabel(question.type)}
                        </Badge>
                        <Badge variant={question.is_active ? 'default' : 'secondary'}>
                          {question.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2">{question.title}</h3>
                      
                      {question.description && (
                        <p className="text-sm text-muted-foreground mb-3">{question.description}</p>
                      )}
                      
                      {question.alternatives && question.alternatives.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Alternativas:</p>
                          <div className="space-y-1">
                            {question.alternatives.map((alt, index) => (
                              <div key={alt.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                                <div className="flex items-center space-x-2">
                                  <span className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-xs">
                                    {index + 1}
                                  </span>
                                  <span className="text-foreground">{alt.text}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {alt.value} pts
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row lg:flex-col flex-wrap lg:flex-nowrap gap-2 lg:space-y-2 lg:space-x-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleQuestionStatus(question.id, question.is_active)}
                      >
                        {question.is_active ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Ativar
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditModal(question)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteQuestion(question.id, question.title)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {questions.length === 0 && (
        <Card>
          <CardContent className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
              <HelpCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Nenhuma pergunta encontrada</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Comece criando sua primeira pergunta para o questionário. As perguntas são organizadas por categorias: Performance, Energia e Cultura.
            </p>
            <Button onClick={openCreateModal} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Pergunta
            </Button>
          </CardContent>
        </Card>
      )}


      <QuestionFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        question={editingQuestion}
      />
    </div>
  )
}
