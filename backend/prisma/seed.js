const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();

  const pizzas = await prisma.category.create({ data: { name: 'Pizzas' } });
  const shawarmas = await prisma.category.create({ data: { name: 'Shawarmas & Rolls' } });
  const fries = await prisma.category.create({ data: { name: 'Fries & Loaded Fries' } });
  const desiFastFood = await prisma.category.create({ data: { name: 'Desi Fast Food' } });
  const drinks = await prisma.category.create({ data: { name: 'Drinks' } });

  await prisma.menuItem.createMany({
    data: [
      { name: 'Chicken Tikka Pizza', price: 1250, categoryId: pizzas.id },
      { name: 'Fajita Pizza', price: 1350, categoryId: pizzas.id },
      { name: 'Behari Pizza', price: 1450, categoryId: pizzas.id },
      { name: 'Chicken Shawarma Roll', price: 350, categoryId: shawarmas.id },
      { name: 'Beef Shawarma Roll', price: 400, categoryId: shawarmas.id },
      { name: 'Zinger Shawarma', price: 450, categoryId: shawarmas.id },
      { name: 'Classic Fries', price: 300, categoryId: fries.id },
      { name: 'Peri Peri Loaded Fries', price: 550, categoryId: fries.id },
      { name: 'Cheese Loaded Fries', price: 600, categoryId: fries.id },
      { name: 'Pizza Paratha', price: 400, categoryId: desiFastFood.id },
      { name: 'Chicken Burger', price: 450, categoryId: desiFastFood.id },
      { name: 'Zinger Burger', price: 500, categoryId: desiFastFood.id },
      { name: 'Soft Drink 500ml', price: 120, categoryId: drinks.id },
      { name: 'Fresh Lemonade', price: 200, categoryId: drinks.id },
    ],
  });

  console.log('Pakistani fast food seed data created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });