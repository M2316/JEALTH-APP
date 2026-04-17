import React from 'react';
import { StyleSheet, View } from 'react-native';

import { KpiCard } from './kpi-card';

import { formatK, type DailyMetrics } from '@/lib/dashboard-metrics';

export interface KpiRowProps {
  metrics: DailyMetrics | null;
}

const EMPTY = '—';

export function KpiRow({ metrics }: KpiRowProps) {
  const hasData = metrics !== null && metrics.setCount > 0;

  const timeValue = hasData ? String(metrics!.estimatedMinutes) : EMPTY;
  const setsValue = hasData ? String(metrics!.setCount) : EMPTY;
  const volumeValue = hasData ? formatK(metrics!.volumeKg) : EMPTY;

  return (
    <View style={styles.row}>
      <KpiCard label="Time" value={timeValue} unit="MIN" />
      <KpiCard label="Sets" value={setsValue} unit="TOTAL" />
      <KpiCard label="Volume" value={volumeValue} unit="KG" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
});
