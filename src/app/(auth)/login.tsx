import { Link } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { GradientBackground } from '@/components/gradient-background';
import { GlassSurface } from '@/components/glass-surface';
import { ThemedButton } from '@/components/themed-button';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { DarkTheme, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await login({ email, password });
    } catch (e: any) {
      setError(e.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <GlassSurface bordered style={styles.inner}>
            <ThemedText type="title" style={styles.title}>
              로그인
            </ThemedText>

            {error ? (
              <ThemedText type="small" style={{ color: DarkTheme.statusDanger, textAlign: 'center' }}>
                {error}
              </ThemedText>
            ) : null}

            <ThemedInput
              label="이메일"
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <ThemedInput
              label="비밀번호"
              placeholder="비밀번호 입력"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <ThemedButton title="로그인" variant="accent" onPress={handleLogin} loading={loading} />

            <View style={styles.links}>
              <Link href="/(auth)/register">
                <ThemedText type="linkPrimary">회원가입</ThemedText>
              </Link>
              <Link href="/(auth)/forgot-password">
                <ThemedText type="linkPrimary">비밀번호 찾기</ThemedText>
              </Link>
            </View>
          </GlassSurface>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.four,
    marginTop: Spacing.two,
  },
});
