import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DarkTheme, Fonts } from '@/constants/theme';

export interface HeroSectionProps {
  hasRoutine: boolean;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export function HeroSection({ hasRoutine }: HeroSectionProps) {
  const badgeActive = hasRoutine;
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.greet}>{greeting()}</Text>
        <Text style={styles.title}>Today&apos;s Session</Text>
      </View>
      <View style={[styles.badge, badgeActive ? styles.badgeActive : styles.badgeIdle]}>
        {badgeActive && <View style={styles.dot} />}
        <Text style={[styles.badgeText, { color: badgeActive ? DarkTheme.accentCyan : DarkTheme.textTertiary }]}>
          {badgeActive ? 'Recording' : 'Ready'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
  },
  left: {
    gap: 4,
    flexShrink: 1,
  },
  greet: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: DarkTheme.textTertiary,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Fonts.sans,
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.textPrimary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  badgeActive: {
    backgroundColor: 'rgba(0, 229, 204, 0.12)',
  },
  badgeIdle: {
    backgroundColor: DarkTheme.bgElevated,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DarkTheme.accentCyan,
  },
  badgeText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
