import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Calendar, Eye, ShieldAlert } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { LoadingSpinner, EmptyState } from '../../components/common/SkeletonCard';
import { Badge } from '../../components/common/Badge';
import { formatDate } from '../../utils/formatters';
import { toast } from '../../store/toastStore';

export const AdminEventsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['admin-events-list', { search, status }],
    queryFn: () =>
      adminService.getAllEvents({
        search: search.trim() || undefined,
        status: status !== 'ALL' ? status : undefined,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ eventId, status }) => adminService.updateEventStatus(eventId, status),
    onSuccess: (data) => {
      toast.success('Status Updated', `Event status set to ${data.data?.event?.status}`);
      queryClient.invalidateQueries(['admin-events-list']);
    },
    onError: (err) => {
      toast.error('Moderation Error', err.message || 'Could not update event status');
    },
  });

  const events = eventsData?.data || [];

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Event Moderation & Control</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Oversee all public listings, enforce platform safety, and moderate event states
          </p>
        </div>
        <Badge variant="primary" size="md">
          {events.length} Events Listed
        </Badge>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by event title or organizer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900"
          />
        </div>

        <div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900 cursor-pointer"
          >
            <option value="ALL">All Event Statuses</option>
            <option value="PUBLISHED">Published Live</option>
            <option value="DRAFT">Draft Mode</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      {events.length === 0 ? (
        <EmptyState icon={Calendar} title="No events found" description="Try clearing filters." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold border-y border-slate-100">
              <tr>
                <th className="py-3 px-4">Event Title</th>
                <th className="py-3 px-4">Organizer</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Moderate Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[220px] truncate">
                    {e.title}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{e.organizer?.name}</td>
                  <td className="py-3.5 px-4 font-semibold text-brand-700">{e.category}</td>
                  <td className="py-3.5 px-4 text-slate-500">{e.venue?.city || 'India'}</td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        e.status === 'PUBLISHED'
                          ? 'success'
                          : e.status === 'DRAFT'
                          ? 'default'
                          : 'danger'
                      }
                      size="xs"
                    >
                      {e.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <select
                      value={e.status}
                      disabled={statusMutation.isPending}
                      onChange={(ev) =>
                        statusMutation.mutate({ eventId: e.id, status: ev.target.value })
                      }
                      className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
