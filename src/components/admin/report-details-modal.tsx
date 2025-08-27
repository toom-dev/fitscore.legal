"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { ScrollArea } from "@/src/components/ui/scroll-area"
import { Separator } from "@/src/components/ui/separator"
import { 
  FileText, 
  Calendar, 
  Users, 
  Award, 
  TrendingUp, 
  BarChart3,
  Download,
  X,
  Clock,
  Target
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface GeneratedReport {
  id: string
  title: string
  type: string
  period_start: string
  period_end: string
  parameters: any
  summary: any
  data: any
  generated_by: string
  created_at: string
}

interface ReportDetailsModalProps {
  report: GeneratedReport | null
  isOpen: boolean
  onClose: () => void
}

export function ReportDetailsModal({ report, isOpen, onClose }: ReportDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'candidates' | 'parameters'>('summary')

  if (!report) return null

  const getTypeLabel = (type: string) => {
    const labels = {
      approved_candidates: 'Candidatos Aprovados',
      daily_summary: 'Resumo Diário',
      weekly_summary: 'Resumo Semanal'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getGeneratedByLabel = (generatedBy: string) => {
    const labels = {
      manual: 'Manual',
      scheduled: 'Programado',
      system: 'Sistema'
    }
    return labels[generatedBy as keyof typeof labels] || generatedBy
  }

  const getFitLabelColor = (fitLabel: string) => {
    const colors = {
      'alto': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
      'médio': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'baixo': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    }
    return colors[fitLabel as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }

  const exportToCsv = () => {
    if (!report.data?.candidates) return

    const csvContent = "data:text/csv;charset=utf-8," + 
      "Nome,Email,Telefone,Score,Classificação,Completo Em\n" +
      report.data.candidates.map((c: any) => 
        `"${c.name}","${c.email}","${c.phone || ''}","${c.fit_score}","${c.fit_label}","${format(new Date(c.completed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}"`
      ).join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `relatorio_${report.id}_${format(new Date(report.created_at), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-none !max-h-none !w-screen !h-screen !p-0 !m-0 !rounded-none !border-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="flex-shrink-0 p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center space-x-2 text-xl">
                  <FileText className="w-6 h-6" />
                  <span>{report.title}</span>
                </DialogTitle>
                <div className="flex items-center space-x-2 mt-3">
                  <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
                  <Badge variant={report.generated_by === 'manual' ? 'default' : 'secondary'}>
                    {getGeneratedByLabel(report.generated_by)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{format(new Date(report.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={exportToCsv}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex-shrink-0 p-6 pb-4">
            <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
              <Button
                variant={activeTab === 'summary' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('summary')}
              >
                Resumo
              </Button>
              <Button
                variant={activeTab === 'candidates' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('candidates')}
              >
                Candidatos ({report.data?.candidates?.length || 0})
              </Button>
              <Button
                variant={activeTab === 'parameters' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('parameters')}
              >
                Parâmetros
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 px-6 pb-6">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Estatísticas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Aprovados</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{report.summary?.totalApproved || 0}</div>
                    <p className="text-xs text-muted-foreground">candidatos encontrados</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{report.summary?.averageScore || 0}</div>
                    <p className="text-xs text-muted-foreground">pontos em média</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{report.summary?.completionRate || 0}%</div>
                    <p className="text-xs text-muted-foreground">dos candidatos</p>
                  </CardContent>
                </Card>
              </div>

              {/* Informações do Período */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Período Analisado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Início:</span>
                      <div className="font-medium">
                        {format(new Date(report.period_start), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Fim:</span>
                      <div className="font-medium">
                        {format(new Date(report.period_end), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                    <div className="text-sm">
                      <span className="font-medium">Duração:</span>
                      <span className="ml-2">
                        {formatDistanceToNow(new Date(report.period_start), { 
                          locale: ptBR,
                          addSuffix: false 
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição por Classificação */}
              {report.summary?.totalApproved > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      Distribuição por Classificação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                          <span className="font-medium">Fit Alto (≥ 90)</span>
                        </div>
                        <div className="text-lg font-bold">{report.summary?.highFit || 0}</div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground text-center">
                        {report.summary?.highFit > 0 && (
                          <span>
                            {Math.round((report.summary.highFit / report.summary.totalApproved) * 100)}% dos aprovados têm score ≥ 90
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'candidates' && (
            <div className="space-y-4">
              {!report.data?.candidates || report.data.candidates.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Nenhum candidato encontrado</h3>
                    <p className="text-muted-foreground">
                      Não foram encontrados candidatos aprovados no período analisado
                    </p>
                  </CardContent>
                </Card>
              ) : (
                report.data.candidates.map((candidate: any, index: number) => (
                  <Card key={candidate.id || index}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                              {candidate.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">{candidate.name}</h4>
                              <p className="text-sm text-muted-foreground">{candidate.email}</p>
                              {candidate.phone && (
                                <p className="text-xs text-muted-foreground">{candidate.phone}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-3 text-sm text-muted-foreground">
                            Completou em: {format(new Date(candidate.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary mb-2">
                            {candidate.fit_score}
                          </div>
                          <Badge className={getFitLabelColor(candidate.fit_label)}>
                            Fit {candidate.fit_label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'parameters' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Parâmetros de Geração
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Score Mínimo:</span>
                      <div className="font-medium text-lg">{report.parameters?.minScore || 80} pontos</div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-muted-foreground">Período Analisado:</span>
                      <div className="font-medium text-lg">{report.parameters?.hours || 12} horas</div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-muted-foreground">Notificação:</span>
                      <div className="font-medium text-lg">
                        {report.parameters?.notify ? 'Ativada' : 'Desativada'}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-muted-foreground">Gerado por:</span>
                      <div className="font-medium text-lg">
                        {getGeneratedByLabel(report.generated_by)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Informações Técnicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID do Relatório:</span>
                      <span className="font-mono text-xs">{report.id}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gerado em:</span>
                      <span>{format(new Date(report.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Critério:</span>
                      <span>{report.data?.criteria || `Score ≥ ${report.parameters?.minScore || 80}`}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Registros Encontrados:</span>
                      <span>{report.data?.candidates?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
