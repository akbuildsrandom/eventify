import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  QrCode,
  TrendingUp,
  Star,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { eventService } from '../../services/eventService';
import { EventCard } from '../../components/events/EventCard';
import { CategoryPills } from '../../components/events/CategoryPills';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { Button } from '../../components/common/Button';
import { CITIES } from '../../utils/formatters';

export const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Fetch published events from API
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['public-events-home', activeCategory],
    queryFn: () => eventService.getEvents({ category: activeCategory, limit: 6, sort: 'upcoming' }),
  });

  const events = eventsData?.data || [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (selectedCity && selectedCity !== 'All Cities') params.append('city', selectedCity);
    if (activeCategory && activeCategory !== 'ALL') params.append('category', activeCategory);
    navigate(`/events?${params.toString()}`);
  };

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32 bg-gradient-to-b from-brand-50/60 via-slate-50 to-slate-50 border-b border-slate-200/60">
        {/* Subtle background glow element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-400/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/80 text-brand-700 text-xs font-bold mb-6 tracking-wide border border-brand-200/60 shadow-sm animate-in fade-in slide-in-from-top-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Discover Top Indian Festivals, Hackathons & Concerts</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Discover Experiences.{' '}
            <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
              Create Memories.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Find the events you love, book your tickets effortlessly with atomic seat reservations, and enjoy seamless digital QR check-in across India.
          </p>

          {/* Hero Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-10 max-w-3xl mx-auto p-2 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-premium border border-slate-200/80 flex flex-col sm:flex-row items-center gap-2"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-2 flex-1 w-full border-b sm:border-b-0 sm:border-r border-slate-100">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search hackathons, music tours, conferences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* City Selector */}
            <div className="flex items-center gap-2 px-4 py-2 w-full sm:w-auto shrink-0 border-b sm:border-b-0 border-slate-100">
              <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit CTA */}
            <Button
              type="submit"
              variant="gradient"
              size="md"
              className="w-full sm:w-auto shrink-0 rounded-xl sm:rounded-2xl"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-xs font-semibold text-slate-500">
            <Link to="/events" className="hover:text-brand-600 transition-colors">
              Popular: Bangalore AI Hackathon
            </Link>
            <span>•</span>
            <Link to="/events" className="hover:text-brand-600 transition-colors">
              Arijit Singh Mumbai Concert
            </Link>
            <span>•</span>
            <Link to="/events" className="hover:text-brand-600 transition-colors">
              Mood Indigo 2026
            </Link>
          </div>
        </div>
      </section>

      {/* 2. POPULAR CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Explore by Category</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Browse through curated technical, musical, and cultural experiences
            </p>
          </div>
          <Link
            to="/events"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <CategoryPills
          selectedCategory={activeCategory}
          onSelectCategory={(catId) => setActiveCategory(catId)}
        />
      </section>

      {/* 3. FEATURED & TRENDING EVENTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trending Live Now</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Featured Events Across India
            </h2>
          </div>

          <Link to="/events">
            <Button variant="outline" size="sm">
              See All Events
            </Button>
          </Link>
        </div>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : events.map((event) => <EventCard key={event.id} event={event} />)}
        </div>
      </section>

      {/* 4. HOW EVENTIFY WORKS */}
      <section className="bg-white py-16 sm:py-24 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">How Eventify Works</h2>
            <p className="text-slate-500 text-sm mt-2">
              Simple, high-concurrency ticketing designed to give customers and organizers peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-slate-50/80 border border-slate-200/80 text-center relative group hover:border-brand-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-5 font-black text-xl group-hover:scale-110 transition-transform">
                <Search className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-2">
                Step 1
              </span>
              <h3 className="text-lg font-bold text-slate-900">Discover Experiences</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Filter across Indian cities, technical genres, musical concerts, and college festivals with real-time availability.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-slate-50/80 border border-slate-200/80 text-center relative group hover:border-brand-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto mb-5 font-black text-xl group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-violet-600 uppercase tracking-widest block mb-2">
                Step 2
              </span>
              <h3 className="text-lg font-bold text-slate-900">Atomic Reservation & Pay</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Tickets are atomically reserved to prevent overselling. Complete your checkout securely using Razorpay in INR.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-slate-50/80 border border-slate-200/80 text-center relative group hover:border-brand-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 font-black text-xl group-hover:scale-110 transition-transform">
                <QrCode className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-2">
                Step 3
              </span>
              <h3 className="text-lg font-bold text-slate-900">Instant QR Entry</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Access unique digital tickets on your phone or print passes. Organizers scan barcodes at the gate with zero latency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BENEFITS FOR ORGANIZERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-navy-900 to-navy-950 rounded-3xl p-8 sm:p-14 text-white relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold mb-4 border border-brand-500/30">
                <Zap className="w-3.5 h-3.5" /> Built for Scale & High Concurrency
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Engineered for High-Volume Ticket Sales
              </h2>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed max-w-lg">
                Whether you're organizing a 1,500-hacker national hackathon, a stadium music concert, or a college festival, Eventify delivers enterprise reliability without double-booking headaches.
              </p>

              <div className="space-y-3 mt-6 text-sm">
                <div className="flex items-center gap-3 text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Atomic PostgreSQL row conditional updates prevent negative inventory.</span>
                </div>
                <div className="flex items-center gap-3 text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Integrated Razorpay payment gateway with automatic webhook verification.</span>
                </div>
                <div className="flex items-center gap-3 text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Built-in mobile camera QR scanner for fraud-proof check-ins.</span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/register?role=ORGANIZER">
                  <Button variant="primary" size="md">
                    Become an Organizer
                  </Button>
                </Link>
                <Link to="/events">
                  <Button variant="outline" size="md" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                    Explore Platform
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Metrics Visual */}
            <div className="bg-navy-900/80 rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                  Live Concurrency Guard
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
                  ACTIVE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-navy-950 rounded-xl border border-slate-800">
                  <span className="text-2xl font-black text-white">0.0%</span>
                  <span className="block text-[11px] text-slate-400 mt-1">Oversell Rate</span>
                </div>
                <div className="p-4 bg-navy-950 rounded-xl border border-slate-800">
                  <span className="text-2xl font-black text-white">100%</span>
                  <span className="block text-[11px] text-slate-400 mt-1">QR Authenticity</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
