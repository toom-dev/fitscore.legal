"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Input } from "@/src/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Switch } from "@/src/components/ui/switch"
import { Label } from "@/src/components/ui/label"
import { 
  FileText, 
  Clock, 
  Play, 
  Pause, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  TrendingUp,
  Users,
  Award,
  Download,
  Eye
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { ReportDetailsModal } from '@/src/components/admin/report-details-modal'

interface ScheduledReport {
  id: string
  name: string
  type: 'approved_candidates' | 'daily_summary' | 'weekly_summary'
  schedule: string
  config: {
    hours?: number
    minScore?: number
    notifyManager?: boolean
    managerEmail?: string
    enabled?: boolean
  }
  lastRun?: string
  nextRun?: string
  created_at: string
  updated_at: string
}

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

export default function RelatoriosPage() {
  const [reports, setReports] = useState<ScheduledReport[]>([])
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'scheduled' | 'generated'>('scheduled')
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newReport, setNewReport] = useState({
    name: '',
    type: 'approved_candidates' as const,
    schedule: '0 */12 * * *',
    config: {
      hours: 12,
      minScore: 80,
      notifyManager: true,
      managerEmail: '',
      enabled: true
    }
  })

  useEffect(() => {
    loadReports()
    loadGeneratedReports()
  }, [])

  const loadGeneratedReports = async () => {
    try {
      const response = await fetch('/api/reports/generated?limit=50')
      
      if (response.ok) {
        const data = await response.json()
        setGeneratedReports(data.reports || [])
      }
    } catch (error) {
    }
  }

  const loadReports = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/reports/schedule')
      
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (error) {

    } finally {
      setIsLoading(false)
    }
  }

  const createReport = async () => {
    try {
      const response = await fetch('/api/reports/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReport)
      })

      if (response.ok) {
        await loadReports()
        setIsCreating(false)
        setNewReport({
          name: '',
          type: 'approved_candidates',
          schedule: '0 */12 * * *',
          config: {
            hours: 12,
            minScore: 80,
            notifyManager: true,
            managerEmail: '',
            enabled: true
          }
        })
      }
    } catch (error) {

    }
  }

  const toggleReport = async (reportId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/reports/schedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: reportId,
          config: { enabled }
        })
      })

      if (response.ok) {
        await loadReports()
      }
    } catch (error) {

    }
  }

  const deleteReport = async (reportId: string) => {
    if (!confirm('Tem certeza que deseja excluir este relatório?')) {
      return
    }

    try {
      const response = await fetch(`/api/reports/schedule?id=${reportId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadReports()
      }
    } catch (error) {

    }
  }

  const executeNow = async (reportId: string) => {
    try {
      const response = await fetch('/api/reports/execute', {
        method: 'POST'
      })

      if (response.ok) {
        await loadReports()
        await loadGeneratedReports()
        toast.success('Relatório executado com sucesso!')
      } else {
        toast.error('Erro ao executar relatório')
      }
    } catch (error) {

    }
  }

  const generateManualReport = async () => {
    try {
      const response = await fetch('/api/reports/approved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hours: 12,
          minScore: 80,
          notifyManager: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        await loadGeneratedReports()
        await loadReports() // Atualizar também os relatórios programados
        toast.success(`Relatório gerado! ${data.report.totalApproved} candidatos aprovados encontrados.`)
      } else {
        toast.error('Erro ao gerar relatório')
      }
    } catch (error) {

    }
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      approved_candidates: 'Candidatos Aprovados',
      daily_summary: 'Resumo Diário',
      weekly_summary: 'Resumo Semanal'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getScheduleLabel = (schedule: string) => {
    const labels = {
      '0 */12 * * *': 'A cada 12 horas',
      '0 9 * * *': 'Diário às 9h',
      '0 9 * * 1': 'Semanal (Segunda às 9h)',
      '0 0 * * 0': 'Semanal (Domingo à meia-noite)'
    }
    return labels[schedule as keyof typeof labels] || schedule
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-9 w-48 bg-muted animate-pulse rounded mb-2" />
          <div className="h-5 w-96 bg-muted animate-pulse rounded" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent dark:from-white dark:to-gray-200">
            Relatórios Automáticos
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure e gerencie relatórios programados do sistema
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateManualReport}
            title="Gera relatório de candidatos aprovados das últimas 12 horas"
          >
            <Download className="w-4 h-4 mr-2" />
            Relatório Últimas 12h
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Relatório
          </Button>
        </div>
      </div>


      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'scheduled' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('scheduled')}
        >
          Programados ({reports.length})
        </Button>
        <Button
          variant={activeTab === 'generated' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('generated')}
        >
          Gerados ({generatedReports.length})
        </Button>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground mt-1">relatórios configurados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
              <Play className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {reports.filter(r => r.config.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">em execução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Execução</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {reports.filter(r => r.config.enabled && r.nextRun).length > 0 ? (
                formatDistanceToNow(
                  new Date(Math.min(...reports
                    .filter(r => r.config.enabled && r.nextRun)
                    .map(r => new Date(r.nextRun!).getTime())
                  )),
                  { addSuffix: true, locale: ptBR }
                )
              ) : 'Nenhuma'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">próximo relatório</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Execução</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-full">
              <Calendar className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {reports.filter(r => r.lastRun).length > 0 ? (
                formatDistanceToNow(
                  new Date(Math.max(...reports
                    .filter(r => r.lastRun)
                    .map(r => new Date(r.lastRun!).getTime())
                  )),
                  { addSuffix: true, locale: ptBR }
                )
              ) : 'Nunca'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">última execução</p>
          </CardContent>
        </Card>
      </div>


      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Relatório Programado</CardTitle>
            <CardDescription>
              Configure um novo relatório para execução automática
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Relatório</Label>
                <Input
                  id="name"
                  value={newReport.name}
                  onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Relatório de Aprovados 12h"
                />
              </div>

              <div>
                <Label htmlFor="type">Tipo de Relatório</Label>
                <Select 
                  value={newReport.type} 
                  onValueChange={(value: any) => setNewReport(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved_candidates">Candidatos Aprovados</SelectItem>
                    <SelectItem value="daily_summary">Resumo Diário</SelectItem>
                    <SelectItem value="weekly_summary">Resumo Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="schedule">Frequência</Label>
                <Select 
                  value={newReport.schedule} 
                  onValueChange={(value) => setNewReport(prev => ({ ...prev, schedule: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0 */12 * * *">A cada 12 horas</SelectItem>
                    <SelectItem value="0 9 * * *">Diário às 9h</SelectItem>
                    <SelectItem value="0 9 * * 1">Semanal (Segunda às 9h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="minScore">Score Mínimo</Label>
                <Input
                  id="minScore"
                  type="number"
                  value={newReport.config.minScore}
                  onChange={(e) => setNewReport(prev => ({ 
                    ...prev, 
                    config: { ...prev.config, minScore: parseInt(e.target.value) }
                  }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={newReport.config.enabled}
                onCheckedChange={(checked) => setNewReport(prev => ({ 
                  ...prev, 
                  config: { ...prev.config, enabled: checked }
                }))}
              />
              <Label htmlFor="enabled">Ativar relatório</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button onClick={createReport}>
                Criar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


      <div className="space-y-4">
        {activeTab === 'scheduled' && (
          <>
            {reports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum relatório configurado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro relatório automático para receber notificações regulares
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Relatório
              </Button>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{report.name}</span>
                      <Badge variant={report.config.enabled ? 'default' : 'secondary'}>
                        {report.config.enabled ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {getTypeLabel(report.type)} • {getScheduleLabel(report.schedule)}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={report.config.enabled || false}
                      onCheckedChange={(checked) => toggleReport(report.id, checked)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => executeNow(report.id)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Executar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteReport(report.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Última execução:</span>
                    <div className="font-medium">
                      {report.lastRun 
                        ? formatDistanceToNow(new Date(report.lastRun), { addSuffix: true, locale: ptBR })
                        : 'Nunca'
                      }
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Próxima execução:</span>
                    <div className="font-medium">
                      {report.nextRun && report.config.enabled
                        ? formatDistanceToNow(new Date(report.nextRun), { addSuffix: true, locale: ptBR })
                        : 'Desabilitado'
                      }
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Score mínimo:</span>
                    <div className="font-medium">{report.config.minScore || 80} pontos</div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Período:</span>
                    <div className="font-medium">{report.config.hours || 12}h</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
          </>
        )}

        {activeTab === 'generated' && (
          <>
            {generatedReports.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Download className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum relatório gerado</h3>
                  <p className="text-muted-foreground mb-4">
                    Os relatórios gerados aparecerão aqui após serem executados
                  </p>
                  <Button onClick={generateManualReport}>
                    <Download className="w-4 h-4 mr-2" />
                    Gerar Primeiro Relatório
                  </Button>
                </CardContent>
              </Card>
            ) : (
              generatedReports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{report.title}</span>
                          <Badge variant={report.generated_by === 'manual' ? 'default' : 'secondary'}>
                            {report.generated_by === 'manual' ? 'Manual' : 
                             report.generated_by === 'scheduled' ? 'Programado' : 'Sistema'}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {getTypeLabel(report.type)} • {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ptBR })}
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report)
                            setIsModalOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (confirm('Tem certeza que deseja excluir este relatório?')) {
                              try {
                                const response = await fetch(`/api/reports/generated?id=${report.id}`, {
                                  method: 'DELETE'
                                })
                                if (response.ok) {
                                  await loadGeneratedReports()
                                  toast.success('Relatório excluído com sucesso')
                                } else {
                                  toast.error('Erro ao excluir relatório')
                                }
                              } catch (error) {
                                toast.error('Erro inesperado')
                              }
                            }
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Período:</span>
                        <div className="font-medium">
                          {formatDistanceToNow(new Date(report.period_start), { locale: ptBR })} - Agora
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Total encontrado:</span>
                        <div className="font-medium">
                          {report.summary?.totalApproved || 0} candidatos
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Score médio:</span>
                        <div className="font-medium">
                          {report.summary?.averageScore || 0} pontos
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Score mínimo:</span>
                        <div className="font-medium">
                          {report.parameters?.minScore || 80} pontos
                        </div>
                      </div>
                    </div>

                    {report.summary?.totalApproved > 0 && (
                      <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                        <div className="text-sm">
                          <span className="font-medium">Resumo:</span>
                          <span className="ml-2">
                            {report.summary.totalApproved} aprovados • 
                            {report.summary.highFit} com score ≥ 90 • 
                            Taxa: {report.summary.completionRate}%
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </>
        )}
      </div>


      <ReportDetailsModal
        report={selectedReport}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedReport(null)
        }}
      />
    </div>
  )
}
