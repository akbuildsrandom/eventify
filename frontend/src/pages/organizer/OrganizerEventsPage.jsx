import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  PlusCircle,
  QrCode,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import { organizerService } from '../../services/organizerService';
import { eventService } from '../../services/eventService';
import { LoadingSpinner, EmptyState } from '../../components/common/SkeletonCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { toast } from '../../store/toastStore';

export const OrganizerEventsPage = () => {
  const queryClient = useQueryClient();

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['organizer-events-all'],
    queryFn: () => organizerService.getMyEvents(),
  });

  const publishMutation = useMutation({
    mutationFn: (eventId) => eventService.publishEvent(eventId),
    onSuccess: () => {
      toast.success('Event Published!', 'Your event is now live for attendees to book.');
      queryClient.invalidateQueries(['organizer-events-all']);
      queryClient.invalidateQueries(['organizer-dashboard']);
    },
    onError: (err) => {
      toast.error('Publish Error', err.message || 'Could not publish event');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (eventId) => eventService.cancelEvent(eventId),
    onSuccess: () => {
      toast.info('Event Cancelled', 'Event has been marked as cancelled.');
      queryClient.invalidateQueries(['organizer-events-all']);
    },
    onError: (err) => {
      toast.error('Cancel Error', err.message || 'Could not cancel event');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId) => eventService.deleteDraftEvent(eventId),
    onSuccess: () => {
      toast.success('Draft Deleted', 'The draft event has been removed.');
      queryClient.invalidateQueries(['organizer-events-all']);
    },
    onError: (err) => {
      toast.error('Delete Error', err.message || 'Could not delete draft');
    },
  });

  const events = eventsData?.data?.events || [];

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Event Portfolio</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your draft, active, and completed events
          </p>
        </div>

        <Link to="/organizer/events/new">
          <Button variant="primary" size="sm" icon={PlusCircle}>
            Create New Event
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events yet"
          description="You have not created any events yet. Publish your first event in minutes."
          action={
            <Link to="/organizer/events/new">
              <Button variant="primary">Create Event</Button>
            </Link>
          }
        />
      ) : (
        <div className="divide-y divide-slate-100 overflow-x-auto">
          {events.map((e) => {
            const isDraft = e.status === 'DRAFT';
            const isPublished = e.status === 'PUBLISHED';
            const isCancelled = e.status === 'CANCELLED';

            return (
              <div
                key={e.id}
                className="py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="flex gap-4">
                  <img
                    src={
                      e.imageUrl ||
                      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=150&q=80'
                    }
                    alt={e.title}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                  />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          isPublished
                            ? 'success'
                            : isDraft
                            ? 'default'
                            : 'danger'
                        }
                        size="xs"
                      >
                        {e.status}
                      </Badge>
                      <span className="text-xs font-bold text-brand-600">
                        {e.category?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900">{e.title}</h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{formatDate(e.startDate)}</span>
                      <span>•</span>
                      <span>{e.venue?.city || 'India'}</span>
                      <span>•</span>
                      <span className="font-bold text-slate-700">
                        {e.ticketsSold} / {e.totalCapacity} sold
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metrics & Actions */}
                <div className="flex flex-wrap items-center gap-4 lg:gap-6 justify-between lg:justify-end">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Revenue
                    </span>
                    <span className="text-base font-extrabold text-slate-900">
                      {formatCurrency(e.revenue)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Link */}
                    {isPublished && (
                      <Link to={`/events/${e.slug || e.id}`} target="_blank">
                        <Button variant="ghost" size="sm" icon={Eye} title="View public page" />
                      </Link>
                    )}

                    {/* QR Scanner Link */}
                    {isPublished && (
                      <Link to={`/organizer/check-in?eventId=${e.id}`}>
                        <Button variant="outline" size="sm" icon={QrCode}>
                          Check-in
                        </Button>
                      </Link>
                    )}

                    {/* Publish Action */}
                    {isDraft && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={CheckCircle}
                        isLoading={publishMutation.isPending}
                        onClick={() => publishMutation.mutate(e.id)}
                      >
                        Publish Live
                      </Button>
                    )}

                    {/* Delete Draft Action */}
                    {isDraft && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50"
                        icon={Trash2}
                        isLoading={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(e.id)}
                      />
                    )}

                    {/* Cancel Event Action */}
                    {isPublished && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50"
                        isLoading={cancelMutation.isPending}
                        onClick={() => {
                          if (window.confirm('Are you sure you want to cancel this published event?')) {
                            cancelMutation.mutate(e.id);
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
