import type { Metadata } from 'next';
import { createClient, getUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Superadmin',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleError || !roleData || roleData.role !== 'super_admin') {
    redirect('/dashboard')
  }

  return <>{children}</>;
}
