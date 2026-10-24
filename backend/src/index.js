const { createApp } = require('./app');
const prisma = require('./prisma');

const PORT = process.env.PORT || 4000;

async function startServer() {
  const { httpServer } = await createApp();

  httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/graphql`);
    console.log('Socket.IO ready');
  });

  async function shutdown() {
    httpServer.close();
    await prisma.$disconnect();
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
