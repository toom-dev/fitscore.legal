"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Textarea } from "./textarea"
import { Label } from "./label"
import { AlertCircle } from "lucide-react"

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, label, error, hint, required, id, ...props }, ref) => {
    const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
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
          <Textarea
            id={inputId}
            className={cn(
              className,
              hasError && "border-destructive focus-visible:ring-destructive"
            )}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
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

FormTextarea.displayName = "FormTextarea"

export { FormTextarea }
