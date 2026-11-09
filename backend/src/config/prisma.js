import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__db) {
    global.__db = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = global.__db;
}

export { prisma };
export default prisma;
