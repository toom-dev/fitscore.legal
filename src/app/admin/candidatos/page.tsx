"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Input } from "@/src/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { createClient } from '@/lib/supabase/client'
import { CandidateSummaryView, fitLabelColors } from '@/lib/types/database'
import { CandidateDetailsModal } from '@/src/components/admin/candidate-details-modal'
import { Loader2, Eye, Search, Filter, Download, Users } from 'lucide-react'

export default function CandidatosPage() {
  const [candidates, setCandidates] = useState<CandidateSummaryView[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateSummaryView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFit, setFilterFit] = useState<'all' | 'Fit Altíssimo' | 'Fit Aprovado' | 'Fit Questionável' | 'Fora do Perfil' | 'pending'>('all')
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSummaryView | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadCandidates()
  }, [])

  useEffect(() => {
    filterCandidates()
  }, [candidates, searchTerm, filterFit])

  const loadCandidates = async () => {
    try {
      setIsLoading(true)
      
      // Mesmo sistema de debug da página principal
      console.log('🔍 [Candidatos] Tentando acessar candidates_summary...')
      const { data: summaryData, error: summaryError } = await supabase
        .from('candidates_summary')
        .select('*')
        .order('created_at', { ascending: false })

      if (summaryError) {
        console.warn('⚠️ [Candidatos] View falhou, usando query direta...')
        
        // Fallback: buscar candidatos e respostas separadamente
        const { data: candidatesData, error: candidatesError } = await supabase
          .from('candidates')
          .select('*')
          .order('created_at', { ascending: false })

        if (candidatesError) {
          console.error('❌ [Candidatos] Erro ao carregar candidatos:', candidatesError)
          return
        }

        // Para cada candidato, buscar suas respostas
        const candidatesWithAnswers = await Promise.all(
          (candidatesData || []).map(async (candidate) => {
            const { data: answers, error: answersError } = await supabase
              .from('answers')
              .select('id, question_id')
              .eq('candidate_id', candidate.id)

            if (answersError) {
              console.warn(`⚠️ [Candidatos] Erro ao buscar respostas para ${candidate.name}:`, answersError)
            }

            return {
              ...candidate,
              total_answers: answers?.length || 0,
              answered_questions: new Set(answers?.map(a => a.question_id) || []).size
            }
          })
        )

        setCandidates(candidatesWithAnswers)
      } else {
        console.log('✅ [Candidatos] Dados da view:', summaryData?.length, 'candidatos')
        setCandidates(summaryData || [])
      }

    } catch (error) {
      console.error('❌ [Candidatos] Erro inesperado:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterCandidates = () => {
    let filtered = candidates

    // Filtrar por fit_label
    if (filterFit === 'pending') {
      filtered = filtered.filter(c => c.fit_label === null || c.completed_at === null)
    } else if (filterFit !== 'all') {
      filtered = filtered.filter(c => c.fit_label === filterFit)
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
      )
    }

    setFilteredCandidates(filtered)
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

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Nome,Email,Telefone,Score,Classificação,Criado,Completo\n" +
      filteredCandidates.map(c => 
        `"${c.name}","${c.email}","${c.phone || ''}","${c.fit_score || ''}","${c.fit_label || ''}","${formatDate(c.created_at)}","${c.completed_at ? formatDate(c.completed_at) : ''}"`
      ).join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `candidatos_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleViewDetails = (candidate: CandidateSummaryView) => {
    setSelectedCandidate(candidate)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCandidate(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Carregando candidatos...</span>
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
            Candidatos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie e visualize todos os candidatos e seus resultados
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-64">
              <Select value={filterFit} onValueChange={(value: 'all' | 'Fit Altíssimo' | 'Fit Aprovado' | 'Fit Questionável' | 'Fora do Perfil' | 'pending') => setFilterFit(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Fit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      Todos ({candidates.length})
                    </span>
                  </SelectItem>
                  <SelectItem value="Fit Altíssimo">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-600 rounded-full"></span>
                      Fit Altíssimo ({candidates.filter(c => c.fit_label === 'Fit Altíssimo').length})
                    </span>
                  </SelectItem>
                  <SelectItem value="Fit Aprovado">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                      Fit Aprovado ({candidates.filter(c => c.fit_label === 'Fit Aprovado').length})
                    </span>
                  </SelectItem>
                  <SelectItem value="Fit Questionável">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-yellow-600 rounded-full"></span>
                      Fit Questionável ({candidates.filter(c => c.fit_label === 'Fit Questionável').length})
                    </span>
                  </SelectItem>
                  <SelectItem value="Fora do Perfil">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-600 rounded-full"></span>
                      Fora do Perfil ({candidates.filter(c => c.fit_label === 'Fora do Perfil').length})
                    </span>
                  </SelectItem>
                  <SelectItem value="pending">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-gray-600 rounded-full"></span>
                      Pendentes ({candidates.filter(c => !c.fit_label || !c.completed_at).length})
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Candidatos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Candidatos ({filteredCandidates.length})
          </CardTitle>
          <CardDescription>
            {searchTerm && `Resultados para "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum candidato encontrado</p>
              <p className="text-sm">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCandidates.map((candidate) => {
                const fitStyle = getFitLabelStyle(candidate.fit_label || null)
                
                return (
                  <div key={candidate.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-semibold text-lg">{candidate.name}</h3>
                          <p className="text-sm text-muted-foreground">{candidate.email}</p>
                          {candidate.phone && (
                            <p className="text-xs text-muted-foreground">📱 {candidate.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>📅 {formatDate(candidate.created_at)}</span>
                        {candidate.completed_at && (
                          <span>✅ {formatDate(candidate.completed_at)}</span>
                        )}
                        <span>💬 {candidate.total_answers} respostas</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {candidate.fit_score !== null ? (
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary mb-1">
                            {candidate.fit_score}
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`${fitStyle.bg} ${fitStyle.text} ${fitStyle.border}`}
                          >
                            {candidate.fit_label}
                          </Badge>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <div className="text-sm">Em andamento</div>
                          <Badge variant="outline">Pendente</Badge>
                        </div>
                      )}

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(candidate)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Detalhes
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <CandidateDetailsModal 
        candidate={selectedCandidate}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}
