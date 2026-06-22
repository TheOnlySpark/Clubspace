// src/components/admin/UniversitySettings.tsx
"use client";
import * as React from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface UniversitySettingsProps {
  university: any;
  onUpdate: () => void;
  className?: string;
}

export default function UniversitySettings({
  university,
  onUpdate,
  className,
}: UniversitySettingsProps) {
  const [name, setName] = React.useState(university.name || '');
  const [slug, setSlug] = React.useState(university.slug || '');
  const [domainList, setDomainList] = React.useState(
    Array.isArray(university.domain_allowlist)
      ? university.domain_allowlist.join(', ')
      : ''
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const updates = {
        name: name.trim(),
        slug: slug.trim(),
        domain_allowlist: domainList
          .split(',')
          .map((d: string) => d.trim())
          .filter((d: string) => d.length > 0),
      };

      const { error: updateError } = await supabase
        .from('universities')
        .update(updates)
        .eq('id', university.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess('University settings updated successfully');
      setName(university.name); // reset to current values? Actually we could update state with new values
      setSlug(university.slug);
      setDomainList(university.domain_allowlist.join(', '));
      // Call onUpdate to refresh parent data
      onUpdate();
    } catch (err: any) {
      setError(err.message ?? 'Failed to update university settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      <div>
        <label htmlFor="uniName" className="block text-sm font-medium text-muted-foreground mb-2">
          University Name
        </label>
        <Input
          id="uniName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div>
        <label htmlFor="uniSlug" className="block text-sm font-medium text-muted-foreground mb-2">
          Slug (URL-friendly identifier)
        </label>
        <Input
          id="uniSlug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Used in public URLs like /clubs/{slug}
        </p>
      </div>
      <div>
        <label htmlFor="uniDomains" className="block text-sm font-medium text-muted-foreground mb-2">
          Domain Allowlist (comma-separated)
        </label>
        <Input
          id="uniDomains"
          type="text"
          value={domainList}
          onChange={(e) => setDomainList(e.target.value)}
          className="block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Only emails with these domains can sign up (e.g. uct.ac.za, example.com)
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-success">{success}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving...' : 'Save Settings'}
      </Button>
    </form>
  );
}