"use client"

import { useState } from "react"
import { AdminSidebar } from "@/src/components/admin/admin-sidebar"
import { ThemeToggle } from "@/src/components/theme-toggle"
import { NotificationBell } from "@/src/components/admin/notifications"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { Button } from "@/src/components/ui/button"
import { Menu, X } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh
  } = useNotifications()

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20">

      <div className="hidden lg:block sticky top-0 h-screen">
        <AdminSidebar />
      </div>


      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-64 bg-background shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}


      <main className="flex-1 min-w-0">

        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
            <div className="flex items-center space-x-4">

              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-foreground">
                  Painel Administrativo
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDelete={deleteNotification}
                onRefresh={refresh}
              />
              <ThemeToggle />
            </div>
          </div>
        </header>


        <div className="container mx-auto max-w-screen-2xl p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
