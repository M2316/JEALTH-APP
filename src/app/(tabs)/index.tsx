import React from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DashboardCard } from '@/components/dashboard-card';
import { GradientBackground } from '@/components/gradient-background';
import { MiniChart } from '@/components/mini-chart';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, DarkTheme, MaxContentWidth, Spacing } from '@/constants/theme';

const DUMMY = {
  exerciseMinutes: [30, 45, 20, 60, 35, 50, 40],
  caloriesBurned: [200, 320, 150, 420, 280, 350, 310],
  weight: [72.5, 72.3, 72.4, 72.1, 72.0, 71.8, 71.9],
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - Spacing.four * 2 - Spacing.three * 2, MaxContentWidth - Spacing.three * 2);

  return (
    <GradientBackground>
      <ScrollView
        style={{ backgroundColor: 'transparent' }}
        contentContainerStyle={styles.scroll}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="title">오늘의 건강</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              최근 7일간의 기록입니다
            </ThemedText>
          </View>

          <View style={styles.cards}>
            <DashboardCard title="운동 시간" value="40" unit="분">
              <MiniChart data={DUMMY.exerciseMinutes} color={DarkTheme.statusSuccess} width={chartWidth} />
            </DashboardCard>

            <DashboardCard title="칼로리 소모" value="310" unit="kcal">
              <MiniChart data={DUMMY.caloriesBurned} color={DarkTheme.statusWarning} width={chartWidth} />
            </DashboardCard>

            <DashboardCard title="체중" value="71.9" unit="kg">
              <MiniChart data={DUMMY.weight} color={DarkTheme.accentCyan} width={chartWidth} />
            </DashboardCard>
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
  safeArea: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  header: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.one,
  },
  cards: {
    gap: Spacing.three,
  },
});
