import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

// Paths that never require authentication
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    // If already authenticated and visiting /login → redirect to dashboard
    if (pathname.startsWith('/login')) {
      const token = request.cookies.get(COOKIE_NAME)?.value;
      if (token && (await verifyToken(token))) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  // Verify JWT from cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifyToken(token))) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
