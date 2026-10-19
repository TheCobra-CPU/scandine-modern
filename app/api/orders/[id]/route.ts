import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { currentStaff, apiUnauthorized, apiForbidden } from '@/lib/auth';
const schema = z.object({ status: z.enum(['NEW', 'PREPARING', 'READY', 'SERVED', 'CANCELLED']) });
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await currentStaff();
  if (!staff) return apiUnauthorized();
  if (!['ADMIN', 'KITCHEN'].includes(staff.role)) return apiForbidden();
  try { const { id } = await params; const { status } = schema.parse(await req.json()); return NextResponse.json(await prisma.order.update({ where: { id }, data: { status } })); }
  catch { return NextResponse.json({ error: 'Unable to update order status' }, { status: 400 }); }
}
