import { useAppStore } from '../store/appStore';
import { Radius, Shadow, Spacing, FontWeight, FontSize } from '../constants/theme';

// Common brand tokens that don't change between themes
export const Brand = {
  blue: '#2563EB',
  teal: '#10B981',
  white: '#FFFFFF',
  blueBorder: 'rgba(37,99,235,0.3)',
  // Primary gradient — FABs, CTAs, active pills
  gradientPrimary: ['#2563EB', '#10B981'] as const,
  // Card layout
  cardRadius: Radius.lg,
  cardPadding: Spacing.lg,
};

// ── Shared button style presets ────────────────────────────────
// Import these into any screen so button appearance is identical everywhere.
export const BtnStyle = {
  /** Filled primary — solid teal, white text */
  primary: {
    container: {
      backgroundColor: Brand.teal,
      borderRadius: Radius.md,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 48,
      ...Shadow.teal,
    },
    text: {
      color: Brand.white,
      fontSize: FontSize.cardTitle,
      fontWeight: FontWeight.semibold,
    },
  },
  /** Outline secondary — transparent bg, teal border + text */
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: Brand.teal,
      borderRadius: Radius.md,
      paddingVertical: 10,
      paddingHorizontal: 18,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 44,
    },
    text: {
      color: Brand.teal,
      fontSize: FontSize.base,
      fontWeight: FontWeight.semibold,
    },
  },
  /** FAB — 56×56 circle, teal gradient shadow */
  fab: {
    container: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...Shadow.teal,
    },
    gradient: Brand.gradientPrimary,
  },
};

export const darkPalette = {
  // Backgrounds
  bgStart: '#0B1B4D',
  bgMid: '#050D1F',
  bgEnd: '#020810',
  navy: '#050D1F',

  // Surfaces
  cardBg: 'rgba(255,255,255,0.07)',
  cardBgLight: 'rgba(255,255,255,0.1)',
  inputBg: 'rgba(37,99,235,0.10)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.5)',
  textDim: 'rgba(255,255,255,0.3)',

  // Accents
  borderFaint: 'rgba(255,255,255,0.1)',
  logoRoof: '#FFFFFF',

  // Semantic
  successFaint: 'rgba(16,185,129,0.15)',
  successText: '#10B981',
  errorFaint: 'rgba(239,68,68,0.12)',
  errorText: '#F87171',
  warningFaint: 'rgba(245,158,11,0.15)',
  warningText: '#FBBF24',
  infoFaint: 'rgba(37,99,235,0.15)',
  infoText: '#60A5FA',
  brandFaint: 'rgba(13,148,136,0.15)',

  // Tab/Nav
  tabUnderlineBg: Brand.teal,
};

export const lightPalette = {
  // Backgrounds
  bgStart: '#FFFFFF',
  bgMid: '#F8FAFF',
  bgEnd: '#F0F4F8',
  navy: '#FFFFFF',

  // Surfaces
  cardBg: '#FFFFFF',
  cardBgLight: '#F8FAFF',
  inputBg: '#FFFFFF',

  // Text
  textPrimary: '#050D1F',
  textSecondary: '#64748B',
  textDim: '#94A3B8',

  // Accents
  borderFaint: 'rgba(0,0,0,0.05)',
  logoRoof: '#050D1F',

  // Semantic
  successFaint: '#DCFCE7',
  successText: '#10B981',
  errorFaint: '#FEE2E2',
  errorText: '#EF4444',
  warningFaint: '#FEF3C7',
  warningText: '#D97706',
  infoFaint: '#DBEAFE',
  infoText: '#2563EB',
  brandFaint: '#F0FDFA',

  // Tab/Nav
  tabUnderlineBg: Brand.teal,
};

export function useAppTheme() {
  const themeType = useAppStore(s => s.theme);
  const colors = themeType === 'dark' ? darkPalette : lightPalette;

  return {
    type: themeType,
    colors,
    Brand,
    BtnStyle,
    isDark: themeType === 'dark',
  };
}
