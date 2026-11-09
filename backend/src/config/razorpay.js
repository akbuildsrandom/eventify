import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from './env.js';

let razorpayInstance = null;
const isConfigured = Boolean(
  env.RAZORPAY_KEY_ID &&
  env.RAZORPAY_KEY_SECRET &&
  !env.RAZORPAY_KEY_ID.includes('your_key') &&
  !env.RAZORPAY_KEY_ID.includes('demo_key')
);

if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  try {
    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  } catch (err) {
    console.warn('⚠️ Razorpay initialization warning:', err.message);
  }
}

export const razorpay = {
  instance: razorpayInstance,
  isConfigured,
  keyId: env.RAZORPAY_KEY_ID,

  /**
   * Create an order on Razorpay
   * @param {number} amountInINR
   * @param {string} receipt
   * @param {object} notes
   */
  async createOrder(amountInINR, receipt, notes = {}) {
    const amountInPaise = Math.round(Number(amountInINR) * 100);

    // If configured with real or test credentials
    if (razorpayInstance && isConfigured) {
      return await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receipt.slice(0, 40),
        notes,
      });
    }

    // Explicit test/demo order generator for local testing when test keys are placeholders
    const mockOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      id: mockOrderId,
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      status: 'created',
      notes,
      isMock: !isConfigured,
    };
  },

  /**
   * Verify Razorpay Payment Signature
   * @param {string} orderId
   * @param {string} paymentId
   * @param {string} signature
   */
  verifyPaymentSignature(orderId, paymentId, signature) {
    if (!orderId || !paymentId || !signature) {
      return false;
    }

    const secret = env.RAZORPAY_KEY_SECRET;
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    // Also support test mode simulated signature if mock keys
    if (!isConfigured && signature === `test_sig_${orderId}`) {
      return true;
    }

    try {
      const expectedBuf = Buffer.from(expectedSignature, 'utf8');
      const sigBuf = Buffer.from(signature, 'utf8');
      if (expectedBuf.length !== sigBuf.length) {
        return false;
      }
      return crypto.timingSafeEqual(expectedBuf, sigBuf);
    } catch {
      return false;
    }
  },

  /**
   * Verify Razorpay Webhook Signature
   * @param {string} rawBody
   * @param {string} signature
   */
  verifyWebhookSignature(rawBody, signature) {
    if (!signature || !env.RAZORPAY_WEBHOOK_SECRET) {
      return false;
    }
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch {
      return false;
    }
  },
};

export default razorpay;
