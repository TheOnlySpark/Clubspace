// src/components/ui/Dropdown.tsx
"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'

interface DropdownProps {
  children: React.ReactNode
  className?: string
}

interface DropdownTriggerProps {
  children: React.ReactNode
  className?: string
}

interface DropdownContentProps {
  className?: string
  children: React.ReactNode
  sideOffset?: number
  align?: 'start' | 'end'
  collisionPadding?: number
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
      onOpenChange()
    }

    return (
      <button
        ref={ref as React.RefObject<HTMLButtonElement>}
        type="button"
        onClick={handleClick}
        disabled={props.disabled}
        aria-expanded={open}
        className={cn(
          'inline-flex items-center rounded-md border border-input bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
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
          onClose()
        }
      }
      const handleClickOutside = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          onClose()
        }
      }
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('click', handleClickOutside, true)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('click', handleClickOutside, true)
      }
    }, [open, onClose])

    if (!open) return null

    return (
      <div
        ref={ref}
        role="menu"
        aria-orientation="vertical"
        aria-label="dropdown"
        className={cn(
          'absolute z-50 mt-2 w-56 origin-top-left rounded-md bg-popover p-1 text-popover-foreground shadow-lg',
          'is-hidden',
          'data-[state=open]:animate-in',
          'data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0',
          'data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95',
          'data-[state=open]:zoom-in-95',
          'data-[state=closed]:duration-200',
          'data-[state=open]:duration-300',
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