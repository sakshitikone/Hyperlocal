// src/utils/helpers.js

/** Format a date relative to now (e.g. "2 min ago") */
export const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60)  return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

/** Distance in km between two [lat,lng] points */
export const distanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
};

/** Category icons (emoji fallback) */
export const CATEGORY_ICONS = {
  item:      '📦',
  help:      '🤝',
  food:      '🍱',
  transport: '🚗',
  study:     '📚',
  other:     '💬',
};

export const CATEGORIES = ['item', 'help', 'food', 'transport', 'study', 'other'];

/** Get initials from a name */
export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

/** Star rating array */
export const starArray = (rating) =>
  Array.from({ length: 5 }, (_, i) => (i < Math.round(rating) ? '★' : '☆'));
