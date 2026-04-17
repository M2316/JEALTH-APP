import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { GlassSurface } from '@/components/glass-surface';
import { DarkTheme, Fonts } from '@/constants/theme';

export interface KpiCardProps {
  label: string;
  value: string;
  unit: string;
}

export function KpiCard({ label, value, unit }: KpiCardProps) {
  return (
    <GlassSurface bordered borderRadius={16} style={styles.card}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.value} selectable numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.unit} numberOfLines={1}>
        {unit}
      </Text>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    gap: 8,
    minHeight: 112,
    borderCurve: 'continuous',
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: DarkTheme.textTertiary,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: Fonts.sans,
    fontSize: 40,
    fontWeight: '900',
    color: DarkTheme.accentCyan,
    lineHeight: 42,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.textSecondary,
    lineHeight: 16,
  },
});
