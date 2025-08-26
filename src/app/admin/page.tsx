"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { createClient } from '@/lib/supabase/client'
import { CandidateSummaryView } from '@/lib/types/database'
import { Loader2, Users, TrendingUp, BarChart3, Award, AlertCircle } from 'lucide-react'

export default function DashboardPage() {
  const [candidates, setCandidates] = useState<CandidateSummaryView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    avgScore: 0
  })

  const supabase = createClient()

  useEffect(() => {
    loadCandidates()
  }, [])

  const loadCandidates = async () => {
    try {
      setIsLoading(true)
      
      // Debug: Tentar primeiro a view candidates_summary
      console.log('🔍 Tentando acessar candidates_summary...')
      const { data: summaryData, error: summaryError } = await supabase
        .from('candidates_summary')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('📊 Summary data:', summaryData)
      console.log('❌ Summary error:', summaryError)

      if (summaryError) {
        console.warn('⚠️ View candidates_summary falhou, usando query direta...')
        
        // Fallback: Query direta com JOIN manual
        const { data: directData, error: directError } = await supabase
          .rpc('get_candidates_with_answers')

        if (directError) {
          console.error('❌ Erro na função RPC:', directError)
          
                    // Último fallback: query básica separada
          const { data: candidatesData, error: candidatesError } = await supabase
            .from('candidates')
            .select('*')
            .order('created_at', { ascending: false })

          if (candidatesError) {
            console.error('❌ Erro ao carregar candidatos básicos:', candidatesError)
            return
          }

          console.log('👥 Candidatos encontrados:', candidatesData?.length)

          // Para cada candidato, buscar suas respostas
          const candidatesWithAnswers = await Promise.all(
            (candidatesData || []).map(async (candidate) => {
              const { data: answers, error: answersError } = await supabase
                .from('answers')
                .select('id, question_id')
                .eq('candidate_id', candidate.id)

              if (answersError) {
                console.warn(`⚠️ Erro ao buscar respostas para ${candidate.name}:`, answersError)
              }

              console.log(`📝 ${candidate.name}: ${answers?.length || 0} respostas`)

              return {
                ...candidate,
                total_answers: answers?.length || 0,
                answered_questions: new Set(answers?.map(a => a.question_id) || []).size
              }
            })
          )

          setCandidates(candidatesWithAnswers)
        } else {
          console.log('✅ Dados da RPC função:', directData)
          setCandidates(directData || [])
        }
      } else {
        console.log('✅ Dados da view candidates_summary:', summaryData?.length, 'candidatos')
        setCandidates(summaryData || [])
      }



    } catch (error) {
      console.error('❌ Erro inesperado:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calcular estatísticas sempre que candidates mudar
  useEffect(() => {
    if (candidates.length > 0) {
      const completed = candidates.filter(c => c.completed_at) || []
      const avgScore = completed.length > 0 
        ? completed.reduce((sum, c) => sum + (c.fit_score || 0), 0) / completed.length 
        : 0

      setStats({
        total: candidates.length,
        completed: completed.length,
        avgScore: Math.round(avgScore)
      })
      
      console.log('📈 Estatísticas atualizadas:', {
        total: candidates.length,
        completed: completed.length,
        avgScore: Math.round(avgScore),
        candidatos: candidates.map(c => ({ 
          name: c.name, 
          answers: c.total_answers, 
          completed: !!c.completed_at 
        }))
      })
    }
  }, [candidates])

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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Carregando dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent dark:from-white dark:to-gray-200">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Visão geral dos resultados e estatísticas do FitScore
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Candidatos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  candidatos registrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avaliações Completas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">
                  formulários enviados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgScore}</div>
                <p className="text-xs text-muted-foreground">
                  pontos em média
                </p>
              </CardContent>
        </Card>

        {/* Card adicional com distribuição por classificação */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              formulários completos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de classificações */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo por Classificação</CardTitle>
          <CardDescription>
            Distribuição dos candidatos por nível de fit
          </CardDescription>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum dado para exibir</p>
              <p className="text-sm">Candidatos aparecerão aqui após completarem o formulário</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Fit Altíssimo', 'Fit Aprovado', 'Fit Questionável', 'Fora do Perfil'].map((label) => {
                const count = candidates.filter(c => c.fit_label === label).length
                const percentage = stats.completed > 0 ? Math.round((count / stats.completed) * 100) : 0
                
                return (
                  <div key={label} className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">{count}</div>
                    <div className="text-xs font-medium mb-1">{label}</div>
                    <div className="text-xs text-muted-foreground">{percentage}%</div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Últimos candidatos */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Candidatos</CardTitle>
          <CardDescription>
            Os 5 candidatos mais recentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {candidates.slice(0, 5).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum candidato encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {candidates.slice(0, 5).map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium">{candidate.name}</h4>
                    <p className="text-sm text-muted-foreground">{candidate.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(candidate.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    {candidate.fit_score !== null ? (
                      <div>
                        <div className="text-lg font-bold text-primary">{candidate.fit_score}</div>
                        <div className="text-xs text-muted-foreground">{candidate.fit_label}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">Em andamento</div>
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
