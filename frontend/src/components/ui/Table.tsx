// src/components/ui/Table.tsx
"use client"
import React from 'react'
import { cn } from '@/lib/utils'

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  className?: string
  children: React.ReactNode
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <table
      ref={ref}
      className={cn(
        'w-full text-sm text-left rtl:text-right text-muted-foreground',
        className
      )}
      {...props}
    />
  )
)
Table.displayName = 'Table'

interface TheadProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string
  children: React.ReactNode
}
const Thead = React.forwardRef<HTMLTableSectionElement, TheadProps>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('bg-muted', className)} {...props} />
))
Thead.displayName = 'Thead'

interface TbodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string
  children: React.ReactNode
}
const Tbody = React.forwardRef<HTMLTableSectionElement, TbodyProps>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('divide-y divide-muted', className)} {...props} />
))
Tbody.displayName = 'Tbody'

interface TrProps extends React.HTMLAttributes<HTMLTableRowElement> {
  className?: string
  children?: React.ReactNode
}
const Tr = React.forwardRef<HTMLTableRowElement, TrProps>(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn(' hover:bg-muted/50', className)} {...props} />
))
Tr.displayName = 'Tr'

interface ThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  className?: string
  children?: React.ReactNode
}
const Th = React.forwardRef<HTMLTableCellElement, ThProps>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'px-6 py-3 font-medium text-left text-[0.875rem] uppercase tracking-wider',
      className
    )}
    {...props}
  />
))
Th.displayName = 'Th'

interface TdProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  className?: string
  children?: React.ReactNode
}
const Td = React.forwardRef<HTMLTableCellElement, TdProps>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('px-6 py-4 whitespace-nowrap', className)}
    {...props}
  />
))
Td.displayName = 'Td'

export { Table, Thead, Tbody, Tr, Th, Td }