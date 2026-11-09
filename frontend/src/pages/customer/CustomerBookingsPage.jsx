import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Ticket, ExternalLink, XCircle } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner, EmptyState } from '../../components/common/SkeletonCard';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { toast } from '../../store/toastStore';

export const CustomerBookingsPage = () => {
  const queryClient = useQueryClient();

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['my-bookings-all'],
    queryFn: () => bookingService.getMyBookings(),
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId) => bookingService.cancelBooking(bookingId),
    onSuccess: () => {
      toast.success('Reservation Cancelled', 'Your reserved tickets have been released.');
      queryClient.invalidateQueries(['my-bookings-all']);
      queryClient.invalidateQueries(['my-bookings']);
    },
    onError: (err) => {
      toast.error('Cancel Error', err.message || 'Could not cancel booking');
    },
  });

  const bookings = bookingsData?.data?.bookings || [];

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">My Bookings History</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Track all your ticket reservations, confirmations and receipts
        </p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No bookings found"
          description="You have not booked any event tickets yet."
          action={
            <Link to="/events">
              <Button variant="primary" size="sm">
                Explore Events
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="divide-y divide-slate-100 overflow-x-auto">
          {bookings.map((b) => {
            const ticketCount = b.bookingItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            const isPending = b.status === 'PENDING';
            const isConfirmed = b.status === 'CONFIRMED';

            return (
              <div
                key={b.id}
                className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      #{b.id.slice(0, 8)}
                    </span>
                    <Badge
                      variant={
                        isConfirmed
                          ? 'success'
                          : isPending
                          ? 'warning'
                          : 'danger'
                      }
                      size="xs"
                    >
                      {b.status}
                    </Badge>
                  </div>

                  <Link to={`/events/${b.event?.slug || b.event?.id}`}>
                    <h3 className="font-bold text-base text-slate-900 hover:text-brand-600 transition-colors">
                      {b.event?.title}
                    </h3>
                  </Link>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{formatDate(b.event?.startDate)}</span>
                    <span>•</span>
                    <span>{b.event?.venue?.name}, {b.event?.venue?.city}</span>
                    <span>•</span>
                    <span>{ticketCount} Pass(es)</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total Paid
                    </span>
                    <span className="text-base font-extrabold text-slate-900">
                      {formatCurrency(b.totalAmount)}
                    </span>
                  </div>

                  {isConfirmed && (
                    <Link to="/dashboard/tickets">
                      <Button variant="outline" size="sm" icon={Ticket}>
                        View Passes
                      </Button>
                    </Link>
                  )}

                  {isPending && (
                    <Button
                      variant="danger"
                      size="sm"
                      isLoading={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(b.id)}
                    >
                      Cancel Reservation
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
