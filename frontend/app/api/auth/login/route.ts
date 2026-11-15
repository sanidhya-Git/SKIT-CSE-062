import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const upstream = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return NextResponse.json(
        { message: data.message ?? 'Login failed.' },
        { status: upstream.status }
      );
    }

    // data = { accessToken, refreshToken, user }
    const { accessToken, refreshToken, user } = data;
    const token = accessToken;

    const res = NextResponse.json({ token, user }, { status: 200 });

    // Store refresh token in httpOnly cookie
    if (refreshToken) {
      res.cookies.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    // Store access token in httpOnly cookie as fallback for server-side proxy
    if (token) {
      res.cookies.set('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 15, // 15 minutes (matches typical JWT expiry)
      });
    }

    return res;
  } catch (err) {
    console.error('[auth/login] error:', err);
    return NextResponse.json(
      { message: 'Login failed due to a server error. Please try again.' },
      { status: 500 }
    );
  }
}
