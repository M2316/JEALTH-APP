import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { ChatBubble } from './chat-bubble';
import { ChatDraftCard } from './chat-draft-card';
import type { ChatMessage } from '@/types/chat';

interface Props {
  messages: ChatMessage[];
  saving: boolean;
  onApprove: (messageId: number) => void;
  onRetry: (messageId: number) => void;
  lowConfidenceIds: Set<number>;
  parseSuccessByMsgId: Record<number, boolean>;
}

export function ChatMessageList({ messages, saving, onApprove, onRetry, lowConfidenceIds, parseSuccessByMsgId }: Props) {
  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <View>
        <ChatBubble role={item.role} content={item.content} />
        {item.role === 'assistant' && item.draft && (
          <ChatDraftCard
            message={item}
            isLowConfidence={lowConfidenceIds.has(item.id)}
            // 메모리에 기록된 parseSuccess 가 없으면(앱 재시작 등) 보수적으로 true 로 두어
            // 사용자가 과거 저장 가능했던 draft 를 계속 승인할 수 있게 한다.
            parseSuccess={parseSuccessByMsgId[item.id] ?? true}
            onApprove={() => onApprove(item.id)}
            onRetry={() => onRetry(item.id)}
            saving={saving}
          />
        )}
      </View>
    ),
    [saving, onApprove, onRetry, lowConfidenceIds, parseSuccessByMsgId],
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
