import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { IndianRupee, TrendingUp, Calendar, Ticket, Download } from 'lucide-react';
import { organizerService } from '../../services/organizerService';
import { LoadingSpinner } from '../../components/common/SkeletonCard';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatters';

export const OrganizerAnalyticsPage = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['organizer-analytics-full'],
    queryFn: () => organizerService.getAnalytics(),
  });

  const dailyTrend = analyticsData?.data?.dailyTrend || [];
  const totalBookings = analyticsData?.data?.totalBookings || 0;

  const totalGross = dailyTrend.reduce((sum, d) => sum + d.revenue, 0);
  const totalPasses = dailyTrend.reduce((sum, d) => sum + d.tickets, 0);
  const avgOrderValue = totalBookings > 0 ? totalGross / totalBookings : 0;

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Financial Analytics & Sales Trajectory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Historical daily trends and revenue aggregations in Indian Rupees (₹)
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-bold uppercase text-slate-400">Total Gross Revenue</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalGross)}</h3>
          <span className="text-xs text-emerald-600 font-semibold mt-1 block">
            Across all events hosted
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-bold uppercase text-slate-400">Total Tickets Sold</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {totalPasses.toLocaleString('en-IN')}
          </h3>
          <span className="text-xs text-slate-500 mt-1 block">Across {totalBookings} orders</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-bold uppercase text-slate-400">Average Order Value</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(avgOrderValue)}
          </h3>
          <span className="text-xs text-slate-500 mt-1 block">Per checkout transaction</span>
        </div>
      </div>

      {/* Daily Revenue Area Chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Daily Revenue Timeline</h3>
            <p className="text-xs text-slate-500 mt-0.5">Earnings progression over time in INR</p>
          </div>
          <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
            Daily Timeline
          </span>
        </div>

        <div className="h-72 w-full">
          {dailyTrend.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No sales data recorded yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Daily Passes Sold Bar Chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Passes Issued Per Day</h3>
            <p className="text-xs text-slate-500 mt-0.5">Attendee registration volume</p>
          </div>
        </div>

        <div className="h-64 w-full">
          {dailyTrend.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No tickets recorded yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrend}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val} Passes`, 'Tickets']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="tickets" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
