import { format, parseISO } from 'date-fns';

/**
 * Format monetary amount in INR (₹)
 * @param {number|string} amount
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Format date string into human-friendly format
 * @param {string|Date} date
 * @param {string} formatStr
 * @returns {string}
 */
export const formatDate = (date, formatStr = 'EEE, dd MMM yyyy') => {
  if (!date) return '';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  try {
    return format(parsed, formatStr);
  } catch {
    return String(date);
  }
};

/**
 * Format time
 * @param {string|Date} date
 * @returns {string}
 */
export const formatTime = (date) => {
  if (!date) return '';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  try {
    return format(parsed, 'hh:mm a');
  } catch {
    return '';
  }
};

export const CATEGORIES = [
  { id: 'ALL', label: 'All Events', icon: 'Sparkles' },
  { id: 'CONCERT', label: 'Concerts & Music', icon: 'Music' },
  { id: 'HACKATHON', label: 'Hackathons & AI', icon: 'Code' },
  { id: 'COLLEGE_FEST', label: 'College Fests', icon: 'GraduationCap' },
  { id: 'CONFERENCE', label: 'Tech Conferences', icon: 'Briefcase' },
  { id: 'WORKSHOP', label: 'Workshops & Labs', icon: 'Cpu' },
  { id: 'SPORTS', label: 'Sports & Fitness', icon: 'Trophy' },
  { id: 'CULTURAL', label: 'Cultural & Arts', icon: 'Palette' },
  { id: 'PARTY', label: 'Nightlife & Parties', icon: 'PartyPopper' },
  { id: 'NETWORKING', label: 'Networking & Meetups', icon: 'Users' },
];

export const CITIES = [
  'All Cities',
  'Bengaluru',
  'Mumbai',
  'New Delhi',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
];
