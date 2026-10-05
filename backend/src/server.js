import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import app from './app.js';

/**
 * Server entry point.
 * 1. Connect to MongoDB.
 * 2. Start the HTTP server.
 * 3. Handle graceful shutdown on SIGTERM/SIGINT.
 */

// Connect to database first, then start the server
connectDB().then(() => {
  const server = app.listen(env.PORT, () => {
    console.log(
      `[SERVER] ShelfLife API running in ${env.NODE_ENV} mode on port ${env.PORT}`
    );
    console.log(`[SERVER] Health: http://localhost:${env.PORT}/health`);
    console.log(`[SERVER] API Base: http://localhost:${env.PORT}/api`);
  });

  // ─── Graceful Shutdown ──────────────────────────────────────────────────────
  const shutdown = (signal) => {
    console.log(`\n[SERVER] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[SERVER] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Catch unhandled promise rejections (programming errors)
  process.on('unhandledRejection', (err) => {
    console.error('[SERVER] Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
  });
});
