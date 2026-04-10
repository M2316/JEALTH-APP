import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/gradient-background';
import { PeriodSelector } from '@/components/workout/period-selector';
import { VolumeChart } from '@/components/workout/volume-chart';
import { PersonalRecords } from '@/components/workout/personal-records';
import { MuscleBreakdown } from '@/components/workout/muscle-breakdown';
import { DarkTheme } from '@/constants/theme';
import { useStatsStore } from '@/stores/stats-store';

export default function StatsScreen() {
  const {
    period,
    setPeriod,
    volumeData,
    personalRecords,
    muscleBreakdown,
    isLoading,
    loadStats,
  } = useStatsStore();

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(() => {
    loadStats();
  }, [loadStats]);

  if (isLoading && volumeData.length === 0) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DarkTheme.accentCyan} />
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor={DarkTheme.accentCyan}
            />
          }
        >
          <Text style={styles.title}>통계</Text>

          <View style={styles.sectionPeriod}>
            <PeriodSelector period={period} onChangePeriod={setPeriod} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>총 볼륨</Text>
            <VolumeChart data={volumeData} />
          </View>

          <View style={styles.section}>
            <PersonalRecords records={personalRecords} />
          </View>

          <View style={styles.section}>
            <MuscleBreakdown data={muscleBreakdown} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  title: {
    color: DarkTheme.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  sectionPeriod: {
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    color: DarkTheme.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
});
