import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { GlassSurface } from '@/components/glass-surface';
import { MiniChart } from '@/components/mini-chart';
import { DarkTheme, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  computeWeeklyTotal,
  computeWeekOverWeek,
  formatK,
} from '@/lib/dashboard-metrics';
import type { VolumeData } from '@/types/workout';

export interface WeeklyVolumeCardProps {
  thisWeek: VolumeData[];
  lastWeek: VolumeData[];
  isLoading?: boolean;
}

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const CARD_PADDING = 20;
const EMPTY = '—';

function todayWeekdayIndex(): number {
  const js = new Date().getDay();
  return (js + 6) % 7;
}

export function WeeklyVolumeCard({ thisWeek, lastWeek, isLoading = false }: WeeklyVolumeCardProps) {
  const { width } = useWindowDimensions();
  const screenPadding = Spacing.four;
  const maxWidth = Math.min(width, MaxContentWidth);
  const chartWidth = Math.max(0, maxWidth - screenPadding * 2 - CARD_PADDING * 2);

  const total = computeWeeklyTotal(thisWeek);
  const delta = computeWeekOverWeek(thisWeek, lastWeek);
  const hasAny = thisWeek.length > 0;
  const values = hasAny ? thisWeek.map((d) => Number(d.volume) || 0) : [0, 0, 0, 0, 0, 0, 0];

  const deltaLabel = !hasAny || lastWeek.length === 0 ? EMPTY : `${delta > 0 ? '↑' : delta < 0 ? '↓' : ''} ${Math.abs(delta)}%`;
  const deltaStyle =
    !hasAny || lastWeek.length === 0
      ? styles.deltaNeutral
      : delta > 0
      ? styles.deltaPositive
      : delta < 0
      ? styles.deltaNegative
      : styles.deltaNeutral;
  const deltaColor =
    !hasAny || lastWeek.length === 0
      ? DarkTheme.textTertiary
      : delta > 0
      ? DarkTheme.statusSuccess
      : delta < 0
      ? DarkTheme.statusDanger
      : DarkTheme.textTertiary;

  const todayIdx = todayWeekdayIndex();

  return (
    <GlassSurface bordered borderRadius={20} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.label}>This Week</Text>
          <Text style={styles.value} selectable>
            {hasAny ? formatK(total) : EMPTY}
          </Text>
          <Text style={styles.unit}>KG</Text>
        </View>
        <View style={[styles.delta, deltaStyle]}>
          <Text style={[styles.deltaText, { color: deltaColor }]}>{deltaLabel}</Text>
        </View>
      </View>

      <View style={[styles.chart, isLoading && styles.chartLoading]}>
        <MiniChart data={values} color={DarkTheme.accentCyan} width={chartWidth} />
      </View>

      <View style={styles.days}>
        {DAY_LABELS.map((d, i) => (
          <Text
            key={d}
            style={[
              styles.day,
              { color: i === todayIdx ? DarkTheme.accentCyan : DarkTheme.textTertiary },
            ]}
          >
            {d}
          </Text>
        ))}
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: CARD_PADDING,
    borderCurve: 'continuous',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    gap: 4,
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
    fontSize: 32,
    fontWeight: '900',
    color: DarkTheme.textPrimary,
    lineHeight: 36,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.textSecondary,
  },
  delta: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderCurve: 'continuous',
  },
  deltaPositive: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
  },
  deltaNegative: {
    backgroundColor: 'rgba(255, 79, 106, 0.12)',
  },
  deltaNeutral: {
    backgroundColor: DarkTheme.bgElevated,
  },
  deltaText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  chart: {
    marginTop: 20,
    height: 112,
    justifyContent: 'center',
  },
  chartLoading: {
    opacity: 0.4,
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  day: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
