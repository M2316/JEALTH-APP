import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';

import { GlassSurface } from './glass-surface';
import { ThemedText } from './themed-text';

import { DarkTheme, MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/(tabs)" asChild>
            <TabButton>홈</TabButton>
          </TabTrigger>
          <TabTrigger name="record" href="/(tabs)/record" asChild>
            <TabButton>기록</TabButton>
          </TabTrigger>
          <TabTrigger name="stats" href="/(tabs)/stats" asChild>
            <TabButton>통계</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/(tabs)/settings" asChild>
            <TabButton>설정</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View
        style={[
          styles.tabButtonView,
          {
            backgroundColor: isFocused
              ? DarkTheme.accentCyanGlow
              : 'transparent',
          },
        ]}>
        <ThemedText
          type="small"
          style={{
            color: isFocused ? DarkTheme.accentCyan : DarkTheme.textSecondary,
          }}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <GlassSurface bordered borderRadius={Spacing.five} style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          Jealth
        </ThemedText>
        {props.children}
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
