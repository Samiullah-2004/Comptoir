const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/auth");

const resolvers = {
  Query: {
    categories: async (_parent, _args, context) => {
      return context.prisma.category.findMany({ include: { menuItems: true } });
    },
    menuItems: async (_parent, _args, context) => {
      return context.prisma.menuItem.findMany({ include: { category: true } });
    },
    me: async (_parent, _args, context) => {
      if (!context.userId) return null;
      return context.prisma.user.findUnique({ where: { id: context.userId } });
    },
  },
  Mutation: {
    register: async (_parent, { email, password }, context) => {
      const existing = await context.prisma.user.findUnique({
        where: { email },
      });
      if (existing) {
        throw new Error("Email already in use");
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await context.prisma.user.create({
        data: { email, passwordHash },
      });
      const token = generateToken(user);
      return { token, user };
    },
    login: async (_parent, { email, password }, context) => {
      const user = await context.prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new Error("Invalid email or password");
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        throw new Error("Invalid email or password");
      }
      const token = generateToken(user);
      return { token, user };
    },
    createOrder: async (_parent, { items }, context) => {
      if (!context.userId) {
        throw new Error("You must be logged in to place an order");
      }
      if (!items || items.length === 0) {
        throw new Error("Order must contain at least one item");
      }

      const menuItemIds = items.map((i) => i.menuItemId);
      const menuItems = await context.prisma.menuItem.findMany({
        where: { id: { in: menuItemIds } },
      });

      if (menuItems.length !== menuItemIds.length) {
        throw new Error("One or more menu items not found");
      }

      const menuItemMap = Object.fromEntries(menuItems.map((m) => [m.id, m]));

      let total = 0;
      const orderItemsData = items.map((item) => {
        const menuItem = menuItemMap[item.menuItemId];
        if (!menuItem.available) {
          throw new Error(`${menuItem.name} is not currently available`);
        }
        const lineTotal = menuItem.price * item.quantity;
        total += lineTotal;
        return {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          priceAtOrder: menuItem.price,
        };
      });

      const order = await context.prisma.order.create({
        data: {
          userId: context.userId,
          status: "PENDING",
          total,
          items: { create: orderItemsData },
          statusHistory: { create: { status: "PENDING" } },
        },
        include: {
          items: { include: { menuItem: true } },
        },
      });

      return order;
    },
  },
};

module.exports = resolvers;
