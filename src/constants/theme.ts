import { Platform } from 'react-native';

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl:32,
};

export const Radius = {
  sm:   6,
  md:   12,
  lg:   16,   // standard card radius — used by all cards app-wide
  xl:   24,
  full: 9999,
};

export const FontFamily = {
  regular:  Platform.OS === 'ios' ? 'Inter' : 'Inter-Regular',
  medium:   Platform.OS === 'ios' ? 'Inter' : 'Inter-Medium',
  semibold: Platform.OS === 'ios' ? 'Inter' : 'Inter-SemiBold',
  bold:     Platform.OS === 'ios' ? 'Inter' : 'Inter-Bold',
};

export const FontSize = {
  xs:        10,
  sm:        12,
  base:      14,
  md:        15,
  lg:        17,
  xl:        20,
  xxl:       24,
  xxxl:      32,
  // Named scale aligned to design spec
  caption:   12,   // timestamps, labels
  body:      14,   // secondary / card subtext
  cardTitle: 16,   // card titles, primary body
  h2:        13,   // section headers (uppercase + letter-spacing)
  h1:        28,   // page titles
};

export const FontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  teal: {
    shadowColor: '#0A6E5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
};

/** Shared card layout tokens — apply to ALL cards across the app */
export const Card = {
  radius:  Radius.lg,   // 16dp
  padding: Spacing.lg,  // 16dp
  gap:     Spacing.md,  // 12dp vertical gap between stacked cards
};

