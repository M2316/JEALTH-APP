import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DarkTheme } from '@/constants/theme';

export function ChatEmptyState() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>오늘의 운동을 자연어로 말씀해 주세요</Text>
      <Text style={styles.hint}>
        예: <Text style={styles.example}>벤치프레스 4세트 10개 20kg, 10개 25kg, 8개 30kg, 6개 35kg</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { color: DarkTheme.textPrimary, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  hint: { color: '#888', fontSize: 13, textAlign: 'center' },
  example: { color: DarkTheme.accentCyan },
});
