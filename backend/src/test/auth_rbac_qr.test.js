import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/prisma.js';

describe('Auth, RBAC, Payments & QR Verification Suite', () => {
  let customerToken;
  let customerCookie;
  let organizerCookie;
  let adminCookie;
  let customerUser;
  let organizerUser;
  let testEventId;
  let testTicketTypeId;

  beforeAll(async () => {
    // 1. Customer login
    const cRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer1@eventify.com', password: 'Password123!' });
    customerCookie = cRes.headers['set-cookie'];
    customerToken = cRes.body.data.accessToken;
    customerUser = cRes.body.data.user;

    // 2. Organizer login
    const oRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'organizer1@eventify.com', password: 'Password123!' });
    organizerCookie = oRes.headers['set-cookie'];
    organizerUser = oRes.body.data.user;

    // 3. Admin login
    const aRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@eventify.com', password: 'Password123!' });
    adminCookie = aRes.headers['set-cookie'];

    // Create a dedicated test event owned by organizer1
    const now = new Date();
    const event = await prisma.event.create({
      data: {
        title: `Auth Test Summit ${Date.now()}`,
        slug: `auth-test-summit-${Date.now()}`,
        description: 'Dedicated test event for auth, rbac, payments and qr suite.',
        category: 'CONFERENCE',
        organizerId: organizerUser.id,
        startDate: new Date(now.getTime() + 10 * 86400000),
        endDate: new Date(now.getTime() + 11 * 86400000),
        status: 'PUBLISHED',
        ticketTypes: {
          create: [
            {
              name: 'General Admission',
              price: 999,
              totalQuantity: 100,
              availableQuantity: 100,
              salesStart: new Date(now.getTime() - 100000),
              salesEnd: new Date(now.getTime() + 5000000),
              maxPerOrder: 5,
            },
          ],
        },
      },
      include: { ticketTypes: true },
    });

    testEventId = event.id;
    testTicketTypeId = event.ticketTypes[0].id;
  });

  describe('Authentication & Token Rotation', () => {
    it('should register a new customer with hashed password', async () => {
      const email = `newuser_${Date.now()}@eventify.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Pooja Verma',
          email,
          password: 'Password123!',
          phone: '+91 99999 11111',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(email);
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'customer1@eventify.com', password: 'WrongPassword!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should rotate refresh token successfully', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', customerCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should get current authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', customerCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('customer1@eventify.com');
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('customer should be forbidden from accessing admin dashboard', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', customerCookie);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });

    it('customer should be forbidden from creating an event', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Cookie', customerCookie)
        .send({
          title: 'Unauthorized Event',
          description: 'This event should fail creation by customer',
          category: 'CONFERENCE',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          ticketTypes: [{ name: 'Pass', price: 100, totalQuantity: 10, salesStart: new Date(), salesEnd: new Date() }],
        });

      expect(res.status).toBe(403);
    });

    it('admin should access admin dashboard', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.metrics.totalUsers).toBeGreaterThan(0);
    });
  });

  describe('Payment & QR Check-in Workflow', () => {
    let bookingId;
    let orderId;
    let generatedTicket;

    it('should create reservation and Razorpay payment order', async () => {
      // 1. Create booking
      const bRes = await request(app)
        .post('/api/bookings')
        .set('Cookie', customerCookie)
        .send({
          eventId: testEventId,
          items: [{ ticketTypeId: testTicketTypeId, quantity: 1 }],
        });

      expect(bRes.status).toBe(201);
      bookingId = bRes.body.data.booking.id;

      // 2. Create Razorpay order
      const pRes = await request(app)
        .post('/api/payments/create-order')
        .set('Cookie', customerCookie)
        .send({ bookingId });

      expect(pRes.status).toBe(200);
      expect(pRes.body.data.orderId).toBeDefined();
      orderId = pRes.body.data.orderId;
    });

    it('should reject payment verification with invalid signature', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Cookie', customerCookie)
        .send({
          bookingId,
          razorpayOrderId: orderId,
          razorpayPaymentId: 'pay_mock_fake_123',
          razorpaySignature: 'invalid_fraudulent_signature',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid payment signature');
    });

    it('should verify payment and generate digital QR tickets in test mode', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Cookie', customerCookie)
        .send({
          bookingId,
          razorpayOrderId: orderId,
          razorpayPaymentId: `pay_test_${Date.now()}`,
          razorpaySignature: `test_sig_${orderId}`,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe('CONFIRMED');
      expect(res.body.data.tickets.length).toBe(1);

      generatedTicket = res.body.data.tickets[0];
      expect(generatedTicket.ticketCode).toMatch(/^EVT-/);
      expect(generatedTicket.qrCode).toContain('data:image/png;base64');
    });

    it('organizer should verify and check in valid ticket', async () => {
      const res = await request(app)
        .post('/api/tickets/check-in')
        .set('Cookie', organizerCookie)
        .send({
          ticketCode: generatedTicket.ticketCode,
          eventId: testEventId,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.status).toBe('CHECKED_IN');
      expect(res.body.data.attendee.name).toBe(customerUser.name);
    });

    it('second scan of the same ticket must be rejected as ALREADY_USED', async () => {
      const res = await request(app)
        .post('/api/tickets/check-in')
        .set('Cookie', organizerCookie)
        .send({
          ticketCode: generatedTicket.ticketCode,
          eventId: testEventId,
        });

      expect(res.status).toBe(400);
      expect(res.body.data.valid).toBe(false);
      expect(res.body.data.status).toBe('ALREADY_USED');
      expect(res.body.message).toContain('already used');
    });

    it('scanning for a different event must be rejected as WRONG_EVENT', async () => {
      // Create a second event
      const otherEvent = await prisma.event.create({
        data: {
          title: `Different Event ${Date.now()}`,
          slug: `other-event-${Date.now()}`,
          description: 'A different event for wrong-event verification',
          category: 'WORKSHOP',
          organizerId: organizerUser.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
          status: 'PUBLISHED',
        },
      });

      const res = await request(app)
        .post('/api/tickets/check-in')
        .set('Cookie', organizerCookie)
        .send({
          ticketCode: generatedTicket.ticketCode,
          eventId: otherEvent.id, // WRONG EVENT ID
        });

      expect(res.status).toBe(400);
      expect(res.body.data.status).toBe('WRONG_EVENT');
    });
  });
});
