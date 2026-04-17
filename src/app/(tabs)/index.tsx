import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeroSection } from '@/components/dashboard/hero-section';
import { KpiRow } from '@/components/dashboard/kpi-row';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { WeeklyVolumeCard } from '@/components/dashboard/weekly-volume-card';
import { GradientBackground } from '@/components/gradient-background';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { addDays, todayString } from '@/lib/date';
import { computeDailyMetrics } from '@/lib/dashboard-metrics';
import { fetchVolume } from '@/lib/stats-api';
import { fetchRoutinesByDate } from '@/lib/workout-api';
import { useStatsStore } from '@/stores/stats-store';
import type { VolumeData, WorkoutRoutine } from '@/types/workout';

export default function HomeScreen() {
  const { volumeData, loadStats, isLoading } = useStatsStore();
  const [todayRoutines, setTodayRoutines] = useState<WorkoutRoutine[]>([]);
  const [lastWeek, setLastWeek] = useState<VolumeData[]>([]);

  useFocusEffect(
    useCallback(() => {
      const today = todayString();
      fetchRoutinesByDate(today)
        .then(setTodayRoutines)
        .catch(() => setTodayRoutines([]));
      loadStats();
      const lwEnd = addDays(today, -7);
      const lwStart = addDays(today, -13);
      fetchVolume(lwStart, lwEnd)
        .then(setLastWeek)
        .catch(() => setLastWeek([]));
    }, [loadStats]),
  );

  const metrics = useMemo(() => computeDailyMetrics(todayRoutines), [todayRoutines]);
  const hasRoutine = todayRoutines.some((r) => r.exercises.length > 0);

  return (
    <GradientBackground>
      <ScrollView
        style={{ backgroundColor: 'transparent' }}
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.content}>
            <HeroSection hasRoutine={hasRoutine} />
            <KpiRow metrics={hasRoutine ? metrics : null} />
            <WeeklyVolumeCard thisWeek={volumeData} lastWeek={lastWeek} isLoading={isLoading} />
            <QuickActions hasRoutine={hasRoutine} />
          </View>
        </SafeAreaView>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
  },
  safe: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
});
