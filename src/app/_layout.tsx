import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ToastHost } from '@/components/ui/toast';
import { DarkTheme as AppDark } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

const NavigationDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: AppDark.bgPrimary,
    card: AppDark.bgSurface,
    text: AppDark.textPrimary,
    border: AppDark.bgBorder,
    primary: AppDark.accentCyan,
  },
};

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadToken } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuth) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppDark.bgPrimary }}>
        <ActivityIndicator size="large" color={AppDark.accentCyan} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <BottomSheetModalProvider>
          <ThemeProvider value={NavigationDark}>
            <StatusBar style="light" />
            <AnimatedSplashOverlay />
            <Slot />
            <ToastHost />
          </ThemeProvider>
        </BottomSheetModalProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
