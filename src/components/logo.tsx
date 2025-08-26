"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-12 w-auto", 
    lg: "h-16 w-auto"
  }

  const dimensions = {
    sm: { width: 120, height: 32 },
    md: { width: 180, height: 48 },
    lg: { width: 240, height: 64 }
  }

  // Filtro CSS para inverter cores no modo escuro
  const getImageFilter = () => {
    if (!mounted) return ""
    return resolvedTheme === "dark" ? "brightness(0) invert(1)" : ""
  }

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/images/logo/logo.png"
        alt="Fit Score Legal"
        width={dimensions[size].width}
        height={dimensions[size].height}
        className={`${sizeClasses[size]} transition-all duration-300 hover:scale-105`}
        style={{ 
          filter: getImageFilter(),
          transition: "filter 0.3s ease-in-out"
        }}
        priority={size === "lg"}
      />
    </div>
  )
}