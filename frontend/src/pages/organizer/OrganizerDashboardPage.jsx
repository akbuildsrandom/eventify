import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Calendar,
  Ticket,
  TrendingUp,
  IndianRupee,
  PlusCircle,
  QrCode,
  Users,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { organizerService } from '../../services/organizerService';
import { LoadingSpinner } from '../../components/common/SkeletonCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatCurrency } from '../../utils/formatters';

const CHART_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const OrganizerDashboardPage = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['organizer-dashboard'],
    queryFn: () => organizerService.getDashboard(),
  });

  const { data: eventsData } = useQuery({
    queryKey: ['organizer-events-list'],
    queryFn: () => organizerService.getMyEvents(),
  });

  const metrics = dashboardData?.data?.metrics || {
    totalEvents: 0,
    totalTicketsSold: 0,
    totalAvailableTickets: 0,
    totalRevenue: 0,
    upcomingEventsCount: 0,
  };

  const charts = dashboardData?.data?.charts || {
    eventSales: [],
    categoryDistribution: [],
  };

  const events = eventsData?.data?.events || [];

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Organizer Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time analytics, revenue tracking, and live check-in monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/organizer/check-in">
            <Button variant="outline" size="sm" icon={QrCode}>
              QR Check-in Scanner
            </Button>
          </Link>
          <Link to="/organizer/events/new">
            <Button variant="gradient" size="sm" icon={PlusCircle}>
              Host New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Total Revenue</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {formatCurrency(metrics.totalRevenue)}
            </h3>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              Direct INR Settlement
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-brand-600 flex items-center justify-center font-bold text-lg">
            ₹
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Tickets Sold</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {metrics.totalTicketsSold.toLocaleString('en-IN')}
            </h3>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {metrics.totalAvailableTickets} available
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Published Events</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.totalEvents}</h3>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {metrics.upcomingEventsCount} upcoming
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Conversion Rate</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {metrics.totalAvailableTickets + metrics.totalTicketsSold > 0
                ? (
                    (metrics.totalTicketsSold /
                      (metrics.totalAvailableTickets + metrics.totalTicketsSold)) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </h3>
            <span className="text-[11px] text-slate-500 mt-1 block">Capacity filled</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Recharts Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Event Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue by Event</h3>
              <p className="text-xs text-slate-500 mt-0.5">Aggregated ticket gross earnings in INR</p>
            </div>
            <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
              Live DB Aggregation
            </span>
          </div>

          <div className="h-64 w-full">
            {charts.eventSales?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No event revenue generated yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.eventSales}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sales by Genre</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribution of passes sold</p>
          </div>

          <div className="h-52 w-full my-auto">
            {charts.categoryDistribution?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No tickets sold yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.categoryDistribution}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {charts.categoryDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {charts.categoryDistribution?.map((c, i) => (
              <div key={c.category} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="font-medium">{c.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Active Events Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-subtle">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">My Events Overview</h3>
            <p className="text-xs text-slate-500 mt-0.5">Quick status & capacity monitor</p>
          </div>
          <Link
            to="/organizer/events"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>Manage All Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {events.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              You haven't created any events yet.{' '}
              <Link to="/organizer/events/new" className="text-brand-600 font-bold hover:underline">
                Create your first event
              </Link>
            </p>
          ) : (
            events.slice(0, 5).map((e) => (
              <div
                key={e.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-sm text-slate-900">{e.title}</h4>
                    <Badge variant={e.status === 'PUBLISHED' ? 'success' : 'default'} size="xs">
                      {e.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{e.venue?.city || 'India'}</span>
                    <span>•</span>
                    <span>
                      {e.ticketsSold} / {e.totalCapacity} sold
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Revenue
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {formatCurrency(e.revenue)}
                    </span>
                  </div>

                  <Link to={`/organizer/check-in?eventId=${e.id}`}>
                    <Button variant="outline" size="sm" icon={QrCode}>
                      Check-in Gate
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
