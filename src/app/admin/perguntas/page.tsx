"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { createClient } from '@/lib/supabase/client'
import { QuestionWithAlternatives } from '@/lib/types/database'
import { QuestionFormModal } from '@/src/components/admin/question-form-modal'
import { Loader2, HelpCircle, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'

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

  const supabase = createClient()

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      setIsLoading(true)
      
      console.log('🔍 Carregando perguntas...')
      
      // Tentar primeiro a view questions_with_alternatives
      const { data: viewData, error: viewError } = await supabase
        .from('questions_with_alternatives')
        .select('*')
        .order('category', { ascending: true })
        .order('order_index', { ascending: true })

      console.log('📊 View data:', viewData)
      console.log('❌ View error:', viewError)

      if (viewError) {
        console.warn('⚠️ View falhou, usando query direta...')
        
        // Fallback: buscar perguntas e alternativas separadamente
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .order('category', { ascending: true })
          .order('order_index', { ascending: true })

        console.log('❓ Questions data:', questionsData)
        console.log('❌ Questions error:', questionsError)

        if (questionsError) {
          console.error('Erro ao carregar perguntas:', questionsError)
          return
        }

        // Para cada pergunta, buscar suas alternativas
        const questionsWithAlternatives = await Promise.all(
          (questionsData || []).map(async (question) => {
            const { data: alternatives, error: altError } = await supabase
              .from('alternatives')
              .select('*')
              .eq('question_id', question.id)
              .order('order_index', { ascending: true })

            if (altError) {
              console.warn(`⚠️ Erro ao buscar alternativas para ${question.title}:`, altError)
            }

            return {
              ...question,
              alternatives: alternatives || []
            }
          })
        )

        setQuestions(questionsWithAlternatives)
      } else {
        console.log('✅ Dados da view:', viewData?.length, 'perguntas')
        setQuestions(viewData || [])
      }
      
    } catch (error) {
      console.error('Erro inesperado:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Função separada para calcular estatísticas
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
      const { error } = await supabase
        .from('questions')
        .update({ is_active: !currentStatus })
        .eq('id', questionId)

      if (error) {
        console.error('Erro ao alterar status:', error)
        return
      }

      // Recarregar perguntas
      loadQuestions()
    } catch (error) {
      console.error('Erro inesperado:', error)
    }
  }

  const deleteQuestion = async (questionId: string, questionTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir a pergunta "${questionTitle}"?\n\nEsta ação não pode ser desfeita e também excluirá todas as alternativas e respostas relacionadas.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

      if (error) {
        console.error('Erro ao excluir pergunta:', error)
        alert('Erro ao excluir pergunta. Tente novamente.')
        return
      }

      // Recarregar perguntas
      loadQuestions()
    } catch (error) {
      console.error('Erro inesperado:', error)
      alert('Erro inesperado. Tente novamente.')
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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Carregando perguntas...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
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

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">perguntas cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">perguntas ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byCategory.performance}</div>
            <p className="text-xs text-muted-foreground">perguntas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energia + Cultura</CardTitle>
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byCategory.energia + stats.byCategory.cultura}</div>
            <p className="text-xs text-muted-foreground">perguntas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Perguntas por Categoria */}
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
                  <div key={question.id} className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center space-x-3 mb-2">
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
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Alternativas:</p>
                          {question.alternatives.map((alt) => (
                            <div key={alt.id} className="text-xs text-muted-foreground flex justify-between">
                              <span>• {alt.text}</span>
                              <span className="font-mono bg-muted px-1 rounded">{alt.value}pts</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2">
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
          <CardContent className="text-center py-12">
            <HelpCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma pergunta encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando sua primeira pergunta para o questionário
            </p>
            <Button onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Pergunta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de Criar/Editar Pergunta */}
      <QuestionFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        question={editingQuestion}
      />
    </div>
  )
}
