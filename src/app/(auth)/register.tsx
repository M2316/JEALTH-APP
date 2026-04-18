import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { GradientBackground } from '@/components/gradient-background';
import { GlassSurface } from '@/components/glass-surface';
import { ThemedButton } from '@/components/themed-button';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { DarkTheme, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

export default function RegisterScreen() {
  const register = useAuthStore((s) => s.register);
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = '이름을 입력해주세요.';
    if (!email.trim()) e.email = '이메일을 입력해주세요.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = '올바른 이메일 형식이 아닙니다.';
    if (!password) e.password = '비밀번호를 입력해주세요.';
    else if (password.length < 6) e.password = '비밀번호는 6자 이상이어야 합니다.';
    if (password !== confirmPassword) e.confirmPassword = '비밀번호가 일치하지 않습니다.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    setGeneralError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name, email, password });
      if (Platform.OS === 'web') {
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
      } else {
        Alert.alert('완료', '회원가입이 완료되었습니다. 로그인해주세요.');
      }
      router.replace('/(auth)/login');
    } catch (e: any) {
      setGeneralError(e.message || '회원가입에 실패했습니다.');
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
              회원가입
            </ThemedText>

            {generalError ? (
              <ThemedText type="small" style={{ color: DarkTheme.statusDanger, textAlign: 'center' }}>
                {generalError}
              </ThemedText>
            ) : null}

            <ThemedInput
              label="이름"
              placeholder="홍길동"
              value={name}
              onChangeText={setName}
              error={errors.name}
            />

            <ThemedInput
              label="이메일"
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />

            <ThemedInput
              label="비밀번호"
              placeholder="6자 이상"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />

            <ThemedInput
              label="비밀번호 확인"
              placeholder="비밀번호 재입력"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
            />

            <ThemedButton title="회원가입" variant="accent" onPress={handleRegister} loading={loading} />

            <View style={styles.links}>
              <Link href="/(auth)/login">
                <ThemedText type="linkPrimary">이미 계정이 있으신가요? 로그인</ThemedText>
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
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
