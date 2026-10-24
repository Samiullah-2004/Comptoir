const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/auth");
const { DateTimeResolver } = require("graphql-scalars");
const { getStripe } = require("../utils/stripe");
const {
  DELIVERY_FEE,
  MAX_QUANTITY_PER_ITEM,
  calculateTotals,
} = require("../utils/pricing");

const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

const resolvers = {
  DateTime: DateTimeResolver,
  Query: {
    categories: async (_parent, _args, context) => {
      return context.prisma.category.findMany({
        include: { menuItems: { orderBy: { name: "asc" } } },
      });
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
    allOrders: async (_parent, _args, context) => {
      if (context.role !== "ADMIN") {
        throw new Error("Only admins can view all orders");
      }
      return context.prisma.order.findMany({
        include: {
          items: { include: { menuItem: true } },
          user: true,
        },
        orderBy: { createdAt: "desc" },
      });
    },
  },
  Mutation: {
    register: async (_parent, { name, email, password }, context) => {
      name = name.trim();
      email = email.trim().toLowerCase();
      if (!name) {
        throw new Error("Please enter your name");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address");
      }
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
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
      email = email.trim().toLowerCase();
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

      // Merge duplicate lines so the same dish sent twice is one order item.
      const quantities = new Map();
      for (const { menuItemId, quantity } of items) {
        if (!Number.isInteger(quantity) || quantity < 1) {
          throw new Error("Each item quantity must be at least 1");
        }
        quantities.set(menuItemId, (quantities.get(menuItemId) || 0) + quantity);
      }
      for (const quantity of quantities.values()) {
        if (quantity > MAX_QUANTITY_PER_ITEM) {
          throw new Error(`You can order at most ${MAX_QUANTITY_PER_ITEM} of a single item`);
        }
      }

      const menuItemIds = [...quantities.keys()];
      const menuItems = await context.prisma.menuItem.findMany({
        where: { id: { in: menuItemIds } },
      });

      if (menuItems.length !== menuItemIds.length) {
        throw new Error("One or more menu items not found");
      }

      const menuItemMap = Object.fromEntries(menuItems.map((m) => [m.id, m]));

      let subtotal = 0;
      const orderItemsData = menuItemIds.map((menuItemId) => {
        const menuItem = menuItemMap[menuItemId];
        const quantity = quantities.get(menuItemId);
        if (!menuItem.available) {
          throw new Error(`${menuItem.name} is not currently available`);
        }
        subtotal += menuItem.price * quantity;
        return {
          menuItemId,
          quantity,
          priceAtOrder: menuItem.price,
        };
      });

      const { total } = calculateTotals(subtotal);

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

      context.io.emit("newOrder", { orderId: order.id });

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
      const trimmed = name.trim();
      if (!trimmed) {
        throw new Error("Category name cannot be empty");
      }
      return context.prisma.category.create({
        data: { name: trimmed },
        include: { menuItems: true },
      });
    },

    createMenuItem: async (
      _parent,
      { name, price, categoryId, imageUrl },
      context,
    ) => {
      if (context.role !== "ADMIN") {
        throw new Error("Only admins can manage the menu");
      }
      if (!name.trim()) {
        throw new Error("Item name cannot be empty");
      }
      if (!(price > 0)) {
        throw new Error("Price must be greater than zero");
      }
      return context.prisma.menuItem.create({
        data: { name: name.trim(), price, categoryId, imageUrl },
        include: { category: true },
      });
    },

    updateMenuItem: async (_parent, { id, ...updates }, context) => {
      if (context.role !== "ADMIN") {
        throw new Error("Only admins can manage the menu");
      }
      if (updates.price !== undefined && updates.price !== null && !(updates.price > 0)) {
        throw new Error("Price must be greater than zero");
      }
      // GraphQL sends explicit nulls for omitted nullable args in some clients;
      // drop them so a partial update never wipes a required column.
      const data = Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined && value !== null),
      );
      return context.prisma.menuItem.update({
        where: { id },
        data,
        include: { category: true },
      });
    },

    deleteMenuItem: async (_parent, { id }, context) => {
      if (context.role !== "ADMIN") {
        throw new Error("Only admins can manage the menu");
      }
      const orderCount = await context.prisma.orderItem.count({
        where: { menuItemId: id },
      });
      if (orderCount > 0) {
        throw new Error(
          "This item appears in past orders. Mark it unavailable instead of deleting it.",
        );
      }
      await context.prisma.menuItem.delete({ where: { id } });
      return true;
    },
    createCheckoutSession: async (_parent, { orderId, notes }, context) => {
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

      if (order.status !== "PENDING") {
        throw new Error("This order has already been processed");
      }

      const subtotal = order.items.reduce(
        (sum, item) => sum + item.priceAtOrder * item.quantity,
        0,
      );
      const { tax } = calculateTotals(subtotal);
      const toMinorUnits = (amount) => Math.round(amount * 100);

      const lineItems = order.items.map((item) => ({
        price_data: {
          currency: "pkr",
          product_data: {
            name: item.menuItem.name,
            ...(item.menuItem.imageUrl ? { images: [item.menuItem.imageUrl] } : {}),
          },
          unit_amount: toMinorUnits(item.priceAtOrder),
        },
        quantity: item.quantity,
      }));
      lineItems.push(
        {
          price_data: {
            currency: "pkr",
            product_data: { name: "Delivery fee" },
            unit_amount: toMinorUnits(DELIVERY_FEE),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "pkr",
            product_data: { name: "Tax (5%)" },
            unit_amount: toMinorUnits(tax),
          },
          quantity: 1,
        },
      );

      const session = await getStripe().checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,
        metadata: {
          orderId: order.id,
          // Stripe caps metadata values at 500 characters.
          ...(notes && notes.trim() ? { notes: notes.trim().slice(0, 500) } : {}),
        },
        success_url: `${FRONTEND_URL}/orders?checkout=success&orderId=${order.id}`,
        cancel_url: `${FRONTEND_URL}/cart?checkout=cancelled`,
      });

      return { url: session.url };
    },

    deleteCategory: async (_parent, { id }, context) => {
      if (context.role !== "ADMIN") {
        throw new Error("Only admins can manage the menu");
      }
      const itemCount = await context.prisma.menuItem.count({
        where: { categoryId: id },
      });
      if (itemCount > 0) {
        throw new Error("Cannot delete a category that still has menu items");
      }
      await context.prisma.category.delete({ where: { id } });
      return true;
    },
  },
};

module.exports = resolvers;
