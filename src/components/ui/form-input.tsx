"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import { Label } from "./label"
import { AlertCircle } from "lucide-react"

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, type, label, error, hint, required, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const hasError = !!error

    return (
      <div className="space-y-2">
        {label && (
          <Label 
            htmlFor={inputId} 
            className={cn(
              "text-sm font-medium",
              hasError && "text-destructive",
              required && "after:content-['*'] after:ml-0.5 after:text-destructive"
            )}
          >
            {label}
          </Label>
        )}
        
        <div className="relative">
          <Input
            id={inputId}
            type={type}
            className={cn(
              className,
              hasError && "border-destructive focus-visible:ring-destructive",
              hasError && "pr-10"
            )}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
          
          {hasError && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          )}
        </div>

        {error && (
          <p 
            id={`${inputId}-error`}
            className="text-sm text-destructive flex items-center gap-1"
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            {error}
          </p>
        )}

        {hint && !error && (
          <p 
            id={`${inputId}-hint`}
            className="text-sm text-muted-foreground"
          >
            {hint}
          </p>
        )}
      </div>
    )
  }
)

FormInput.displayName = "FormInput"

export { FormInput }
