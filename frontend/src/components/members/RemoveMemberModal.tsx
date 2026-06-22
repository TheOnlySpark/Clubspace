// src/components/members/RemoveMemberModal.tsx
"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface RemoveMemberModalProps {
  member: {
    id: string
    first_name: string
    last_name: string
    email: string
    role: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (memberId: string) => void
}

export default function RemoveMemberModal({
  member,
  open,
  onOpenChange,
  onConfirm,
}: RemoveMemberModalProps) {
  const handleConfirm = () => {
    onConfirm(member.id)
    onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-primary mb-4">
          Remove member
        </h2>
        <div className="mb-4">
          <p className="font-medium">Are you sure you want to remove this member?</p>
          <p className="mt-2 text-sm">
            <strong>{member.first_name} {member.last_name}</strong> ({member.email})
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            This will remove them from the club but keep their account active.
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full md:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            className="w-full md:w-auto"
          >
            Remove member
          </Button>
        </div>
      </div>
    </Modal>
  )
}