import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';

import { DarkTheme } from '@/constants/theme';
import { haptic } from '@/lib/haptics';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

interface Props {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  onCalendarToggle?: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dow = DAY_NAMES[d.getDay()];
  return `${y}년 ${m}월 ${day}일 (${dow})`;
}

function isToday(dateStr: string): boolean {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return dateStr === today;
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function DateSelector({ selectedDate, onDateChange, onCalendarToggle }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => { haptic.light(); onDateChange(addDays(selectedDate, -1)); }}
        style={styles.chevron}
        hitSlop={8}>
        <Text style={styles.chevronText}>{'‹'}</Text>
      </Pressable>

      <Pressable onPress={() => { haptic.light(); onCalendarToggle?.(); }} style={styles.center}>
        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        {isToday(selectedDate) && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayText}>오늘</Text>
          </View>
        )}
      </Pressable>

      <Pressable
        onPress={() => { haptic.light(); onDateChange(addDays(selectedDate, 1)); }}
        style={styles.chevron}
        hitSlop={8}>
        <Text style={styles.chevronText}>{'›'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 4,
    zIndex: 100,
  },
  chevron: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronText: {
    color: DarkTheme.textPrimary,
    fontSize: 28,
    fontWeight: '300',
  },
  center: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    color: DarkTheme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  todayBadge: {
    backgroundColor: DarkTheme.accentCyanGlow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  todayText: {
    color: DarkTheme.accentCyan,
    fontSize: 11,
    fontWeight: '700',
  },
});
