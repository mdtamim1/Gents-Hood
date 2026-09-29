import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ADMIN_COOKIE_NAME = 'gh_admin_session';

const getJwtSecret = () => {
  const secret = process.env.AUTH_SECRET || 'gents-hood-ultra-secure-admin-secret-key-32chars';
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Guard Admin API routes (except login)
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth/login')) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    try {
      await jwtVerify(token, getJwtSecret());
      return NextResponse.next();
    } catch {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  // 2. Guard Admin UI pages
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    let isAuthenticated = false;
    if (token) {
      try {
        await jwtVerify(token, getJwtSecret());
        isAuthenticated = true;
      } catch {
        isAuthenticated = false;
      }
    }

    // If on login page and already logged in -> go to dashboard
    if (isLoginPage) {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // If on protected admin route and not logged in -> redirect to login
    if (!isAuthenticated) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
