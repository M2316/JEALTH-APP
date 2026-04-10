import React from 'react';
import { View, Pressable, StyleSheet, Text, ScrollView } from 'react-native';

import { GlassSurface } from '../glass-surface';
import { MuscleGroupBadge } from './muscle-group-badge';
import { WorkoutSetRow } from './workout-set-row';

import { DarkTheme } from '@/constants/theme';
import { haptic } from '@/lib/haptics';
import type { WorkoutExercise, WeightUnit } from '@/types/workout';

interface Props {
  workoutExercise: WorkoutExercise;
  onUpdateSet: (
    exerciseOrder: number,
    setIndex: number,
    field: 'reps' | 'weight' | 'weightUnit',
    value: number | WeightUnit,
  ) => void;
  onDeleteSet: (exerciseOrder: number, setIndex: number) => void;
  onAddSet: (exerciseOrder: number) => void;
  onDeleteExercise: (exerciseOrder: number) => void;
}

export function WorkoutExerciseCard({
  workoutExercise,
  onUpdateSet,
  onDeleteSet,
  onAddSet,
  onDeleteExercise,
}: Props) {
  const { exercise, order, sets } = workoutExercise;

  return (
    <GlassSurface bordered style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          {exercise.muscleGroups.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.badges}>
              {exercise.muscleGroups.map((mg) => (
                <View key={mg.id} style={{ marginRight: 4 }}>
                  <MuscleGroupBadge muscleGroup={mg} size="sm" />
                </View>
              ))}
            </ScrollView>
          )}
        </View>
        <Pressable
          onPress={() => { haptic.warning(); onDeleteExercise(order); }}
          style={styles.deleteBtn}
          hitSlop={8}>
          <Text style={styles.deleteIcon}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.sets}>
        {sets.map((s, i) => (
          <WorkoutSetRow
            key={s.id ?? `set-${i}`}
            set={s}
            roundNumber={s.round}
            onUpdate={(field, value) => onUpdateSet(order, i, field, value)}
            onDelete={() => onDeleteSet(order, i)}
          />
        ))}
      </View>

      <Pressable
        onPress={() => { haptic.medium(); onAddSet(order); }}
        style={styles.addSetBtn}
        hitSlop={4}>
        <Text style={styles.addSetText}>+ 세트 추가</Text>
      </Pressable>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    color: DarkTheme.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  badges: {
    marginTop: 4,
  },
  deleteBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -12,
    marginRight: -12,
  },
  deleteIcon: {
    color: DarkTheme.textTertiary,
    fontSize: 16,
  },
  sets: {
    marginBottom: 8,
  },
  addSetBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  addSetText: {
    color: DarkTheme.accentCyan,
    fontSize: 14,
    fontWeight: '600',
  },
});
