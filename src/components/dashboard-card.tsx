import React from 'react';
import { StyleSheet, View } from 'react-native';

import { GlassSurface } from './glass-surface';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';

interface DashboardCardProps {
  title: string;
  value: string;
  unit?: string;
  children?: React.ReactNode;
}

export function DashboardCard({ title, value, unit, children }: DashboardCardProps) {
  return (
    <GlassSurface bordered style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary">
        {title}
      </ThemedText>
      <View style={styles.valueRow}>
        <ThemedText type="subtitle">{value}</ThemedText>
        {unit && (
          <ThemedText type="small" themeColor="textSecondary">
            {' '}{unit}
          </ThemedText>
        )}
      </View>
      {children && <View style={styles.chartArea}>{children}</View>}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  chartArea: {
    marginTop: Spacing.two,
    height: 80,
  },
});
