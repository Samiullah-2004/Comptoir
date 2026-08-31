const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const starters = await prisma.category.create({ data: { name: 'Starters' } });
  const mains = await prisma.category.create({ data: { name: 'Mains' } });
  const desserts = await prisma.category.create({ data: { name: 'Desserts' } });
  const drinks = await prisma.category.create({ data: { name: 'Drinks' } });

  await prisma.menuItem.createMany({
    data: [
      { name: 'Garlic Bread', price: 5.5, categoryId: starters.id },
      { name: 'Bruschetta', price: 6.0, categoryId: starters.id },
      { name: 'Margherita Pizza', price: 12.0, categoryId: mains.id },
      { name: 'Grilled Chicken', price: 14.5, categoryId: mains.id },
      { name: 'Tiramisu', price: 7.0, categoryId: desserts.id },
      { name: 'Lemonade', price: 3.0, categoryId: drinks.id },
    ],
  });

  console.log('Seed data created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });