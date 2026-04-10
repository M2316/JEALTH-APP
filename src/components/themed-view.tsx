import { View, type ViewProps } from 'react-native';

import { DarkTheme, type DarkThemeColor, type ThemeColor } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  type?: ThemeColor | DarkThemeColor;
};

const keyMap: Record<string, string> = {
  background: 'bgPrimary',
  backgroundElement: 'bgSurface',
  backgroundSelected: 'bgElevated',
  text: 'textPrimary',
  textSecondary: 'textSecondary',
};

export function ThemedView({ style, type, ...otherProps }: ThemedViewProps) {
  const resolved = type ? (keyMap[type] ?? type) : 'bgPrimary';
  const bg = DarkTheme[resolved as DarkThemeColor] ?? DarkTheme.bgPrimary;

  return <View style={[{ backgroundColor: bg }, style]} {...otherProps} />;
}
