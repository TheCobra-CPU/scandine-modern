import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Scan&Dine...');

  const menu = [
    {
      name: 'Small Plates',
      items: [
        { name: 'Crispy Spring Rolls', description: 'Golden vegetable rolls with sweet chilli', price: 3.5, popular: true },
        { name: 'Garlic Butter Wings', description: 'Chicken wings, garlic butter, herbs', price: 6.5, popular: true },
      ],
    },
    {
      name: 'Mains',
      items: [
        { name: 'Khmer Chicken Amok', description: 'Traditional coconut curry with steamed rice', price: 8.5, popular: true },
        { name: 'Classic Beef Burger', description: 'Grilled beef, cheddar, house sauce, fries', price: 9.5, popular: true },
        { name: 'Grilled Salmon Bowl', description: 'Salmon, greens, rice, citrus dressing', price: 12, popular: false },
      ],
    },
    {
      name: 'Drinks',
      items: [
        { name: 'Iced Latte', description: 'Double espresso with chilled milk', price: 3, popular: true },
        { name: 'Mango Smoothie', description: 'Fresh mango blended with yogurt', price: 3.5, popular: true },
        { name: 'Sparkling Water', description: 'Chilled sparkling mineral water', price: 1.5, popular: false },
      ],
    },
  ];

  for (const group of menu) {
    const category = await prisma.category.upsert({
      where: { name: group.name },
      update: {},
      create: { name: group.name },
    });

    for (const item of group.items) {
      // Keep seeding idempotent even if MenuItem.name is not a unique column.
      const existing = await prisma.menuItem.findFirst({
        where: { name: item.name, categoryId: category.id },
      });
      if (!existing) {
        await prisma.menuItem.create({
          data: { ...item, categoryId: category.id },
        });
      } else if (typeof item.popular === 'boolean') {
        // Keep the sample favorites visible after an existing database is reseeded.
        await prisma.menuItem.update({
          where: { id: existing.id },
          data: { popular: item.popular },
        });
      }
    }
  }
  console.log('✅ Sample menu ready.');

  const starterUsers = [
    { name: 'Restaurant Administrator', email: 'admin@scandine.local', password: 'Admin123!', role: 'ADMIN' as const },
    { name: 'Kitchen Team', email: 'kitchen@scandine.local', password: 'Kitchen123!', role: 'KITCHEN' as const },
    { name: 'Service Team', email: 'service@scandine.local', password: 'Service123!', role: 'SERVICE' as const },
  ];

  for (const user of starterUsers) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    await prisma.staffUser.upsert({
      where: { email: user.email },
      // Update the password hash too, so re-running the seed resets demo logins.
      update: { name: user.name, role: user.role, active: true, passwordHash },
      create: { name: user.name, email: user.email, passwordHash, role: user.role, active: true },
    });
    console.log(`✅ Staff account ready: ${user.email}`);
  }

  for (let i = 1; i <= 10; i++) {
    const name = `Table ${String(i).padStart(2, '0')}`;
    await prisma.diningTable.upsert({
      where: { name }, update: {},
      create: { name, kind: 'STANDARD', seats: 4 },
    });
  }

  for (let i = 1; i <= 5; i++) {
    const name = `VIP Room ${i}`;
    await prisma.diningTable.upsert({
      where: { name }, update: {},
      create: { name, kind: 'VIP', seats: 8 },
    });
  }

  console.log('✅ 10 standard tables and 5 VIP rooms ready.');
  console.log('🎉 Scan&Dine seed completed.');
}

main()
  .catch((error) => {
    console.error('❌ Scan&Dine seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
