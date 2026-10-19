import { jwtVerify, SignJWT } from 'jose';
export type StaffRole = 'ADMIN' | 'KITCHEN' | 'SERVICE';
export type StaffSession = { id: string; name: string; email: string; role: StaffRole; exp?: number };
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET || 'change-this-development-secret-before-deploying-please');
export async function createSessionToken(user: Omit<StaffSession, 'exp'>) {
  return new SignJWT(user).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('10h').sign(key());
}
export async function verifySessionToken(token?: string | null): Promise<StaffSession | null> {
  try {
    if (!token) return null;
    const { payload } = await jwtVerify(token, key());
    if (!payload.id || !payload.role || !payload.email) return null;
    if (!['ADMIN', 'KITCHEN', 'SERVICE'].includes(String(payload.role))) return null;
    return payload as unknown as StaffSession;
  } catch { return null; }
}
