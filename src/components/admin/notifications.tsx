"use client"

import { useState } from 'react'
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover"
import { ScrollArea } from "@/src/components/ui/scroll-area"
import { Notification, NotificationType, NotificationCategory } from '@/lib/types/notifications'
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  User, 
  FileText, 
  Award, 
  AlertTriangle, 
  Settings, 
  Download,
  X,
  Trash2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface NotificationsProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  onRefresh: () => void
}

const getNotificationIcon = (category: NotificationCategory) => {
  const iconMap = {
    candidate_registered: User,
    form_completed: FileText,
    high_score_achieved: Award,
    system_alert: AlertTriangle,
    question_updated: Settings,
    export_ready: Download
  }
  
  return iconMap[category] || Bell
}

const getNotificationColor = (type: NotificationType) => {
  const colorMap = {
    success: 'text-green-600 bg-green-50 border-green-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    error: 'text-red-600 bg-red-50 border-red-200'
  }
  
  return colorMap[type]
}

const getTypeLabel = (type: NotificationType) => {
  const labelMap = {
    success: 'Sucesso',
    info: 'Informação',
    warning: 'Atenção',
    error: 'Erro'
  }
  
  return labelMap[type]
}

export function NotificationBell({ 
  notifications, 
  unreadCount, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onDelete, 
  onRefresh 
}: NotificationsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const recentNotifications = notifications.slice(0, 5)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} não lidas</Badge>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
            >
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-96">
          {recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {recentNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.category)
                const colorClass = getNotificationColor(notification.type)
                
                return (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border transition-colors hover:bg-muted/50 ${
                      !notification.read ? 'bg-primary/5 border-primary/20' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-1.5 rounded-full ${colorClass}`}>
                        <IconComponent className="h-3 w-3" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onMarkAsRead(notification.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(notification.id)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(notification.type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 5 && (
          <div className="p-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                setIsOpen(false)
                // Navigate to notifications page
                window.location.href = '/admin/notificacoes'
              }}
            >
              Ver todas as notificações ({notifications.length})
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function NotificationCard({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: { 
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const IconComponent = getNotificationIcon(notification.category)
  const colorClass = getNotificationColor(notification.type)

  return (
    <Card className={`transition-colors ${!notification.read ? 'border-primary/20 bg-primary/5' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${colorClass}`}>
              <IconComponent className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{notification.title}</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {getTypeLabel(notification.type)}
                </Badge>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </span>
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
              >
                <Check className="h-4 w-4 mr-1" />
                Marcar como lida
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(notification.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {notification.message}
        </p>
        
        {notification.metadata && (
          <div className="mt-3 p-3 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {notification.metadata.candidateName && (
                <div>
                  <span className="font-medium">Candidato:</span>
                  <span className="ml-1">{notification.metadata.candidateName}</span>
                </div>
              )}
              {notification.metadata.score && (
                <div>
                  <span className="font-medium">Score:</span>
                  <span className="ml-1">{notification.metadata.score} pontos</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
