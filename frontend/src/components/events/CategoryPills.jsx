import React from 'react';
import {
  Sparkles,
  Music,
  Code,
  GraduationCap,
  Briefcase,
  Cpu,
  Trophy,
  Palette,
  PartyPopper,
  Users,
} from 'lucide-react';
import { CATEGORIES } from '../../utils/formatters';

const iconMap = {
  Sparkles,
  Music,
  Code,
  GraduationCap,
  Briefcase,
  Cpu,
  Trophy,
  Palette,
  PartyPopper,
  Users,
};

export const CategoryPills = ({ selectedCategory = 'ALL', onSelectCategory }) => {
  return (
    <div className="flex items-center gap-2.5 overflow-x-auto py-2 scrollbar-none">
      {CATEGORIES.map((cat) => {
        const IconComponent = iconMap[cat.icon] || Sparkles;
        const isSelected = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
              isSelected
                ? 'bg-brand-600 text-white shadow-glow shadow-brand-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-100/80 border border-slate-200/80 shadow-subtle'
            }`}
          >
            <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-brand-600'}`} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
