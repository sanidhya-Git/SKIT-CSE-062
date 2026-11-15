import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    // Tell the backend to revoke the refresh token
    if (refreshToken) {
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `refresh_token=${refreshToken}`,
        },
      }).catch(() => {
        // Backend logout is best-effort; we still clear cookies
      });
    }
  } catch {
    // ignore
  }

  const res = NextResponse.json({ success: true }, { status: 200 });

  // Clear both cookies
  res.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  res.cookies.set('access_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return res;
}
