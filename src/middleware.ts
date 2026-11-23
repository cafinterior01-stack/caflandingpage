import { NextRequest, NextResponse } from 'next/server';

function decodeSessionCookie(token?: string): { id: string; email: string; role: string; name: string } | null {
  if (!token) return null;
  try {
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin dashboard route (allow /admin/login for authentication)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('caf_session')?.value;
    const session = decodeSessionCookie(token);

    if (!session) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role !== 'ADMIN') {
      const deniedUrl = new URL('/admin/login?error=access_denied', request.url);
      return NextResponse.redirect(deniedUrl);
    }
  }

  // Protect /api/admin endpoint at the edge
  if (pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('caf_session')?.value;
    const session = decodeSessionCookie(token);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Administrator authorisation required.' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
