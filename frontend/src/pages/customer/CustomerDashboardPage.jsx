import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Ticket, ArrowRight, ShieldCheck, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { ticketService } from '../../services/ticketService';
import { eventService } from '../../services/eventService';
import { EventCard } from '../../components/events/EventCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/SkeletonCard';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const CustomerDashboardPage = () => {
  const { data: bookingsData, isLoading: isBookingsLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingService.getMyBookings(),
  });

  const { data: ticketsData, isLoading: isTicketsLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => ticketService.getMyTickets(),
  });

  const { data: recEventsData } = useQuery({
    queryKey: ['rec-events'],
    queryFn: () => eventService.getEvents({ limit: 3, sort: 'upcoming' }),
  });

  const bookings = bookingsData?.data?.bookings || [];
  const tickets = ticketsData?.data?.tickets || [];
  const recommendedEvents = recEventsData?.data || [];

  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED');
  const pendingBookings = bookings.filter((b) => b.status === 'PENDING');

  return (
    <div className="space-y-10">
      {/* 1. Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Total Passes
            </span>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{tickets.length}</h3>
            <span className="text-xs text-slate-500 mt-1 block">Active digital QR passes</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Confirmed Bookings
            </span>
            <h3 className="text-3xl font-black text-slate-900 mt-1">
              {confirmedBookings.length}
            </h3>
            <span className="text-xs text-slate-500 mt-1 block">Orders fulfilled</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Pending Reservations
            </span>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{pendingBookings.length}</h3>
            <span className="text-xs text-slate-500 mt-1 block">Awaiting checkout</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Recent Bookings List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Bookings</h3>
            <p className="text-xs text-slate-500 mt-0.5">Your most recent ticket purchases</p>
          </div>
          <Link
            to="/dashboard/bookings"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isBookingsLoading ? (
          <LoadingSpinner />
        ) : bookings.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            You haven't made any bookings yet.{' '}
            <Link to="/events" className="text-brand-600 font-bold hover:underline">
              Explore events
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bookings.slice(0, 4).map((b) => (
              <div
                key={b.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 px-3 rounded-xl transition-colors"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{b.event?.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>{formatDate(b.event?.startDate)}</span>
                    <span>•</span>
                    <span>{b.event?.venue?.city}</span>
                    <span>•</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(b.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      b.status === 'CONFIRMED'
                        ? 'success'
                        : b.status === 'PENDING'
                        ? 'warning'
                        : 'danger'
                    }
                    size="xs"
                  >
                    {b.status}
                  </Badge>

                  {b.status === 'CONFIRMED' && (
                    <Link to="/dashboard/tickets">
                      <Button variant="outline" size="sm">
                        View Passes
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Recommended Events */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recommended for You</h3>
            <p className="text-xs text-slate-500 mt-0.5">Top upcoming events you might enjoy</p>
          </div>
          <Link
            to="/events"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
};
