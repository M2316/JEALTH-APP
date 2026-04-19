import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DarkTheme } from '@/constants/theme';
import { GlassSurface } from '@/components/glass-surface';
import { haptic } from '@/lib/haptics';
import type { ChatMessage } from '@/types/chat';

interface Props {
  message: ChatMessage;
  saving: boolean;
  onApprove: (muscleGroupIds: string[]) => void;
  onReject: () => void;
}

export function ChatNewExerciseCard({ message, saving, onApprove, onReject }: Props) {
  const initial = useMemo(
    () =>
      new Set<string>(
        message.editedMuscleGroupIds ?? message.suggestedMuscleGroupIds ?? [],
      ),
    [message.editedMuscleGroupIds, message.suggestedMuscleGroupIds],
  );
  const [selected, setSelected] = useState<Set<string>>(initial);

  if (!message.draft) return null;
  const exercise = message.draft.exercises[0];
  if (!exercise) return null;

  const isSaved = message.status === 'saved';
  const isDiscarded = message.status === 'discarded';
  const isError = message.status === 'error';
  const dim = isSaved || isDiscarded;
  const showButtons = !isSaved && !isDiscarded && !isError;

  const suggestedEmpty = (message.suggestedMuscleGroupIds ?? []).length === 0;
  const canApprove = selected.size > 0 && !saving;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApprove = () => {
    if (!canApprove) return;
    haptic.medium();
    const orderedIds = (message.muscleGroups ?? [])
      .map((mg) => mg.id)
      .filter((id) => selected.has(id));
    onApprove(orderedIds);
  };

  const handleReject = () => {
    haptic.medium();
    onReject();
  };

  return (
    <View style={styles.wrapper}>
      <GlassSurface
        bordered
        borderRadius={14}
        style={[styles.card, dim && styles.cardDimmed]}
      >
        <Text style={styles.title}>🆕 신규 운동 추가</Text>

        {suggestedEmpty && !isSaved && (
          <View style={styles.warnBanner}>
            <Text style={styles.warnText}>
              근육 그룹을 추정하지 못했어요. 선택 후 승인해주세요.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>운동명</Text>
          <Text style={[styles.exerciseName, dim && styles.dimText]}>
            {exercise.name}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>근육 그룹 (탭하여 선택)</Text>
          <View style={styles.chipRow}>
            {(message.muscleGroups ?? []).map((mg) => {
              const active = selected.has(mg.id);
              return (
                <Pressable
                  key={mg.id}
                  testID={`mg-chip-${mg.id}`}
                  accessibilityState={{ selected: active }}
                  onPress={() => toggle(mg.id)}
                  disabled={!showButtons}
                  style={[
                    styles.chip,
                    active && styles.chipActive,
                    dim && styles.chipDim,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                    ]}
                  >
                    {mg.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>세트</Text>
          {exercise.sets.map((s) => (
            <Text key={s.round} style={[styles.setLine, dim && styles.dimText]}>
              {s.round}세트 · {s.reps}reps · {s.weight}{s.weightUnit}
            </Text>
          ))}
        </View>

        {isSaved && (
          <View style={styles.savedFooter}>
            <Text style={styles.savedLabel}>✅ 저장됨</Text>
          </View>
        )}

        {showButtons && (
          <View style={styles.buttonRow}>
            <Pressable
              testID="reject-btn"
              onPress={handleReject}
              style={styles.rejectBtn}
              hitSlop={8}
            >
              <Text style={styles.rejectText}>거절</Text>
            </Pressable>
            <Pressable
              testID="approve-btn"
              accessibilityState={{ disabled: !canApprove }}
              onPress={handleApprove}
              disabled={!canApprove}
              style={[styles.approveBtn, !canApprove && styles.approveDisabled]}
            >
              {saving ? (
                <ActivityIndicator color={DarkTheme.bgPrimary} />
              ) : (
                <Text style={styles.approveText}>✅ 추가하고 저장</Text>
              )}
            </Pressable>
          </View>
        )}
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 12, marginVertical: 4 },
  card: { padding: 12, gap: 12 },
  cardDimmed: { opacity: 0.55 },
  title: { color: DarkTheme.textPrimary, fontSize: 15, fontWeight: '700' },
  warnBanner: { backgroundColor: '#3b2a00', padding: 8, borderRadius: 8 },
  warnText: { color: '#ffd773', fontSize: 12, lineHeight: 16 },
  section: { gap: 6 },
  label: { color: DarkTheme.textSecondary, fontSize: 12, fontWeight: '600' },
  exerciseName: { color: DarkTheme.textPrimary, fontSize: 16, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: DarkTheme.bgElevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: DarkTheme.accentCyanGlow,
    borderColor: DarkTheme.accentCyan,
  },
  chipDim: { opacity: 0.6 },
  chipText: { color: DarkTheme.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: DarkTheme.accentCyan },
  setLine: { color: DarkTheme.textPrimary, fontSize: 13 },
  dimText: { color: '#888' },
  savedFooter: { alignItems: 'flex-end' },
  savedLabel: { color: '#7ee37e', fontSize: 12, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 8 },
  rejectBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DarkTheme.bgBorder,
  },
  rejectText: { color: DarkTheme.textSecondary, fontWeight: '600' },
  approveBtn: {
    flex: 2,
    backgroundColor: DarkTheme.accentCyan,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  approveDisabled: { opacity: 0.4 },
  approveText: { color: DarkTheme.bgPrimary, fontWeight: '700' },
});
