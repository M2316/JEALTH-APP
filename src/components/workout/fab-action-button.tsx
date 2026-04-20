import React, { useEffect, useState } from 'react';
import { DarkTheme } from '@/constants/theme';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '../glass-surface';
import { haptic } from '@/lib/haptics';

interface FABActionButtonProps {
  onAddExercise: () => void;
  onCopyRoutine: () => void;
  onOpenChat: () => void;
  hidden?: boolean;
}

const DURATION = 120;

export function FABActionButton({
  onAddExercise,
  onCopyRoutine,
  onOpenChat,
  hidden = false,
}: FABActionButtonProps) {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const hiddenProgress = useSharedValue(0);
  const iconRotation = useSharedValue(0);

  const toggle = () => {
    haptic.medium();
    const next = !expanded;
    setExpanded(next);
    iconRotation.value = withTiming(next ? 45 : 0, { duration: DURATION });
  };

  const close = () => {
    setExpanded(false);
    iconRotation.value = withTiming(0, { duration: DURATION });
  };

  useEffect(() => {
    hiddenProgress.value = withTiming(hidden ? 200 : 0, { duration: 200 });
  }, [hidden, hiddenProgress]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hiddenProgress.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  const handleAddExercise = () => {
    haptic.medium();
    onAddExercise();
    close();
  };
  const handleCopyRoutine = () => {
    haptic.medium();
    onCopyRoutine();
    close();
  };
  const handleOpenChat = () => {
    haptic.medium();
    onOpenChat();
    close();
  };

  return (
    <>
      {expanded && (
        <Animated.View
          entering={FadeIn.duration(DURATION)}
          exiting={FadeOut.duration(DURATION)}
          style={StyleSheet.absoluteFill}>
          <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={close} />
        </Animated.View>
      )}

      <Animated.View
        style={[styles.container, { bottom: 24 + insets.bottom }, containerStyle]}>
        {expanded && (
          <Animated.View
            entering={FadeIn.duration(DURATION)}
            exiting={FadeOut.duration(DURATION)}
            style={styles.menuContainer}>
            <Pressable onPress={handleOpenChat}>
              <GlassSurface bordered borderRadius={12} style={styles.menuItem}>
                <Text style={styles.menuText}>💬 채팅 모드</Text>
              </GlassSurface>
            </Pressable>
            <Pressable onPress={handleAddExercise}>
              <GlassSurface bordered borderRadius={12} style={styles.menuItem}>
                <Text style={styles.menuText}>운동 추가</Text>
              </GlassSurface>
            </Pressable>
            <Pressable onPress={handleCopyRoutine}>
              <GlassSurface bordered borderRadius={12} style={styles.menuItem}>
                <Text style={styles.menuText}>이전 루틴 복사</Text>
              </GlassSurface>
            </Pressable>
          </Animated.View>
        )}

        <Pressable onPress={toggle} style={styles.fab} testID="fab-button">
          <Animated.Text style={[styles.fabIcon, iconStyle]}>+</Animated.Text>
        </Pressable>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.3)' },
  container: { position: 'absolute', right: 24, alignItems: 'flex-end' },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DarkTheme.accentCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { color: DarkTheme.bgPrimary, fontSize: 28, fontWeight: '300', lineHeight: 30 },
  menuContainer: { alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  menuItem: { paddingVertical: 12, paddingHorizontal: 20 },
  menuText: { color: DarkTheme.textPrimary, fontSize: 14, fontWeight: '600' },
});
