// src/components/ui/Dropdown.tsx
"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'

interface DropdownProps {
  children: React.ReactNode
  className?: string
}

interface DropdownTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
  open?: boolean
  onOpenChange?: () => void
}

interface DropdownContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children: React.ReactNode
  sideOffset?: number
  align?: 'start' | 'end'
  collisionPadding?: number
  open?: boolean
  onClose?: () => void
}

const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  ({ className, children, ...props }, ref) => {
    const [open, setOpen] = React.useState(false)

    const toggleOpen = () => setOpen((prev) => !prev)
    const close = () => setOpen(false)

    return (
      <div
        ref={ref}
        className={cn('relative inline-block text-left', className)}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            if (child.type === DropdownTrigger) {
              return React.cloneElement(child, {
                open,
                onOpenChange: toggleOpen,
              })
            }
            if (child.type === DropdownContent) {
              return React.cloneElement(child, {
                open,
                onClose: close,
              })
            }
          }
          return child
        })}
      </div>
    )
  }
)
Dropdown.displayName = 'Dropdown'

const DropdownTrigger = React.forwardRef<(HTMLButtonElement | HTMLDivElement) & { __disabledUnderscoreDropdownTrigger?: undefined }, DropdownTriggerProps>(
  ({ className, children, open, onOpenChange, ...props }, ref) => {
    const handleClick = () => {
      onOpenChange?.()
    }

    return (
      <button
        ref={ref as React.RefObject<HTMLButtonElement>}
        type="button"
        onClick={handleClick}
        disabled={props.disabled}
        aria-expanded={open}
        className={cn(
          'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-white/10 focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DropdownTrigger.displayName = 'DropdownTrigger'

const DropdownContent = React.forwardRef<HTMLDivElement, DropdownContentProps>(
  ({ className, children, open, onClose, sideOffset = 4, align = 'start', collisionPadding = 4, ...props }, ref) => {
    React.useEffect(() => {
      if (!open) return
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose?.()
        }
      }
      const handleClickOutside = (e: MouseEvent) => {
        if (ref && typeof ref !== 'function' && ref.current && !ref.current.contains(e.target as Node)) {
          onClose?.()
        }
      }
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('click', handleClickOutside, true)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('click', handleClickOutside, true)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, onClose])

    if (!open) return null

    return (
      <div
        ref={ref}
        role="menu"
        aria-orientation="vertical"
        aria-label="dropdown"
        className={cn(
          'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-white/10 glass-panel p-1 text-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        {...props}
      >
        <div className="py-1" role="none">
          {children}
        </div>
      </div>
    )
  }
)
DropdownContent.displayName = 'DropdownContent'

export { Dropdown, DropdownTrigger, DropdownContent }