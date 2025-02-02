// lib/prismaClient.js

import { PrismaClient } from '@prisma/client';

let prisma;

// Prevent multiple instances of Prisma Client in development
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'], // Optional: Enable logging
    });
  }
  prisma = global.prisma;
}

export default prisma;
