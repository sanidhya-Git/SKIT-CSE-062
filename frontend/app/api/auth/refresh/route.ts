import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export async function POST(_req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json({ message: 'No session found.' }, { status: 401 });
    }

    const upstream = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      // Clear stale cookie
      const res = NextResponse.json(
        { message: data.message ?? 'Session expired.' },
        { status: 401 }
      );
      res.cookies.set('refresh_token', '', { httpOnly: true, maxAge: 0, path: '/' });
      res.cookies.set('access_token', '', { httpOnly: true, maxAge: 0, path: '/' });
      return res;
    }

    const { accessToken, refreshToken: newRefreshToken, user } = data;
    const token = accessToken;

    const res = NextResponse.json({ token, user }, { status: 200 });

    // Rotate refresh token if the backend issued a new one
    if (newRefreshToken) {
      res.cookies.set('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    if (token) {
      res.cookies.set('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 15,
      });
    }

    return res;
  } catch (err) {
    console.error('[auth/refresh] error:', err);
    return NextResponse.json({ message: 'Could not refresh session.' }, { status: 500 });
  }
}
