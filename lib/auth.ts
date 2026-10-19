import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifySessionToken, type StaffRole, type StaffSession } from './token';
export type { StaffRole, StaffSession } from './token';
export const createSession = async (user: Omit<StaffSession, 'exp'>) => import('./token').then(m => m.createSessionToken(user));
export async function currentStaff() { const jar = await cookies(); return verifySessionToken(jar.get('scandine_staff')?.value); }
export function sessionCookie(token: string) { return { name: 'scandine_staff', value: token, httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 10 }; }
export function clearSessionCookie() { return { name: 'scandine_staff', value: '', httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 }; }
export function apiUnauthorized() { return NextResponse.json({ error: 'Staff login required' }, { status: 401 }); }
export function apiForbidden() { return NextResponse.json({ error: 'You do not have permission to do this' }, { status: 403 }); }
export function roleHome(role: StaffRole) { return role === 'ADMIN' ? '/admin' : role === 'KITCHEN' ? '/kitchen' : '/service'; }
