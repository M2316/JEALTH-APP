import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ChatBubble } from './chat-bubble';
import { ChatDraftCard } from './chat-draft-card';
import type { ChatMessage } from '@/types/chat';

interface Props {
  messages: ChatMessage[];
  saving: boolean;
  onApprove: (messageId: number) => void;
  onRetry: (messageId: number) => void;
  lowConfidenceIds: Set<number>;
}

export function ChatMessageList({ messages, saving, onApprove, onRetry, lowConfidenceIds }: Props) {
  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <View>
        <ChatBubble role={item.role} content={item.content} />
        {item.role === 'assistant' && item.draft && (
          <ChatDraftCard
            message={item}
            isLowConfidence={lowConfidenceIds.has(item.id)}
            onApprove={() => onApprove(item.id)}
            onRetry={() => onRetry(item.id)}
            saving={saving}
          />
        )}
      </View>
    ),
    [saving, onApprove, onRetry, lowConfidenceIds],
  );

  return (
    <FlatList
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
