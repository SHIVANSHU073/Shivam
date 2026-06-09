// ClutchArena theme tokens
export const colors = {
  bg: '#05050A',
  surface: '#0F0F1A',
  surfaceElevated: '#1A1A2E',
  primary: '#00E5FF',
  primaryGlow: 'rgba(0, 229, 255, 0.4)',
  secondary: '#9D00FF',
  secondaryGlow: 'rgba(157, 0, 255, 0.4)',
  success: '#00FF66',
  danger: '#FF0055',
  warning: '#FFAA00',
  text: '#FFFFFF',
  textMuted: '#8B949E',
  borderSubtle: 'rgba(0, 229, 255, 0.15)',
  borderActive: 'rgba(0, 229, 255, 0.8)',
  cardGradient: ['#0F0F1A', '#1A1A2E'] as const,
  primaryGradient: ['#00E5FF', '#0099CC'] as const,
  secondaryGradient: ['#9D00FF', '#6600AA'] as const,
  dangerGradient: ['#FF0055', '#CC0044'] as const,
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radii = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };

export const shadow = {
  neon: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  purple: {
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '900' as const, letterSpacing: -0.5, color: colors.text },
  h2: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.3, color: colors.text },
  h3: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 14, color: colors.text },
  bodyMuted: { fontSize: 14, color: colors.textMuted },
  label: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 2, textTransform: 'uppercase' as const, color: colors.primary },
};
