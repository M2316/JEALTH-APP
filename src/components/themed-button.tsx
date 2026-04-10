import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  PressableProps,
  ViewStyle,
  StyleProp,
} from 'react-native';

import { GlassSurface } from './glass-surface';
import { ThemedText } from './themed-text';

import { DarkTheme, Spacing } from '@/constants/theme';
import { haptic } from '@/lib/haptics';

interface ThemedButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'accent' | 'outline';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ThemedButton({
  title,
  variant = 'primary',
  loading,
  disabled,
  style,
  ...props
}: ThemedButtonProps) {
  const isAccent = variant === 'accent';
  const isOutline = variant === 'outline';

  const originalOnPress = props.onPress;
  const handlePress: typeof originalOnPress = (e) => {
    isOutline ? haptic.warning() : haptic.medium();
    originalOnPress?.(e);
  };

  const textColor = isAccent
    ? DarkTheme.bgPrimary
    : isOutline
      ? DarkTheme.textSecondary
      : DarkTheme.textPrimary;

  if (isAccent) {
    return (
      <Pressable
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: DarkTheme.accentCyan,
            borderColor: DarkTheme.accentCyan,
            opacity: disabled || loading ? 0.5 : pressed ? 0.8 : 1,
          },
          style,
        ]}
        {...props}
        onPress={handlePress}>
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <ThemedText style={[styles.text, { color: textColor }]}>{title}</ThemedText>
        )}
      </Pressable>
    );
  }

  return (
    <GlassSurface
      variant={isOutline ? 'surface' : 'elevated'}
      bordered
      borderRadius={Spacing.two}>
      <Pressable
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.button,
          {
            borderColor: 'transparent',
            opacity: disabled || loading ? 0.5 : pressed ? 0.8 : 1,
          },
          style,
        ]}
        {...props}
        onPress={handlePress}>
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <ThemedText style={[styles.text, { color: textColor }]}>{title}</ThemedText>
        )}
      </Pressable>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
