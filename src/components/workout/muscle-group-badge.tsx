import React, { useRef } from 'react';
import { Pressable, Animated, StyleSheet, Text } from 'react-native';

import { DarkTheme } from '@/constants/theme';
import { haptic } from '@/lib/haptics';
import type { MuscleGroup } from '@/types/workout';

interface Props {
  muscleGroup: MuscleGroup;
  selected?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
}

export function MuscleGroupBadge({
  muscleGroup,
  selected = false,
  onPress,
  size = 'md',
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    haptic.selection();
    onPress?.();
  };

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const height = size === 'sm' ? 28 : 36;
  const fontSize = size === 'sm' ? 11 : 13;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.badge,
          {
            height,
            backgroundColor: selected
              ? DarkTheme.accentCyanGlow
              : DarkTheme.bgElevated,
            borderWidth: 1,
            borderColor: selected ? DarkTheme.accentCyan : 'transparent',
          },
        ]}>
        <Text
          style={{
            fontSize,
            fontWeight: '600',
            color: selected ? DarkTheme.accentCyan : DarkTheme.textSecondary,
          }}>
          {muscleGroup.nameKo}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
