import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DarkTheme, Fonts } from '@/constants/theme';
import { haptic } from '@/lib/haptics';

export interface QuickActionsProps {
  hasRoutine: boolean;
}

export function QuickActions({ hasRoutine }: QuickActionsProps) {
  const router = useRouter();

  const primaryLabel = hasRoutine ? "Continue Today's Workout" : "Start Today's Workout";

  const onPrimary = () => {
    haptic.medium();
    router.push('/(tabs)/record');
  };

  const onSecondary = () => {
    haptic.light();
    router.push('/(tabs)/record?copyOnOpen=1');
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPrimary}
        style={({ pressed }) => [
          styles.primary,
          pressed && { backgroundColor: DarkTheme.accentCyanDim, transform: [{ scale: 0.97 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
      >
        <Text style={styles.primaryText}>{primaryLabel}</Text>
      </Pressable>

      <Pressable
        onPress={onSecondary}
        style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.8 }]}
        accessibilityRole="button"
        accessibilityLabel="Copy Recent Routine"
      >
        <Text style={styles.secondaryText}>Copy Recent Routine</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  primary: {
    backgroundColor: DarkTheme.accentCyan,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
  primaryText: {
    color: DarkTheme.bgPrimary,
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  secondary: {
    backgroundColor: DarkTheme.bgElevated,
    borderWidth: 1,
    borderColor: DarkTheme.bgBorder,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
  secondaryText: {
    color: DarkTheme.textSecondary,
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '600',
  },
});
