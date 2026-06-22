// src/components/ui/Modal.tsx
"use client"
import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ open, onOpenChange, children, className, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    const handleClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onOpenChange(false)
      }
    }

    React.useEffect(() => {
      if (open) {
        document.addEventListener('keydown', handleKeyDown)
      }
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }, [open])

    if (!open) return null

    return createPortal(
      <div
        ref={ref}
        onClick={handleClick}
        className={cn(
          'fixed inset-0 z-50 flex min-h-[calc(100%-3.5rem)] items-center justify-center px-4 py-6 sm:p-0',
          'bg-black/50 backdrop-blur-sm',
          className
        )}
        {...props}
      >
        <div className={cn(
          'relative w-full max-w-lg rounded-lg bg-popover p-6 shadow-lg transition-all',
          'data-[state=open]:animate-in',
          'data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0',
          'data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95',
          'data-[state=open]:zoom-in-95',
          'data-[state=closed]:duration-200',
          'data-[state=open]:duration-300'
        )}
        >
          {children}
        </div>
      </div>,
      document.body
    )
  }
)
Modal.displayName = 'Modal'

export default Modal