import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Pressable,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchRoutinesByDate } from '@/lib/workout-api';
import type { WorkoutRoutine } from '@/types/workout';
import { DarkTheme } from '@/constants/theme';
import { haptic } from '@/lib/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCopy: (routineId: string) => void;
}

interface DateRoutine {
  date: string;
  routines: WorkoutRoutine[];
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()} (${dow})`;
}

function summarizeRoutine(routine: WorkoutRoutine): string {
  const exercises = routine.exercises;
  if (exercises.length === 0) return '운동 없음';
  const totalSets = exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const first = exercises[0].exercise.name;
  if (exercises.length === 1) return `${first}, ${totalSets}세트`;
  return `${first} 외 ${exercises.length - 1}종목, ${totalSets}세트`;
}

export function CopyRoutineModal({ visible, onClose, onCopy }: Props) {
  const [dateRoutines, setDateRoutines] = useState<DateRoutine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);

    const loadRecent = async () => {
      const results: DateRoutine[] = [];
      const today = new Date();
      for (let i = 0; i <= 14; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        try {
          const routines = await fetchRoutinesByDate(dateStr);
          if (routines.length > 0) {
            results.push({ date: dateStr, routines });
          }
        } catch {
          // skip
        }
        if (results.length >= 7) break;
      }
      setDateRoutines(results);
      setLoading(false);
    };

    loadRecent();
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>이전 루틴 복사</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={DarkTheme.accentCyan} />
          </View>
        ) : (
          <FlatList
            data={dateRoutines}
            keyExtractor={(item) => item.date}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View>
                <Text style={styles.dateLabel}>
                  {formatDateLabel(item.date)}
                </Text>
                {item.routines.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => { haptic.light(); r.id && onCopy(r.id); }}
                    style={styles.routineItem}>
                    <Text style={styles.routineSummary}>
                      {summarizeRoutine(r)}
                    </Text>
                    <Text style={styles.arrow}>›</Text>
                  </Pressable>
                ))}
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>
                  최근 기록이 없습니다
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: DarkTheme.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: DarkTheme.textSecondary,
    fontSize: 20,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  dateLabel: {
    color: DarkTheme.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  routineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DarkTheme.bgSurface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DarkTheme.bgBorder,
  },
  routineSummary: {
    color: DarkTheme.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  arrow: {
    color: DarkTheme.textTertiary,
    fontSize: 20,
    marginLeft: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: DarkTheme.textTertiary,
    fontSize: 14,
  },
});
