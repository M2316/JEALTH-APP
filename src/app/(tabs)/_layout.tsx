import React from 'react';

import AppTabs from '@/components/app-tabs';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';

export default function TabsLayout() {
  const keyboardVisible = useKeyboardVisible();
  return <AppTabs hidden={keyboardVisible} />;
}
