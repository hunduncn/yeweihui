import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'yeweihui-jwt-secret-change-in-production'
);

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('auth-token')?.value;

  if (token) {
    try {
      await jwtVerify(token, SECRET);
      return NextResponse.next();
    } catch {
      // Invalid/expired token — fall through
    }
  }

  // API requests → 401
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  // Page requests → redirect to login
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
