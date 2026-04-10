import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { haptic } from '@/lib/haptics';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { DarkTheme } from '@/constants/theme';

interface DialNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  decimalPlaces?: number;
  width?: number;
  onTap?: () => void;
}

const triggerHaptic = () => {
  haptic.light();
};

export function DialNumberInput({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  decimalPlaces = 0,
  width = 64,
  onTap,
}: DialNumberInputProps) {
  const isDragging = useSharedValue(false);
  const displayScale = useSharedValue(1);
  const baseValue = useSharedValue(Number(value) || 0);
  const lastSteps = useSharedValue(0);

  const clamp = useCallback(
    (v: number) => {
      const clamped = Math.min(max, Math.max(min, v));
      return Number(clamped.toFixed(decimalPlaces));
    },
    [min, max, decimalPlaces],
  );

  const emitChange = useCallback(
    (next: number) => {
      onChange(next);
    },
    [onChange],
  );

  const handleTap = useCallback(() => {
    onTap?.();
  }, [onTap]);

  const panGesture = Gesture.Pan()
    .minDistance(5)
    .activeOffsetY([-10, 10])
    .failOffsetX([-5, 5])
    .onStart(() => {
      'worklet';
      baseValue.value = Number(value) || 0;
      lastSteps.value = 0;
      isDragging.value = true;
      displayScale.value = withSpring(1.15);
    })
    .onUpdate((e) => {
      'worklet';
      const pixelsPerStep = step < 1 ? 20 : 12;
      const rawSteps = -e.translationY / pixelsPerStep;
      const snappedSteps = Math.round(rawSteps);
      if (snappedSteps !== lastSteps.value) {
        lastSteps.value = snappedSteps;
        runOnJS(triggerHaptic)();
      }
      const next = Math.min(max, Math.max(min, baseValue.value + snappedSteps * step));
      const rounded = Number(next.toFixed(decimalPlaces));
      runOnJS(emitChange)(rounded);
    })
    .onEnd(() => {
      'worklet';
      isDragging.value = false;
      displayScale.value = withSpring(1);
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    'worklet';
    runOnJS(handleTap)();
  });

  const composed = Gesture.Exclusive(panGesture, tapGesture);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: displayScale.value }],
    borderWidth: isDragging.value ? 1 : 0,
    borderColor: isDragging.value ? DarkTheme.accentCyan : 'transparent',
  }));

  const topArrowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(isDragging.value ? 1 : 0, [0, 1], [0.3, 0.7]),
  }));

  const bottomArrowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(isDragging.value ? 1 : 0, [0, 1], [0.3, 0.7]),
  }));

  const safeValue = Number(value) || 0;
  const displayValue = safeValue.toFixed(decimalPlaces);
  const isEmpty = safeValue === 0;

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.wrapper, { width }]}>
        <Animated.View style={topArrowStyle}>
          <Text style={styles.arrow}>▲</Text>
        </Animated.View>

        <Animated.View
          style={[styles.container, { width }, animatedContainerStyle]}>
          <Text
            style={[
              styles.valueText,
              isEmpty && styles.placeholderText,
            ]}>
            {isEmpty ? '0' : displayValue}
          </Text>
        </Animated.View>

        <Animated.View style={bottomArrowStyle}>
          <Text style={styles.arrow}>▼</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 2,
  },
  container: {
    backgroundColor: DarkTheme.bgElevated,
    borderRadius: 8,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    color: DarkTheme.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholderText: {
    color: DarkTheme.textTertiary,
  },
  arrow: {
    color: DarkTheme.textTertiary,
    fontSize: 8,
    textAlign: 'center',
  },
});
