export const COLORS = {
  primary: '#064E3B', // Deep Emerald
  primaryLight: '#D1FAE5', // Light Mint
  secondary: '#10B981', // Emerald
  accent: '#F59E0B', // Amber
  background: '#F9FAFB', // Cool Gray 50
  surface: '#FFFFFF',
  text: '#111827', // Gray 900
  textLight: '#6B7280', // Gray 500
  border: '#E5E7EB', // Gray 200
  error: '#EF4444', // Red 500
  success: '#10B981', // Emerald 500
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  glass: 'rgba(255, 255, 255, 0.7)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const SHADOWS = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    color: COLORS.textLight,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
};
