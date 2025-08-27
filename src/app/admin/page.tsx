"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { ApiService } from '@/lib/services/api'
import { DashboardSkeleton } from '@/src/components/admin/skeletons'
import { Users, TrendingUp, BarChart3, Award, AlertCircle, HelpCircle } from 'lucide-react'

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      const response = await ApiService.getDashboardStats()
      
      if (response.success && response.data) {
        setDashboardData(response.data)
      }

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



  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Erro ao carregar dados do dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent dark:from-white dark:to-gray-200">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Visão geral dos resultados e estatísticas do FitScore
        </p>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Candidatos</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardData.stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              candidatos registrados
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações Completas</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardData.stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              formulários enviados
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardData.stats.avgScore}</div>
            <p className="text-xs text-muted-foreground mt-1">
              pontos em média
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <Award className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {dashboardData.stats.total > 0 ? Math.round((dashboardData.stats.completed / dashboardData.stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              formulários completos
            </p>
          </CardContent>
        </Card>
      </div>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Resumo por Classificação
          </CardTitle>
          <CardDescription>
            Distribuição dos candidatos por nível de fit
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData.stats.total === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum dado para exibir</h3>
              <p className="text-sm">Candidatos aparecerão aqui após completarem o formulário</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: 'alto', label: 'Fit Alto', color: 'bg-emerald-500', icon: Award },
                { key: 'médio', label: 'Fit Médio', color: 'bg-blue-500', icon: TrendingUp },
                { key: 'baixo', label: 'Fit Baixo', color: 'bg-yellow-500', icon: AlertCircle },
                { key: 'pending', label: 'Pendente', color: 'bg-gray-500', icon: HelpCircle }
              ].map((item) => {
                const count = dashboardData.classification[item.key as keyof typeof dashboardData.classification]
                const percentage = dashboardData.stats.completed > 0 ? Math.round((count / dashboardData.stats.completed) * 100) : 0
                const IconComponent = item.icon
                
                return (
                  <div key={item.label} className="relative overflow-hidden rounded-lg p-4 border bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 ${item.color} rounded-full`}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-2xl font-bold">
                        {count}
                      </div>
                    </div>
                    <div className="text-sm font-semibold mb-1">{item.label}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">{percentage}% do total</div>
                      <div className={`w-full max-w-[60px] h-1 ${item.color} rounded-full ml-2`} 
                           style={{ width: `${Math.max(percentage, 5)}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Últimos Candidatos
          </CardTitle>
          <CardDescription>
            Os 5 candidatos mais recentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData.recentCandidates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum candidato encontrado</h3>
              <p className="text-sm">Candidatos aparecerão aqui quando se cadastrarem</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.recentCandidates.map((candidate: any, index: number) => (
                <div key={candidate.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {candidate.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold">{candidate.name}</h4>
                      <p className="text-sm text-muted-foreground">{candidate.email}</p>
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <span className="w-1 h-1 bg-muted-foreground rounded-full mr-2"></span>
                        {formatDate(candidate.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {candidate.fit_score !== null ? (
                      <div className="flex flex-col items-end">
                        <div className="text-2xl font-bold mb-1">{candidate.fit_score}</div>
                        <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                          candidate.fit_label === 'alto' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' :
                          candidate.fit_label === 'médio' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                          candidate.fit_label === 'baixo' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                        }`}>
                          {candidate.fit_label === 'alto' ? 'Alto' : 
                           candidate.fit_label === 'médio' ? 'Médio' :
                           candidate.fit_label === 'baixo' ? 'Baixo' : 'Pendente'}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <div className="w-8 h-8 bg-muted rounded-full animate-pulse mb-1"></div>
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          Em andamento
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
