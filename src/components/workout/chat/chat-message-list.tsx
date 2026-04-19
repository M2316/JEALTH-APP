import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { ChatBubble } from './chat-bubble';
import { ChatDraftCard } from './chat-draft-card';
import { ChatNewExerciseCard } from './chat-new-exercise-card';
import type { ChatMessage } from '@/types/chat';

interface Props {
  messages: ChatMessage[];
  saving: boolean;
  onApprove: (messageId: number) => void;
  onRetry: (messageId: number) => void;
  onApproveNewExercise: (messageId: number, muscleGroupIds: string[]) => void;
  onRejectNewExercise: (messageId: number) => void;
  lowConfidenceIds: Set<number>;
  parseSuccessByMsgId: Record<number, boolean>;
}

export function ChatMessageList({
  messages, saving, onApprove, onRetry,
  onApproveNewExercise, onRejectNewExercise,
  lowConfidenceIds, parseSuccessByMsgId,
}: Props) {
  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <View>
        <ChatBubble role={item.role} content={item.content} />
        {item.role === 'assistant' && item.draft && item.kind === 'new_exercise' ? (
          <ChatNewExerciseCard
            message={item}
            saving={saving}
            onApprove={(ids) => onApproveNewExercise(item.id, ids)}
            onReject={() => onRejectNewExercise(item.id)}
          />
        ) : item.role === 'assistant' && item.draft ? (
          <ChatDraftCard
            message={item}
            isLowConfidence={lowConfidenceIds.has(item.id)}
            parseSuccess={parseSuccessByMsgId[item.id] ?? true}
            onApprove={() => onApprove(item.id)}
            onRetry={() => onRetry(item.id)}
            saving={saving}
          />
        ) : null}
      </View>
    ),
    [
      saving, onApprove, onRetry,
      onApproveNewExercise, onRejectNewExercise,
      lowConfidenceIds, parseSuccessByMsgId,
    ],
  );

  return (
    <BottomSheetFlatList
      style={styles.list}
      data={messages}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingVertical: 12, gap: 4 },
});
