export type NotificationType = 'success' | 'info' | 'warning' | 'error'

export type NotificationCategory = 
  | 'candidate_registered'
  | 'form_completed'
  | 'high_score_achieved'
  | 'system_alert'
  | 'question_updated'
  | 'export_ready'

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  category: NotificationCategory
  read: boolean
  created_at: string
  updated_at: string
  metadata?: {
    candidateId?: string
    candidateName?: string
    score?: number
    questionId?: string
    exportUrl?: string
    [key: string]: unknown
  }
}

export interface NotificationStats {
  total: number
  unread: number
  byType: Record<NotificationType, number>
  byCategory: Record<NotificationCategory, number>
}
