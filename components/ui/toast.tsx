"use client"

import * as React from "react"

interface ToastProps {
  id?: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
  duration?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export function Toast({
  id,
  title,
  description,
  action,
  variant = "default",
  duration = 3000,
  open = true,
  onOpenChange,
  children,
}: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(open)

  React.useEffect(() => {
    setIsVisible(open)
  }, [open])

  React.useEffect(() => {
    if (isVisible && duration) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onOpenChange?.(false)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onOpenChange])

  if (!isVisible) return null

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 min-w-[300px] rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-5 ${
        variant === "destructive"
          ? "bg-destructive text-destructive-foreground border-destructive"
          : "bg-background text-foreground border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {children}
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            onOpenChange?.(false)
          }}
          className="text-foreground/50 hover:text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  )
}

