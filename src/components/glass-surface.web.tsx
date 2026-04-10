import React from 'react';
import { View, type ViewProps } from 'react-native';

import { DarkTheme, Spacing } from '@/constants/theme';

export interface GlassSurfaceProps extends ViewProps {
  variant?: 'surface' | 'elevated';
  bordered?: boolean;
  borderRadius?: number;
  tintColor?: string;
}

export function GlassSurface({
  variant = 'surface',
  bordered = false,
  borderRadius = Spacing.three,
  style,
  children,
  ...rest
}: GlassSurfaceProps) {
  const bg = variant === 'elevated' ? DarkTheme.glassElevated : DarkTheme.glassBg;
  const border = bordered
    ? { borderWidth: 1, borderColor: DarkTheme.glassBorder }
    : undefined;

  const glassStyle = {
    backgroundColor: bg,
    borderRadius,
    overflow: 'hidden',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  } as any;

  return (
    <View
      style={[glassStyle, border, style]}
      {...rest}>
      {children}
    </View>
  );
}
