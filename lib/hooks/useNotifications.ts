"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/lib/types/notifications'
import { NotificationService } from '@/lib/services/notifications'

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  refresh: () => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
}

export function useNotifications(autoRefresh: boolean = true): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await NotificationService.getNotifications(1, 50)
      
      if (response.success && response.data) {
        setNotifications(response.data.notifications)
        setUnreadCount(response.data.unreadCount)
      } else {
        setError(response.error || 'Erro ao carregar notificações')
      }
    } catch {
      setError('Erro inesperado ao carregar notificações')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await NotificationService.markAsRead(id)
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === id 
              ? { ...notification, read: true }
              : notification
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch {
      // Handle error silently or show toast
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await NotificationService.markAllAsRead()
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        )
        setUnreadCount(0)
      }
    } catch {
      // Handle error silently or show toast
    }
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await NotificationService.deleteNotification(id)
      
      if (response.success) {
        const notificationToDelete = notifications.find(n => n.id === id)
        
        setNotifications(prev => prev.filter(notification => notification.id !== id))
        
        if (notificationToDelete && !notificationToDelete.read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch {
      // Handle error silently or show toast
    }
  }, [notifications])

  const refresh = useCallback(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification
            setNotifications(prev => [newNotification, ...prev])
            setUnreadCount(prev => prev + 1)
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification
            setNotifications(prev => 
              prev.map(notification => 
                notification.id === updatedNotification.id 
                  ? updatedNotification 
                  : notification
              )
            )
            
            // Update unread count if read status changed
            const oldNotification = payload.old as Notification
            if (!oldNotification.read && updatedNotification.read) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            } else if (oldNotification.read && !updatedNotification.read) {
              setUnreadCount(prev => prev + 1)
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedNotification = payload.old as Notification
            setNotifications(prev => 
              prev.filter(notification => notification.id !== deletedNotification.id)
            )
            
            if (!deletedNotification.read) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Auto refresh every 30 seconds if enabled (fallback)
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, loadNotifications])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }
}
