import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { DarkTheme, Spacing } from '@/constants/theme';

export interface GlassSurfaceProps extends ViewProps {
  variant?: 'surface' | 'elevated';
  bordered?: boolean;
  borderRadius?: number;
  tintColor?: string;
  liquid?: boolean;
}

const useNativeGlass = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

export function GlassSurface({
  variant = 'surface',
  bordered = false,
  borderRadius = Spacing.three,
  tintColor,
  liquid = false,
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
        tintColor={tintColor ?? (liquid ? DarkTheme.bgElevated : undefined)}
        style={[{ borderRadius, overflow: 'hidden' }, border, style]}
        {...rest}>
        {liquid && (
          <>
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(255,255,255,0.12)', 'rgba(0,0,0,0.15)']}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.innerStroke, { borderRadius }]} />
          </>
        )}
        {children}
      </GlassView>
    );
  }

  const solidBg = liquid ? DarkTheme.bgElevated : bg;

  return (
    <View
      style={[
        { backgroundColor: solidBg, borderRadius, overflow: 'hidden' },
        border,
        styles.shadow,
        style,
      ]}
      {...rest}>
      {liquid && (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.12)', 'rgba(0,0,0,0.15)']}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.innerStroke, { borderRadius }]} />
        </>
      )}
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
      android: { elevation: 4 },
      default: {},
    }),
  },
  innerStroke: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
});
