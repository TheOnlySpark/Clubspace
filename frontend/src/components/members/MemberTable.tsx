// src/components/members/MemberTable.tsx
"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table'

interface MemberTableProps<T> {
  columns: Array<{
    accessor: keyof T
    header: string
    sortable?: boolean
  }>
  data: T[]
  onRowClick?: (row: T) => void
  className?: string
}

export default function MemberTable<T>({
  columns,
  data,
  onRowClick,
  className,
}: MemberTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(
    null
  )

  // Searchable data
  const searchableData = React.useMemo(() => {
    if (!searchTerm) return data
    return data.filter(row =>
      columns.some(column => {
        const value = row[column.accessor]
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase())
        }
        if (typeof value === 'number') {
          return String(value).includes(searchTerm)
        }
        return false
      })
    )
  }, [data, searchTerm, columns])

  // Sorted data
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return searchableData
    const sorted = [...searchableData].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (typeof aValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      return 0
    })
    return sorted
  }, [searchableData, sortConfig])

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div className="mb-4 md:mb-0">
          <Input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
        </div>
        <div className="flex space-x-3">
          {/* Action buttons can go here */}
          <Button variant="outline" className="hidden md:block">
            Add Member
          </Button>
        </div>
      </div>

      <Table className="w-full">
        <Thead>
          <Tr>
            {columns.map((column) => (
              <Th
                key={column.accessor}
                onClick={() => column.sortable && handleSort(column.accessor)}
                className={cn(
                  'cursor-pointer',
                  sortConfig?.key === column.accessor &&
                    (sortConfig.direction === 'asc' ? 'asc' : 'desc')
                )}
              >
                {column.header}
                {column.sortable && (
                  <span className="ml-1 text-xs">
                    {sortConfig?.key === column.accessor
                      ? sortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </span>
                )}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {sortedData.length === 0 ? (
            <Tr>
              <Td colSpan={columns.length} className="text-center py-4">
                No members found
              </Td>
            </Tr>
          ) : (
            sortedData.map((row, index) => (
              <Tr
                key={index}
                onClick={() => onRowClick?.(row)}
                className="cursor-pointer hover:bg-muted"
              >
                {columns.map((column) => {
                  const value = row[column.accessor]
                  return (
                    <Td key={column.accessor}>
                      {typeof value === 'date' ? value.toLocaleDateString() : value}
                    </Td>
                  )
                })}
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </div>
  )
}