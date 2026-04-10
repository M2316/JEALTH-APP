import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Period } from '@/stores/stats-store';
import { DarkTheme } from '@/constants/theme';

const SEGMENTS: { key: Period; label: string }[] = [
  { key: 'week', label: '주간' },
  { key: 'month', label: '월간' },
  { key: 'year', label: '연간' },
];

interface Props {
  period: Period;
  onChangePeriod: (p: Period) => void;
}

export function PeriodSelector({ period, onChangePeriod }: Props) {
  return (
    <View style={styles.container}>
      {SEGMENTS.map((seg) => {
        const selected = seg.key === period;
        return (
          <Pressable
            key={seg.key}
            style={[styles.segment, selected && styles.segmentSelected]}
            onPress={() => onChangePeriod(seg.key)}
          >
            <Text
              style={[styles.label, selected && styles.labelSelected]}
            >
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: DarkTheme.bgSurface,
    borderRadius: 9999,
    padding: 2,
  },
  segment: {
    flex: 1,
    height: 36,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: DarkTheme.accentCyan,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: DarkTheme.textSecondary,
  },
  labelSelected: {
    color: DarkTheme.bgPrimary,
    fontWeight: '700',
  },
});
