import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Pressable,
  TextInput,
  FlatList,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExerciseListItem } from './exercise-list-item';
import { MuscleGroupBadge } from './muscle-group-badge';

import { useExerciseStore } from '@/stores/exercise-store';
import type { Exercise } from '@/types/workout';
import { DarkTheme } from '@/constants/theme';
import { haptic } from '@/lib/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  onCreateNew: () => void;
}

export function ExercisePickerModal({
  visible,
  onClose,
  onSelect,
  onCreateNew,
}: Props) {
  const { muscleGroups, exercises, isLoading, loadMuscleGroups, loadExercises } =
    useExerciseStore();
  const [search, setSearch] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadMuscleGroups();
      loadExercises();
    }
  }, [visible, loadMuscleGroups, loadExercises]);

  const handleSearch = useCallback(
    (text: string) => {
      setSearch(text);
      loadExercises(text || undefined);
    },
    [loadExercises],
  );

  const toggleGroup = useCallback((id: string) => {
    setSelectedGroupId((prev) => (prev === id ? null : id));
  }, []);

  const filteredExercises = selectedGroupId
    ? exercises.filter((e) =>
        e.muscleGroups.some((mg) => mg.id === selectedGroupId),
      )
    : exercises;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>운동 선택</Text>
          <Pressable onPress={() => { haptic.light(); onClose(); }} style={styles.closeBtn} hitSlop={8}>
            <Text style={styles.closeText}>✕</Text>
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
                  onPress={() => toggleGroup(mg.id)}
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
            renderItem={({ item }) => (
              <ExerciseListItem
                exercise={item}
                onPress={() => onSelect(item)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>운동이 없습니다</Text>
              </View>
            }
          />
        )}

        <Pressable onPress={() => { haptic.medium(); onCreateNew(); }} style={styles.createBtn}>
          <Text style={styles.createText}>+ 새 운동 등록</Text>
        </Pressable>
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
    paddingBottom: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: DarkTheme.textTertiary,
    fontSize: 14,
  },
  createBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: DarkTheme.bgBorder,
  },
  createText: {
    color: DarkTheme.accentCyan,
    fontSize: 15,
    fontWeight: '600',
  },
});
