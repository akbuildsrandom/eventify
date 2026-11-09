import { z } from 'zod';

export const bookingItemSchema = z.object({
  ticketTypeId: z.string().uuid('Valid ticket type ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 tickets per order'),
});

export const createBookingSchema = z.object({
  eventId: z.string().uuid('Valid event ID is required'),
  items: z.array(bookingItemSchema).min(1, 'At least one ticket selection is required'),
  idempotencyKey: z.string().optional(),
});
