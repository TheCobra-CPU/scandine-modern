import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { currentStaff, apiUnauthorized, apiForbidden } from '@/lib/auth';

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().max(500).default(''),
  price: z.number().positive().max(10000),
  categoryName: z.string().trim().min(2).max(50),
  popular: z.boolean().default(false),
});
const updateSchema = z.object({
  available: z.boolean().optional(),
  popular: z.boolean().optional(),
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  price: z.number().positive().max(10000).optional(),
});

async function requireAdmin() {
  const staff = await currentStaff();
  if (!staff) return { error: apiUnauthorized() };
  if (staff.role !== 'ADMIN') return { error: apiForbidden() };
  return { staff };
}

export async function GET() {
  const access = await requireAdmin();
  if (access.error) return access.error;
  try {
    const items = await prisma.menuItem.findMany({
      include: { category: true },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });
    return NextResponse.json(items.map((item) => ({ ...item, price: Number(item.price) })));
  } catch {
    return NextResponse.json({ error: 'Unable to load menu items.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const access = await requireAdmin();
  if (access.error) return access.error;
  try {
    const b = createSchema.parse(await req.json());
    const category = await prisma.category.upsert({ where: { name: b.categoryName }, update: {}, create: { name: b.categoryName } });
    const item = await prisma.menuItem.create({ data: { name: b.name, description: b.description, price: b.price, categoryId: category.id, available: true, popular: b.popular }, include: { category: true } });
    return NextResponse.json({ ...item, price: Number(item.price) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Check the menu item name, description, price, and category.' }, { status: 400 });
    return NextResponse.json({ error: 'Unable to create menu item.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const access = await requireAdmin();
  if (access.error) return access.error;
  try {
    const body = await req.json();
    const id = z.string().min(1).parse(body.id);
    const data = updateSchema.parse(body);
    const item = await prisma.menuItem.update({ where: { id }, data, include: { category: true } });
    return NextResponse.json({ ...item, price: Number(item.price) });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid menu update.' }, { status: 400 });
    return NextResponse.json({ error: 'Menu item was not found or could not be updated.' }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest) {
  const access = await requireAdmin();
  if (access.error) return access.error;
  try {
    const id = z.string().min(1).parse(new URL(req.url).searchParams.get('id'));
    const item = await prisma.menuItem.findUnique({ where: { id }, include: { orderItems: { select: { id: true }, take: 1 } } });
    if (!item) return NextResponse.json({ error: 'Menu item not found.' }, { status: 404 });
    if (item.orderItems.length) {
      return NextResponse.json({ error: 'This item has order history. Mark it out of stock instead to preserve receipts and reports.' }, { status: 409 });
    }
    await prisma.menuItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete menu item.' }, { status: 500 });
  }
}
