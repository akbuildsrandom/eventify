import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Calendar, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { EventCard } from '../../components/events/EventCard';
import { EventFilters } from '../../components/events/EventFilters';
import { SkeletonCard, EmptyState } from '../../components/common/SkeletonCard';
import { Button } from '../../components/common/Button';

export const EventsExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [city, setCity] = useState(searchParams.get('city') || 'ALL');
  const [category, setCategory] = useState(searchParams.get('category') || 'ALL');
  const [sort, setSort] = useState(searchParams.get('sort') || 'upcoming');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (city && city !== 'ALL') params.set('city', city);
    if (category && category !== 'ALL') params.set('category', category);
    if (sort && sort !== 'upcoming') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));

    setSearchParams(params, { replace: true });
  }, [search, city, category, sort, page, setSearchParams]);

  // Query events with TanStack Query
  const { data: responseData, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['events-explore', { search, city, category, sort, page }],
    queryFn: () =>
      eventService.getEvents({
        search: search.trim() || undefined,
        city: city !== 'ALL' ? city : undefined,
        category: category !== 'ALL' ? category : undefined,
        sort,
        page,
        limit: 12,
      }),
    keepPreviousData: true,
  });

  const events = responseData?.data || [];
  const pagination = responseData?.meta || { total: 0, totalPages: 1, page: 1 };

  const handleReset = () => {
    setSearch('');
    setCity('ALL');
    setCategory('ALL');
    setSort('upcoming');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Title Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Explore Live Events
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Discover {pagination.total || 0} upcoming technical summits, concerts, hackathons, and college festivals.
        </p>
      </div>

      {/* Filter Component */}
      <EventFilters
        search={search}
        setSearch={(val) => {
          setSearch(val);
          setPage(1);
        }}
        city={city}
        setCity={(val) => {
          setCity(val);
          setPage(1);
        }}
        category={category}
        setCategory={(val) => {
          setCategory(val);
          setPage(1);
        }}
        sort={sort}
        setSort={(val) => {
          setSort(val);
          setPage(1);
        }}
        onReset={handleReset}
      />

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No events match your criteria"
          description="Try broadening your search keywords, clearing location filters, or resetting filters."
          action={
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-12 pt-6 border-t border-slate-200">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isPlaceholderData}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            icon={ChevronLeft}
          >
            Previous
          </Button>

          <span className="text-xs font-bold text-slate-600 px-3">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages || isPlaceholderData}
            onClick={() => setPage((p) => p + 1)}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};
