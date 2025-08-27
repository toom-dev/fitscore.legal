interface CandidateFilters {
  page?: number
  limit?: number
  search?: string
  fitFilter?: string[]
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface CandidatesResponse {
  candidates: unknown[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface DashboardStats {
  stats: {
    total: number
    completed: number
    avgScore: number
  }
  classification: {
    alto: number
    médio: number
    baixo: number
    pending: number
  }
  recentCandidates: unknown[]
}

export class ApiService {
  private static baseUrl = '/api'

  static async getCandidates(filters: CandidateFilters = {}): Promise<ApiResponse<CandidatesResponse>> {
    try {
      const params = new URLSearchParams()
      
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.search) params.append('search', filters.search)
      if (filters.fitFilter?.length) params.append('fitFilter', filters.fitFilter.join(','))

      const response = await fetch(`${this.baseUrl}/candidates?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }

      const data = await response.json()
      return { success: true, data }
    } catch {
      return { success: false, error: 'Erro de conexão' }
    }
  }

  static async getCandidateAnswers(candidateId: string): Promise<ApiResponse<{ answers: unknown[] }>> {
    try {
      const response = await fetch(`${this.baseUrl}/candidates/${candidateId}/answers`)
      
      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }

      const data = await response.json()
      return { success: true, data }
    } catch {
      return { success: false, error: 'Erro de conexão' }
    }
  }

  static async getQuestions(): Promise<ApiResponse<{ questions: unknown[] }>> {
    try {
      const response = await fetch(`${this.baseUrl}/questions`)
      
      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }

      const data = await response.json()
      return { success: true, data }
    } catch {
      return { success: false, error: 'Erro de conexão' }
    }
  }

  static async toggleQuestionStatus(questionId: string, isActive: boolean): Promise<ApiResponse<unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/questions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          is_active: isActive
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }

      const data = await response.json()
      return { success: true, data }
    } catch {
      return { success: false, error: 'Erro de conexão' }
    }
  }

  static async deleteQuestion(questionId: string): Promise<ApiResponse<unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/questions?id=${questionId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }

      const data = await response.json()
      return { success: true, data }
    } catch {
      return { success: false, error: 'Erro de conexão' }
    }
  }

  static async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboard/stats`)
      
      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }

      const data = await response.json()
      return { success: true, data }
    } catch {
      return { success: false, error: 'Erro de conexão' }
    }
  }

  static async submitForm(candidateId: string, answers: unknown[]): Promise<ApiResponse<unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId,
          answers
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }

      const data = await response.json()
      return { success: true, data }
    } catch {
      return { success: false, error: 'Erro de conexão' }
    }
  }
}
