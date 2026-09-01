const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/auth");
const { DateTimeResolver } = require("graphql-scalars");
const stripe = require("../utils/stripe");

const resolvers = {
  DateTime: DateTimeResolver,
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
    myOrders: async (_parent, _args, context) => {
      if (!context.userId) {
        throw new Error("You must be logged in to view your orders");
      }
      return context.prisma.order.findMany({
        where: { userId: context.userId },
        include: { items: { include: { menuItem: true } } },
        orderBy: { createdAt: "desc" },
      });
    },
  },
  Mutation: {
    register: async (_parent, { name, email, password }, context) => {
      const existing = await context.prisma.user.findUnique({
        where: { email },
      });
      if (existing) {
        throw new Error("Email already in use");
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await context.prisma.user.create({
        data: { name, email, passwordHash },
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
    updateOrderStatus: async (_parent, { orderId, status }, context) => {
      if (!context.userId) {
        throw new Error("You must be logged in");
      }
      if (context.role !== "ADMIN") {
        throw new Error("Only admins can update order status");
      }

      const order = await context.prisma.order.findUnique({
        where: { id: orderId },
      });
      if (!order) {
        throw new Error("Order not found");
      }

      const updatedOrder = await context.prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          statusHistory: { create: { status } },
        },
        include: {
          items: { include: { menuItem: true } },
        },
      });
      context.io.to(`order:${orderId}`).emit("orderStatusUpdated", {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
      });
      return updatedOrder;
    },
    createCategory: async (_parent, { name }, context) => {
      if (context.role !== "ADMIN") {
        throw new Error("Only admins can manage the menu");
      }
      return context.prisma.category.create({ data: { name } });
    },

    createMenuItem: async (
      _parent,
      { name, price, categoryId, imageUrl },
      context,
    ) => {
      if (context.role !== "ADMIN") {
        throw new Error("Only admins can manage the menu");
      }
      return context.prisma.menuItem.create({
        data: { name, price, categoryId, imageUrl },
        include: { category: true },
      });
    },

    updateMenuItem: async (_parent, { id, ...updates }, context) => {
      if (context.role !== "ADMIN") {
        throw new Error("Only admins can manage the menu");
      }
      return context.prisma.menuItem.update({
        where: { id },
        data: updates,
        include: { category: true },
      });
    },

    deleteMenuItem: async (_parent, { id }, context) => {
      if (context.role !== "ADMIN") {
        throw new Error("Only admins can manage the menu");
      }
      await context.prisma.menuItem.delete({ where: { id } });
      return true;
    },
    createCheckoutSession: async (_parent, { orderId }, context) => {
      if (!context.userId) {
        throw new Error("You must be logged in");
      }

      const order = await context.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { menuItem: true } } },
      });

      if (!order) {
        throw new Error("Order not found");
      }
      if (order.userId !== context.userId) {
        throw new Error("This order does not belong to you");
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: order.items.map((item) => ({
          price_data: {
            currency: "usd",
            product_data: { name: item.menuItem.name },
            unit_amount: Math.round(item.priceAtOrder * 100),
          },
          quantity: item.quantity,
        })),
        success_url: "http://localhost:5173/order-success?orderId=" + order.id,
        cancel_url: "http://localhost:5173/order-cancelled",
      });

      return { url: session.url };
    },
  },
};

module.exports = resolvers;
