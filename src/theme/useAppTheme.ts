import { useAppStore } from '../store/appStore';

// Common brand tokens that don't change between themes
export const Brand = {
  blue: '#2563EB',
  teal: '#10B981',
  white: '#FFFFFF',
  blueBorder: 'rgba(37,99,235,0.3)',
};

export const darkPalette = {
  // Backgrounds
  bgStart: '#0B1B4D',
  bgMid: '#050D1F',
  bgEnd: '#020810',
  navy: '#050D1F', // used for solid areas like StatusBar
  
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
  errorFaint: 'rgba(239,68,68,0.12)',
  errorText: '#F87171',
  
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
  textPrimary: '#050D1F', // dark navy
  textSecondary: '#64748B', // slate
  textDim: '#94A3B8',
  
  // Accents
  borderFaint: 'rgba(0,0,0,0.05)',
  logoRoof: '#050D1F', // navy roof in light mode
  
  // Semantic
  successFaint: '#DCFCE7',
  errorFaint: '#FEE2E2',
  errorText: '#EF4444',
  
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
    isDark: themeType === 'dark',
  };
}
