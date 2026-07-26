// src/components/admin/UserRoleTable.tsx
"use client";
import * as React from 'react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Save, RotateCcw } from 'lucide-react';

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
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Track pending role changes: { memberId: newRole }
  const [pendingChanges, setPendingChanges] = React.useState<Record<string, string>>({});

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  // Fetch members for the university
  React.useEffect(() => {
    fetchMembers();
  }, [universityId]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    setPendingChanges({});
    setSaveSuccess(false);
    try {
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

  // Stage a role change locally (does NOT save to DB yet)
  const handleRoleChange = (memberId: string, newRole: string) => {
    const originalMember = members.find((m) => m.id === memberId);
    if (!originalMember) return;

    // If the user reverts back to the original role, remove from pending
    if (originalMember.role === newRole) {
      setPendingChanges((prev) => {
        const updated = { ...prev };
        delete updated[memberId];
        return updated;
      });
    } else {
      setPendingChanges((prev) => ({ ...prev, [memberId]: newRole }));
    }
    setSaveSuccess(false);
  };

  // Get the displayed role for a member (pending change takes priority)
  const getDisplayedRole = (member: any) => {
    return pendingChanges[member.id] ?? member.role;
  };

  // Save all pending changes to Supabase via the API
  const handleSaveAll = async () => {
    if (!hasPendingChanges) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    const entries = Object.entries(pendingChanges);
    const errors: string[] = [];

    for (const [memberId, newRole] of entries) {
      try {
        const response = await fetch(`/api/admin/members/${memberId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          const memberName = members.find((m) => m.id === memberId);
          errors.push(
            `${memberName?.first_name || 'User'}: ${errorData.error || 'Failed to update'}`
          );
        }
      } catch (err: any) {
        errors.push(err.message ?? 'Unknown error');
      }
    }

    if (errors.length > 0) {
      setError(`Some role updates failed: ${errors.join('; ')}`);
    } else {
      setSaveSuccess(true);
    }

    // Re-fetch fresh data from the server to ensure consistency
    await fetchMembers();
    if (onRoleUpdate) onRoleUpdate();
    setSaving(false);
  };

  // Discard all pending changes
  const handleDiscardChanges = () => {
    setPendingChanges({});
    setSaveSuccess(false);
  };

  if (loading) {
    return <p className="text-center py-4">Loading members...</p>;
  }

  if (error && members.length === 0) {
    return <p className="text-center text-destructive">{error}</p>;
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">University Members</h2>
        <div className="flex items-center gap-3">
          {hasPendingChanges && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDiscardChanges}
              disabled={saving}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Discard
            </Button>
          )}
          <Button
            variant={hasPendingChanges ? 'default' : 'outline'}
            size="sm"
            onClick={handleSaveAll}
            disabled={!hasPendingChanges || saving}
            className={cn(
              'transition-all duration-300',
              hasPendingChanges && 'animate-in fade-in zoom-in-95 duration-200'
            )}
          >
            <Save className="w-4 h-4 mr-1.5" />
            {saving
              ? 'Saving...'
              : hasPendingChanges
                ? `Save ${Object.keys(pendingChanges).length} change${Object.keys(pendingChanges).length > 1 ? 's' : ''}`
                : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Success message */}
      {saveSuccess && !hasPendingChanges && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          All role changes saved successfully.
        </div>
      )}

      {/* Error message */}
      {error && members.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

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
              {members.map((member) => {
                const displayedRole = getDisplayedRole(member);
                const isChanged = pendingChanges[member.id] !== undefined;

                return (
                  <tr
                    key={member.id}
                    className={cn(
                      'transition-colors',
                      isChanged
                        ? 'bg-primary/5 border-l-2 border-l-primary'
                        : 'hover:bg-slate-800'
                    )}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {member.first_name || ''} {member.last_name || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {member.student_number || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground capitalize">
                      <span className="flex items-center gap-2">
                        {displayedRole.replace('_', ' ')}
                        {isChanged && (
                          <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">
                            unsaved
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {/* Role selector */}
                      <select
                        value={displayedRole}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        disabled={saving}
                        className="block w-sm rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-foreground ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="member" className="bg-slate-900 text-slate-100">Member</option>
                        <option value="officer" className="bg-slate-900 text-slate-100">Officer</option>
                        <option value="club_admin" className="bg-slate-900 text-slate-100">Club Admin</option>
                        <option value="university_admin" className="bg-slate-900 text-slate-100">University Admin</option>
                        <option value="super_admin" className="bg-slate-900 text-slate-100">Super Admin</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}