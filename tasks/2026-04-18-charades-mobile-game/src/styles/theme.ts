import { StyleSheet } from 'react-native';

export const COLORS = {
  bg: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceHigh: '#252548',
  border: 'rgba(255,255,255,0.08)',
  primary: '#6C3483',
  primaryLight: '#9B59B6',
  accent: '#F1C40F',
  success: '#27AE60',
  danger: '#E74C3C',
  warning: '#F39C12',
  text: '#FFFFFF',
  textSub: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.38)',
} as const;

export const BUTTON_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 } as const,
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8,
};

export const shared = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 12,
  },
  screenBg: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  scrollPad: {
    padding: 24,
    paddingBottom: 48,
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
});
