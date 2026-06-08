/**
 * Format a number to Indian price notation
 * 1400000 → "₹14L"  |  10500000 → "₹1.05Cr"
 */
export const formatPrice = (value: number): string => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2).replace(/\.?0+$/, '')}Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(0)}K`;
  }
  return `₹${value}`;
};

/**
 * Format rent: 14000 → "₹14,000/mo"
 */
export const formatRent = (value: number): string =>
  `₹${value.toLocaleString('en-IN')}/mo`;

/**
 * Relative time: "2 days ago", "just now"
 */
export const timeAgo = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return past.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/**
 * Freshness indicator
 * Returns: 'fresh' (< 7 days), 'stale' (7–30 days), 'old' (> 30 days)
 */
export const getFreshness = (date: string | Date): 'fresh' | 'stale' | 'old' => {
  const diffDays = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 7) return 'fresh';
  if (diffDays < 30) return 'stale';
  return 'old';
};

/**
 * Shorten a name to initials for avatar
 * "Rahul Kumar" → "RK"
 */
export const getInitials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

/**
 * Truncate long strings
 */
export const truncate = (str: string, length: number): string =>
  str.length > length ? `${str.slice(0, length)}…` : str;
