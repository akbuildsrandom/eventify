import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Tag, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';

export const EventCard = ({ event }) => {
  const isSoldOut = event.isSoldOut || event.totalAvailableTickets <= 0;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-subtle hover:shadow-premium transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
      {/* Banner Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
        <img
          src={
            event.imageUrl ||
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'
          }
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Category Badge overlay */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="primary" size="xs" className="shadow-sm backdrop-blur-md bg-white/95">
            {event.category?.replace(/_/g, ' ')}
          </Badge>
          {isSoldOut && (
            <Badge variant="danger" size="xs" className="shadow-sm font-bold">
              SOLD OUT
            </Badge>
          )}
        </div>

        {/* Availability Count */}
        {!isSoldOut && event.totalAvailableTickets !== undefined && (
          <div className="absolute bottom-3 right-3 bg-navy-900/85 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg">
            {event.totalAvailableTickets} left
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Date & Time */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(event.startDate, 'EEE, dd MMM yyyy')}</span>
          </div>

          {/* Title */}
          <Link to={`/events/${event.slug || event.id}`}>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug">
              {event.title}
            </h3>
          </Link>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2.5 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>
              {event.venue?.name ? `${event.venue.name}, ` : ''}
              {event.venue?.city || 'India'}
            </span>
          </div>
        </div>

        {/* Card Footer: Price & CTA */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block -mb-0.5">
              Starts From
            </span>
            <span className="text-base font-extrabold text-slate-900">
              {event.startingPrice !== undefined ? formatCurrency(event.startingPrice) : 'Free'}
            </span>
          </div>

          <Link
            to={`/events/${event.slug || event.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100/80 px-3 py-1.5 rounded-xl transition-colors"
          >
            <span>{isSoldOut ? 'View' : 'Book'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
