import React from 'react';
import { Search, MapPin, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { CITIES, CATEGORIES } from '../../utils/formatters';

export const EventFilters = ({
  search,
  setSearch,
  city,
  setCity,
  category,
  setCategory,
  sort,
  setSort,
  onReset,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Search Events
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Title, artist, topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900"
            />
          </div>
        </div>

        {/* City Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Location
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900 cursor-pointer appearance-none"
            >
              {CITIES.map((c) => (
                <option key={c} value={c === 'All Cities' ? 'ALL' : c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900 cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Sort By
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none text-slate-900 cursor-pointer"
          >
            <option value="upcoming">Upcoming Events</option>
            <option value="newest">Recently Published</option>
            <option value="popularity">Most Popular</option>
            <option value="price_asc">Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* Reset Bar */}
      <div className="flex justify-end mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </button>
      </div>
    </div>
  );
};
