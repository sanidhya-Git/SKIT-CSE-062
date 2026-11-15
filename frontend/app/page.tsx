import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

/**
 * Root page — redirect to dashboard if a session exists, otherwise to login.
 */
export default async function RootPage() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.has('refresh_token');

  if (hasSession) {
    redirect('/overview');
  } else {
    redirect('/login');
  }
}
