import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { DarkTheme } from '@/constants/theme';
import type { MuscleBreakdownItem } from '@/types/workout';

interface Props {
  data: MuscleBreakdownItem[];
}

export function MuscleBreakdown({ data }: Props) {
  const maxCount = Math.max(...data.map((d) => d.setCount), 1);

  return (
    <View>
      <Text style={styles.header}>부위별 운동량</Text>
      {data.length === 0 ? (
        <Text style={styles.emptyText}>데이터가 없습니다</Text>
      ) : (
        <View style={styles.rows}>
          {data.map((item, index) => (
            <View key={`${item.muscleGroup}-${index}`} style={styles.row}>
              <Text style={styles.label}>{item.muscleGroup}</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      flex: item.setCount / maxCount,
                    },
                  ]}
                />
                <View style={{ flex: 1 - item.setCount / maxCount }} />
              </View>
              <Text style={styles.count}>{item.setCount}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    color: DarkTheme.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  rows: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: DarkTheme.textSecondary,
    fontSize: 13,
    width: 60,
  },
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 24,
  },
  bar: {
    backgroundColor: DarkTheme.accentCyan,
    borderRadius: 8,
    height: 24,
  },
  count: {
    color: DarkTheme.textSecondary,
    fontSize: 13,
    width: 30,
    textAlign: 'right',
  },
  emptyText: {
    color: DarkTheme.textTertiary,
    fontSize: 14,
  },
});
