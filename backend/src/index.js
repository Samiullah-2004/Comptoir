require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { json } = require('body-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express5');

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const prisma = require('./prisma');
const { verifyToken } = require('./utils/auth');

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const PORT = process.env.PORT || 4000;

  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('joinOrderRoom', (orderId) => {
      socket.join(`order:${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  const apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();

  app.use(
    '/graphql',
    cors(),
    json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.replace('Bearer ', '');
        const payload = verifyToken(token);
        return {
          prisma,
          userId: payload?.userId || null,
          role: payload?.role || null,
          io,
        };
      },
    })
  );

  httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/graphql`);
    console.log(`Socket.IO ready`);
  });
}

startServer();