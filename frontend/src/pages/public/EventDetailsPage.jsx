import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  MapPin,
  Shield,
  Star,
  Users,
  Share2,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Building,
} from 'lucide-react';
import { eventService } from '../../services/eventService';
import { reviewService } from '../../services/reviewService';
import { TicketSelector } from '../../components/booking/TicketSelector';
import { BookingModal } from '../../components/booking/BookingModal';
import { LoadingSpinner, EmptyState } from '../../components/common/SkeletonCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatDate, formatTime, formatCurrency } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';

export const EventDetailsPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Fetch Event details
  const { data: eventData, isLoading, error } = useQuery({
    queryKey: ['event-details', id],
    queryFn: () => eventService.getEventById(id),
  });

  const event = eventData?.data?.event;

  // Review submission mutation
  const reviewMutation = useMutation({
    mutationFn: (data) => reviewService.createReview(event.id, data),
    onSuccess: () => {
      toast.success('Review Posted!', 'Thank you for your feedback.');
      setReviewComment('');
      queryClient.invalidateQueries(['event-details', id]);
    },
    onError: (err) => {
      toast.error('Review Error', err.message || 'Could not post review');
    },
  });

  const handleQuantityChange = (tierId, qty) => {
    setSelectedQuantities((prev) => ({
      ...prev,
      [tierId]: qty,
    }));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: `Check out ${event?.title} on Eventify!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link Copied', 'Event URL copied to clipboard');
    }
  };

  // Calculate order total
  let totalSelectedAmount = 0;
  let totalSelectedTickets = 0;
  for (const tt of event?.ticketTypes || []) {
    const qty = selectedQuantities[tt.id] || 0;
    totalSelectedTickets += qty;
    totalSelectedAmount += Number(tt.price) * qty;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <EmptyState
          icon={AlertCircle}
          title="Event Not Found"
          description="The event you are looking for may have been removed or does not exist."
          action={
            <Link to="/events">
              <Button variant="primary">Browse Events</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isSoldOut = event.isSoldOut || event.totalAvailableTickets <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. Header Banner & Info */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-[21/9] max-h-[460px] w-full mb-8 shadow-2xl">
        <img
          src={
            event.imageUrl ||
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80'
          }
          alt={event.title}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />

        {/* Floating Badges */}
        <div className="absolute top-6 left-6 flex gap-2.5">
          <Badge variant="primary" size="md" className="backdrop-blur-md bg-white/95">
            {event.category?.replace(/_/g, ' ')}
          </Badge>
          {isSoldOut ? (
            <Badge variant="danger" size="md" className="font-extrabold shadow-sm">
              SOLD OUT
            </Badge>
          ) : (
            <Badge variant="success" size="md">
              Selling Fast ({event.totalAvailableTickets} Left)
            </Badge>
          )}
        </div>

        {/* Share Button */}
        <div className="absolute top-6 right-6">
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg transition-transform active:scale-95"
            title="Share Event"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Banner Title Overlay */}
        <div className="absolute bottom-6 left-6 right-6 text-white max-w-4xl">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-3 text-xs sm:text-sm text-slate-200">
            <span className="flex items-center gap-1.5 font-semibold">
              <Calendar className="w-4 h-4 text-brand-400" />
              {formatDate(event.startDate, 'EEEE, dd MMMM yyyy')}
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Clock className="w-4 h-4 text-brand-400" />
              {formatTime(event.startDate)} - {formatTime(event.endDate)}
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <MapPin className="w-4 h-4 text-brand-400" />
              {event.venue?.city || 'India'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Description, Venue, Reviews */}
        <div className="lg:col-span-2 space-y-10">
          {/* About Event */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle">
            <h2 className="text-xl font-bold text-slate-900 mb-4">About This Experience</h2>
            <div className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line space-y-4">
              {event.description}
            </div>

            {/* Organizer Card */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={
                    event.organizer?.avatar ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
                  }
                  alt={event.organizer?.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                    Organized By
                  </span>
                  <span className="text-sm font-bold text-slate-900">{event.organizer?.name}</span>
                </div>
              </div>
              <Badge variant="primary" size="xs">
                VERIFIED ORGANIZER
              </Badge>
            </div>
          </section>

          {/* Venue & Location Details */}
          {event.venue && (
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-brand-600" />
                <span>Venue & Location</span>
              </h2>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-base text-slate-900">{event.venue.name}</h4>
                  <p className="text-xs text-slate-600 mt-1">{event.venue.address}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {event.venue.city}, {event.venue.state} - {event.venue.pincode}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-slate-400 block">Capacity</span>
                  <span className="text-sm font-bold text-slate-800">
                    {event.venue.capacity.toLocaleString('en-IN')} Attendees
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Reviews & Ratings */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-600" />
                  <span>Verified Attendee Reviews</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real feedback from customers who booked and attended this event
                </p>
              </div>

              {event.averageRating > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-200">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span className="font-extrabold text-sm">{event.averageRating}</span>
                  <span className="text-xs text-slate-500">({event._count?.reviews || 0})</span>
                </div>
              )}
            </div>

            {/* Submit Review Box (If logged in) */}
            {isAuthenticated ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!reviewComment.trim()) return;
                  reviewMutation.mutate({ rating: reviewRating, comment: reviewComment });
                }}
                className="mb-8 p-4 rounded-2xl bg-slate-50 border border-slate-200"
              >
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Leave a Review (Ticket Holders Only)
                </h4>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-slate-500">Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="text-amber-400 hover:scale-110 transition-transform p-0.5"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  placeholder="Share your experience at this event..."
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-800"
                />

                <div className="flex justify-end mt-2">
                  <Button
                    type="submit"
                    size="sm"
                    variant="primary"
                    isLoading={reviewMutation.isPending}
                    disabled={!reviewComment.trim()}
                  >
                    Post Review
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl mb-6">
                <Link to="/login" className="text-brand-600 font-bold hover:underline">
                  Sign in
                </Link>{' '}
                with your ticket-purchased account to submit a review.
              </p>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {event.reviews?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No reviews submitted yet. Be the first to leave one after attending!
                </p>
              ) : (
                event.reviews?.map((r) => (
                  <div key={r.id} className="p-4 rounded-xl bg-slate-50/60 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={r.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}
                          alt={r.user?.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-slate-900">{r.user?.name}</span>
                        <Badge variant="success" size="xs">
                          Verified Attendee
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold">{r.rating}/5</span>
                      </div>
                    </div>
                    {r.comment && <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Ticket Category Selection & Sticky Checkout Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-premium space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900">Select Tickets</h3>
              <p className="text-xs text-slate-500 mt-1">
                Prices in INR (₹). Guaranteed real-time seat availability.
              </p>
            </div>

            {/* Ticket Selector Component */}
            <TicketSelector
              ticketTypes={event.ticketTypes || []}
              selectedQuantities={selectedQuantities}
              onQuantityChange={handleQuantityChange}
              disabled={isSoldOut}
            />

            {/* Order Total & CTA */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase text-slate-500">
                  Total ({totalSelectedTickets} passes)
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {formatCurrency(totalSelectedAmount)}
                </span>
              </div>

              <Button
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={totalSelectedTickets === 0 || isSoldOut}
                onClick={() => setIsBookingModalOpen(true)}
              >
                {isSoldOut ? 'Sold Out' : totalSelectedTickets === 0 ? 'Select Tickets' : 'Book Tickets Now'}
              </Button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-500 space-y-1">
              <p className="flex items-center gap-1.5 font-medium">
                <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Atomic PostgreSQL reservation locking
              </p>
              <p className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                Instant unique QR pass delivery
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Checkout Modal */}
      {isBookingModalOpen && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          event={event}
          selectedQuantities={selectedQuantities}
        />
      )}
    </div>
  );
};
