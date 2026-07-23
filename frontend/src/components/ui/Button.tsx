"use client"
import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, children, disabled = false, type = 'button', ...props }, ref) => {
    const Composed = asChild ? 'span' : 'button'

    // Base classes with micro-animations
    const baseClasses = 'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-95'

    // Premium Variants
    const variantClasses = {
      default: 'bg-primary text-white hover:bg-primary/90',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
      outline: 'border border-border bg-background hover:bg-accent hover:text-accent-foreground text-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground text-muted-foreground hover:text-foreground',
      link: 'underline-offset-4 hover:underline text-primary hover:text-accent transition-colors',
    }

    // Sizes
    const sizeClasses = {
      default: 'h-11 px-5 py-2',
      sm: 'h-9 px-4 rounded-lg',
      lg: 'h-12 px-8 rounded-2xl text-base',
      icon: 'h-11 w-11 rounded-xl',
    }

    return React.createElement(
      Composed,
      {
        ref,
        type: asChild ? undefined : type,
        disabled,
        className: cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        ),
        ...props,
      },
      children
    )
  }
)
Button.displayName = 'Button'

export default Button