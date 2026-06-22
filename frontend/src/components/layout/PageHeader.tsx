// src/components/layout/PageHeader.tsx
"use client"
import React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  className?: string
  children?: React.ReactNode
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between w-full px-4 pb-6 pt-8',
        className
      )}
      {...props}
    >
      <div className="mb-4 sm:mb-0">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {/* Actions placeholder - could be passed as children */}
      <div className="flex space-x-3">{props.children}</div>
    </div>
  )
)
PageHeader.displayName = 'PageHeader'

export default PageHeader