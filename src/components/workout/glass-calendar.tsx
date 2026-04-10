import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { GlassSurface } from '../glass-surface';

import { DarkTheme } from '@/constants/theme';
import { haptic } from '@/lib/haptics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GlassCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  visible: boolean;
  onClose: () => void;
  workoutDates?: string[];
  onMonthChange?: (year: number, month: number) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const PADDING_H = 16;
const MONTHS = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
];

// ---------------------------------------------------------------------------
// Pure date helpers
// ---------------------------------------------------------------------------

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toDateString(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function getTodayString(): string {
  const now = new Date();
  return toDateString(now.getFullYear(), now.getMonth(), now.getDate());
}

interface CalendarCell {
  year: number;
  month: number;
  day: number;
  isCurrentMonth: boolean;
}

function buildCalendarCells(year: number, month: number): CalendarCell[] {
  const cells: CalendarCell[] = [];
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrev = getDaysInMonth(prevYear, prevMonth);

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ year: prevYear, month: prevMonth, day: daysInPrev - i, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ year, month, day: d, isCurrentMonth: true });
  }
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ year: nextYear, month: nextMonth, day: nextDay++, isCurrentMonth: false });
  }
  return cells;
}

// ---------------------------------------------------------------------------
// Year/Month Picker Modal
// ---------------------------------------------------------------------------

function YearMonthPicker({
  visible,
  year,
  month,
  onSelect,
  onClose,
}: {
  visible: boolean;
  year: number;
  month: number;
  onSelect: (y: number, m: number) => void;
  onClose: () => void;
}) {
  const [pickerYear, setPickerYear] = useState(year);

  useEffect(() => {
    if (visible) setPickerYear(year);
  }, [visible, year]);

  const years = Array.from({ length: 11 }, (_, i) => pickerYear - 5 + i);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={pickerStyles.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}} style={pickerStyles.card}>
          <GlassSurface variant="elevated" bordered borderRadius={16} style={pickerStyles.surface}>
            {/* Year selector */}
            <View style={pickerStyles.yearRow}>
              <Pressable onPress={() => { haptic.light(); setPickerYear((y) => y - 1); }} hitSlop={8}>
                <Text style={pickerStyles.yearChevron}>{'‹'}</Text>
              </Pressable>
              <Text style={pickerStyles.yearText}>{pickerYear}년</Text>
              <Pressable onPress={() => { haptic.light(); setPickerYear((y) => y + 1); }} hitSlop={8}>
                <Text style={pickerStyles.yearChevron}>{'›'}</Text>
              </Pressable>
            </View>

            {/* Month grid */}
            <View style={pickerStyles.monthGrid}>
              {MONTHS.map((label, i) => {
                const isSelected = pickerYear === year && i === month;
                return (
                  <Pressable
                    key={i}
                    onPress={() => {
                      haptic.selection();
                      onSelect(pickerYear, i);
                    }}
                    style={[
                      pickerStyles.monthCell,
                      isSelected && { backgroundColor: DarkTheme.accentCyan },
                    ]}>
                    <Text
                      style={[
                        pickerStyles.monthText,
                        isSelected && { color: DarkTheme.bgPrimary },
                      ]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassSurface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DarkTheme.bgPrimary,
  },
  card: {
    width: 280,
  },
  surface: {
    padding: 20,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  yearChevron: {
    color: DarkTheme.textPrimary,
    fontSize: 24,
    fontWeight: '300',
    paddingHorizontal: 8,
  },
  yearText: {
    color: DarkTheme.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthCell: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  monthText: {
    color: DarkTheme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GlassCalendar({
  selectedDate,
  onSelectDate,
  visible,
  onClose,
  workoutDates = [],
  onMonthChange,
}: GlassCalendarProps) {
  const parsedDate = new Date(selectedDate + 'T00:00:00');
  const [viewYear, setViewYear] = useState(parsedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedDate.getMonth());
  const [cellSize, setCellSize] = useState(0);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      const d = new Date(selectedDate + 'T00:00:00');
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [visible, selectedDate]);

  // Animation
  const progress = useSharedValue(visible ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: 200 });
  }, [visible, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [-10, 0]) }],
  }));

  // Month navigation
  const navigateMonth = useCallback(
    (dir: -1 | 1) => {
      const newMonth = dir === -1
        ? (viewMonth === 0 ? 11 : viewMonth - 1)
        : (viewMonth === 11 ? 0 : viewMonth + 1);
      const newYear = dir === -1
        ? (viewMonth === 0 ? viewYear - 1 : viewYear)
        : (viewMonth === 11 ? viewYear + 1 : viewYear);
      setViewYear(newYear);
      setViewMonth(newMonth);
      onMonthChange?.(newYear, newMonth);
    },
    [viewYear, viewMonth, onMonthChange],
  );

  // Swipe gesture for month navigation
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      'worklet';
      if (e.translationX > 60) {
        runOnJS(haptic.light)();
        runOnJS(navigateMonth)(-1);
      } else if (e.translationX < -60) {
        runOnJS(haptic.light)();
        runOnJS(navigateMonth)(1);
      }
    });

  const cells = buildCalendarCells(viewYear, viewMonth);
  const todayStr = getTodayString();

  const handleDayPress = (cell: CalendarCell) => {
    haptic.selection();
    onSelectDate(toDateString(cell.year, cell.month, cell.day));
    onClose();
  };

  const handleYearMonthSelect = (y: number, m: number) => {
    setYearPickerVisible(false);
    setViewYear(y);
    setViewMonth(m);
    onMonthChange?.(y, m);
  };

  return (
    <>
      <Animated.View style={animatedStyle}>
        <GestureDetector gesture={swipeGesture}>
          <GlassSurface
            bordered
            borderRadius={16}
            style={styles.container}
            onLayout={(e) => {
              setCellSize((e.nativeEvent.layout.width - PADDING_H * 2) / 7);
            }}>
            {/* Month/year header */}
            <View style={styles.header}>
              <Pressable onPress={() => { haptic.light(); navigateMonth(-1); }} style={styles.chevron} hitSlop={8}>
                <Text style={styles.chevronText}>{'‹'}</Text>
              </Pressable>
              <Pressable onPress={() => { haptic.light(); setYearPickerVisible(true); }}>
                <Text style={styles.headerTitle}>
                  {viewYear}년 {viewMonth + 1}월
                </Text>
              </Pressable>
              <Pressable onPress={() => { haptic.light(); navigateMonth(1); }} style={styles.chevron} hitSlop={8}>
                <Text style={styles.chevronText}>{'›'}</Text>
              </Pressable>
            </View>

            {/* Day-of-week row */}
            <View style={styles.weekRow}>
              {DAY_NAMES.map((name) => (
                <View key={name} style={[styles.weekCell, { width: cellSize }]}>
                  <Text style={styles.weekText}>{name}</Text>
                </View>
              ))}
            </View>

            {/* Day grid */}
            <View style={styles.grid}>
              {cells.map((cell, idx) => {
                const dateStr = toDateString(cell.year, cell.month, cell.day);
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === todayStr && !isSelected;
                const hasWorkout = cell.isCurrentMonth && workoutDates.includes(dateStr);

                return (
                  <Pressable
                    key={idx}
                    onPress={() => handleDayPress(cell)}
                    style={[
                      styles.dayCell,
                      { width: cellSize, height: cellSize, borderRadius: cellSize / 2 },
                      isSelected && { backgroundColor: DarkTheme.accentCyan },
                      isToday && { borderWidth: 1, borderColor: DarkTheme.accentCyan },
                    ]}>
                    <Text
                      style={[
                        styles.dayText,
                        !cell.isCurrentMonth && { color: DarkTheme.textTertiary },
                        isSelected && { color: DarkTheme.bgPrimary },
                      ]}>
                      {cell.day}
                    </Text>
                    {hasWorkout && (
                      <View
                        style={[
                          styles.dot,
                          isSelected && { backgroundColor: DarkTheme.bgPrimary },
                        ]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </GlassSurface>
        </GestureDetector>
      </Animated.View>

      <YearMonthPicker
        visible={yearPickerVisible}
        year={viewYear}
        month={viewMonth}
        onSelect={handleYearMonthSelect}
        onClose={() => setYearPickerVisible(false)}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: PADDING_H,
    paddingTop: 12,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chevron: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronText: {
    color: DarkTheme.textPrimary,
    fontSize: 24,
    fontWeight: '300',
  },
  headerTitle: {
    color: DarkTheme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  weekText: {
    color: DarkTheme.textTertiary,
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    color: DarkTheme.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  dot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: DarkTheme.accentCyan,
  },
});
