// src/components/admin/UserRoleTable.tsx
"use client";
import * as React from 'react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface UserRoleTableProps {
  universityId: string;
  onRoleUpdate?: () => void;
  className?: string;
}

export default function UserRoleTable({
  universityId,
  onRoleUpdate,
  className,
}: UserRoleTableProps) {
  const [members, setMembers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [updating, setUpdating] = React.useState<string | null>(null); // updating member id

  // Fetch members for the university
  React.useEffect(() => {
    fetchMembers();
  }, [universityId]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const response = await fetch(`/api/admin/members`, {
        method: 'GET',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch members');
      }
      const data: any[] = await response.json();
      setMembers(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setUpdating(memberId);
    setError(null);
    try {
      const supabase = createClient();
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: newRole,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }
      // Update local state
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      if (onRoleUpdate) onRoleUpdate();
    } catch (err: any) {
      setError(err.message ?? 'Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <p className="text-center py-4">Loading members...</p>;
  }

  if (error) {
    return <p className="text-center text-destructive">{error}</p>;
  }

  return (
    <div className={cn('space-y-6', className)}>
      <h2 className="text-lg font-semibold text-primary mb-4">University Members</h2>

      {members.length === 0 && (
        <p className="text-center py-4 text-muted-foreground">
          No members found for this university.
        </p>
      )}

      {members.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Student Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {members.map((member) => (
                <tr key={member.id} className={updating === member.id ? 'bg-slate-700' : 'hover:bg-slate-800 transition-colors'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {member.first_name || ''} {member.last_name || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {member.student_number || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground capitalize">
                    {member.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {/* Role selector */}
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      disabled={updating === member.id}
                      className="block w-sm rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-foreground ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="member" className="bg-slate-900 text-slate-100">Member</option>
                      <option value="officer" className="bg-slate-900 text-slate-100">Officer</option>
                      <option value="club_admin" className="bg-slate-900 text-slate-100">Club Admin</option>
                      <option value="university_admin" className="bg-slate-900 text-slate-100">University Admin</option>
                      <option value="super_admin" className="bg-slate-900 text-slate-100">Super Admin</option>
                    </select>
                    {updating === member.id && (
                      <span className="text-xs text-muted-foreground">Updating...</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}