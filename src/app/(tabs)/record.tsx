import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { GradientBackground } from '@/components/gradient-background';
import { GlassSurface } from '@/components/glass-surface';
import { DateSelector, addDays } from '@/components/workout/date-selector';
import { haptic } from '@/lib/haptics';
import { fetchRoutinesByRange } from '@/lib/workout-api';
import { GlassCalendar } from '@/components/workout/glass-calendar';
import { WorkoutExerciseCard } from '@/components/workout/workout-exercise-card';
import { ExercisePickerModal } from '@/components/workout/exercise-picker-modal';
import { CopyRoutineModal } from '@/components/workout/copy-routine-modal';
import { FABActionButton } from '@/components/workout/fab-action-button';
import { ChatBottomSheet } from '@/components/workout/chat/chat-bottom-sheet';
import { DarkTheme } from '@/constants/theme';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';
import { useToast } from '@/components/ui/toast';
import { useWorkoutStore } from '@/stores/workout-store';
import type {
  Exercise,
  WeightUnit,
  WorkoutExercise as WE,
  WorkoutSet as WS,
} from '@/types/workout';

export default function RecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ copyOnOpen?: string }>();
  const keyboardVisible = useKeyboardVisible();
  const toast = useToast();
  const {
    selectedDate,
    routines,
    isLoading,
    setDate,
    loadRoutines,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    copyFromRoutine,
    pendingExerciseToAdd,
    setPendingExerciseToAdd,
  } = useWorkoutStore();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [copyVisible, setCopyVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);

  const [localExercises, setLocalExercises] = useState<WE[]>([]);
  const [routineId, setRoutineId] = useState<string | undefined>();
  const [dirty, setDirty] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveToServerRef = useRef<() => void>(() => undefined);
  const latestExercisesRef = useRef<WE[]>([]);
  const [workoutDates, setWorkoutDates] = useState<string[]>([]);

  // Bottom bar keyboard hide animation
  const bottomBarProgress = useSharedValue(1);
  useEffect(() => {
    bottomBarProgress.value = withTiming(keyboardVisible ? 0 : 1, { duration: 200 });
  }, [keyboardVisible]);

  const bottomBarAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(bottomBarProgress.value, [0, 1], [200, 0]) }],
    opacity: bottomBarProgress.value,
  }));

  useEffect(() => {
    if (routines.length === 0) {
      setLocalExercises([]);
      setRoutineId(undefined);
      setDirty(false);
      return;
    }
    const incoming = routines[0];
    if (
      incoming.id === routineId &&
      JSON.stringify(incoming.exercises) ===
        JSON.stringify(latestExercisesRef.current)
    ) {
      return;
    }
    setLocalExercises(incoming.exercises);
    setRoutineId(incoming.id);
    setDirty(false);
  // routineId/latestExercisesRef intentionally omitted — only re-sync when store pushes new data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routines]);

  useEffect(() => {
    loadRoutines();
  }, [selectedDate, loadRoutines]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      saveToServerRef.current();
    }, 1500);
  }, []);

  const buildPayload = useCallback(
    (exercises: WE[]) => ({
      date: selectedDate,
      exercises: exercises.map((ex, ei) => ({
        exerciseId: ex.exercise.id,
        order: ei + 1,
        sets: ex.sets.map((s, si) => ({
          round: si + 1,
          reps: Number(s.reps) || 0,
          weight: Number(s.weight) || 0,
          weightUnit: s.weightUnit,
        })),
      })),
    }),
    [selectedDate],
  );

  const saveToServer = useCallback(async () => {
    if (!routineId) return;
    try {
      await updateRoutine(routineId, buildPayload(latestExercisesRef.current));
      if (!saveTimerRef.current) {
        setDirty(false);
      }
      toast({ message: '저장 완료', variant: 'success' });
    } catch (e) {
      console.warn('saveToServer failed:', e);
      toast({ message: '저장 실패', variant: 'error' });
    }
  }, [routineId, buildPayload, updateRoutine, toast]);

  useEffect(() => {
    saveToServerRef.current = saveToServer;
  }, [saveToServer]);

  useEffect(() => {
    latestExercisesRef.current = localExercises;
  }, [localExercises]);

  const handleDateChange = useCallback(
    (date: string) => {
      setCalendarVisible(false);
      setDate(date);
    },
    [setDate],
  );

  const loadWorkoutDates = useCallback(async (year: number, month: number) => {
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    try {
      const routines = await fetchRoutinesByRange(start, end);
      const dates = [...new Set(routines.map((r) => r.date))];
      setWorkoutDates(dates);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (calendarVisible) {
      const d = new Date(selectedDate + 'T00:00:00');
      loadWorkoutDates(d.getFullYear(), d.getMonth());
    }
  }, [calendarVisible, selectedDate, loadWorkoutDates]);

  const handleSelectExercise = useCallback(
    async (exercise: Exercise) => {
      setPickerVisible(false);
      const newExercise: WE = {
        exercise,
        order: localExercises.length + 1,
        sets: [{ round: 1, reps: 0, weight: 0, weightUnit: 'kg' }],
      };

      if (routineId) {
        const updated = [...localExercises, newExercise];
        try {
          await updateRoutine(routineId, buildPayload(updated));
          await loadRoutines();
        } catch (e: unknown) {
          toast({
            message: e instanceof Error ? e.message : '추가 실패',
            variant: 'error',
          });
        }
      } else {
        try {
          await addRoutine(buildPayload([newExercise]));
          await loadRoutines();
        } catch (e: unknown) {
          toast({
            message: e instanceof Error ? e.message : '추가 실패',
            variant: 'error',
          });
        }
      }
    },
    [localExercises, routineId, selectedDate, buildPayload, addRoutine, updateRoutine, loadRoutines],
  );

  useFocusEffect(
    useCallback(() => {
      if (pendingExerciseToAdd) {
        const ex = pendingExerciseToAdd;
        setPendingExerciseToAdd(null);
        handleSelectExercise(ex);
      }
    }, [pendingExerciseToAdd, handleSelectExercise, setPendingExerciseToAdd]),
  );

  useFocusEffect(
    useCallback(() => {
      if (params.copyOnOpen === '1') {
        setCopyVisible(true);
        router.setParams({ copyOnOpen: undefined });
      }
    }, [params.copyOnOpen, router]),
  );

  const doCopy = useCallback(
    async (sourceId: string) => {
      await copyFromRoutine(sourceId);
      await loadRoutines();
    },
    [copyFromRoutine, loadRoutines],
  );

  const doOverwrite = useCallback(
    async (sourceId: string) => {
      if (routineId) await deleteRoutine(routineId);
      await copyFromRoutine(sourceId);
      await loadRoutines();
    },
    [routineId, deleteRoutine, copyFromRoutine, loadRoutines],
  );

  const doAppend = useCallback(
    async (sourceId: string) => {
      const copied = await copyFromRoutine(sourceId);
      if (routineId && copied.exercises.length > 0) {
        const merged = [...localExercises, ...copied.exercises.map((ex, i) => ({
          ...ex,
          order: localExercises.length + i + 1,
        }))];
        await updateRoutine(routineId, buildPayload(merged));
      }
      // Delete copied routine after successful update
      if (copied.id) {
        try { await deleteRoutine(copied.id); } catch { /* silent */ }
      }
      await loadRoutines();
    },
    [routineId, localExercises, copyFromRoutine, updateRoutine, deleteRoutine, buildPayload, loadRoutines],
  );

  const handleCopyRoutine = useCallback(
    async (sourceId: string) => {
      setCopyVisible(false);
      if (localExercises.length === 0) {
        try {
          await doCopy(sourceId);
        } catch (e: unknown) {
          toast({
            message: e instanceof Error ? e.message : '복사 실패',
            variant: 'error',
          });
        }
        return;
      }

      Alert.alert(
        '이전 루틴 복사',
        '현재 기록이 있습니다. 어떻게 처리할까요?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '붙여넣기',
            onPress: async () => {
              try {
                await doAppend(sourceId);
              } catch (e: unknown) {
                toast({
                  message: e instanceof Error ? e.message : '붙여넣기 실패',
                  variant: 'error',
                });
              }
            },
          },
          {
            text: '덮어쓰기',
            style: 'destructive',
            onPress: async () => {
              try {
                await doOverwrite(sourceId);
              } catch (e: unknown) {
                toast({
                  message: e instanceof Error ? e.message : '덮어쓰기 실패',
                  variant: 'error',
                });
              }
            },
          },
        ],
      );
    },
    [localExercises, doCopy, doOverwrite, doAppend],
  );

  const handleUpdateSet = useCallback(
    (exerciseOrder: number, setIndex: number, field: 'reps' | 'weight' | 'weightUnit', value: number | WeightUnit) => {
      setLocalExercises((prev) =>
        prev.map((ex) => {
          if (ex.order !== exerciseOrder) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s, i) => {
              if (i !== setIndex) return s;
              return { ...s, [field]: value };
            }),
          };
        }),
      );
      setDirty(true);
      scheduleSave();
    },
    [scheduleSave],
  );

  const handleDeleteSet = useCallback(
    (exerciseOrder: number, setIndex: number) => {
      setLocalExercises((prev) =>
        prev.map((ex) => {
          if (ex.order !== exerciseOrder) return ex;
          return {
            ...ex,
            sets: ex.sets.filter((_, i) => i !== setIndex),
          };
        }),
      );
      setDirty(true);
      scheduleSave();
    },
    [scheduleSave],
  );

  const handleAddSet = useCallback(
    (exerciseOrder: number) => {
      setLocalExercises((prev) =>
        prev.map((ex) => {
          if (ex.order !== exerciseOrder) return ex;
          const lastSet = ex.sets[ex.sets.length - 1];
          const newSet: WS = {
            round: ex.sets.length + 1,
            reps: lastSet?.reps ?? 0,
            weight: lastSet?.weight ?? 0,
            weightUnit: lastSet?.weightUnit ?? 'kg',
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }),
      );
      setDirty(true);
      scheduleSave();
    },
    [scheduleSave],
  );

  const handleDeleteExercise = useCallback(
    async (exerciseOrder: number) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      const remaining = localExercises.filter((ex) => ex.order !== exerciseOrder);
      if (remaining.length === 0) {
        if (routineId) {
          try {
            setLocalExercises([]);
            setRoutineId(undefined);
            await deleteRoutine(routineId);
            await loadRoutines();
          } catch (e) {
            console.error('Delete routine failed:', e);
            toast({ message: '삭제 실패', variant: 'error' });
            await loadRoutines();
          }
        } else {
          setLocalExercises([]);
        }
        return;
      }
      const reindexed = remaining.map((ex, i) => ({ ...ex, order: i + 1 }));
      latestExercisesRef.current = reindexed;
      setLocalExercises(reindexed);
      if (routineId) {
        try {
          await updateRoutine(routineId, buildPayload(reindexed));
          await loadRoutines();
        } catch (e) {
          console.error('Update routine failed:', e);
          await loadRoutines();
        }
      }
    },
    [localExercises, routineId, buildPayload, updateRoutine, deleteRoutine, loadRoutines],
  );

  const hasExercises = localExercises.length > 0;

  // Edge swipe to change date with slide animation
  const { width: screenWidth } = useWindowDimensions();
  const EDGE_WIDTH = 50;
  const MIN_SWIPE_DISTANCE = 50;
  const swipeX = useSharedValue(0);
  const isEdgeSwiping = useSharedValue(false);

  const changeDate = useCallback(
    (dir: -1 | 1) => {
      haptic.light();
      handleDateChange(addDays(selectedDate, dir));
    },
    [selectedDate, handleDateChange],
  );

  const slideIn = useCallback(
    (dir: -1 | 1) => {
      // New content enters from the opposite side
      swipeX.value = -dir * screenWidth * 0.4;
      swipeX.value = withTiming(0, { duration: 200 });
    },
    [swipeX, screenWidth],
  );

  const edgeSwipeGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-25, 25])
    .onStart((e) => {
      'worklet';
      const startX = e.absoluteX - e.translationX;
      isEdgeSwiping.value =
        startX < EDGE_WIDTH || startX > screenWidth - EDGE_WIDTH;
    })
    .onUpdate((e) => {
      'worklet';
      if (!isEdgeSwiping.value) return;
      swipeX.value = e.translationX * 0.5;
    })
    .onEnd((e) => {
      'worklet';
      if (!isEdgeSwiping.value) {
        swipeX.value = withSpring(0);
        return;
      }
      isEdgeSwiping.value = false;

      const startX = e.absoluteX - e.translationX;
      const isLeftEdge = startX < EDGE_WIDTH;
      const isRightEdge = startX > screenWidth - EDGE_WIDTH;

      if (isLeftEdge && e.translationX > MIN_SWIPE_DISTANCE) {
        swipeX.value = withTiming(screenWidth * 0.5, { duration: 120 }, () => {
          runOnJS(changeDate)(-1);
          runOnJS(slideIn)(-1);
        });
      } else if (isRightEdge && e.translationX < -MIN_SWIPE_DISTANCE) {
        swipeX.value = withTiming(-screenWidth * 0.5, { duration: 120 }, () => {
          runOnJS(changeDate)(1);
          runOnJS(slideIn)(1);
        });
      } else {
        swipeX.value = withSpring(0);
      }
    });

  const swipeContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipeX.value }],
    opacity: interpolate(
      Math.abs(swipeX.value),
      [0, screenWidth * 0.5],
      [1, 0.3],
    ),
  }));

  return (
    <GradientBackground>
      <GestureDetector gesture={edgeSwipeGesture}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          onCalendarToggle={() => setCalendarVisible((v) => !v)}
        />

        <Animated.View style={[{ flex: 1 }, swipeContentStyle]}>
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={DarkTheme.accentCyan} />
            </View>
          ) : hasExercises ? (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {localExercises.map((we) => (
                <WorkoutExerciseCard
                  key={`${routineId}-${we.order}`}
                  workoutExercise={we}
                  onUpdateSet={handleUpdateSet}
                  onDeleteSet={handleDeleteSet}
                  onAddSet={handleAddSet}
                  onDeleteExercise={handleDeleteExercise}
                />
              ))}
              <View style={{ height: 120 }} />
            </ScrollView>
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>🏋️</Text>
              <Text style={styles.emptyText}>운동을 추가하세요</Text>
              <Text style={styles.emptySubtext}>
                아래 버튼을 눌러 운동을 시작하세요
              </Text>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
      </GestureDetector>

      {/* Calendar overlay */}
      {calendarVisible && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setCalendarVisible(false)}
        >
          <SafeAreaView style={styles.calendarOverlay} edges={['top']}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <GlassCalendar
                selectedDate={selectedDate}
                onSelectDate={handleDateChange}
                visible={calendarVisible}
                onClose={() => setCalendarVisible(false)}
                workoutDates={workoutDates}
                onMonthChange={loadWorkoutDates}
              />
            </Pressable>
          </SafeAreaView>
        </Pressable>
      )}

      {/* Empty state: full bottom bar / Has exercises: FAB */}
      {hasExercises ? (
        <FABActionButton
          onAddExercise={() => setPickerVisible(true)}
          onCopyRoutine={() => setCopyVisible(true)}
          onOpenChat={() => setChatVisible(true)}
          hidden={keyboardVisible}
        />
      ) : (
        <Animated.View style={[styles.bottomBarWrapper, bottomBarAnimStyle]}>
          <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
            <Pressable
              onPress={() => { haptic.medium(); setPickerVisible(true); }}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && { backgroundColor: DarkTheme.accentCyanDim },
              ]}>
              <Text style={styles.primaryBtnText}>+ 운동 추가</Text>
            </Pressable>
            <GlassSurface bordered borderRadius={22} style={styles.secondaryBtnGlass}>
              <Pressable
                onPress={() => { haptic.medium(); setChatVisible(true); }}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && { opacity: 0.8 },
                ]}>
                <Text style={styles.secondaryBtnText}>💬 채팅 모드</Text>
              </Pressable>
            </GlassSurface>
            <GlassSurface bordered borderRadius={22} style={styles.secondaryBtnGlass}>
              <Pressable
                onPress={() => { haptic.light(); setCopyVisible(true); }}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && { opacity: 0.8 },
                ]}>
                <Text style={styles.secondaryBtnText}>이전 루틴 복사</Text>
              </Pressable>
            </GlassSurface>
          </SafeAreaView>
        </Animated.View>
      )}

      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleSelectExercise}
        onCreateNew={() => {
          setPickerVisible(false);
          router.push('/exercises/create');
        }}
      />

      <CopyRoutineModal
        visible={copyVisible}
        onClose={() => setCopyVisible(false)}
        onCopy={handleCopyRoutine}
      />

      <ChatBottomSheet
        visible={chatVisible}
        date={selectedDate}
        onClose={() => setChatVisible(false)}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  calendarOverlay: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 64,
    backgroundColor: DarkTheme.bgPrimary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    color: DarkTheme.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: DarkTheme.textTertiary,
    fontSize: 14,
  },
  bottomBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: DarkTheme.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: DarkTheme.bgBorder,
  },
  primaryBtn: {
    backgroundColor: DarkTheme.accentCyan,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: DarkTheme.bgPrimary,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  secondaryBtnGlass: {
    height: 44,
  },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: DarkTheme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
