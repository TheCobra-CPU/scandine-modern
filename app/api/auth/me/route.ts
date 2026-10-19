import { NextResponse } from 'next/server';
import { currentStaff } from '@/lib/auth';
export async function GET() { const user = await currentStaff(); return user ? NextResponse.json({ user }) : NextResponse.json({ user: null }, { status: 401 }); }
