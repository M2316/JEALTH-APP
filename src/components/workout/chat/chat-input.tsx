import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { DarkTheme } from '@/constants/theme';

interface Props { disabled: boolean; sending: boolean; onSend: (text: string) => void; }

export function ChatInput({ disabled, sending, onSend }: Props) {
  const [text, setText] = useState('');
  const canSend = !disabled && !sending && text.trim().length > 0;
  const submit = () => {
    console.log('[ChatInput] submit pressed', { canSend, textLen: text.length, sending, disabled });
    if (!canSend) return;
    console.log('[ChatInput] calling onSend');
    onSend(text);
    setText('');
  };
  return (
    <View style={styles.container}>
      <BottomSheetTextInput
        testID="chat-input"
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="오늘 한 운동을 자유롭게 입력해보세요"
        placeholderTextColor="#666"
        multiline
        editable={!sending}
        maxLength={2000}
      />
      <Pressable style={[styles.sendButton, !canSend && styles.sendDisabled]} onPress={submit} disabled={!canSend}>
        {sending ? <ActivityIndicator color={DarkTheme.bgPrimary} /> : <Text style={styles.sendText}>전송</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#222' },
  input: { flex: 1, minHeight: 40, maxHeight: 120, color: DarkTheme.textPrimary, backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  sendButton: { backgroundColor: DarkTheme.accentCyan, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, minWidth: 64, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: DarkTheme.bgPrimary, fontWeight: '700' },
});
