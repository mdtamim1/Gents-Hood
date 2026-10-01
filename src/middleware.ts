import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ADMIN_COOKIE_NAME = 'gh_admin_session';

const getJwtSecret = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
    return new TextEncoder().encode('gents-hood-dev-secret-key-do-not-use-in-prod-32c');
  }
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (request.headers.get('host') || '').toLowerCase();
  const isAdminSubdomain = host.startsWith('admin.');

  // 1. Subdomain Routing:
  if (isAdminSubdomain) {
    // If accessing root of admin subdomain (e.g. admin.gentshood.com/): send to /admin
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // If accessing shortcuts like /login -> send to /admin/login
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  } else if (
    // If request is on main store domain (e.g. www.gentshood.com or gentshood.com)
    // and accessing admin panel pages -> redirect to admin subdomain in production
    process.env.NODE_ENV === 'production' &&
    (host === 'gentshood.com' || host === 'www.gentshood.com') &&
    pathname.startsWith('/admin')
  ) {
    const adminUrl = new URL(pathname, 'https://admin.gentshood.com');
    adminUrl.search = request.nextUrl.search;
    return NextResponse.redirect(adminUrl);
  }

  // 2. Guard Admin API routes (except login)
  if (
    pathname.startsWith('/api/admin') &&
    !pathname.startsWith('/api/admin/auth/login') &&
    !pathname.startsWith('/api/admin/orders/midnight-reset')
  ) {
    // CSRF / Origin validation for state-changing requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const origin = request.headers.get('origin');
      if (origin && process.env.NODE_ENV === 'production') {
        const isAllowedOrigin =
          origin === 'https://admin.gentshood.com' ||
          origin === 'https://gentshood.com' ||
          origin === 'https://www.gentshood.com' ||
          origin.endsWith('.gentshood.com');
        if (!isAllowedOrigin) {
          return NextResponse.json(
            { success: false, error: 'Forbidden: Cross-site request rejected' },
            { status: 403 }
          );
        }
      }
    }

    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    try {
      const { payload } = await jwtVerify(token, jwtSecret);

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

  // 3. Guard Admin UI pages
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    let isAuthenticated = false;
    const jwtSecret = getJwtSecret();
    if (token && jwtSecret) {
      try {
        await jwtVerify(token, jwtSecret);
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
  matcher: ['/((?!_next/static|_next/image|images|favicon.ico|robots.txt|sitemap.xml).*)'],
};
