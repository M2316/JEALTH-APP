import { Link } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { GradientBackground } from '@/components/gradient-background';
import { GlassSurface } from '@/components/glass-surface';
import { ThemedButton } from '@/components/themed-button';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { DarkTheme, MaxContentWidth, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSuccess(true);
    } catch {
      setSuccess(true);
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
              비밀번호 찾기
            </ThemedText>

            {success ? (
              <>
                <ThemedText style={styles.successText}>
                  입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다. 메일을 확인해주세요.
                </ThemedText>
                <Link href="/(auth)/login" style={styles.linkCenter}>
                  <ThemedText type="linkPrimary">로그인으로 돌아가기</ThemedText>
                </Link>
              </>
            ) : (
              <>
                <ThemedText type="small" themeColor="textSecondary" style={styles.desc}>
                  가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
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

                <ThemedButton title="재설정 링크 보내기" variant="accent" onPress={handleSubmit} loading={loading} />

                <Link href="/(auth)/login" style={styles.linkCenter}>
                  <ThemedText type="linkPrimary">로그인으로 돌아가기</ThemedText>
                </Link>
              </>
            )}
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
    marginBottom: Spacing.two,
  },
  desc: {
    textAlign: 'center',
  },
  successText: {
    textAlign: 'center',
    lineHeight: 24,
    color: DarkTheme.textPrimary,
  },
  linkCenter: {
    alignSelf: 'center',
  },
});
