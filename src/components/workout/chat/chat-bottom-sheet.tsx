import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
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
  const { height: keyboardHeight, progress } = useReanimatedKeyboardAnimation();
  const bodyStyle = useAnimatedStyle(() => ({
    paddingBottom: -keyboardHeight.value,
  }));
  const inputWrapStyle = useAnimatedStyle(() => ({
    paddingBottom: insets.bottom * (1 - progress.value),
    marginBottom: -12 * progress.value,
  }));
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

  // 상단 handle 더블탭 감지 (300ms 이내 두 번 탭)
  const lastTapRef = useRef(0);
  const onHandlePress = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      sheetRef.current?.dismiss();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, []);

  const onClosePress = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const renderHandle = useCallback(
    () => (
      <Pressable testID="chat-handle" onPress={onHandlePress} style={styles.handleTouch} hitSlop={12}>
        <View style={styles.handleIndicator} />
        <Pressable testID="chat-close-btn" onPress={onClosePress} style={styles.closeButton} hitSlop={16}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
      </Pressable>
    ),
    [onHandlePress, onClosePress],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose={false}
      enableOverDrag={false}
      enableHandlePanningGesture={false}
      onDismiss={handleDismiss}
      backgroundStyle={styles.background}
      handleComponent={renderHandle}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
    >
      <Animated.View style={[styles.body, bodyStyle]}>
        <View style={styles.listArea}>
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
        </View>
        <Animated.View style={[styles.inputWrap, inputWrapStyle]}>
          <ChatInput disabled={false} sending={isSending} onSend={(t) => sendMessage(t)} />
        </Animated.View>
      </Animated.View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: DarkTheme.bgPrimary },
  handleTouch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: DarkTheme.bgPrimary,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#555',
  },
  closeButton: {
    position: 'absolute',
    right: 14,
    top: 6,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  closeIcon: {
    color: DarkTheme.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  body: { flex: 1 },
  listArea: { flex: 1 },
  inputWrap: { backgroundColor: DarkTheme.bgPrimary },
});
