"use client"

import { QuestionWithAlternatives, FormAnswer } from '@/lib/types/database'
import { Label } from '@/src/components/ui/label'
import { Input } from '@/src/components/ui/input'
import { Checkbox } from '@/src/components/ui/checkbox'

interface DynamicQuestionProps {
  question: QuestionWithAlternatives
  answer?: FormAnswer
  onAnswerChange: (questionId: string, answer: Partial<FormAnswer>) => void
  index: number
}

export function DynamicQuestion({ question, answer, onAnswerChange, index }: DynamicQuestionProps) {
  
  const handleSingleChoiceChange = (alternativeId: string) => {
    onAnswerChange(question.id, {
      alternative_id: alternativeId,
      text_answer: undefined
    })
  }

  const handleMultipleChoiceChange = (alternativeId: string, checked: boolean) => {
    const currentIds = Array.isArray(answer?.alternative_id) ? answer.alternative_id : []
    let newIds: string[]

    if (checked) {
      // Verificar se há limite de seleções (baseado na descrição da pergunta)
      const hasLimit = question.description?.toLowerCase().includes('até 2') || 
                      question.title?.toLowerCase().includes('até 2')
      const maxSelections = hasLimit ? 2 : Infinity
      
      if (currentIds.length >= maxSelections) {
        // Não adicionar se já atingiu o limite
        return
      }
      
      newIds = [...currentIds, alternativeId]
    } else {
      newIds = currentIds.filter(id => id !== alternativeId)
    }

    onAnswerChange(question.id, {
      alternative_id: newIds,
      text_answer: undefined
    })
  }

  const handleTextChange = (text: string) => {
    onAnswerChange(question.id, {
      text_answer: text,
      alternative_id: undefined
    })
  }

  const renderQuestion = () => {
    switch (question.type) {
      case 'single_choice':
        return (
          <div className="space-y-3">
            {question.alternatives.map((alternative, altIndex) => (
              <div key={alternative.id} className="flex items-center space-x-3 group">
                <input
                  type="radio"
                  id={`${question.id}-${alternative.id}`}
                  name={question.id}
                  value={alternative.id}
                  checked={answer?.alternative_id === alternative.id}
                  onChange={() => handleSingleChoiceChange(alternative.id)}
                  className="w-4 h-4 text-primary bg-background border-2 border-border focus:ring-primary focus:ring-2 transition-all duration-200"
                />
                <label 
                  htmlFor={`${question.id}-${alternative.id}`}
                  className="flex-1 text-sm font-medium cursor-pointer transition-colors duration-200 group-hover:text-primary"
                >
                  {alternative.text}
                </label>
              </div>
            ))}
          </div>
        )

      case 'multiple_choice':
        const currentIds = Array.isArray(answer?.alternative_id) ? answer.alternative_id : []
        const hasLimit = question.description?.toLowerCase().includes('até 2') || 
                        question.title?.toLowerCase().includes('até 2')
        const maxSelections = hasLimit ? 2 : Infinity
        const remainingSelections = hasLimit ? Math.max(0, maxSelections - currentIds.length) : Infinity

        return (
          <div className="space-y-3">
            {hasLimit && (
              <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md mb-3">
                {currentIds.length} de {maxSelections} selecionadas
                {remainingSelections > 0 && ` • ${remainingSelections} restante${remainingSelections !== 1 ? 's' : ''}`}
              </div>
            )}
            {question.alternatives.map((alternative) => {
              const isChecked = currentIds.includes(alternative.id)
              const canSelect = !isChecked && (remainingSelections > 0)
              
              return (
                <div key={alternative.id} className={`flex items-center space-x-3 group ${!canSelect && !isChecked ? 'opacity-50' : ''}`}>
                  <Checkbox
                    id={`${question.id}-${alternative.id}`}
                    checked={isChecked}
                    disabled={!canSelect && !isChecked}
                    onCheckedChange={(checked) => 
                      handleMultipleChoiceChange(alternative.id, checked === true)
                    }
                    className="transition-all duration-200"
                  />
                  <label 
                    htmlFor={`${question.id}-${alternative.id}`}
                    className={`flex-1 text-sm font-medium cursor-pointer transition-colors duration-200 group-hover:text-primary ${!canSelect && !isChecked ? 'cursor-not-allowed' : ''}`}
                  >
                    {alternative.text}
                  </label>
                </div>
              )
            })}
          </div>
        )

      case 'open_text':
        return (
          <div className="space-y-2">
            <Input
              id={question.id}
              placeholder="Digite sua resposta..."
              value={answer?.text_answer || ''}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:border-primary/50 hover:border-primary/30"
            />
          </div>
        )

      default:
        return (
          <div className="text-muted-foreground text-sm italic">
            Tipo de pergunta não suportado: {question.type}
          </div>
        )
    }
  }

  return (
    <div 
      className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" 
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="space-y-2">
        <Label 
          htmlFor={question.id} 
          className="text-base font-semibold transition-colors duration-200 hover:text-primary block"
        >
          {question.title}
          {question.type !== 'multiple_choice' && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </Label>
        
        {question.description && (
          <p className="text-sm text-muted-foreground">
            {question.description}
          </p>
        )}
      </div>

      <div className="ml-1">
        {renderQuestion()}
      </div>

      {/* Indicador visual de tipo de pergunta */}
      <div className="flex justify-end">
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {question.type === 'single_choice' && 'Selecione uma opção'}
          {question.type === 'multiple_choice' && 'Selecione uma ou mais opções'}  
          {question.type === 'open_text' && 'Resposta livre'}
        </span>
      </div>
    </div>
  )
}
