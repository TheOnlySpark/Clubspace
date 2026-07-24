import type { Metadata } from 'next';
import { getUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Clubs Details',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { data: { user }, error } = await getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  return <>{children}</>;
}
