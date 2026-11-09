import { beforeAll, afterAll } from 'vitest';
import prisma from '../config/prisma.js';

beforeAll(async () => {
  // Test setup
});

afterAll(async () => {
  await prisma.$disconnect();
});
