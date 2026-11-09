import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Heart, Shield, Globe, Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-slate-800/80 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-glow">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">
                Event<span className="text-brand-400">ify</span>
              </span>
            </Link>

            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-sm">
              India's premier high-concurrency event management and live ticketing platform. Discover college festivals, hackathons, concerts, and tech conferences with atomic seat reservation and instant QR entry.
            </p>

            <div className="flex items-center gap-4 mt-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-brand-400" /> Defaults: INR (₹) / IST
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" /> 100% Verified Tickets
              </span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Categories
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/events?category=HACKATHON" className="hover:text-white transition-colors">
                  Hackathons & Web3
                </Link>
              </li>
              <li>
                <Link to="/events?category=CONCERT" className="hover:text-white transition-colors">
                  Concerts & Music
                </Link>
              </li>
              <li>
                <Link to="/events?category=CONFERENCE" className="hover:text-white transition-colors">
                  Tech Conferences
                </Link>
              </li>
              <li>
                <Link to="/events?category=COLLEGE_FEST" className="hover:text-white transition-colors">
                  College Festivals
                </Link>
              </li>
              <li>
                <Link to="/events?category=WORKSHOP" className="hover:text-white transition-colors">
                  Architecture Masterclasses
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Cities */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Top Cities
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/events?city=Bengaluru" className="hover:text-white transition-colors">
                  Bengaluru (Bangalore)
                </Link>
              </li>
              <li>
                <Link to="/events?city=Mumbai" className="hover:text-white transition-colors">
                  Mumbai (Bombay)
                </Link>
              </li>
              <li>
                <Link to="/events?city=New Delhi" className="hover:text-white transition-colors">
                  Delhi NCR
                </Link>
              </li>
              <li>
                <Link to="/events?city=Hyderabad" className="hover:text-white transition-colors">
                  Hyderabad
                </Link>
              </li>
              <li>
                <Link to="/events?city=Pune" className="hover:text-white transition-colors">
                  Pune
                </Link>
              </li>
            </ul>
          </div>

          {/* For Organizers */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Organizers
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/organizer/dashboard" className="hover:text-white transition-colors">
                  Organizer Dashboard
                </Link>
              </li>
              <li>
                <Link to="/organizer/events/new" className="hover:text-white transition-colors">
                  Host an Event
                </Link>
              </li>
              <li>
                <Link to="/register?role=ORGANIZER" className="hover:text-white transition-colors">
                  Organizer Registration
                </Link>
              </li>
              <li>
                <span className="inline-flex items-center gap-1 text-xs text-brand-400 bg-brand-950/80 px-2.5 py-1 rounded-md border border-brand-800/60 mt-2">
                  <Sparkles className="w-3.5 h-3.5" /> Razorpay Test Gateway
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Eventify Technologies Ltd. Built for production.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for event lovers.
          </p>
        </div>
      </div>
    </footer>
  );
};
