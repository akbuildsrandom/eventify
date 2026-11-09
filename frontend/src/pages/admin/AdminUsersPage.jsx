import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Users, Shield, ShieldCheck } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { LoadingSpinner, EmptyState } from '../../components/common/SkeletonCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../utils/formatters';
import { toast } from '../../store/toastStore';

export const AdminUsersPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users-list', { search, role: selectedRole, page }],
    queryFn: () =>
      adminService.getUsers({
        search: search.trim() || undefined,
        role: selectedRole !== 'ALL' ? selectedRole : undefined,
        page,
        limit: 15,
      }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => adminService.updateUserRole(userId, role),
    onSuccess: (data) => {
      toast.success('Role Updated', `User role changed to ${data.data?.user?.role}`);
      queryClient.invalidateQueries(['admin-users-list']);
    },
    onError: (err) => {
      toast.error('Update Error', err.message || 'Could not change role');
    },
  });

  const users = usersData?.data || [];
  const pagination = usersData?.meta || { total: 0, totalPages: 1 };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">User Account Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage user roles and oversee customer and organizer permissions
          </p>
        </div>
        <Badge variant="primary" size="md">
          {pagination.total} Total Registered Users
        </Badge>
      </div>

      {/* Search & Role Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900"
          />
        </div>

        <div>
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900 cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="CUSTOMER">Customers Only</option>
            <option value="ORGANIZER">Organizers Only</option>
            <option value="ADMIN">Super Admins Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try clearing your search query." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold border-y border-slate-100">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Verified</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Modify Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          u.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'
                        }
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">{u.name}</span>
                        <span className="text-[11px] text-slate-400">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        u.role === 'ADMIN'
                          ? 'danger'
                          : u.role === 'ORGANIZER'
                          ? 'primary'
                          : 'default'
                      }
                      size="xs"
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{u.phone || 'N/A'}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`font-semibold ${
                        u.isVerified ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {u.isVerified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{formatDate(u.createdAt)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <select
                      value={u.role}
                      disabled={roleMutation.isPending}
                      onChange={(e) =>
                        roleMutation.mutate({ userId: u.id, role: e.target.value })
                      }
                      className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="ORGANIZER">ORGANIZER</option>
                      <option value="ADMIN">ADMIN</option>
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
