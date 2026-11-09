import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Filter, Download } from 'lucide-react';
import { organizerService } from '../../services/organizerService';
import { LoadingSpinner, EmptyState } from '../../components/common/SkeletonCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../utils/formatters';

export const OrganizerAttendeesPage = () => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const { data: attendeesData, isLoading } = useQuery({
    queryKey: ['organizer-attendees-full', { search, status: selectedStatus }],
    queryFn: () =>
      organizerService.getAttendees({
        search: search.trim() || undefined,
        status: selectedStatus || undefined,
      }),
  });

  const attendees = attendeesData?.data?.attendees || [];

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Attendee Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View registered guests across all your events with real-time gate admission status
          </p>
        </div>
        <Badge variant="primary" size="md">
          {attendees.length} Total Attendees
        </Badge>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by attendee name, email, or ticket code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900"
          />
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900 cursor-pointer"
          >
            <option value="">All Admission States</option>
            <option value="VALID">Valid (Not Yet Admitted)</option>
            <option value="USED">Used (Checked In)</option>
          </select>
        </div>
      </div>

      {/* Attendees Table */}
      {attendees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No attendees found"
          description="No guests match your active search filters."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold border-y border-slate-100">
              <tr>
                <th className="py-3 px-4">Attendee Name</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Tier Pass</th>
                <th className="py-3 px-4">Ticket Code</th>
                <th className="py-3 px-4">Check-in Status</th>
                <th className="py-3 px-4">Booked Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {attendees.map((a) => {
                const isUsed = a.ticketStatus === 'USED';

                return (
                  <tr key={a.ticketId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {a.attendeeName}
                      <span className="block font-normal text-slate-400 text-[11px]">
                        {a.attendeeEmail}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px] truncate">{a.eventTitle}</td>
                    <td className="py-3.5 px-4 font-semibold text-brand-700">{a.ticketType}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                      {a.ticketCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={isUsed ? 'success' : 'default'} size="xs">
                        {isUsed ? 'CHECKED IN' : 'VALID'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(a.bookedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
