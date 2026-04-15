import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass-surface';
import { DarkTheme, Spacing } from '@/constants/theme';
import { useToastStore, type ToastItem } from '@/stores/toast-store';

const AUTO_HIDE_MS: Record<ToastItem['variant'], number> = {
  success: 1500,
  error: 3000,
};

const ICON: Record<ToastItem['variant'], string> = {
  success: '✅',
  error: '⚠️',
};

const BORDER: Record<ToastItem['variant'], string> = {
  success: DarkTheme.accentCyan,
  error: DarkTheme.statusDanger,
};

interface ToastProps {
  item: ToastItem;
  onAutoHide: () => void;
}

function Toast({ item, onAutoHide }: ToastProps) {
  const translateY = useSharedValue(-40);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
    opacity.value = withTiming(1, { duration: 180 });

    timerRef.current = setTimeout(() => {
      translateY.value = withTiming(-40, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) runOnJS(onAutoHide)();
      });
    }, AUTO_HIDE_MS[item.variant]);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.toastWrapper, animStyle]} pointerEvents="none">
      <GlassSurface
        bordered
        borderRadius={22}
        style={[styles.toast, { borderColor: BORDER[item.variant] }]}>
        <Text style={styles.icon}>{ICON[item.variant]}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
      </GlassSurface>
    </Animated.View>
  );
}

export function ToastHost() {
  const current = useToastStore((s) => s.current);
  const hide = useToastStore((s) => s.hide);

  return (
    <SafeAreaView edges={['top']} style={styles.host} pointerEvents="box-none">
      {current && (
        <Toast key={current.id} item={current} onAutoHide={() => hide(current.id)} />
      )}
    </SafeAreaView>
  );
}

export function useToast() {
  return useToastStore((s) => s.show);
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  toastWrapper: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    maxWidth: 480,
    width: '100%',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
  },
  icon: {
    fontSize: 16,
  },
  message: {
    color: DarkTheme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
