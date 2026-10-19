import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { currentStaff, apiUnauthorized, apiForbidden } from '@/lib/auth';

const orderSchema = z.object({
  tableToken: z.string().min(1),
  notes: z.string().max(500).optional().default(''),
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().int().min(1).max(30),
  })).min(1),
});

export async function GET() {
  const staff = await currentStaff();
  if (!staff) return apiUnauthorized();
  if (!['ADMIN', 'KITCHEN', 'SERVICE'].includes(staff.role)) return apiForbidden();
  try {
    const orders = await prisma.order.findMany({
      where: staff.role === 'KITCHEN' ? { status: { in: ['NEW', 'PREPARING', 'READY'] } } : { status: { not: 'CANCELLED' }, session: { closedAt: null } },
      include: {
        items: { include: { menuItem: true } },
        session: { include: { table: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const response = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        menuItem: {
          ...item.menuItem,
          price: Number(item.menuItem.price),
        },
      })),
    }));

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: 'Database is not ready' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = orderSchema.parse(await req.json());
    const table = await prisma.diningTable.findUnique({
      where: { qrToken: body.tableToken },
    });

    if (!table) {
      return NextResponse.json({ error: 'Unknown table QR code' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let session = await tx.diningSession.findFirst({
        where: { tableId: table.id, closedAt: null },
        orderBy: { openedAt: 'desc' },
      });

      if (!session) {
        session = await tx.diningSession.create({ data: { tableId: table.id } });
      }

      const ids = body.items.map((item) => item.menuItemId);
      const menuItems = await tx.menuItem.findMany({
        where: { id: { in: ids }, available: true },
      });

      if (menuItems.length !== new Set(ids).size) {
        throw new Error('One or more menu items are unavailable');
      }

      const order = await tx.order.create({
        data: {
          sessionId: session.id,
          notes: body.notes,
          items: {
            create: body.items.map((requestedItem) => {
              const menuItem = menuItems.find((item) => item.id === requestedItem.menuItemId)!;
              return {
                menuItemId: menuItem.id,
                quantity: requestedItem.quantity,
                unitPrice: menuItem.price,
              };
            }),
          },
        },
        include: { items: { include: { menuItem: true } } },
      });

      await tx.diningTable.update({
        where: { id: table.id },
        data: { status: 'OCCUPIED' },
      });

      return order;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not place order' },
      { status: 400 },
    );
  }
}
