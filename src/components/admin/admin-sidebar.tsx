"use client"

import { Logo } from "@/src/components/logo"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader } from "@/src/components/ui/card"
import { 
  BarChart3, 
  Users, 
  HelpCircle, 
  Home
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: BarChart3,
    description: "Visão geral"
  },
  {
    title: "Candidatos",
    url: "/admin/candidatos",
    icon: Users,
    description: "Gerenciar candidatos"
  },
  {
    title: "Perguntas",
    url: "/admin/perguntas",
    icon: HelpCircle,
    description: "Configurar questões"
  },
]

interface AdminSidebarProps {
  onNavigate?: () => void
}

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname()

  const handleNavClick = () => {
    onNavigate?.()
  }

  return (
    <div className="w-64 h-full bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col items-center space-y-4">
          <Logo size="md" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">FitScore Legal</h2>
            <p className="text-sm text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-muted-foreground px-2 mb-2">
            Navegação
          </h3>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.url
            const Icon = item.icon
            
            return (
              <Link 
                key={item.title} 
                href={item.url}
                onClick={handleNavClick}
              >
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto p-3",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/15"
                  )}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start" 
          asChild
        >
          <Link href="/" onClick={handleNavClick}>
            <Home className="mr-2 h-4 w-4" />
            Voltar ao Formulário
          </Link>
        </Button>
        
        <div className="text-xs text-muted-foreground text-center">
          <div className="bg-muted/30 rounded px-2 py-1">
            FitScore Legal v1.0
          </div>
        </div>
      </div>
    </div>
  )
}
