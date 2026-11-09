import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Ticket, Calendar, MapPin, QrCode, ArrowRight, Printer } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner, EmptyState } from '../../components/common/SkeletonCard';
import { formatDate } from '../../utils/formatters';

export const CustomerTicketsPage = () => {
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['my-tickets-full'],
    queryFn: () => ticketService.getMyTickets(),
  });

  const tickets = ticketsData?.data?.tickets || [];

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Digital Passes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your verified tickets with unique QR entry barcodes
          </p>
        </div>
        <Badge variant="primary" size="md">
          {tickets.length} Available Passes
        </Badge>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No tickets found"
          description="You do not have any confirmed tickets yet."
          action={
            <Link to="/events">
              <Button variant="primary">Explore Events</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((t) => {
            const event = t.booking?.event;
            const isValid = t.status === 'VALID';

            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle hover:shadow-premium transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Event mini header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={isValid ? 'success' : 'default'} size="xs">
                      {t.status}
                    </Badge>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {t.ticketCode}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{event?.title}</h3>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" />
                    <span>{formatDate(event?.startDate)}</span>
                  </div>
                </div>

                {/* QR Code Centerpiece */}
                <div className="p-6 flex flex-col items-center justify-center bg-white">
                  <div className="p-2.5 rounded-xl border-2 border-slate-100 bg-white shadow-xs">
                    <img
                      src={t.qrCode}
                      alt={t.ticketCode}
                      className="w-36 h-36 object-contain"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-800 mt-3">
                    {t.ticketType?.name}
                  </span>
                  <span className="text-[11px] text-slate-400">Pass #{t.ticketCode}</span>
                </div>

                {/* Ticket Footer Action */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {event?.venue?.city || 'India'}
                  </span>

                  <Link to={`/my-tickets/${t.id}`}>
                    <Button variant="outline" size="sm" icon={ExternalLinkIcon}>
                      Pass View & Print
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ExternalLinkIcon = (props) => (
  <QrCode className="w-3.5 h-3.5" {...props} />
);
