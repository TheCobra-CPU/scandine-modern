import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession, roleHome, sessionCookie } from '@/lib/auth';
const schema = z.object({ email: z.string().email().transform(v => v.toLowerCase().trim()), password: z.string().min(1).max(200) });
export async function POST(req: NextRequest) { try { const body = schema.parse(await req.json()); const user = await prisma.staffUser.findUnique({ where: { email: body.email } }); if (!user || !user.active || !(await bcrypt.compare(body.password, user.passwordHash))) return NextResponse.json({ error: 'Email or password is incorrect' }, { status: 401 }); const token = await createSession({ id: user.id, name: user.name, email: user.email, role: user.role }); const response = NextResponse.json({ ok: true, redirect: roleHome(user.role), user: { name: user.name, email: user.email, role: user.role } }); response.cookies.set(sessionCookie(token)); return response; } catch (error) { if (error instanceof ZodError) return NextResponse.json({ error: 'Please enter a valid email address and a password.' }, { status: 400 }); console.error('Staff login failed:', error); return NextResponse.json({ error: 'Login service is unavailable. Check the database connection and server terminal.' }, { status: 500 }); } }
