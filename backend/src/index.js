require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { json } = require("body-parser");
const { ApolloServer } = require("@apollo/server");
const { verifyToken } = require("./utils/auth");
const { expressMiddleware } = require("@as-integrations/express5");

const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");
const prisma = require("./prisma");

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 4000;

  const apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();

  app.use(
    "/graphql",
    cors(),
    json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = verifyToken(token);
        return {
          prisma,
          userId: payload?.userId || null,
          role: payload?.role || null,
        };
      },
    }),
  );

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/graphql`);
  });
}

startServer();
