import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import React from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { DarkTheme, Spacing } from '@/constants/theme';

export interface GlassSurfaceProps extends ViewProps {
  variant?: 'surface' | 'elevated';
  bordered?: boolean;
  borderRadius?: number;
  tintColor?: string;
}

const useNativeGlass = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

export function GlassSurface({
  variant = 'surface',
  bordered = false,
  borderRadius = Spacing.three,
  tintColor,
  style,
  children,
  ...rest
}: GlassSurfaceProps) {
  const bg = variant === 'elevated' ? DarkTheme.glassElevated : DarkTheme.glassBg;
  const border = bordered
    ? { borderWidth: 1, borderColor: DarkTheme.glassBorder }
    : undefined;

  if (useNativeGlass) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme="dark"
        tintColor={tintColor}
        style={[{ borderRadius, overflow: 'hidden' }, border, style]}
        {...rest}>
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        { backgroundColor: bg, borderRadius, overflow: 'hidden' },
        border,
        styles.shadow,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
});
