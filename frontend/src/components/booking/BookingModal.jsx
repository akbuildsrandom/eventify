import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { ShieldCheck, Clock, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { bookingService } from '../../services/bookingService';
import { paymentService } from '../../services/paymentService';
import { toast } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

export const BookingModal = ({ isOpen, onClose, event, selectedQuantities = {} }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [step, setStep] = useState('review'); // 'review', 'reserving', 'paying', 'confirmed'
  const [createdBooking, setCreatedBooking] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate order items
  const selectedItems = [];
  let totalAmount = 0;
  let totalTickets = 0;

  for (const tt of event?.ticketTypes || []) {
    const qty = selectedQuantities[tt.id] || 0;
    if (qty > 0) {
      const subtotal = Number(tt.price) * qty;
      totalAmount += subtotal;
      totalTickets += qty;
      selectedItems.push({
        ticketTypeId: tt.id,
        name: tt.name,
        quantity: qty,
        unitPrice: Number(tt.price),
        subtotal,
      });
    }
  }

  const handleStartBooking = async () => {
    if (!user) {
      toast.error('Authentication Required', 'Please log in or create an account to book tickets.');
      navigate(`/login?redirect=/events/${event.slug || event.id}`);
      return;
    }

    try {
      setIsProcessing(true);
      setStep('reserving');

      // 1. Send atomic reservation request with idempotency key
      const idempotencyKey = `evt_booking_${user.id}_${event.id}_${Date.now()}`;
      const payload = {
        eventId: event.id,
        items: selectedItems.map((i) => ({
          ticketTypeId: i.ticketTypeId,
          quantity: i.quantity,
        })),
        idempotencyKey,
      };

      const bookingRes = await bookingService.createBooking(payload, idempotencyKey);
      const booking = bookingRes.data.booking;
      setCreatedBooking(booking);

      // 2. Initialize Razorpay payment order
      setStep('paying');
      const orderRes = await paymentService.createPaymentOrder(booking.id);
      setOrderData(orderRes.data);

      // 3. Trigger Razorpay Checkout
      openRazorpayCheckout(booking, orderRes.data);
    } catch (err) {
      toast.error('Reservation Failed', err.message || 'Could not complete reservation');
      setStep('review');
    } finally {
      setIsProcessing(false);
    }
  };

  const openRazorpayCheckout = (booking, order) => {
    // Check if real Razorpay checkout script is available on window
    if (window.Razorpay && order.keyId && !order.keyId.includes('demo_key')) {
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Eventify India',
        description: `Tickets for ${event.title.slice(0, 40)}`,
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=150&q=80',
        order_id: order.orderId,
        handler: async function (response) {
          await verifyPaymentSuccess({
            bookingId: booking.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || '9999999999',
        },
        theme: {
          color: '#7c3aed',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        toast.error('Payment Failed', resp.error.description || 'Payment was declined');
      });
      rzp.open();
    } else {
      // In local dev test mode without live Razorpay credentials, show test mode simulator
      // so user can test the exact end-to-end payment confirmation & ticket generation workflow!
      console.log('⚡ Running simulated Razorpay Test Mode checkout');
    }
  };

  const verifyPaymentSuccess = async (verificationPayload) => {
    try {
      setIsProcessing(true);
      const verifyRes = await paymentService.verifyPayment(verificationPayload);

      setStep('confirmed');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      toast.success('Payment Confirmed!', 'Your tickets have been generated.');
    } catch (err) {
      toast.error('Verification Error', err.message || 'Failed to verify payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateTestPayment = async () => {
    if (!createdBooking || !orderData) return;
    await verifyPaymentSuccess({
      bookingId: createdBooking.id,
      razorpayOrderId: orderData.orderId,
      razorpayPaymentId: `pay_test_${Date.now()}`,
      razorpaySignature: `test_sig_${orderData.orderId}`,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'confirmed' ? 'Tickets Confirmed!' : 'Review Booking & Checkout'}
      maxWidth="max-w-xl"
    >
      {step === 'confirmed' ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900">You're Going! 🎉</h3>
          <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto">
            Your booking for <strong>{event?.title}</strong> is confirmed. Individual digital passes with QR codes are ready.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                navigate('/dashboard/tickets');
              }}
            >
              View My Tickets & QR Passes
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                navigate('/events');
              }}
            >
              Browse More Events
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Reservation Timer Notice */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Tickets will be held for 10 minutes upon confirming reservation.</span>
          </div>

          {/* Event Summary */}
          <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <img
              src={event?.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=150&q=80'}
              alt={event?.title}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                {event?.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {event?.venue?.name}, {event?.venue?.city}
              </p>
            </div>
          </div>

          {/* Selected Tiers Breakdown */}
          <div className="space-y-2 border-t border-b border-slate-100 py-3">
            <h5 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Selected Passes
            </h5>
            {selectedItems.map((item) => (
              <div key={item.ticketTypeId} className="flex justify-between text-xs py-1">
                <span className="text-slate-700">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-bold text-slate-900">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}

            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-3 border-t border-slate-200">
              <span>Total Payable ({totalTickets} passes)</span>
              <span className="text-brand-600 text-base">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Test Mode Simulation Bar (when test keys configured) */}
          {orderData && (
            <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 text-xs">
              <div className="flex items-center gap-2 font-bold text-brand-700 mb-1">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Razorpay Test Mode Active</span>
              </div>
              <p className="text-slate-600 mb-3">
                Order Reference: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">{orderData.orderId}</code>
              </p>
              <Button
                variant="gradient"
                size="sm"
                className="w-full"
                isLoading={isProcessing}
                onClick={handleSimulateTestPayment}
              >
                Complete Payment & Issue QR Tickets
              </Button>
            </div>
          )}

          {/* Action Button */}
          {!orderData && (
            <div className="pt-2">
              <Button
                variant="gradient"
                size="lg"
                className="w-full"
                isLoading={isProcessing}
                onClick={handleStartBooking}
              >
                <span>Proceed to Pay {formatCurrency(totalAmount)}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
