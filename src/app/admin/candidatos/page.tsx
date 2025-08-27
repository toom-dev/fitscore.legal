"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Input } from "@/src/components/ui/input"

import { ApiService } from '@/lib/services/api'
import { fitLabelColors } from '@/lib/types/database'
import { CandidateDetailsModal } from '@/src/components/admin/candidate-details-modal'
import { CandidatesSkeleton } from '@/src/components/admin/skeletons'
import { Eye, Search, Filter, Download, Users, ChevronLeft, ChevronRight, X } from 'lucide-react'

type FitFilterType = 'all' | 'alto' | 'médio' | 'baixo' | 'pending'

export default function CandidatosPage() {
  const [candidatesData, setCandidatesData] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFit, setFilterFit] = useState<FitFilterType[]>(['all'])
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const loadCandidates = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const filters = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        fitFilter: filterFit.includes('all') ? undefined : filterFit
      }

      const response = await ApiService.getCandidates(filters)
      
      if (response.success && response.data) {
        setCandidatesData(response.data)
      }

    } catch {
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, filterFit, itemsPerPage])

  useEffect(() => {
    loadCandidates()
  }, [loadCandidates])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleFilterToggle = (filter: FitFilterType) => {
    if (filter === 'all') {
      setFilterFit(['all'])
    } else {
      setFilterFit(prev => {
        const newFilters = prev.filter(f => f !== 'all')
        
        if (newFilters.includes(filter)) {
          const updated = newFilters.filter(f => f !== filter)
          return updated.length === 0 ? ['all'] : updated
        } else {
          return [...newFilters, filter]
        }
      })
    }
  }

  const removeFilter = (filter: FitFilterType) => {
    setFilterFit(prev => {
      const updated = prev.filter(f => f !== filter)
      return updated.length === 0 ? ['all'] : updated
    })
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
    if (!(candidatesData as any)?.candidates) return
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Nome,Email,Telefone,Score,Classificação,Criado,Completo\n" +
      (candidatesData as { candidates?: Array<{ name: string; email: string; phone?: string; fit_score?: number; fit_label?: string; created_at: string; completed_at?: string }> })?.candidates?.map((c) => 
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

  const handleViewDetails = (candidate: any) => {
    setSelectedCandidate(candidate)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCandidate(null)
  }

  if (isLoading) {
    return <CandidatesSkeleton />
  }

  return (
    <div className="space-y-8">

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


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
            </div>


            <div>
              <label className="text-sm font-medium mb-2 block">Filtrar por Classificação:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'Todos', color: 'bg-primary', count: (candidatesData as any)?.pagination?.total || 0 },
                  { value: 'alto', label: 'Fit Alto', color: 'bg-emerald-500', count: 0 },
                  { value: 'médio', label: 'Fit Médio', color: 'bg-blue-500', count: 0 },
                  { value: 'baixo', label: 'Fit Baixo', color: 'bg-yellow-500', count: 0 },
                  { value: 'pending', label: 'Pendentes', color: 'bg-gray-500', count: 0 }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={filterFit.includes(option.value as FitFilterType) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterToggle(option.value as FitFilterType)}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-3 h-3 ${option.color} rounded-full`}></div>
                    {option.label} ({option.count})
                  </Button>
                ))}
              </div>
            </div>


            {!filterFit.includes('all') && filterFit.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                {filterFit.map((filter) => (
                  <Badge key={filter} variant="secondary" className="flex items-center gap-1">
                    {filter === 'pending' ? 'Pendentes' : 
                     filter === 'alto' ? 'Fit Alto' :
                     filter === 'médio' ? 'Fit Médio' :
                     filter === 'baixo' ? 'Fit Baixo' : filter}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeFilter(filter)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Candidatos ({(candidatesData as any)?.pagination?.total || 0})
              </CardTitle>
              <CardDescription>
                {searchTerm ? `Resultados para "${searchTerm}"` : 'Lista completa de candidatos'}
                {(candidatesData as any)?.pagination && (
                  <span className="ml-2">
                    • Página {currentPage} de {(candidatesData as any).pagination.totalPages} 
                    • Total: {(candidatesData as any).pagination.total} candidatos
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!(candidatesData as any)?.candidates || (candidatesData as any).candidates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum candidato encontrado</p>
              <p className="text-sm">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {(candidatesData as { candidates?: Array<{ id: string; name: string; email: string; phone?: string; fit_score?: number; fit_label?: string; created_at: string; completed_at?: string; total_answers: number }> })?.candidates?.map((candidate) => {
                const fitStyle = getFitLabelStyle(candidate.fit_label || null)
                
                return (
                  <div key={candidate.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-semibold text-lg">{candidate.name}</h3>
                          <p className="text-sm text-muted-foreground">{candidate.email}</p>
                          {candidate.phone && (
                            <p className="text-xs text-muted-foreground">{candidate.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>Criado: {formatDate(candidate.created_at)}</span>
                        {candidate.completed_at && (
                          <span>Completo: {formatDate(candidate.completed_at)}</span>
                        )}
                        <span>{candidate.total_answers} respostas</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      {candidate.fit_score !== null ? (
                        <div className="text-left sm:text-right">
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
                        <div className="text-left sm:text-center text-muted-foreground">
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


              {(candidatesData as any)?.pagination && (candidatesData as any).pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t gap-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, (candidatesData as any).pagination.total)} de {(candidatesData as any).pagination.total} candidatos
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      {Array.from({ length: (candidatesData as any).pagination.totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          return page === 1 || 
                                 page === (candidatesData as any).pagination.totalPages || 
                                 (page >= currentPage - 1 && page <= currentPage + 1)
                        })
                        .map((page, index, array) => {
                          const showEllipsis = index > 0 && page - array[index - 1] > 1
                          
                          return (
                            <div key={page} className="flex items-center">
                              {showEllipsis && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className="w-8 h-8 p-0"
                              >
                                {page}
                              </Button>
                            </div>
                          )
                        })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === (candidatesData as any).pagination.totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>


      <CandidateDetailsModal 
        candidate={selectedCandidate}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}
