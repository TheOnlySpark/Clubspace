// src/components/ui/Toast.tsx
"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'

// Toast context to manage toast state
const ToastContext = React.createContext<{
  toasts: Array<{ id: string; title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }>
  addToast: (toast: Omit<{ id: string; title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }, 'id'>) => void
  removeToast: (id: string) => void
}>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
})

const ToastProvider: React.FC<{ children: React.ReactNode; duration?: number }> = ({ children, duration = 3000 }) => {
  const [toasts, setToasts] = React.useState<Array<{ id: string; title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }>>([])

  const addToast = React.useCallback((toast: Omit<{ id: string; title: string; description?: string; variant?: 'default' | 'destructive' | 'success' }, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, ...toast }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [duration])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

const ToastContainer = () => {
  const { toasts, removeToast } = React.useContext(ToastContext)

  return (
    <div
      className="pointer-events-none fixed w-full top-4 left-1/2 transform -translate-x-1/2 flex flex-col-reverse sm:flex-row sm:space-x-4 sm:space-y-0 z-50"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

interface ToastProps {
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  onClose: () => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ title, description, variant = 'default', onClose, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-border text-muted-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
      success: 'bg-success text-success-foreground',
    }

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className={cn(
          'flex w-full max-w-xs items-center p-4 mb-4 space-x-4 text-sm border-none shadow-lg',
          'rounded-lg ring-1 ring-black/5',
          variantClasses[variant],
          'data-[state=open]:animate-in',
          'data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0',
          'data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95',
          'data-[state=open]:zoom-in-95',
          'data-[state=closed]:duration-200',
          'data-[state=open]:duration-300'
        )}
        {...props}
      >
        <div className="flex flex-col space-y-1">
          <h2 className="font-medium">{title}</h2>
          {description && <p className="text-sm">{description}</p>}
        </div>
        <button
          onClick={onClose}
          className="ml-auto flex h-4 w-4 rounded-md items-center justify-center text-muted-foreground hover:text-muted-foreground/80"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-2 w-2"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }
)
Toast.displayName = 'Toast'

export { ToastProvider, Toast }