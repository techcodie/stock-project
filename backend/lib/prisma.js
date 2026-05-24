/**
 * Single shared Prisma client for the whole backend.
 *
 * Why this file exists:
 *   If every controller calls `new PrismaClient()`, each one opens its own
 *   pool of database connections. With ~10 files doing that, the server can
 *   run out of connections on hosted Postgres (like Neon). Creating the client
 *   once here and importing this same instance everywhere keeps it to one pool.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
