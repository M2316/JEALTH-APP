import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { DarkTheme } from '@/constants/theme';
import { useChatStore } from '@/stores/chat-store';
import { ChatMessageList } from './chat-message-list';
import { ChatInput } from './chat-input';
import { ChatEmptyState } from './chat-empty-state';

interface Props {
  visible: boolean;
  date: string;
  onClose: () => void;
}

export function ChatBottomSheet({ visible, date, onClose }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const {
    messages,
    isSending,
    confidenceByMsgId,
    openForDate,
    sendMessage,
    approveDraft,
    retryFromError,
    closeAndCleanup,
  } = useChatStore();
  const snapPoints = useMemo(() => ['90%'], []);
  const lowConfidenceIds = useMemo(
    () =>
      new Set<number>(
        Object.entries(confidenceByMsgId)
          .filter(([, c]) => c === 'low')
          .map(([id]) => Number(id)),
      ),
    [confidenceByMsgId],
  );

  useEffect(() => {
    if (visible) {
      void openForDate(date);
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [visible, date, openForDate]);

  const handleClose = useCallback(async () => {
    await closeAndCleanup();
    onClose();
  }, [closeAndCleanup, onClose]);

  if (!visible) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.body}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {messages.length === 0 ? (
            <ChatEmptyState />
          ) : (
            <ChatMessageList
              messages={messages}
              saving={isSending}
              onApprove={(id) => approveDraft(id)}
              onRetry={(id) => retryFromError(id)}
              lowConfidenceIds={lowConfidenceIds}
            />
          )}
          <ChatInput disabled={false} sending={isSending} onSend={(t) => sendMessage(t)} />
        </KeyboardAvoidingView>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: DarkTheme.bgPrimary },
  handle: { backgroundColor: '#444' },
  body: { flex: 1 },
  flex: { flex: 1 },
});
