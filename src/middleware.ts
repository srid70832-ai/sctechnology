import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('sctech_session_token')?.value;

  // 1. Guard /admin routes
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
        const payload = JSON.parse(payloadJson);
        const isExpired = payload.exp && payload.exp * 1000 < Date.now();
        const isAdmin = payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN';

        if (isExpired) {
          const url = new URL('/login', request.url);
          url.searchParams.set('redirect', pathname);
          return NextResponse.redirect(url);
        }

        if (!isAdmin) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } else {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 2. Guard student protected routes
  const protectedStudentRoutes = [
    '/dashboard',
    '/profile',
    '/my-hackathons',
    '/my-internships',
    '/my-projects',
    '/idea-link',
    '/my-certificates',
    '/my-plan',
    '/notifications',
    '/payments',
  ];

  if (protectedStudentRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/my-hackathons/:path*',
    '/my-internships/:path*',
    '/my-projects/:path*',
    '/idea-link/:path*',
    '/my-certificates/:path*',
    '/my-plan/:path*',
    '/notifications/:path*',
    '/payments/:path*',
  ],
};
