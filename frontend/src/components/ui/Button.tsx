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
      default: 'bg-gradient-to-r from-primary to-accent text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-white/10',
      destructive: 'bg-gradient-to-r from-red-600 to-rose-500 text-white hover:shadow-[0_0_20px_rgba(225,29,72,0.4)] border border-white/10',
      outline: 'border border-white/20 bg-white/5 backdrop-blur-md text-foreground hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]',
      secondary: 'bg-white/10 text-foreground backdrop-blur-md hover:bg-white/20 border border-transparent hover:border-white/10',
      ghost: 'hover:bg-white/10 text-muted-foreground hover:text-foreground',
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