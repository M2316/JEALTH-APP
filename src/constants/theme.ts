import '@/global.css';

import { Platform } from 'react-native';

/** 통합 다크 글래스모피즘 테마 */
export const DarkTheme = {
  // Backgrounds
  bgPrimary: '#07111E',
  bgSurface: '#0E1E2F',
  bgElevated: '#142438',
  bgBorder: '#1E3448',

  // Glass surfaces
  glassBg: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  glassElevated: 'rgba(255, 255, 255, 0.08)',
  glassHighlight: 'rgba(255, 255, 255, 0.15)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#89A8C4',
  textTertiary: '#496680',

  // Accent
  accentCyan: '#00E5CC',
  accentCyanDim: '#00B8A4',
  accentCyanGlow: 'rgba(0, 229, 204, 0.15)',

  // Semantic
  statusDanger: '#FF4F6A',
  statusSuccess: '#34C759',
  statusWarning: '#FF9500',
  linkColor: '#3c87f7',
} as const;

export type DarkThemeColor = keyof typeof DarkTheme;

/** 레거시 키 호환 (ThemedView, ThemedText의 keyMap에서 사용) */
export type ThemeColor = 'text' | 'background' | 'backgroundElement' | 'backgroundSelected' | 'textSecondary';

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
