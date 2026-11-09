import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  bookingId: z.string().uuid('Valid booking ID is required'),
});

export const verifyPaymentSchema = z.object({
  bookingId: z.string().uuid('Valid booking ID is required'),
  razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
});

export const refundPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().optional(),
});
