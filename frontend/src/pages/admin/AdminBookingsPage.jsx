import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ticket, Search } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { LoadingSpinner, EmptyState } from '../../components/common/SkeletonCard';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const AdminBookingsPage = () => {
  const [status, setStatus] = useState('ALL');

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['admin-bookings-list', status],
    queryFn: () => adminService.getAllBookings({ status: status !== 'ALL' ? status : undefined }),
  });

  const bookings = bookingsData?.data || [];

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Platform Bookings & Transactions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit customer checkout reservations and confirmed payment orders
          </p>
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 cursor-pointer"
        >
          <option value="ALL">All Order Statuses</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="PENDING">PENDING</option>
          <option value="EXPIRED">EXPIRED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {bookings.length === 0 ? (
        <EmptyState icon={Ticket} title="No bookings found" description="No orders match this status." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold border-y border-slate-100">
              <tr>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                    #{b.id.slice(0, 8)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {b.user?.name}
                    <span className="block font-normal text-slate-400 text-[11px]">
                      {b.user?.email}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-[200px] truncate">{b.event?.title}</td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    {formatCurrency(b.totalAmount)}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        b.status === 'CONFIRMED'
                          ? 'success'
                          : b.status === 'PENDING'
                          ? 'warning'
                          : 'danger'
                      }
                      size="xs"
                    >
                      {b.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono">
                    {formatDate(b.createdAt, 'dd MMM yyyy, hh:mm a')}
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
