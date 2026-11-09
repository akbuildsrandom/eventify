import React, { useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  MapPin,
  Printer,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Shield,
  Download,
} from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { LoadingSpinner, EmptyState } from '../../components/common/SkeletonCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatDate, formatTime, formatCurrency } from '../../utils/formatters';
import { toast } from '../../store/toastStore';

export const TicketViewPage = () => {
  const { ticketId } = useParams();
  const ticketRef = useRef(null);

  const { data: ticketData, isLoading, error } = useQuery({
    queryKey: ['ticket-view', ticketId],
    queryFn: () => ticketService.getTicketById(ticketId),
  });

  const ticket = ticketData?.data?.ticket;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    if (ticket?.ticketCode) {
      navigator.clipboard.writeText(ticket.ticketCode);
      toast.success('Copied!', 'Ticket code copied to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <EmptyState
          icon={AlertCircle}
          title="Ticket Not Found"
          description="Could not locate this digital pass."
          action={
            <Link to="/dashboard/tickets">
              <Button variant="primary">My Tickets</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const event = ticket.booking?.event;
  const isValid = ticket.status === 'VALID';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Top Bar Navigation (Hidden in print) */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link
          to="/dashboard/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Passes</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>
            Print Ticket
          </Button>
        </div>
      </div>

      {/* The Printable Boarding Pass Card */}
      <div
        ref={ticketRef}
        className="bg-white rounded-3xl border border-slate-200 shadow-premium overflow-hidden print:shadow-none print:border-slate-300"
      >
        {/* Event Header Banner */}
        <div className="relative aspect-[21/9] max-h-56 w-full bg-slate-900 overflow-hidden">
          <img
            src={
              event?.imageUrl ||
              'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
            }
            alt={event?.title}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />

          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <Badge variant={isValid ? 'success' : 'danger'} size="sm" className="shadow-md">
              {ticket.status}
            </Badge>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-300 block">
              Official Admission Pass
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight line-clamp-1">
              {event?.title}
            </h1>
          </div>
        </div>

        {/* Pass Details & QR Body */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Details (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Date
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {formatDate(event?.startDate, 'EEEE, dd MMM yyyy')}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Time
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {formatTime(event?.startDate)} IST
                </span>
              </div>
            </div>

            <div className="pb-4 border-b border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Venue & Address
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                {event?.venue?.name}
              </span>
              <span className="text-xs text-slate-500">
                {event?.venue?.address}, {event?.venue?.city} - {event?.venue?.pincode}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Pass Tier
                </span>
                <span className="text-xs sm:text-sm font-bold text-brand-700">
                  {ticket.ticketType?.name}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Ticket Holder
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {ticket.booking?.user?.name}
                </span>
              </div>
            </div>
          </div>

          {/* QR Barcode Section (1 col) */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
            <img
              src={ticket.qrCode}
              alt={ticket.ticketCode}
              className="w-40 h-40 object-contain rounded-lg bg-white p-2 border border-slate-200"
            />
            <div className="flex items-center gap-1.5 mt-3">
              <code className="text-xs font-mono font-bold text-slate-800">
                {ticket.ticketCode}
              </code>
              <button
                onClick={handleCopyCode}
                className="text-slate-400 hover:text-slate-700 p-0.5 print:hidden"
                title="Copy code"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">Single admission barcode</span>
          </div>
        </div>

        {/* Ticket Footer Guidelines */}
        <div className="p-4 sm:p-5 bg-slate-100/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Valid government or college photo ID required upon entry.</span>
          </div>
          <span className="font-mono text-slate-400 text-[10px]">
            Order Ref: #{ticket.bookingId?.slice(0, 12)}
          </span>
        </div>
      </div>
    </div>
  );
};
