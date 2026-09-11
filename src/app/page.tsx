import { redirect } from 'next/navigation';
import { requireMember } from '@/lib/access';
import Dashboard from '@/components/dashboard';
export const dynamic = 'force-dynamic';
export default async function Page() {
  try {
    await requireMember();
  } catch {
    redirect('/login');
  }
  return <Dashboard />;
}
