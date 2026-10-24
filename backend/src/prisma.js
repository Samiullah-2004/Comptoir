const { PrismaClient } = require('@prisma/client');

// Reuse one client across nodemon reloads so we don't exhaust the pooler's
// connection limit during development.
const prisma = globalThis.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

module.exports = prisma;
