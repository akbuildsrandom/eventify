import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Users,
  Calendar,
  Ticket,
  TrendingUp,
  FileText,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { LoadingSpinner } from '../../components/common/SkeletonCard';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const AdminDashboardPage = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-dashboard-overview'],
    queryFn: () => adminService.getDashboard(),
  });

  const metrics = dashboardData?.data?.metrics || {
    totalUsers: 0,
    totalOrganizers: 0,
    totalEvents: 0,
    totalPublishedEvents: 0,
    totalBookings: 0,
    totalConfirmedTickets: 0,
    platformRevenue: 0,
  };

  const recentActivities = dashboardData?.data?.recentActivities || [];

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Platform Administrator Console</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          System Overview & Platform Health
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Cross-platform aggregation of accounts, event listings, financial throughput, and security audit logs
        </p>
      </div>

      {/* 2. Platform KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-bold uppercase text-slate-400">Platform Revenue</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(metrics.platformRevenue)}
          </h3>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            Verified Payments Throughput
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-bold uppercase text-slate-400">Total Users</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.totalUsers}</h3>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {metrics.totalOrganizers} Organizers
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-bold uppercase text-slate-400">Total Events</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.totalEvents}</h3>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {metrics.totalPublishedEvents} Live Published
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-bold uppercase text-slate-400">Confirmed Passes</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {metrics.totalConfirmedTickets}
          </h3>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Across {metrics.totalBookings} orders
          </span>
        </div>
      </div>

      {/* 3. Recent Platform Audit Activity */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Security Audit Trail</h3>
            <p className="text-xs text-slate-500 mt-0.5">Recent administrative and security actions</p>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            <span>View All Logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {recentActivities.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No recent audit logs.</p>
          ) : (
            recentActivities.map((log) => (
              <div
                key={log.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-bold text-slate-800">{log.entityType}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Actor: {log.user ? `${log.user.name} (${log.user.email})` : 'System Daemon'}
                  </p>
                </div>

                <div className="text-slate-400 text-[11px] shrink-0 font-mono">
                  {new Date(log.createdAt).toLocaleString('en-IN')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
