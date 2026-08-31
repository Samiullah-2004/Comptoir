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
  },
};

module.exports = resolvers;