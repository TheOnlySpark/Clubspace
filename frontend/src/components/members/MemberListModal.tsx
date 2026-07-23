"use client"
import * as React from 'react'
import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export type Member = {
  membership_id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  role: 'admin' | 'officer' | 'member'
  course_name?: string
  avatar_url?: string
}

interface MemberListModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clubId: string
  clubName: string
  isAdminOrSuperAdmin: boolean // determines if they can manage roles
}

export default function MemberListModal({
  open,
  onOpenChange,
  clubId,
  clubName,
  isAdminOrSuperAdmin,
}: MemberListModalProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && clubId) {
      fetchMembers()
    }
  }, [open, clubId])

  const fetchMembers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/clubs/${clubId}/members`)
      if (!res.ok) throw new Error('Failed to fetch members')
      const data = await res.json()
      setMembers(data.members || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Optimistic update
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role: newRole as any } : m))
      )

      const res = await fetch(`/api/clubs/${clubId}/members/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!res.ok) {
        throw new Error('Failed to update role')
      }
    } catch (err: any) {
      console.error(err)
      // Revert on error
      fetchMembers()
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-4xl w-full">
      <div className="flex flex-col h-[70vh]">
        <div className="flex-none pb-4 border-b border-border">
          <h2 className="text-xl font-bold text-navy">Member List</h2>
          <p className="text-sm text-gray-500">
            {clubName} members {isAdminOrSuperAdmin ? '— Manage roles below' : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-500">Loading members...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">
              {error}
            </div>
          ) : members.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No members found.
            </div>
          ) : (
            <Table className="w-full">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Course Name</Th>
                  <Th>Club Name</Th>
                  <Th>Role</Th>
                </Tr>
              </Thead>
              <Tbody>
                {members.map((member) => {
                  if (!member) return null;
                  return (
                  <Tr key={member.membership_id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover bg-gray-100"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-electric-blue flex items-center justify-center text-xs font-bold">
                            {(member?.first_name?.[0] || '') + (member?.last_name?.[0] || '')}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-navy text-sm">
                            {member?.first_name} {member?.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{member?.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-sm text-gray-700">
                      {member?.course_name || 'N/A'}
                    </Td>
                    <Td className="text-sm text-gray-700">{clubName}</Td>
                    <Td>
                      {isAdminOrSuperAdmin ? (
                        <select
                          className="bg-gray-50 border border-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                          value={member?.role}
                          onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                        >
                          <option value="member">Member</option>
                          <option value="officer">Officer</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="capitalize text-sm font-medium text-gray-700">
                          {member?.role}
                        </span>
                      )}
                    </Td>
                  </Tr>
                )})}
              </Tbody>
            </Table>
          )}
        </div>

        <div className="flex-none pt-4 border-t border-border flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
