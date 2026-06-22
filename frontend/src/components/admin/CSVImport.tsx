// src/components/admin/CSVImport.tsx
"use client";
import * as React from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface CSVImportProps {
  className?: string;
}

export default function CSVImport({ className }: CSVImportProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(null);
      setReport(null);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setError(null);
    setSuccess(null);
    setUploading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Get user's university_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('university_id')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profileData) {
        throw new Error('Profile not found');
      }

      const formData = new FormData();
      formData.append('file', file);

      // Call the API route
      const response = await fetch(`/api/university/import`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import CSV');
      }

      setSuccess(result.message || 'Import completed');
      setReport(result.report);
    } catch (err: any) {
      setError(err.message ?? 'Failed to import CSV');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <h2 className="text-xl font-semibold text-primary">CSV Import</h2>
      <p className="text-muted-foreground">
        Import multiple members at once using a CSV file. Required columns: email, student_number.
        Optional columns: first_name, last_name, department.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-success">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="csvFile" className="block text-sm font-medium text-muted-foreground mb-2">
            CSV File
          </label>
          <Input
            id="csvFile"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-muted-foreground border border-input bg-transparent"
          />
          {file && (
            <p className="text-xs text-muted-foreground mt-1">
              Selected file: {file.name}
            </p>
          )}
        </div>

        <Button type="submit" disabled={uploading} className="w-full">
          {uploading ? 'Uploading...' : 'Import CSV'}
        </Button>
      </form>

      {report && (
        <div className="bg-white rounded-lg shadow-md p-4 mt-6">
          <h3 className="text-lg font-semibold text-primary mb-4">Import Report</h3>
          <div className="space-y-2">
            <p><strong>Total rows:</strong> {report.total}</p>
            <p><strong>Successful:</strong> {report.success}</p>
            <p><strong>Errors:</strong> {report.errors?.length || 0}</p>
            {report.errorDetails && report.errorDetails.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-muted-foreground">First few errors:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                  {report.errorDetails.map((err: any, idx: number) => (
                    <li key={idx}>
                      Email: {err.row?.email} - {err.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}