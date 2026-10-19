import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from './lib/token';
const protectedRoutes: Record<string, string> = { '/admin': 'ADMIN', '/kitchen': 'KITCHEN', '/service': 'SERVICE' };
function roleHome(role: string) { return role === 'ADMIN' ? '/admin' : role === 'KITCHEN' ? '/kitchen' : '/service'; }
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const session = await verifySessionToken(req.cookies.get('scandine_staff')?.value);
  if (path === '/login' && session) return NextResponse.redirect(new URL(roleHome(session.role), req.url));
  const needed = protectedRoutes[path];
  if (!needed) return NextResponse.next();
  if (!session) { const url = new URL('/login', req.url); url.searchParams.set('next', path); return NextResponse.redirect(url); }
  if (session.role !== needed) return NextResponse.redirect(new URL(roleHome(session.role), req.url));
  return NextResponse.next();
}
export const config = { matcher: ['/login', '/admin/:path*', '/kitchen/:path*', '/service/:path*'] };
