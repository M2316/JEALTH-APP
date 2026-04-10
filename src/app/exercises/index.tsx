import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { GradientBackground } from '@/components/gradient-background';
import { ExerciseListItem } from '@/components/workout/exercise-list-item';
import { MuscleGroupBadge } from '@/components/workout/muscle-group-badge';
import { DarkTheme } from '@/constants/theme';
import { useExerciseStore } from '@/stores/exercise-store';

export default function ExerciseListScreen() {
  const router = useRouter();
  const { muscleGroups, exercises, isLoading, loadMuscleGroups, loadExercises } =
    useExerciseStore();
  const [search, setSearch] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    loadMuscleGroups();
    loadExercises();
  }, [loadMuscleGroups, loadExercises]);

  const handleSearch = useCallback(
    (text: string) => {
      setSearch(text);
      loadExercises(text || undefined);
    },
    [loadExercises],
  );

  const filteredExercises = selectedGroupId
    ? exercises.filter((e) =>
        e.muscleGroups.some((mg) => mg.id === selectedGroupId),
      )
    : exercises;

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>운동 목록</Text>
          <Pressable
            onPress={() => router.push('/exercises/create')}
            style={styles.addBtn}>
            <Text style={styles.addText}>+</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearch}
            placeholder="운동 검색..."
            placeholderTextColor={DarkTheme.textTertiary}
          />
        </View>

        {muscleGroups.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}>
            {muscleGroups.map((mg) => (
              <View key={mg.id} style={{ marginRight: 8 }}>
                <MuscleGroupBadge
                  muscleGroup={mg}
                  selected={selectedGroupId === mg.id}
                  onPress={() =>
                    setSelectedGroupId((prev) =>
                      prev === mg.id ? null : mg.id,
                    )
                  }
                />
              </View>
            ))}
          </ScrollView>
        )}

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={DarkTheme.accentCyan} />
          </View>
        ) : (
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <ExerciseListItem exercise={item} />}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>운동이 없습니다</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: DarkTheme.textPrimary,
    fontSize: 28,
    fontWeight: '300',
  },
  title: {
    color: DarkTheme.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  addBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    color: DarkTheme.accentCyan,
    fontSize: 28,
    fontWeight: '300',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: DarkTheme.bgElevated,
    color: DarkTheme.textPrimary,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
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
