export const Colors = {
  // Brand
  brandTeal: '#0A6E5E',
  brandTealLight: '#0D9178',
  brandTealDark: '#064D41',
  brandAmber: '#F59E0B',
  brandAmberDark: '#D97706',

  // Backgrounds
  background: '#F0F4F3',
  surface: '#FFFFFF',
  surface2: '#F7FAF9',
  surfaceDark: '#0C1F1C',

  // Text
  textPrimary: '#0F2922',
  textSecondary: '#5A7A74',
  textMuted: '#8FA9A4',
  textInverse: '#FFFFFF',

  // Border
  border: '#E2EEEB',
  borderFocus: '#0D9178',

  // Lead Status
  leadMatched: '#3B82F6',
  leadPending: '#F59E0B',
  leadConfirmed: '#10B981',
  leadRejected: '#EF4444',
  leadVisit: '#8B5CF6',
  leadDeal: '#0A6E5E',

  // Property Status
  propActive: '#10B981',
  propNegotiation: '#F59E0B',
  propHold: '#94A3B8',
  propSold: '#0A6E5E',
  propRented: '#3B82F6',
  propExpired: '#EF4444',

  // Requirement Status
  reqActive: '#10B981',
  reqVisiting: '#8B5CF6',
  reqNegotiating: '#F59E0B',
  reqClosed: '#0A6E5E',
  reqNotInterested: '#94A3B8',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // Transparent
  overlay: 'rgba(0,0,0,0.45)',
  tealGlow: 'rgba(10,110,94,0.25)',
};

// Status chip background + text color pairs
export const LeadStatusColors: Record<string, { bg: string; text: string; dot: string }> = {
  Matched:             { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  'Pending Confirmation': { bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' },
  Confirmed:           { bg: '#DCFCE7', text: '#15803D', dot: '#10B981' },
  Rejected:            { bg: '#FEE2E2', text: '#B91C1C', dot: '#EF4444' },
  'Visit Conducted':   { bg: '#F3E8FF', text: '#7C3AED', dot: '#8B5CF6' },
  'Deal Done':         { bg: '#CCFBF1', text: '#0F766E', dot: '#0A6E5E' },
};

export const PropertyStatusColors: Record<string, { bg: string; text: string; dot: string }> = {
  Active:         { bg: '#DCFCE7', text: '#15803D', dot: '#10B981' },
  'In Negotiation': { bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' },
  'On Hold':      { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' },
  Sold:           { bg: '#CCFBF1', text: '#0F766E', dot: '#0A6E5E' },
  Rented:         { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  Expired:        { bg: '#FEE2E2', text: '#B91C1C', dot: '#EF4444' },
};

export const RequirementStatusColors: Record<string, { bg: string; text: string; dot: string }> = {
  Active:           { bg: '#DCFCE7', text: '#15803D', dot: '#10B981' },
  'Client Visiting':{ bg: '#F3E8FF', text: '#7C3AED', dot: '#8B5CF6' },
  Negotiating:      { bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' },
  Closed:           { bg: '#CCFBF1', text: '#0F766E', dot: '#0A6E5E' },
  'Not Interested': { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' },
};
