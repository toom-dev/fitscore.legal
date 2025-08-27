import { Notification, NotificationCategory, NotificationType } from '@/lib/types/notifications'

interface NotificationsResponse {
  notifications: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  unreadCount: number
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export class NotificationService {
  private static baseUrl = '/api/notifications'

  static async getNotifications(
    page: number = 1, 
    limit: number = 20, 
    unreadOnly: boolean = false
  ): Promise<ApiResponse<NotificationsResponse>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        unreadOnly: unreadOnly.toString()
      })

      const response = await fetch(`${this.baseUrl}?${params}`)
      
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

  static async markAsRead(notificationId: string): Promise<ApiResponse<{ notification: Notification }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true })
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

  static async markAllAsRead(): Promise<ApiResponse<{ updatedCount: number }>> {
    try {
      const response = await fetch(`${this.baseUrl}/mark-all-read`, {
        method: 'POST'
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

  static async deleteNotification(notificationId: string): Promise<ApiResponse<unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/${notificationId}`, {
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

  static async createNotification(
    title: string,
    message: string,
    type: NotificationType,
    category: NotificationCategory,
    metadata?: unknown
  ): Promise<ApiResponse<{ notification: Notification }>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          message,
          type,
          category,
          metadata
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

  // Helper methods para criar notificações específicas
  static async notifyCandidateRegistered(candidateName: string, candidateId: string) {
    return this.createNotification(
      'Novo Candidato Registrado',
      `${candidateName} se registrou na plataforma`,
      'info',
      'candidate_registered',
      { candidateName, candidateId }
    )
  }

  static async notifyFormCompleted(candidateName: string, candidateId: string, score: number) {
    const fitLabel = score >= 80 ? 'alto' : score >= 60 ? 'médio' : 'baixo'
    
    return this.createNotification(
      'Formulário Completado',
      `${candidateName} completou o questionário com ${score} pontos`,
      'success',
      'form_completed',
      { candidateName, candidateId, score, fitLabel }
    )
  }

  static async notifyHighScore(candidateName: string, candidateId: string, score: number) {
    return this.createNotification(
      'Score Alto Alcançado!',
      `${candidateName} obteve um excelente score de ${score} pontos`,
      'success',
      'high_score_achieved',
      { candidateName, candidateId, score }
    )
  }

  static async notifySystemAlert(title: string, message: string) {
    return this.createNotification(
      title,
      message,
      'warning',
      'system_alert'
    )
  }

  static async notifyQuestionUpdated(questionTitle: string, questionId: string) {
    return this.createNotification(
      'Pergunta Atualizada',
      `A pergunta "${questionTitle}" foi modificada`,
      'info',
      'question_updated',
      { questionTitle, questionId }
    )
  }

  static async notifyExportReady(exportType: string, exportUrl: string) {
    return this.createNotification(
      'Exportação Concluída',
      `Sua exportação de ${exportType} está pronta para download`,
      'success',
      'export_ready',
      { exportType, exportUrl }
    )
  }
}
