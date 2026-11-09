import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  Search,
  MapPin,
  PlusCircle,
  User,
  LogOut,
  Ticket,
  LayoutDashboard,
  ShieldAlert,
  Bell,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { CITIES } from '../../utils/formatters';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/events');
    }
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    if (city === 'All Cities') {
      navigate('/events');
    } else {
      navigate(`/events?city=${encodeURIComponent(city)}`);
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'ORGANIZER') return '/organizer/dashboard';
    return '/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                Event<span className="text-brand-600">ify</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase -mt-1">
                India
              </span>
            </div>
          </Link>

          {/* Quick Search & City Filter Bar (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-xl mx-4">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search hackathons, concerts, workshops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-brand-500 rounded-xl transition-all outline-none text-slate-900 placeholder:text-slate-400"
              />
            </form>

            {/* City Selector */}
            <div className="relative group shrink-0">
              <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 rounded-xl text-slate-700 transition-colors">
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                <span>{selectedCity}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-premium py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCityChange(city)}
                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link
              to="/events"
              className={`hover:text-brand-600 transition-colors ${
                location.pathname === '/events' ? 'text-brand-600 font-semibold' : ''
              }`}
            >
              Explore Events
            </Link>

            {user?.role === 'ORGANIZER' ? (
              <Link to="/organizer/events/new">
                <Button size="sm" variant="outline" icon={PlusCircle}>
                  Create Event
                </Button>
              </Link>
            ) : (
              <Link
                to={isAuthenticated ? '/organizer/dashboard' : '/register?role=ORGANIZER'}
                className="hover:text-brand-600 transition-colors"
              >
                Become an Organizer
              </Link>
            )}
          </nav>

          {/* User / Auth Action Controls */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent focus:border-slate-200"
                >
                  <img
                    src={
                      user?.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                    }
                    alt={user?.name}
                    className="w-8 h-8 rounded-full object-cover border border-brand-200"
                  />
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {user?.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div
                    onClick={() => setIsUserMenuOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-premium py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900 leading-tight">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                      <div className="mt-2">
                        <Badge variant="primary" size="xs">
                          {user?.role}
                        </Badge>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to={getDashboardLink()}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        Dashboard
                      </Link>

                      {user?.role === 'CUSTOMER' && (
                        <>
                          <Link
                            to="/dashboard/tickets"
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                          >
                            <Ticket className="w-4 h-4 text-slate-400" />
                            My Tickets
                          </Link>
                          <Link
                            to="/dashboard/profile"
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                          >
                            <User className="w-4 h-4 text-slate-400" />
                            Profile Settings
                          </Link>
                        </>
                      )}

                      {user?.role === 'ORGANIZER' && (
                        <Link
                          to="/organizer/events/new"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                        >
                          <PlusCircle className="w-4 h-4 text-slate-400" />
                          Publish Event
                        </Link>
                      )}

                      {user?.role === 'ADMIN' && (
                        <Link
                          to="/admin/users"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4 text-slate-400" />
                          User Moderation
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        onClick={logout}
                        className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 animate-in fade-in duration-150">
            <form onSubmit={handleSearchSubmit} className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl outline-none"
              />
            </form>

            <div className="flex flex-col gap-2 font-medium text-sm text-slate-700">
              <Link
                to="/events"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                Explore Events
              </Link>
              {isAuthenticated && (
                <Link
                  to={getDashboardLink()}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-slate-100"
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/events?category=HACKATHON"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                Hackathons & Tech
              </Link>
              <Link
                to="/events?category=CONCERT"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                Concerts & Live Shows
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
