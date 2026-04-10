import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/gradient-background';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';
import { fetchAllRoutines, deleteRoutine } from '@/lib/workout-api';

export default function SettingsScreen() {
  const logout = useAuthStore((s) => s.logout);
  const [resetting, setResetting] = useState(false);

  const handleResetAll = () => {
    Alert.alert(
      '모든 기록 초기화',
      '모든 운동 기록이 영구적으로 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              const routines = await fetchAllRoutines();
              await Promise.all(routines.map((r) => r.id && deleteRoutine(r.id)));
              Alert.alert('완료', '모든 기록이 초기화되었습니다.');
            } catch {
              Alert.alert('오류', '초기화에 실패했습니다.');
            } finally {
              setResetting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.inner}>
        <ThemedText type="subtitle">설정</ThemedText>

        <View style={styles.section}>
          <ThemedButton
            title="모든 기록 초기화"
            variant="outline"
            loading={resetting}
            onPress={handleResetAll}
          />
        </View>

        <View style={styles.bottomSection}>
          <ThemedButton title="로그아웃" variant="outline" onPress={logout} />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    padding: Spacing.four,
    paddingTop: Spacing.six,
    gap: Spacing.four,
  },
  section: {
    marginTop: Spacing.four,
  },
  bottomSection: {
    marginTop: 'auto',
    marginBottom: Spacing.four,
  },
});
