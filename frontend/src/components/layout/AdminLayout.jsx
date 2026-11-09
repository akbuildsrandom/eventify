import React, { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Calendar,
  Ticket,
  FileText,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '../common/Badge';

export const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { to: '/admin/dashboard', label: 'Admin Overview', icon: ShieldAlert, end: true },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/events', label: 'Event Moderation', icon: Calendar },
    { to: '/admin/bookings', label: 'Bookings & Orders', icon: Ticket },
    { to: '/admin/audit-logs', label: 'Security Audit Logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col z-50 transition-transform duration-200 border-r border-slate-800 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <div>
              <span className="font-extrabold text-lg text-white">Eventify</span>
              <span className="block text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                Admin Console
              </span>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Badge */}
        <div className="px-5 py-4 mx-3 my-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center gap-3">
          <img
            src={
              user?.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
            }
            alt={user?.name}
            className="w-10 h-10 rounded-full object-cover border border-rose-500"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">{user?.name}</h4>
            <Badge variant="danger" size="xs" className="mt-1">
              SUPER ADMIN
            </Badge>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-subtle'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <Link
            to="/events"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Public Site
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 px-3 py-2 rounded-lg hover:bg-rose-950/30 transition-colors w-full text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Platform Master Controls
          </span>
          <Badge variant="danger" size="xs">
            SECURE ACCESS
          </Badge>
        </header>

        <main className="p-4 sm:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
