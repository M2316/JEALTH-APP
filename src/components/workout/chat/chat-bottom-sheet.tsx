import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetFooter, type BottomSheetFooterProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const sheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const {
    messages,
    isSending,
    confidenceByMsgId,
    parseSuccessByMsgId,
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
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible, date, openForDate]);

  const handleDismiss = useCallback(async () => {
    await closeAndCleanup();
    onClose();
  }, [closeAndCleanup, onClose]);

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom}>
        <View style={{ backgroundColor: DarkTheme.bgPrimary }}>
          <ChatInput disabled={false} sending={isSending} onSend={(t) => sendMessage(t)} />
        </View>
      </BottomSheetFooter>
    ),
    [insets.bottom, isSending, sendMessage],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={handleDismiss}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      footerComponent={renderFooter}
    >
      <BottomSheetView style={styles.body}>
        {messages.length === 0 ? (
          <ChatEmptyState />
        ) : (
          <ChatMessageList
            messages={messages}
            saving={isSending}
            onApprove={(id) => approveDraft(id)}
            onRetry={(id) => retryFromError(id)}
            lowConfidenceIds={lowConfidenceIds}
            parseSuccessByMsgId={parseSuccessByMsgId}
          />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: DarkTheme.bgPrimary },
  handle: { backgroundColor: '#444' },
  body: { flex: 1 },
  flex: { flex: 1 },
});
