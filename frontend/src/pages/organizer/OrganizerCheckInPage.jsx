import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QrCode, CheckCircle2, Users, AlertCircle, ArrowRight, ScanLine } from 'lucide-react';
import { organizerService } from '../../services/organizerService';
import { ticketService } from '../../services/ticketService';
import { QRScannerModal } from '../../components/qr/QRScannerModal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/SkeletonCard';
import { formatDate } from '../../utils/formatters';

export const OrganizerCheckInPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [selectedEventId, setSelectedEventId] = useState(searchParams.get('eventId') || '');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Load organizer events
  const { data: eventsData, isLoading: isEventsLoading } = useQuery({
    queryKey: ['organizer-events-dropdown'],
    queryFn: () => organizerService.getMyEvents(),
  });
  const events = eventsData?.data?.events || [];

  // Default to first event if none selected
  const activeEvent =
    events.find((e) => e.id === selectedEventId) || events[0] || null;
  const currentEventId = activeEvent?.id;

  // Check-in stats query
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['check-in-stats', currentEventId],
    queryFn: () => ticketService.getEventCheckInStats(currentEventId),
    enabled: Boolean(currentEventId),
  });

  // Recent attendees query
  const { data: attendeesData, refetch: refetchAttendees } = useQuery({
    queryKey: ['check-in-attendees', currentEventId],
    queryFn: () => organizerService.getAttendees({ eventId: currentEventId }),
    enabled: Boolean(currentEventId),
  });

  const stats = statsData?.data?.stats || {
    totalTickets: 0,
    checkedInTickets: 0,
    remainingTickets: 0,
    checkInRate: 0,
  };
  const attendees = attendeesData?.data?.attendees || [];

  const handleEventChange = (id) => {
    setSelectedEventId(id);
    setSearchParams({ eventId: id });
  };

  const handleScanSuccess = () => {
    refetchStats();
    refetchAttendees();
    queryClient.invalidateQueries(['organizer-dashboard']);
  };

  if (isEventsLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-8">
      {/* 1. Header with Event Selector & Scanner Launch */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block mb-1">
            Access Control Terminal
          </span>
          <h1 className="text-2xl font-black text-slate-900">Live Ticket Verification</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Scan attendee QR barcodes or enter ticket reference codes manually
          </p>
        </div>

        {/* Event Select Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={currentEventId || ''}
            onChange={(e) => handleEventChange(e.target.value)}
            className="px-4 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-900 cursor-pointer"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>

          <Button
            variant="gradient"
            size="md"
            icon={ScanLine}
            disabled={!currentEventId}
            onClick={() => setIsScannerOpen(true)}
          >
            Launch Camera Scanner
          </Button>
        </div>
      </div>

      {/* 2. Check-in KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-bold uppercase text-slate-400">Total Confirmed Passes</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.totalTickets}</h3>
          <span className="text-[11px] text-slate-500 mt-1 block">Issued for this event</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-bold uppercase text-slate-400">Checked In</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">
            {stats.checkedInTickets}
          </h3>
          <span className="text-[11px] text-slate-500 mt-1 block">Admitted at entrance</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-bold uppercase text-slate-400">Awaiting Arrival</span>
          <h3 className="text-2xl font-black text-slate-700 mt-1">
            {stats.remainingTickets}
          </h3>
          <span className="text-[11px] text-slate-500 mt-1 block">Passes yet to scan</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-bold uppercase text-slate-400">Check-In Rate</span>
          <h3 className="text-2xl font-black text-brand-600 mt-1">{stats.checkInRate}%</h3>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-brand-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(stats.checkInRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Real-time Check-in Log Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Live Admission Log</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time attendee check-in records</p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
            Authoritative Server State
          </span>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {attendees.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              No ticket holders found for this event yet.
            </p>
          ) : (
            attendees.slice(0, 15).map((a) => {
              const isUsed = a.ticketStatus === 'USED';

              return (
                <div
                  key={a.ticketId}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isUsed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isUsed ? '✓' : '•'}
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900">{a.attendeeName}</h4>
                      <p className="text-[11px] text-slate-400">{a.attendeeEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {a.ticketType}
                    </span>
                    <code className="font-mono text-slate-500 text-[11px]">{a.ticketCode}</code>
                    <Badge variant={isUsed ? 'success' : 'default'} size="xs">
                      {isUsed ? 'CHECKED IN' : 'VALID'}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {isScannerOpen && activeEvent && (
        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          eventId={activeEvent.id}
          eventTitle={activeEvent.title}
          onSuccessfulScan={handleScanSuccess}
        />
      )}
    </div>
  );
};
