import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { GradientBackground } from '@/components/gradient-background';
import { MuscleGroupBadge } from '@/components/workout/muscle-group-badge';
import { DarkTheme } from '@/constants/theme';
import { haptic } from '@/lib/haptics';
import { useExerciseStore } from '@/stores/exercise-store';
import { useWorkoutStore } from '@/stores/workout-store';

const EQUIPMENT_OPTIONS = ['바벨', '덤벨', '머신', '맨몸'] as const;

export default function CreateExerciseScreen() {
  const router = useRouter();
  const { muscleGroups, exercises, loadMuscleGroups, loadExercises, addExercise, uploadImage } =
    useExerciseStore();
  const setPendingExerciseToAdd = useWorkoutStore((s) => s.setPendingExerciseToAdd);

  const [name, setName] = useState('');
  const [equipment, setEquipment] = useState('');
  const [selectedMuscleIds, setSelectedMuscleIds] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMuscleGroups();
    loadExercises();
  }, [loadMuscleGroups, loadExercises]);

  const toggleMuscle = (id: string) => {
    setSelectedMuscleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const normalize = (s: string) =>
    s.trim().toLowerCase().replace(/\s+/g, ' ');

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('오류', '운동 이름을 입력하세요.');
      return;
    }

    const duplicate = exercises.find(
      (e) => normalize(e.name) === normalize(name),
    );

    if (duplicate) {
      Alert.alert(
        '동일한 이름의 운동이 있습니다',
        `"${duplicate.name}" 운동을 오늘 루틴에 추가하시겠습니까?`,
        [
          { text: '아니오, 다른 이름으로 등록', style: 'cancel' },
          {
            text: '네, 기존 운동 추가',
            onPress: () => {
              setPendingExerciseToAdd(duplicate);
              router.back();
            },
          },
        ],
      );
      return;
    }

    setSubmitting(true);
    try {
      const exercise = await addExercise({
        name: name.trim(),
        equipment: equipment.trim() || undefined,
        muscleGroupIds:
          selectedMuscleIds.length > 0 ? selectedMuscleIds : undefined,
      });
      if (imageUri) {
        await uploadImage(exercise.id, imageUri);
      }
      router.back();
    } catch (e: unknown) {
      Alert.alert('오류', e instanceof Error ? e.message : '등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>새 운동 등록</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>운동 이름 *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="예: 벤치프레스"
              placeholderTextColor={DarkTheme.textTertiary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>장비</Text>
            <View style={styles.equipmentRow}>
              {EQUIPMENT_OPTIONS.map((opt) => {
                const selected = equipment === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      haptic.selection();
                      setEquipment(selected ? '' : opt);
                    }}
                    style={[
                      styles.equipmentChip,
                      selected && styles.equipmentChipSelected,
                    ]}>
                    <Text
                      style={[
                        styles.equipmentChipText,
                        selected && styles.equipmentChipTextSelected,
                      ]}>
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>근육 그룹</Text>
            <View style={styles.muscleGrid}>
              {muscleGroups.map((mg) => (
                <View key={mg.id} style={{ marginRight: 8, marginBottom: 8 }}>
                  <MuscleGroupBadge
                    muscleGroup={mg}
                    selected={selectedMuscleIds.includes(mg.id)}
                    onPress={() => toggleMuscle(mg.id)}
                  />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>사진</Text>
            <Pressable onPress={pickImage} style={styles.imagePicker}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.imagePreview}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.imagePickerText}>탭하여 사진 선택</Text>
              )}
            </Pressable>
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitBtn, submitting && { opacity: 0.5 }]}>
            {submitting ? (
              <ActivityIndicator color={DarkTheme.bgPrimary} />
            ) : (
              <Text style={styles.submitText}>등록하기</Text>
            )}
          </Pressable>
        </ScrollView>
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
  form: {
    padding: 16,
    gap: 24,
    paddingBottom: 48,
  },
  field: {
    gap: 8,
  },
  label: {
    color: DarkTheme.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  input: {
    backgroundColor: DarkTheme.bgElevated,
    color: DarkTheme.textPrimary,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  equipmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  equipmentChip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: DarkTheme.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  equipmentChipSelected: {
    backgroundColor: DarkTheme.accentCyanGlow,
    borderColor: DarkTheme.accentCyan,
  },
  equipmentChipText: {
    color: DarkTheme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  equipmentChipTextSelected: {
    color: DarkTheme.accentCyan,
  },
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imagePicker: {
    backgroundColor: DarkTheme.bgElevated,
    height: 120,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DarkTheme.bgBorder,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePickerText: {
    color: DarkTheme.textTertiary,
    fontSize: 14,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  submitBtn: {
    backgroundColor: DarkTheme.accentCyan,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitText: {
    color: DarkTheme.bgPrimary,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
