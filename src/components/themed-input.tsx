import React, { useState } from 'react';
import { TextInput, View, Pressable, StyleSheet, TextInputProps } from 'react-native';

import { GlassSurface } from './glass-surface';
import { ThemedText } from './themed-text';

import { DarkTheme, Fonts, Spacing } from '@/constants/theme';
import { haptic } from '@/lib/haptics';

interface ThemedInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function ThemedInput({ label, error, secureTextEntry, style, ...props }: ThemedInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
      )}
      <GlassSurface
        variant="elevated"
        bordered
        borderRadius={Spacing.two}
        style={error ? { borderColor: DarkTheme.statusDanger } : undefined}>
        <View style={styles.inputInner}>
          <TextInput
            placeholderTextColor={DarkTheme.textTertiary}
            style={[
              styles.input,
              { color: DarkTheme.textPrimary, fontFamily: Fonts.sans },
              style,
            ]}
            secureTextEntry={secureTextEntry && !showPassword}
            {...props}
          />
          {secureTextEntry && (
            <Pressable onPress={() => { haptic.selection(); setShowPassword((v) => !v); }} style={styles.toggle}>
              <ThemedText type="small" themeColor="textSecondary">
                {showPassword ? '숨기기' : '보기'}
              </ThemedText>
            </Pressable>
          )}
        </View>
      </GlassSurface>
      {error && (
        <ThemedText type="small" style={[styles.error, { color: DarkTheme.statusDanger }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  label: {
    marginLeft: Spacing.one,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  toggle: {
    paddingLeft: Spacing.two,
  },
  error: {
    marginLeft: Spacing.one,
  },
});
