import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

/**
 * Proxy all /api/proxy/* requests to the backend /api/v1/*.
 * - Strips Cookie and Authorization headers from the incoming request
 * - Reads the access token from the Authorization header the client sends
 *   (the in-memory token), forwards it as Bearer to the backend
 * - Also attempts to read a server-side session token from an httpOnly cookie
 *   as a fallback if no Authorization header was provided
 */
async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const pathSegment = path.join('/');
  const url = new URL(req.url);
  const backendUrl = `${API_URL}/api/v1/${pathSegment}${url.search}`;

  // Build headers for the backend request
  const forwardHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Forward Accept if present
  const accept = req.headers.get('accept');
  if (accept) forwardHeaders['Accept'] = accept;

  // Use the Authorization header from the client (in-memory token)
  const clientAuth = req.headers.get('authorization');
  if (clientAuth) {
    forwardHeaders['Authorization'] = clientAuth;
  } else {
    // Fallback: try the httpOnly access_token cookie (set during login)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('access_token')?.value;
    if (sessionToken) {
      forwardHeaders['Authorization'] = `Bearer ${sessionToken}`;
    }
  }

  // Forward X-Request-ID if present
  const requestId = req.headers.get('x-request-id');
  if (requestId) forwardHeaders['X-Request-ID'] = requestId;

  let body: BodyInit | undefined;
  if (!['GET', 'HEAD'].includes(req.method)) {
    const text = await req.text();
    if (text) body = text;
  }

  try {
    const upstream = await fetch(backendUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
      // Don't follow redirects — pass them back to the client
      redirect: 'manual',
    });

    // Stream the response body back
    const responseBody = await upstream.arrayBuffer();

    const responseHeaders = new Headers();
    // Forward select response headers
    const fwdHeaders = ['content-type', 'x-request-id', 'x-ratelimit-limit', 'x-ratelimit-remaining'];
    for (const h of fwdHeaders) {
      const val = upstream.headers.get(h);
      if (val) responseHeaders.set(h, val);
    }

    return new NextResponse(responseBody.byteLength > 0 ? responseBody : null, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('[proxy] upstream error:', err);
    return NextResponse.json(
      { message: 'The server is unreachable. Check the backend is running.' },
      { status: 502 }
    );
  }
}

export const GET     = handler;
export const POST    = handler;
export const PUT     = handler;
export const PATCH   = handler;
export const DELETE  = handler;
export const HEAD    = handler;
export const OPTIONS = handler;
