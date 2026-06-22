// src/components/admin/ClubManager.tsx
"use client";
import * as React from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface ClubManagerProps {
  universityId: string;
  onClubUpdate?: () => void;
  className?: string;
}

export default function ClubManager({
  universityId,
  onClubUpdate,
  className,
}: ClubManagerProps) {
  const [clubs, setClubs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [createName, setCreateName] = React.useState('');
  const [createDescription, setCreateDescription] = React.useState('');
  const [createPrivacy, setCreatePrivacy] = React.useState('university');
  const [createJoinPolicy, setCreateJoinPolicy] = React.useState('invite');
  const [editingClubId, setEditingClubId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editDescription, setEditDescription] = React.useState('');
  const [editPrivacy, setEditPrivacy] = React.useState('');
  const [editJoinPolicy, setEditJoinPolicy] = React.useState('');
  const [createLoading, setCreateLoading] = React.useState(false);
  const [updateLoading, setUpdateLoading] = React.useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState<string | null>(null);

  // Fetch clubs for the university
  React.useEffect(() => {
    fetchClubs();
  }, [universityId]);

  const fetchClubs = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const response = await fetch(`/api/admin/clubs`, {
        method: 'GET',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch clubs');
      }
      const data: any[] = await response.json();
      setClubs(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load clubs');
      setClubs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreateLoading(true);
    try {
      const supabase = createClient();
      const response = await fetch(`/api/admin/clubs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: createName.trim(),
          description: createDescription.trim(),
          privacy: createPrivacy,
          join_policy: createJoinPolicy,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create club');
      }
      const newClub: any = await response.json();
      setClubs((prev) => [newClub, ...prev]);
      // Reset form
      setCreateName('');
      setCreateDescription('');
      setCreatePrivacy('university');
      setCreateJoinPolicy('invite');
      if (onClubUpdate) onClubUpdate();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create club');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClubId) return;
    setError(null);
    setUpdateLoading(editingClubId);
    try {
      const supabase = createClient();
      const response = await fetch(`/api/admin/clubs/${editingClubId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim(),
          privacy: editPrivacy,
          join_policy: editJoinPolicy,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update club');
      }
      const updatedClub: any = await response.json();
      setClubs((prev) =>
        prev.map((club) => (club.id === updatedClub.id ? updatedClub : club))
      );
      setEditingClubId(null);
      if (onClubUpdate) onClubUpdate();
    } catch (err: any) {
      setError(err.message ?? 'Failed to update club');
    } finally {
      setUpdateLoading(null);
    }
  };

  const handleDelete = async (clubId: string) => {
    setDeleteLoading(clubId);
    try {
      const supabase = createClient();
      const response = await fetch(`/api/admin/clubs/${clubId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete club');
      }
      setClubs((prev) => prev.filter((club) => club.id !== clubId));
      if (onClubUpdate) onClubUpdate();
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete club');
    } finally {
      setDeleteLoading(null);
    }
  };

  const startEditing = (club: any) => {
    setEditingClubId(club.id);
    setEditName(club.name || '');
    setEditDescription(club.description || '');
    setEditPrivacy(club.privacy || 'university');
    setEditJoinPolicy(club.join_policy || 'invite');
  };

  const cancelEditing = () => {
    setEditingClubId(null);
  };

  if (loading) {
    return <p className="text-center py-4">Loading clubs...</p>;
  }

  if (error) {
    return <p className="text-center text-destructive">{error}</p>;
  }

  return (
    <div className={cn('space-y-6', className)}>
      <h2 className="text-lg font-semibold text-primary mb-4">Clubs in University</h2>

      {/* Create Club Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-primary mb-4">Create New Club</h3>
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label htmlFor="createName" className="block text-sm font-medium text-muted-foreground mb-2">
              Club Name
            </label>
            <Input
              id="createName"
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="createDescription" className="block text-sm font-medium text-muted-foreground mb-2">
              Description
            </label>
            <textarea
              id="createDescription"
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              className="block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="createPrivacy" className="block text-sm font-medium text-muted-foreground mb-2">
                Privacy
              </label>
              <select
                id="createPrivacy"
                value={createPrivacy}
                onChange={(e) => setCreatePrivacy(e.target.value)}
                className="block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="public">Public</option>
                <option value="university">University</option>
                <option value="members">Members Only</option>
              </select>
            </div>
            <div>
              <label htmlFor="createJoinPolicy" className="block text-sm font-medium text-muted-foreground mb-2">
                Join Policy
              </label>
              <select
                id="createJoinPolicy"
                value={createJoinPolicy}
                onChange={(e) => setCreateJoinPolicy(e.target.value)}
                className="block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="open">Open</option>
                <option value="invite">Invite Only</option>
                <option value="approval">Approval Required</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={createLoading} className="w-full">
            {createLoading ? 'Creating...' : 'Create Club'}
          </Button>
        </form>
      </div>

      {/* Clubs List */}
      {clubs.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-primary mb-4">Club List</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Privacy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Join Policy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clubs.map((club) => (
                  <tr key={club.id} className={editingClubId === club.id ? 'bg-blue-50' : ''}>
                    {!editingClubId || editingClubId !== club.id ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {club.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {club.description || ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {club.privacy}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrow text-sm text-gray-500">
                          {club.join_policy}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {editingClubId === null && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditing(club)}
                              className="hidden md:inline-block"
                            >
                              Edit
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(club.id)}
                            disabled={deleteLoading === club.id}
                            className="hidden md:inline-block"
                          >
                            Delete
                          </Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td colSpan={5} className="px-6 py-4">
                          <form onSubmit={handleUpdateSubmit} className="space-y-4">
                            <div>
                              <label htmlFor={"editName-" + club.id} className="block text-sm font-medium text-muted-foreground mb-2">
                                Club Name
                              </label>
                              <Input
                                id={"editName-" + club.id}
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label htmlFor={"editDescription-" + club.id} className="block text-sm font-medium text-muted-foreground mb-2">
                                Description
                              </label>
                              <Input
                                id={"editDescription-" + club.id}
                                type="text"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor={"editPrivacy-" + club.id} className="block text-sm font-medium text-muted-foreground mb-2">
                                  Privacy
                                </label>
                                <select
                                  id={"editPrivacy-" + club.id}
                                  value={editPrivacy}
                                  onChange={(e) => setEditPrivacy(e.target.value)}
                                  className="block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="public">Public</option>
                                  <option value="university">University</option>
                                  <option value="members">Members Only</option>
                                </select>
                              </div>
                              <div>
                                <label htmlFor={"editJoinPolicy-" + club.id} className="block text-sm font-medium text-muted-foreground mb-2">
                                  Join Policy
                                </label>
                                <select
                                  id={"editJoinPolicy-" + club.id}
                                  value={editJoinPolicy}
                                  onChange={(e) => setEditJoinPolicy(e.target.value)}
                                  className="block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="open">Open</option>
                                  <option value="invite">Invite Only</option>
                                  <option value="approval">Approval Required</option>
                                </select>
                              </div>
                            </div>

                            {error && <p className="text-sm text-destructive">{error}</p>}

                            <div className="flex justify-end space-x-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelEditing}
                                className="w-full md:w-auto"
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={handleUpdateSubmit}
                                disabled={updateLoading === club.id}
                                className="w-full md:w-auto"
                              >
                                {updateLoading === club.id ? 'Updating...' : 'Save Changes'}
                              </Button>
                            </div>
                          </form>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {clubs.length === 0 && (
        <p className="text-center py-4 text-muted-foreground">
          No clubs found for this university.
        </p>
      )}
    </div>
  );
}