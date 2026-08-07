/**
 * Helper to format raw numeric values into L/Cr notation
 */
const formatNumberValue = (val: number): string => {
  if (isNaN(val)) return '0';
  if (val >= 10000000) return `${(val / 10000000).toFixed(2).replace(/\.?0+$/, '')}Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return String(val.toLocaleString('en-IN'));
};

/**
 * Format price/budget (including JS objects like { min, max, displayValue, currency }) to readable strings
 * 1400000 → "₹14L"  |  10500000 → "₹1.05Cr"
 */
export const formatPrice = (value: any): string => {
  if (value === null || value === undefined || value === '') return 'N/A';

  if (typeof value === 'object') {
    const curr = value.currency ? (value.currency === 'INR' || value.currency === 'INR ' ? '₹' : `${value.currency.trim()} `) : '₹';
    if (value.displayValue) {
      const disp = String(value.displayValue);
      return disp.startsWith('₹') || disp.startsWith(curr.trim()) ? disp : `${curr}${disp}`;
    }
    if (value.min !== undefined && value.max !== undefined) {
      return `${curr}${formatNumberValue(Number(value.min))} – ${formatNumberValue(Number(value.max))}`;
    }
    if (value.min !== undefined) return `${curr}${formatNumberValue(Number(value.min))}+`;
    if (value.max !== undefined) return `Up to ${curr}${formatNumberValue(Number(value.max))}`;
    // Fallback to avoid raw JavaScript objects causing React Native Text crash
    return JSON.stringify(value);
  }

  if (typeof value === 'string') {
    if (value.trim().startsWith('₹') || isNaN(Number(value))) return value;
    return `₹${formatNumberValue(Number(value))}`;
  }

  if (typeof value === 'number') {
    return `₹${formatNumberValue(value)}`;
  }

  return String(value);
};

/**
 * Format rent: 14000 → "₹14,000/mo"
 */
export const formatRent = (value: any): string => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'object') {
    const formatted = formatPrice(value);
    return formatted.endsWith('/mo') ? formatted : `${formatted}/mo`;
  }
  if (typeof value === 'string' && isNaN(Number(value))) {
    return value.endsWith('/mo') ? value : `${value}/mo`;
  }
  return `₹${Number(value || 0).toLocaleString('en-IN')}/mo`;
};

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
