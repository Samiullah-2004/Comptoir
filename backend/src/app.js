require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { json } = require("body-parser");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express5");
const { unwrapResolverError } = require("@apollo/server/errors");

const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");
const prisma = require("./prisma");
const { verifyToken } = require("./utils/auth");

const isProduction = process.env.NODE_ENV === "production";

// Comma-separated list, e.g. "https://comptoir-food.vercel.app,http://localhost:5173".
// Unset means allow any origin, which keeps local dev and the test suite simple.
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : "*";

// Prisma errors leak connection details and stack frames. Swap them for a
// message the UI can show, and keep the real error in the server logs.
function formatError(formattedError, error) {
  const original = unwrapResolverError(error);
  const name = original?.constructor?.name || "";

  if (name.startsWith("PrismaClient")) {
    console.error("[database]", original.message);
    const unreachable =
      name === "PrismaClientInitializationError" ||
      /Can't reach database|ENOTFOUND|tenant\/user|connection/i.test(original.message);
    return {
      message: unreachable
        ? "The kitchen is temporarily offline. Please try again in a moment."
        : "Something went wrong on our side. Please try again.",
      extensions: { code: unreachable ? "SERVICE_UNAVAILABLE" : "INTERNAL_SERVER_ERROR" },
    };
  }

  return formattedError;
}

async function createApp({ prismaClient } = {}) {
  const db = prismaClient || prisma;
  const app = express();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins },
  });

  io.on("connection", (socket) => {
    socket.on("joinOrderRoom", (orderId) => {
      if (typeof orderId === "string") socket.join(`order:${orderId}`);
    });
  });

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    formatError,
    includeStacktraceInErrorResponses: !isProduction,
  });
  await apolloServer.start();

  app.get("/", (_req, res) => {
    res.json({ name: "Comptoir API", graphql: "/graphql", health: "/health" });
  });

  // Pinged by the keep-alive workflow. Touching the database here is what
  // stops Supabase's free tier from pausing the project for inactivity.
  app.get("/health", async (_req, res) => {
    try {
      await db.$queryRaw`SELECT 1`;
      res.json({ status: "ok", database: "up" });
    } catch (err) {
      console.error("[health]", err.message);
      res.status(503).json({ status: "degraded", database: "down" });
    }
  });

  app.use(
    "/graphql",
    cors({ origin: allowedOrigins }),
    json({ limit: "1mb" }),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.replace("Bearer ", "");
        const payload = verifyToken(token);
        return {
          prisma: db,
          userId: payload?.userId || null,
          role: payload?.role || null,
          io,
        };
      },
    }),
  );

  return { app, httpServer, io };
}

module.exports = { createApp };
