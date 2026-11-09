import { paymentService } from '../services/paymentService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const paymentController = {
  async createPaymentOrder(req, res, next) {
    try {
      const data = await paymentService.createPaymentOrder(req.user.id, req.body.bookingId);
      return sendSuccess(res, 'Payment order created successfully', data);
    } catch (err) {
      next(err);
    }
  },

  async verifyPayment(req, res, next) {
    try {
      const result = await paymentService.verifyPayment(req.user.id, req.body);
      return sendSuccess(res, 'Payment verified and booking confirmed successfully', result);
    } catch (err) {
      next(err);
    }
  },

  async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      if (!signature) {
        return sendError(res, 'Missing webhook signature', [], 400);
      }

      // rawBody is attached by our express raw parser middleware
      const rawBody = req.rawBody || JSON.stringify(req.body);
      const result = await paymentService.processWebhook(rawBody, signature, req.body);

      return res.status(200).json({ status: 'ok', result });
    } catch (err) {
      console.error('[Webhook Error]:', err.message);
      return sendError(res, 'Webhook processing failure', [err.message], 400);
    }
  },
};
