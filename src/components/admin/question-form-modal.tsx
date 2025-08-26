"use client"

import React, { useState, useEffect } from 'react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/src/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Textarea } from "@/src/components/ui/textarea"
import { Badge } from "@/src/components/ui/badge"
import { createClient } from '@/lib/supabase/client'
import { QuestionWithAlternatives } from '@/lib/types/database'
import { Plus, X, Save, Loader2 } from 'lucide-react'

interface Alternative {
  id?: string
  text: string
  value: number
  order_index: number
}

interface QuestionFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  question?: QuestionWithAlternatives | null
}

export function QuestionFormModal({ isOpen, onClose, onSave, question }: QuestionFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState(0)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'performance' as 'performance' | 'energia' | 'cultura',
    type: 'single_choice' as 'single_choice' | 'multiple_choice' | 'open_text',
    order_index: 1,
    is_active: true
  })
  const [alternatives, setAlternatives] = useState<Alternative[]>([])
  
  // Arrays para rastrear operações
  const [toDeleteIds, setToDeleteIds] = useState<string[]>([])
  const [toUpdateIds, setToUpdateIds] = useState<string[]>([])
  const [toInsertAlternatives, setToInsertAlternatives] = useState<Alternative[]>([])
  
  const supabase = createClient()

  // Resetar form quando modal abrir/fechar
  useEffect(() => {
    if (isOpen) {
      if (question) {
        // Editando pergunta existente
        setFormData({
          title: question.title,
          description: question.description || '',
          category: question.category as 'performance' | 'energia' | 'cultura',
          type: question.type as 'single_choice' | 'multiple_choice' | 'open_text',
          order_index: question.order_index,
          is_active: question.is_active
        })
        const questionAlts = question.alternatives?.map(alt => ({
          id: alt.id,
          text: alt.text,
          value: alt.value,
          order_index: alt.order_index
        })) || []
        setAlternatives(questionAlts)
        
        // Resetar arrays de operações
        setToDeleteIds([])
        setToUpdateIds([])
        setToInsertAlternatives([])
      } else {
        // Nova pergunta
        setFormData({
          title: '',
          description: '',
          category: 'performance',
          type: 'single_choice',
          order_index: 1,
          is_active: true
        })
        setAlternatives([
          { text: '', value: 0, order_index: 1 },
          { text: '', value: 0, order_index: 2 }
        ])
        
        // Resetar arrays de operações
        setToDeleteIds([])
        setToUpdateIds([])
        setToInsertAlternatives([])
      }
    }
  }, [isOpen, question])

  const addAlternative = () => {
    const newAlternative = { 
      text: '', 
      value: 0, 
      order_index: alternatives.length + 1 
    }
    
    setAlternatives(prev => [...prev, newAlternative])
    setToInsertAlternatives(prev => [...prev, newAlternative])
  }

  const removeAlternative = (index: number) => {
    const alternativeToRemove = alternatives[index]
    
    // Se tem ID, é uma alternativa existente - adicionar ao array de delete
    if (alternativeToRemove.id) {
      setToDeleteIds(prev => [...prev, alternativeToRemove.id!])
    } else {
      // Se não tem ID, é uma alternativa nova - remover do array de insert
      setToInsertAlternatives(prev => prev.filter(alt => alt !== alternativeToRemove))
    }
    
    // Remover da lista visual
    setAlternatives(prev => prev.filter((_, i) => i !== index))
  }

  const updateAlternative = (index: number, field: 'text' | 'value', value: string | number) => {
    const alternativeToUpdate = alternatives[index]
    
    // Se tem ID e não está no array de insert, é uma alternativa existente - adicionar ao array de update
    if (alternativeToUpdate.id && !toInsertAlternatives.some(alt => alt === alternativeToUpdate)) {
      if (!toUpdateIds.includes(alternativeToUpdate.id)) {
        setToUpdateIds(prev => [...prev, alternativeToUpdate.id!])
      }
    } else if (!alternativeToUpdate.id) {
      // Se não tem ID, atualizar no array de insert
      setToInsertAlternatives(prev => prev.map(alt => 
        alt === alternativeToUpdate ? { ...alt, [field]: value } : alt
      ))
    }
    
    // Atualizar na lista visual
    setAlternatives(prev => prev.map((alt, i) => 
      i === index ? { ...alt, [field]: value } : alt
    ))
  }



  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Título é obrigatório')
      return
    }

    if (formData.type !== 'open_text' && alternatives.some(alt => !alt.text.trim())) {
      alert('Todas as alternativas devem ter texto')
      return
    }

    // Prevenir múltiplas submissões
    if (isLoading) {
      return
    }

    // Debounce para evitar cliques duplos
    const now = Date.now()
    if (now - lastSaveTime < 2000) {
      return
    }
    setLastSaveTime(now)

    try {
      setIsLoading(true)

      if (question) {
        
        // Atualizar pergunta existente
        const { error: questionError } = await supabase
          .from('questions')
          .update({
            title: formData.title,
            description: formData.description || null,
            category: formData.category,
            type: formData.type,
            order_index: formData.order_index,
            is_active: formData.is_active
          })
          .eq('id', question.id)

        if (questionError) {
          console.error('Erro ao atualizar pergunta:', questionError)
          alert('Erro ao atualizar pergunta')
          return
        }

        // Atualizar alternativas se não for open_text
        if (formData.type !== 'open_text') {
          // 1. DELETAR alternativas marcadas
          if (toDeleteIds.length > 0) {
            const { error: deleteError } = await supabase
              .from('alternatives')
              .delete()
              .in('id', toDeleteIds)

            if (deleteError) {
              console.error('Erro ao deletar alternativas:', deleteError)
              alert('Erro ao deletar alternativas')
              return
            }
          }

          // 2. ATUALIZAR alternativas modificadas
          for (const altId of toUpdateIds) {
            const currentAlt = alternatives.find(alt => alt.id === altId)
            if (currentAlt && currentAlt.text.trim()) {
              const newOrderIndex = alternatives.filter(alt => alt.text.trim()).indexOf(currentAlt) + 1
              console.log('✏️ Atualizando alternativa:', altId, currentAlt.text, 'order:', newOrderIndex)
              
              const { error: updateError } = await supabase
                .from('alternatives')
                .update({
                  text: currentAlt.text.trim(),
                  value: currentAlt.value,
                  order_index: newOrderIndex
                })
                .eq('id', altId)

              if (updateError) {
                console.error('❌ Erro ao atualizar alternativa:', updateError)
                alert('Erro ao atualizar alternativa')
                return
              }
            }
          }

          // 3. INSERIR novas alternativas
          const validInsertAlternatives = toInsertAlternatives.filter(alt => alt.text.trim())
          if (validInsertAlternatives.length > 0) {
            console.log('➕ Inserindo novas alternativas:', validInsertAlternatives.map(alt => alt.text))
            const alternativesToInsert = validInsertAlternatives.map((alt, index) => ({
              question_id: question.id,
              text: alt.text.trim(),
              value: alt.value,
              order_index: alternatives.filter(a => a.text.trim()).length - validInsertAlternatives.length + index + 1
            }))

            const { error: insertError } = await supabase
              .from('alternatives')
              .insert(alternativesToInsert)

            if (insertError) {
              console.error('❌ Erro ao inserir alternativas:', insertError)
              alert('Erro ao inserir alternativas')
              return
            }
          }

          console.log('✅ Todas as operações executadas com sucesso!')
        } else {
          // Se mudou para open_text, remover todas as alternativas
          console.log('🗑️ Removendo alternativas (mudou para texto aberto)')
          await supabase
            .from('alternatives')
            .delete()
            .eq('question_id', question.id)
        }
      } else {
        console.log('➕ Criando nova pergunta...')
        
        // Criar nova pergunta
        const { data: newQuestion, error: questionError } = await supabase
          .from('questions')
          .insert({
            title: formData.title,
            description: formData.description || null,
            category: formData.category,
            type: formData.type,
            order_index: formData.order_index,
            is_active: formData.is_active
          })
          .select()
          .single()

        if (questionError || !newQuestion) {
          console.error('❌ Erro ao criar pergunta:', questionError)
          alert('Erro ao criar pergunta')
          return
        }

        console.log('✅ Nova pergunta criada:', newQuestion.id)

        // Inserir alternativas se não for open_text
        if (formData.type !== 'open_text') {
          console.log('➕ Inserindo alternativas da nova pergunta...')
          
          const alternativesToInsert = alternatives
            .filter(alt => alt.text.trim())
            .map((alt, index) => ({
              question_id: newQuestion.id,
              text: alt.text.trim(),
              value: alt.value,
              order_index: index + 1
            }))

          if (alternativesToInsert.length > 0) {
            const { error: altError } = await supabase
              .from('alternatives')
              .insert(alternativesToInsert)

            if (altError) {
              console.error('❌ Erro ao inserir alternativas:', altError)
              alert('Erro ao salvar alternativas')
              return
            }

            console.log('✅ Alternativas da nova pergunta inseridas:', alternativesToInsert.length)
          }
        }
      }

      console.log('🎉 Salvamento concluído com sucesso!')
      onSave()
      onClose()
    } catch (error) {
      console.error('Erro inesperado:', error)
      alert('Erro inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  // Injetar CSS dinâmico para forçar tela cheia
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
        <div className="flex flex-col h-screen w-screen overflow-hidden">
          {/* Header Fixo */}
          <div className="px-6 py-4 border-b bg-background flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">
                  {question ? 'Editar Pergunta' : 'Nova Pergunta'}
                </DialogTitle>
                <DialogDescription>
                  {question ? 'Edite os dados da pergunta' : 'Crie uma nova pergunta para o questionário'}
                </DialogDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Conteúdo Scrollável */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={formData.category} onValueChange={(value: 'performance' | 'energia' | 'cultura') => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="energia">Energia</SelectItem>
                        <SelectItem value="cultura">Cultura</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Select value={formData.type} onValueChange={(value: 'single_choice' | 'multiple_choice' | 'open_text') => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_choice">Única Escolha</SelectItem>
                        <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                        <SelectItem value="open_text">Texto Aberto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Digite o título da pergunta"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição opcional da pergunta"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Alternativas */}
            {formData.type !== 'open_text' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Alternativas</CardTitle>
                    <Button onClick={addAlternative} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {alternatives.map((alt, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <Input
                          value={alt.text}
                          onChange={(e) => updateAlternative(index, 'text', e.target.value)}
                          placeholder={`Alternativa ${index + 1}`}
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          value={alt.value}
                          onChange={(e) => updateAlternative(index, 'value', parseInt(e.target.value) || 0)}
                          placeholder="Pontos"
                          min="0"
                          max="100"
                        />
                      </div>
                      {alternatives.length > 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAlternative(index)}
                          className="text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            </div>
          </div>

          {/* Footer Fixo */}
          <div className="px-6 py-4 border-t flex justify-end gap-3 bg-background flex-shrink-0">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className={isLoading ? 'pointer-events-none' : ''}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
