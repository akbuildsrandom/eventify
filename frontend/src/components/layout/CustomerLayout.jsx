import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Calendar, Ticket, User, Bell } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useAuthStore } from '../../store/authStore';

export const CustomerLayout = () => {
  const { user } = useAuthStore();

  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/bookings', label: 'My Bookings', icon: Calendar },
    { to: '/dashboard/tickets', label: 'My Tickets', icon: Ticket },
    { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    { to: '/dashboard/profile', label: 'Profile Settings', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={
                user?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
              }
              alt={user?.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-200 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">{user?.name}</h1>
                <span className="bg-brand-50 text-brand-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {user?.role}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-200 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-subtle'
                      : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>

        {/* Page Content */}
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
