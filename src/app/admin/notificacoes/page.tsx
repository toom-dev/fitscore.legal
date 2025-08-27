"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Input } from "@/src/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { NotificationCard } from '@/src/components/admin/notifications'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { Notification, NotificationType } from '@/lib/types/notifications'
import { 
  Bell, 
  BellRing, 
  CheckCheck, 
  Filter, 
  Search, 
  RefreshCw,
  Archive
} from 'lucide-react'

export default function NotificacoesPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh
  } = useNotifications(false) // Disable auto-refresh on this page

  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    let filtered = notifications

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(notification => notification.type === typeFilter)
    }

    // Filter by status
    if (statusFilter === 'unread') {
      filtered = filtered.filter(notification => !notification.read)
    } else if (statusFilter === 'read') {
      filtered = filtered.filter(notification => notification.read)
    }

    setFilteredNotifications(filtered)
  }, [notifications, searchTerm, typeFilter, statusFilter])

  const handleDeleteAll = async () => {
    if (!confirm('Tem certeza que deseja excluir todas as notificações lidas?')) {
      return
    }

    const readNotifications = notifications.filter(n => n.read)
    for (const notification of readNotifications) {
      await deleteNotification(notification.id)
    }
  }

  const getTypeLabel = (type: NotificationType) => {
    const labels = {
      success: 'Sucesso',
      info: 'Informação',
      warning: 'Atenção',
      error: 'Erro'
    }
    return labels[type]
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-9 w-48 bg-muted animate-pulse rounded mb-2" />
          <div className="h-5 w-96 bg-muted animate-pulse rounded" />
        </div>
        
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
              <div className="flex gap-4">
                <div className="h-10 w-32 bg-muted animate-pulse rounded" />
                <div className="h-10 w-32 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
                    <div>
                      <div className="h-5 w-48 bg-muted animate-pulse rounded mb-1" />
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                  <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
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
            Notificações
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie todas as notificações do sistema
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDeleteAll}>
            <Archive className="w-4 h-4 mr-2" />
            Limpar lidas
          </Button>
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <Bell className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground mt-1">notificações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-full">
              <BellRing className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{unreadCount}</div>
            <p className="text-xs text-muted-foreground mt-1">pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lidas</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
              <CheckCheck className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{notifications.length - unreadCount}</div>
            <p className="text-xs text-muted-foreground mt-1">processadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtradas</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <Filter className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredNotifications.length}</div>
            <p className="text-xs text-muted-foreground mt-1">exibindo</p>
          </CardContent>
        </Card>
      </div>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar notificações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="info">Informação</SelectItem>
                <SelectItem value="warning">Atenção</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
            <div className="flex flex-wrap gap-2 items-center mt-4">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {searchTerm && (
                <Badge variant="secondary">
                  Busca: &quot;{searchTerm}&quot;
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    onClick={() => setSearchTerm('')}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {typeFilter !== 'all' && (
                <Badge variant="secondary">
                  Tipo: {getTypeLabel(typeFilter as NotificationType)}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    onClick={() => setTypeFilter('all')}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary">
                  Status: {statusFilter === 'unread' ? 'Não lidas' : 'Lidas'}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    onClick={() => setStatusFilter('all')}
                  >
                    ×
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>


      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {notifications.length === 0 
                  ? 'Nenhuma notificação encontrada'
                  : 'Nenhuma notificação corresponde aos filtros'
                }
              </h3>
              <p className="text-muted-foreground">
                {notifications.length === 0 
                  ? 'As notificações aparecerão aqui quando houver atividade no sistema'
                  : 'Tente ajustar os filtros para ver mais resultados'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))
        )}
      </div>
    </div>
  )
}
