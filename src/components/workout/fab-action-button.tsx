import { DarkTheme } from '@/constants/theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '../glass-surface';
import { haptic } from '@/lib/haptics';

interface FABActionButtonProps {
  onAddExercise: () => void;
  onCopyRoutine: () => void;
  onOpenChat: () => void;
  hidden?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DURATION = 120;

export function FABActionButton({
  onAddExercise,
  onCopyRoutine,
  onOpenChat,
  hidden = false,
}: FABActionButtonProps) {
  const insets = useSafeAreaInsets();
  const expandProgress = useSharedValue(0);
  const hiddenProgress = useSharedValue(0);

  const isOpen = () => expandProgress.value > 0.5;

  const toggle = () => {
    haptic.medium();
    expandProgress.value = withTiming(isOpen() ? 0 : 1, { duration: DURATION });
  };

  const close = () => {
    expandProgress.value = withTiming(0, { duration: DURATION });
  };

  // Hidden animation
  const prevHidden = useSharedValue(hidden);
  if (prevHidden.value !== hidden) {
    prevHidden.value = hidden;
    hiddenProgress.value = withTiming(hidden ? 200 : 0, { duration: 200 });
  }

  // FAB container animated style (hidden slide)
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hiddenProgress.value }],
  }));

  // FAB icon rotation
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(expandProgress.value, [0, 1], [0, 45])}deg` },
    ],
  }));

  // Backdrop opacity
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
    pointerEvents: expandProgress.value > 0 ? 'auto' : 'none',
  }));

  // Menu items
  const menuStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
    transform: [
      { translateY: interpolate(expandProgress.value, [0, 1], [8, 0]) },
    ],
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
      {/* Backdrop */}
      <AnimatedPressable
        style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        onPress={close}
      />

      {/* FAB + Menu container */}
      <Animated.View
        style={[
          styles.container,
          { bottom: 24 + insets.bottom },
          containerStyle,
        ]}
      >
        {/* Menu items */}
        <Animated.View style={[styles.menuContainer, menuStyle]}>
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

        {/* FAB button */}
        <Pressable onPress={toggle} style={styles.fab} testID="fab-button">
          <Animated.Text style={[styles.fabIcon, iconStyle]}>+</Animated.Text>
        </Pressable>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    position: 'absolute',
    right: 24,
    alignItems: 'flex-end',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DarkTheme.accentCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    color: DarkTheme.bgPrimary,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
  menuContainer: {
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuText: {
    color: DarkTheme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
