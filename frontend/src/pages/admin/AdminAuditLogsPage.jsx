import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { LoadingSpinner, EmptyState } from '../../components/common/SkeletonCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const AdminAuditLogsPage = () => {
  const [page, setPage] = useState(1);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page],
    queryFn: () => adminService.getAuditLogs({ page, limit: 25 }),
  });

  const logs = logsData?.data || [];
  const pagination = logsData?.meta || { total: 0, totalPages: 1 };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Security & Operational Audit Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable system logs recording administrative, moderation, and sensitive mutations
          </p>
        </div>
        <Badge variant="danger" size="md">
          {pagination.total} Log Entries
        </Badge>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={FileText} title="No audit logs recorded" description="All clear." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold border-y border-slate-100">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Metadata</th>
                <th className="py-3 px-4">Timestamp (UTC / IST)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-rose-700">{log.action}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{log.entityType}</td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {log.entityId ? `#${log.entityId.slice(0, 8)}` : 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {log.user ? `${log.user.name} (${log.user.role})` : 'System Daemon'}
                  </td>
                  <td className="py-3.5 px-4 max-w-[220px] truncate text-slate-500">
                    {log.metadata ? JSON.stringify(log.metadata) : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {new Date(log.createdAt).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            Page {page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              icon={ChevronLeft}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
