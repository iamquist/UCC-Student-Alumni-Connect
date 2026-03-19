import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import cors from 'cors';
import express from 'express';

import app from './app.js';
import { connectDB } from './db/init.js';
import { ENV, CORS_CONFIG } from './config/index.js';
import { setupSocketHandlers } from './graphql/socketHandlers.js';
import { typeDefs, resolvers } from './graphql/index.js';
import { verifyToken } from './middleware/auth.js';
import { User } from './db/models/user.js';
import logger from './utils/logger.js';

const PORT = ENV.PORT;

async function bootstrap() {
  // Connect to MongoDB
  await connectDB();

  // Create HTTP server
  const httpServer = createServer(app);

  // ── Socket.io ──────────────────────────────────────────────
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: CORS_CONFIG.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  setupSocketHandlers(io);

  // Attach io to app for use in controllers/services
  app.set('io', io);

  // ── GraphQL with Apollo ────────────────────────────────────
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const apolloServer = new ApolloServer({ schema });
  await apolloServer.start();

  app.use(
    '/graphql',
    cors(CORS_CONFIG),
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        let user = null;
        try {
          const authHeader = req.headers.authorization;
          if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            const decoded = verifyToken(token);
            user = await User.findById(decoded.userId).select('-password');
          }
        } catch {}
        return { user, req };
      },
    })
  );

  // ── Start server ───────────────────────────────────────────
  httpServer.listen(PORT, () => {
    logger.info(`🚀 UniAlum API running on port ${PORT}`);
    logger.info(`🌐 REST API: http://localhost:${PORT}${ENV.API_PREFIX}`);
    logger.info(`📊 GraphQL: http://localhost:${PORT}/graphql`);
    logger.info(`⚡ Socket.io: ws://localhost:${PORT}`);
    logger.info(`🌍 Environment: ${ENV.NODE_ENV}`);
  });

  // ── Graceful shutdown ──────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    httpServer.close(async () => {
      await apolloServer.stop();
      const { disconnectDB } = await import('./db/init.js');
      await disconnectDB();
      logger.info('Server shut down.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', reason);
    if (ENV.isProd) process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', err);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error('Bootstrap failed', err);
  process.exit(1);
});
