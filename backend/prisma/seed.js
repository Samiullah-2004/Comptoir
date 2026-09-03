const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CLOUD = 'uzxk7ify';
function img(publicId) {
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${publicId}`;
}

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();

  const burgers = await prisma.category.create({ data: { name: 'Burgers' } });
  const sandwiches = await prisma.category.create({ data: { name: 'Sandwiches' } });
  const wraps = await prisma.category.create({ data: { name: 'Wraps, Shawarma & Paratha' } });
  const friesPasta = await prisma.category.create({ data: { name: 'Fries, Pasta & Sides' } });
  const classicPizza = await prisma.category.create({ data: { name: 'Classic Pizza' } });
  const specialPizza = await prisma.category.create({ data: { name: 'Special Pizza' } });
  const bbq = await prisma.category.create({ data: { name: 'Bar-B-Q' } });
  const fish = await prisma.category.create({ data: { name: 'Fish' } });
  const drinks = await prisma.category.create({ data: { name: 'Drinks' } });

  await prisma.menuItem.createMany({
    data: [
      // Burgers
      { name: 'Zinger Burger Reg', price: 450, categoryId: burgers.id, imageUrl: img('Zinger_Burger_Reg') },
      { name: 'Jumbo Zinger', price: 650, categoryId: burgers.id, imageUrl: img('Jumbo_Zinger') },
      { name: 'Jumbo Patty Burger', price: 600, categoryId: burgers.id, imageUrl: img('Jumbo_Patty_Burger') },
      { name: 'Fish Burger', price: 550, categoryId: burgers.id, imageUrl: img('Fish_Burger') },

      // Sandwiches
      { name: 'Club Sandwich', price: 500, categoryId: sandwiches.id, imageUrl: img('Club_Sandwich') },
      { name: 'Tikka Sandwich', price: 450, categoryId: sandwiches.id, imageUrl: img('Tikka_Sandwich') },
      { name: 'Mexican Sandwich', price: 480, categoryId: sandwiches.id, imageUrl: img('Mexican_Sandwich') },

      // Wraps, Shawarma & Paratha
      { name: 'Zinger Paratha', price: 400, categoryId: wraps.id, imageUrl: img('Zinger_Paratha') },
      { name: 'Zinger Shawarma', price: 450, categoryId: wraps.id, imageUrl: img('Zinger_Shawarma') },
      { name: 'Pizza Paratha', price: 400, categoryId: wraps.id, imageUrl: img('Pizza_Paratha') },

      // Fries, Pasta & Sides
      { name: 'French Fries', price: 300, categoryId: friesPasta.id, imageUrl: img('French_Fries') },
      { name: 'Loaded Fries', price: 600, categoryId: friesPasta.id, imageUrl: img('Loaded_Fries') },
      { name: 'Crunchy Pasta', price: 550, categoryId: friesPasta.id, imageUrl: img('Crunchy_Pasta') },
      { name: 'Macroni Creamy Pasta', price: 550, categoryId: friesPasta.id, imageUrl: img('Macroni_Creamy_Pasta') },
      { name: 'Wings (10 Pcs)', price: 800, categoryId: friesPasta.id, imageUrl: img('Wings') },
      { name: 'Nuggets (10 Pcs)', price: 700, categoryId: friesPasta.id, imageUrl: img('Nuggets') },

      // Classic Pizza
      { name: 'Kabab Pizza', price: 1200, categoryId: classicPizza.id, imageUrl: img('Kabab_Pizza') },
      { name: 'Malai Boti Pizza', price: 1300, categoryId: classicPizza.id, imageUrl: img('Malai_Boti_Pizza') },
      { name: 'Afghani Pizza', price: 1350, categoryId: classicPizza.id, imageUrl: img('Afghani_Pizza') },
      { name: 'Peri Peri Pizza', price: 1300, categoryId: classicPizza.id, imageUrl: img('Peri_Peri_Pizza') },
      { name: 'Euro Pizza', price: 1400, categoryId: classicPizza.id, imageUrl: img('Euro_Pizza') },
      { name: 'Chicken Supreme', price: 1450, categoryId: classicPizza.id, imageUrl: img('Chicken_Supreme') },
      { name: 'Cheese Lover', price: 1200, categoryId: classicPizza.id, imageUrl: img('Cheese_Lover') },
      { name: 'Veggie Pizza', price: 1100, categoryId: classicPizza.id, imageUrl: img('Veggie_Pizza') },

      // Special Pizza Varieties
      { name: 'Crown Crust Pizza', price: 2200, categoryId: specialPizza.id, imageUrl: img('Crown_Crust_Pizza') },
      { name: 'Donner Pizza', price: 1900, categoryId: specialPizza.id, imageUrl: img('Donner_Pizza') },
      { name: 'Lazani Pizza', price: 1700, categoryId: specialPizza.id, imageUrl: img('Lazani_Pizza') },
      { name: 'Chicken Tikka Pizza', price: 1400, categoryId: specialPizza.id, imageUrl: img('Chicken_Tikka_Pizza') },
      { name: 'Chicken Fajita Pizza', price: 1450, categoryId: specialPizza.id, imageUrl: img('Chicken_Fajita_Pizza') },

      // Bar-B-Q
      { name: 'Beef Kabab', price: 600, categoryId: bbq.id, imageUrl: img('Beef_Kabab') },
      { name: 'Chicken Kabab', price: 500, categoryId: bbq.id, imageUrl: img('Chicken_Kabab') },
      { name: 'Chicken Tikka Boti', price: 550, categoryId: bbq.id, imageUrl: img('Chicken_Tikka_Boti') },
      { name: 'Chicken Malai Boti', price: 600, categoryId: bbq.id, imageUrl: img('Chicken_Malai_Boti') },
      { name: 'Chicken Boneless Boti', price: 650, categoryId: bbq.id, imageUrl: img('Chicken_Boneless_Boti') },
      { name: 'Chicken Breast Piece', price: 500, categoryId: bbq.id, imageUrl: img('Chicken_Breast_Piece') },
      { name: 'Chicken Leg Piece', price: 450, categoryId: bbq.id, imageUrl: img('Chicken_Leg_Piece') },

      // Fish
      { name: 'Grilled Fish', price: 900, categoryId: fish.id, imageUrl: img('Grilled_Fish') },
      { name: 'Tandoori Fish', price: 950, categoryId: fish.id, imageUrl: img('Tandoori_Fish') },

      // Drinks
      // Drinks
      { name: 'Cola-Cola 500ml', price: 100, categoryId: drinks.id, imageUrl: img('Cola_500ml') },
      { name: 'Cola-Cola 1 Litre', price: 150, categoryId: drinks.id, imageUrl: img('Cola_1_Litre') },
      { name: 'Cola-Cola 1.5 Litre', price: 200, categoryId: drinks.id, imageUrl: img('Cola_1.5_Litre') },
      { name: 'Sprite 500ml', price: 100, categoryId: drinks.id, imageUrl: img('Sprite_500ml') },
      { name: 'Sprite 1 Litre', price: 150, categoryId: drinks.id, imageUrl: img('Sprite_1L') },
      { name: 'Sprite 1.5 Litre', price: 200, categoryId: drinks.id, imageUrl: img('Sprite_1.5L') },  
    ],
  });

  console.log('Full menu seed data created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });