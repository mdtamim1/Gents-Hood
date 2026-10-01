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
  if (
    pathname.startsWith('/api/admin') &&
    !pathname.startsWith('/api/admin/auth/login') &&
    !pathname.startsWith('/api/admin/orders/midnight-reset')
  ) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());

      // Check if user is active via the token's role/id
      // Full session validation happens in individual route handlers
      if (!payload.id || !payload.role) {
        return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
      }

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

    // If on login page
    if (isLoginPage) {
      // If there's an error/invalidation reason, clear the stale cookie to prevent redirect loops
      if (request.nextUrl.searchParams.has('reason') || !isAuthenticated) {
        const response = NextResponse.next();
        if (token) {
          response.cookies.delete(ADMIN_COOKIE_NAME);
          response.cookies.set({
            name: ADMIN_COOKIE_NAME,
            value: '',
            path: '/',
            maxAge: 0,
          });
        }
        return response;
      }

      // If authenticated and no reason given, go to dashboard
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
