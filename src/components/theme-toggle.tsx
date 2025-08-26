"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Button } from "@/src/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="w-10 h-10">
        <Sun className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-10 h-10 transition-all duration-300 hover:scale-105 border-primary/20 hover:border-primary/40"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4 transition-all duration-300 text-primary" />
      ) : (
        <Sun className="h-4 w-4 transition-all duration-300 text-primary" />
      )}
      <span className="sr-only">
        {theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
      </span>
    </Button>
  )
}
