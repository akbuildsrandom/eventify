import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/prisma.js';

describe('Critical Concurrency & High-Volume Inventory Reservation', () => {
  let customer1Cookie;
  let customer2Cookie;
  let eventId;
  let singleTicketTypeId;

  beforeAll(async () => {
    // 1. Log in customer 1
    const res1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer1@eventify.com', password: 'Password123!' });
    customer1Cookie = res1.headers['set-cookie'];

    // 2. Log in customer 2
    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer2@eventify.com', password: 'Password123!' });
    customer2Cookie = res2.headers['set-cookie'];

    // 3. Find an organizer
    const organizer = await prisma.user.findFirst({
      where: { role: 'ORGANIZER' },
    });

    // 4. Create an exclusive flash-sale event with EXACTLY 1 ticket available
    const now = new Date();
    const flashEvent = await prisma.event.create({
      data: {
        title: `Flash Sale Concurrency Event ${Date.now()}`,
        slug: `flash-sale-${Date.now()}`,
        description: 'Testing high-concurrency race condition where only 1 VIP ticket is left.',
        category: 'CONCERT',
        organizerId: organizer.id,
        startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        status: 'PUBLISHED',
        ticketTypes: {
          create: [
            {
              name: 'Sole VIP Pass',
              price: 5000,
              totalQuantity: 1,
              availableQuantity: 1, // EXACTLY 1 TICKET REMAINING
              salesStart: new Date(now.getTime() - 10000),
              salesEnd: new Date(now.getTime() + 1000000),
              maxPerOrder: 1,
            },
          ],
        },
      },
      include: { ticketTypes: true },
    });

    eventId = flashEvent.id;
    singleTicketTypeId = flashEvent.ticketTypes[0].id;
  });

  it('MANDATORY TEST: When only ONE ticket remains, only one of two simultaneous requests must succeed', async () => {
    // Fire two simultaneous requests from two different customer sessions
    const req1 = request(app)
      .post('/api/bookings')
      .set('Cookie', customer1Cookie)
      .send({
        eventId,
        items: [{ ticketTypeId: singleTicketTypeId, quantity: 1 }],
      });

    const req2 = request(app)
      .post('/api/bookings')
      .set('Cookie', customer2Cookie)
      .send({
        eventId,
        items: [{ ticketTypeId: singleTicketTypeId, quantity: 1 }],
      });

    const [response1, response2] = await Promise.all([req1, req2]);

    const statuses = [response1.status, response2.status];
    console.log('Concurrent reservation results:', statuses);

    // Exactly one response must be 201 Created
    const successCount = statuses.filter((s) => s === 201).length;
    // Exactly one response must be 409 Conflict (Insufficient inventory)
    const failureCount = statuses.filter((s) => s === 409).length;

    expect(successCount).toBe(1);
    expect(failureCount).toBe(1);

    // Verify database state: remaining tickets must be exactly 0, never negative
    const updatedTicketType = await prisma.ticketType.findUnique({
      where: { id: singleTicketTypeId },
    });
    expect(updatedTicketType.availableQuantity).toBe(0);

    // Verify bookings in database
    const bookings = await prisma.booking.findMany({
      where: { eventId },
    });
    expect(bookings.length).toBe(1);
    expect(bookings[0].status).toBe('PENDING');
  });

  it('subsequent booking attempt when inventory is 0 must immediately return 409', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Cookie', customer1Cookie)
      .send({
        eventId,
        items: [{ ticketTypeId: singleTicketTypeId, quantity: 1 }],
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Insufficient tickets remaining');
  });
});
