const resolvers = {
  Query: {
    categories: async (_parent, _args, context) => {
      return context.prisma.category.findMany({ include: { menuItems: true } });
    },
    menuItems: async (_parent, _args, context) => {
      return context.prisma.menuItem.findMany({ include: { category: true } });
    },
  },
};

module.exports = resolvers;