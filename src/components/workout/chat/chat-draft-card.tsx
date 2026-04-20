import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { DarkTheme } from '@/constants/theme';
import { GlassSurface } from '@/components/glass-surface';
import { haptic } from '@/lib/haptics';
import type { ChatMessage } from '@/types/chat';

interface Props {
  message: ChatMessage;
  isLowConfidence: boolean;
  parseSuccess: boolean;
  onApprove: () => void;
  onRetry: () => void;
  saving: boolean;
}

export function ChatDraftCard({ message, isLowConfidence, parseSuccess, onApprove, onRetry, saving }: Props) {
  if (!message.draft) return null;
  const isSaved = message.status === 'saved';
  const isError = message.status === 'error';
  const isDiscarded = message.status === 'discarded';
  const dim = isSaved || isDiscarded;
  const showApprove = !isSaved && !isError && !isDiscarded && parseSuccess;
  const showReinputHint = !isSaved && !isError && !isDiscarded && !parseSuccess;

  return (
    <View style={styles.wrapper}>
      <GlassSurface bordered borderRadius={14} style={[styles.card, dim && styles.cardDimmed, isError && styles.cardError]}>
        {isLowConfidence && !isSaved && parseSuccess && (
          <View style={styles.warnBanner}><Text style={styles.warnText}>확실치 않아요. 한 번 확인해주세요</Text></View>
        )}
        {message.draft.exercises.length > 0 ? (
          message.draft.exercises.map((ex, exIdx) => (
            <View key={`${ex.exerciseId}-${exIdx}`} style={styles.exerciseBlock}>
              <Text style={[styles.exerciseName, dim && styles.dimText]}>{ex.name}</Text>
              {ex.sets.map((s) => (
                <Text key={s.round} style={[styles.setLine, dim && styles.dimText]}>
                  {s.round}세트 · {s.weight}{s.weightUnit} · {s.reps}reps
                </Text>
              ))}
            </View>
          ))
        ) : null}
        {isSaved && (<View style={styles.savedFooter}><Text style={styles.savedLabel}>✅ 저장됨</Text></View>)}
        {isError && (
          <Pressable style={styles.retryButton} onPress={() => { haptic.medium(); onRetry(); }}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        )}
        {showApprove && (
          <Pressable
            style={[styles.approveButton, saving && styles.approveDisabled]}
            disabled={saving}
            onPress={() => { haptic.medium(); onApprove(); }}
          >
            {saving ? <ActivityIndicator color={DarkTheme.bgPrimary} /> : <Text style={styles.approveText}>✅ 이대로 저장</Text>}
          </Pressable>
        )}
        {showReinputHint && (
          <View style={styles.reinputHint}>
            <Text style={styles.reinputText}>정확히 인식하지 못했어요. 운동명·세트·무게를 명확히 다시 입력해주세요.</Text>
          </View>
        )}
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 12, marginVertical: 4 },
  card: { padding: 12, gap: 10 },
  cardDimmed: { opacity: 0.55 },
  cardError: { borderColor: '#ff5b5b' },
  warnBanner: { backgroundColor: '#3b2a00', padding: 8, borderRadius: 8 },
  warnText: { color: '#ffd773', fontSize: 12 },
  exerciseBlock: { gap: 4 },
  exerciseName: { color: DarkTheme.textPrimary, fontSize: 16, fontWeight: '700' },
  setLine: { color: DarkTheme.textPrimary, fontSize: 13 },
  dimText: { color: '#888' },
  savedFooter: { alignItems: 'flex-end' },
  savedLabel: { color: '#7ee37e', fontSize: 12, fontWeight: '600' },
  approveButton: { backgroundColor: DarkTheme.accentCyan, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  approveDisabled: { opacity: 0.5 },
  approveText: { color: DarkTheme.bgPrimary, fontWeight: '700' },
  retryButton: { borderColor: '#ff5b5b', borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  retryText: { color: '#ff5b5b', fontWeight: '600' },
  reinputHint: { backgroundColor: '#2a2014', padding: 10, borderRadius: 8 },
  reinputText: { color: '#ffd773', fontSize: 13, lineHeight: 18 },
});
