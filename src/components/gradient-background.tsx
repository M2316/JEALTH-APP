import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { DarkTheme } from '@/constants/theme';

interface GradientBackgroundProps extends ViewProps {
  children: React.ReactNode;
}

export function GradientBackground({ children, style, ...rest }: GradientBackgroundProps) {
  return (
    <View style={[styles.container, style]} {...rest}>
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={DarkTheme.bgPrimary} />
            <Stop offset="0.4" stopColor="#0A1628" />
            <Stop offset="1" stopColor={DarkTheme.bgPrimary} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bg)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.bgPrimary,
  },
});
