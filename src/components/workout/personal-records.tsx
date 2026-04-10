import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

import { DarkTheme } from '@/constants/theme';
import type { PersonalRecord } from '@/types/workout';

interface Props {
  records: PersonalRecord[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

export function PersonalRecords({ records }: Props) {
  return (
    <View>
      <Text style={styles.header}>개인 기록</Text>
      {records.length === 0 ? (
        <Text style={styles.emptyText}>기록이 없습니다</Text>
      ) : (
        <FlatList
          data={records}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${item.name}-${item.date}-${index}`}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <View style={styles.weightRow}>
                <Text style={styles.weightValue}>{item.maxWeight}</Text>
                <Text style={styles.weightUnit}>kg</Text>
              </View>
              <Text style={styles.date}>{formatDate(item.date)}</Text>
            </View>
          )}
        />
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
  list: {
    paddingRight: 20,
  },
  card: {
    backgroundColor: DarkTheme.bgSurface,
    borderRadius: 16,
    padding: 16,
    width: 160,
  },
  exerciseName: {
    color: DarkTheme.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  weightValue: {
    color: DarkTheme.accentCyan,
    fontSize: 36,
    fontWeight: '900',
  },
  weightUnit: {
    color: DarkTheme.textTertiary,
    fontSize: 14,
  },
  date: {
    color: DarkTheme.textTertiary,
    fontSize: 11,
    marginTop: 8,
  },
  emptyText: {
    color: DarkTheme.textTertiary,
    fontSize: 14,
  },
});
