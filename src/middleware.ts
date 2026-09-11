import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that can be viewed without logging in
const PUBLIC_ROOTS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/verify',
  '/ref',
];

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_ROOTS.some(
    (root) => root !== '/' && (pathname === root || pathname.startsWith(root + '/'))
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get('sctech_session_token')?.value;

  let userPayload: { uid?: string; email?: string; role?: string; exp?: number } | null = null;

  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
        const parsed = JSON.parse(payloadJson);
        const isExpired = parsed.exp && parsed.exp * 1000 < Date.now();
        if (!isExpired) {
          userPayload = parsed;
        }
      }
    } catch {
      userPayload = null;
    }
  }

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password';

  // 1. If user is already authenticated and visits /login or /register
  if (userPayload && isAuthPage) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const isAdmin = userPayload.role === 'ADMIN' || userPayload.role === 'SUPER_ADMIN';

    if (isAdmin) {
      const target = redirectParam && redirectParam.startsWith('/admin') ? redirectParam : '/admin';
      return NextResponse.redirect(new URL(target, request.url));
    } else if (userPayload.role === 'JUDGE') {
      return NextResponse.redirect(new URL('/judge', request.url));
    } else if (userPayload.role === 'COMPANY' || userPayload.role === 'HR') {
      return NextResponse.redirect(new URL('/company', request.url));
    } else {
      const target = redirectParam && !redirectParam.startsWith('/admin') ? redirectParam : '/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  // 2. If path is public and user is unauthenticated or just visiting
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 3. If unauthenticated user tries to access any non-public path
  if (!userPayload) {
    const fullPath = pathname + (search || '');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', fullPath);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Role-based route guards for authenticated users
  const isAdmin = userPayload.role === 'ADMIN' || userPayload.role === 'SUPER_ADMIN';

  if (pathname.startsWith('/admin')) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (pathname.startsWith('/judge')) {
    if (userPayload.role !== 'JUDGE' && !isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (pathname.startsWith('/company')) {
    if (userPayload.role !== 'COMPANY' && userPayload.role !== 'HR' && !isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/*)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.png, images/*, static asset extensions
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|logo\\.png|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
