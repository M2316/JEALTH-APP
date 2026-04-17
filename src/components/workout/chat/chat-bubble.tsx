import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DarkTheme } from '@/constants/theme';
import { GlassSurface } from '@/components/glass-surface';
import type { ChatRole } from '@/types/chat';

interface Props { role: ChatRole; content: string; }

export function ChatBubble({ role, content }: Props) {
  const isUser = role === 'user';
  if (isUser) {
    return (
      <View style={[styles.row, styles.rowRight]}>
        <View style={styles.userBubble}><Text style={styles.userText}>{content}</Text></View>
      </View>
    );
  }
  return (
    <View style={[styles.row, styles.rowLeft]}>
      <GlassSurface bordered borderRadius={14} style={styles.assistantBubble}>
        <Text style={styles.assistantText}>{content}</Text>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 4, paddingHorizontal: 12 },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  userBubble: { backgroundColor: DarkTheme.accentCyan, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, maxWidth: '80%' },
  userText: { color: DarkTheme.bgPrimary, fontSize: 14, lineHeight: 20 },
  assistantBubble: { paddingVertical: 10, paddingHorizontal: 14, maxWidth: '85%' },
  assistantText: { color: DarkTheme.textPrimary, fontSize: 14, lineHeight: 20 },
});
