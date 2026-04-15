# Record UX 개선 (자동저장 깜빡임 / 토스트 / 운동명 중복 검사) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 운동 기록 화면의 자동저장 깜빡임을 제거하고, 저장 피드백 토스트를 추가하며, 새 운동 등록 시 동일 이름 중복을 감지해 기존 운동 재사용을 유도한다.

**Architecture:** 3개 영역으로 분리한 작은 변경 묶음. (1) Glass 디자인을 따르는 자체 토스트 시스템 신규(zustand store + Reanimated 컴포넌트). (2) 자동저장 경로에서 `loadRoutines()` 제거 + `useEffect([routines])` 의미적 동등성 검사로 불필요한 리렌더 차단. (3) `exercises/create.tsx`에서 클라이언트 측 정규화 비교로 중복 검출, `Alert.alert`로 "기존 운동 사용?" 확인, `workout-store.pendingExerciseToAdd` 임시 필드를 통해 record 화면이 `useFocusEffect`로 자동 추가.

**Tech Stack:** Expo SDK 55, React 19, React Native 0.83, TypeScript 5.9 strict, Zustand 5, Reanimated 4, expo-router (typed routes), React Compiler, Maestro (E2E).

**Spec:** `jealth-app/docs/superpowers/specs/2026-04-15-record-ux-improvements-design.md`

**Worktree (CLAUDE.md 규칙):**
```bash
cd jealth-app
git worktree add .worktrees/record-ux-improvements -b record-ux-improvements stage
cd .worktrees/record-ux-improvements
```
(stage 브랜치가 없으면 main 기준)

**테스트 전략 주의:** 이 프로젝트는 Jest 단위 테스트 셋업이 없고 Maestro E2E만 사용한다. 따라서 각 태스크는 strict TDD가 아닌 "구현 → 수동 확인 → 커밋" 패턴이며, E2E는 마지막에 모아서 추가한다.

---

## Task 1: 토스트 store 생성

**Files:**
- Create: `src/stores/toast-store.ts`

**Why:** 토스트의 단일 진실 원천. `current` 한 개 필드만 두고 마지막 호출이 이전을 덮어쓰는 단순 모델 (큐잉 없음 → 자동저장 연타 시 누적 방지).

- [ ] **Step 1: 파일 작성**

```ts
// src/stores/toast-store.ts
import { create } from 'zustand';

export type ToastVariant = 'success' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  current: ToastItem | null;
  show: (opts: { message: string; variant: ToastVariant }) => void;
  hide: () => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  current: null,
  show: ({ message, variant }) =>
    set({ current: { id: nextId++, message, variant } }),
  hide: () => set({ current: null }),
}));
```

- [ ] **Step 2: 타입 체크 통과 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (이 파일 관련).

- [ ] **Step 3: 커밋**

```bash
git add src/stores/toast-store.ts
git commit -m "feat(toast): add toast store with single-current model"
```

---

## Task 2: 토스트 컴포넌트 + Host 생성

**Files:**
- Create: `src/components/ui/toast.tsx`

**Why:** Glass 디자인에 맞춘 자체 토스트. `ToastHost`는 루트에 한 번만 마운트되어 store를 구독하고, `Toast`는 mount/unmount 애니메이션을 담당.

기존 `GlassSurface` 사용 (`src/components/glass-surface.tsx`). 색상 토큰 (`statusSuccess`, `statusDanger`) 은 이미 theme에 존재 — 추가 변경 불필요.

- [ ] **Step 1: 파일 작성**

```tsx
// src/components/ui/toast.tsx
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  }, [item.id]);

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
      {current && <Toast key={current.id} item={current} onAutoHide={hide} />}
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
```

- [ ] **Step 2: GlassSurface props 시그니처 일치 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음. 만약 `GlassSurface`의 prop 이름이 다르면 `src/components/glass-surface.tsx`를 보고 맞춰 수정.

- [ ] **Step 3: 커밋**

```bash
git add src/components/ui/toast.tsx
git commit -m "feat(toast): add Toast component and ToastHost"
```

---

## Task 3: 루트에 ToastHost 마운트

**Files:**
- Modify: `src/app/_layout.tsx`

**Why:** 토스트가 모든 화면 위에 떠야 하므로 루트에 한 번 마운트.

- [ ] **Step 1: import 추가**

`src/app/_layout.tsx` 상단 import 그룹에 추가:

```tsx
import { ToastHost } from '@/components/ui/toast';
```

- [ ] **Step 2: `<Slot />` 다음에 `<ToastHost />` 마운트**

기존:
```tsx
<GestureHandlerRootView style={{ flex: 1 }}>
  <ThemeProvider value={NavigationDark}>
    <StatusBar style="light" />
    <AnimatedSplashOverlay />
    <Slot />
  </ThemeProvider>
</GestureHandlerRootView>
```

변경:
```tsx
<GestureHandlerRootView style={{ flex: 1 }}>
  <ThemeProvider value={NavigationDark}>
    <StatusBar style="light" />
    <AnimatedSplashOverlay />
    <Slot />
    <ToastHost />
  </ThemeProvider>
</GestureHandlerRootView>
```

- [ ] **Step 3: 수동 확인**

개발 서버 띄우고 어디서든 `useToastStore.getState().show({ message: '테스트', variant: 'success' })` 를 임시로 호출해서 토스트가 상단에 뜨는지 확인 (확인 후 임시 호출 코드 제거).

- [ ] **Step 4: 커밋**

```bash
git add src/app/_layout.tsx
git commit -m "feat(toast): mount ToastHost at root layout"
```

---

## Task 4: workout-store에 pendingExerciseToAdd 추가

**Files:**
- Modify: `src/stores/workout-store.ts`

**Why:** create 화면 → record 화면으로 "이 기존 운동을 오늘 루틴에 추가해줘" 신호 전달용 임시 필드.

- [ ] **Step 1: 인터페이스에 필드 추가**

`src/stores/workout-store.ts` 의 `WorkoutState` 인터페이스 (line 17-31) 변경:

```ts
import type { WorkoutRoutine, CreateRoutinePayload, Exercise } from '@/types/workout';

interface WorkoutState {
  selectedDate: string;
  routines: WorkoutRoutine[];
  isLoading: boolean;
  pendingExerciseToAdd: Exercise | null;

  setDate: (date: string) => void;
  loadRoutines: () => Promise<void>;
  addRoutine: (data: CreateRoutinePayload) => Promise<WorkoutRoutine>;
  updateRoutine: (
    id: string,
    data: Partial<CreateRoutinePayload>,
  ) => Promise<WorkoutRoutine>;
  deleteRoutine: (id: string) => Promise<void>;
  copyFromRoutine: (sourceId: string) => Promise<WorkoutRoutine>;
  setPendingExerciseToAdd: (e: Exercise | null) => void;
}
```

`Exercise` 타입이 `@/types/workout`에 export 되어 있는지 확인 — 안 되어 있으면 `import type { Exercise } from '@/types/workout'` 가 실패함. 그 경우 import 위치를 수정.

- [ ] **Step 2: store 초기 상태 + 액션 구현 추가**

`create<WorkoutState>((set, get) => ({ ... }))` 안에 추가:

```ts
  // 기존 selectedDate, routines, isLoading 다음에:
  pendingExerciseToAdd: null,

  // 기존 액션들 다음에:
  setPendingExerciseToAdd: (e) => {
    set({ pendingExerciseToAdd: e });
  },
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add src/stores/workout-store.ts
git commit -m "feat(workout-store): add pendingExerciseToAdd signal field"
```

---

## Task 5: record.tsx — saveToServer 정리 (loadRoutines 제거 + 토스트 + dirty 처리)

**Files:**
- Modify: `src/app/(tabs)/record.tsx`

**Why:** 깜빡임의 직접 원인 제거. 자동저장 성공 시 store만 갱신되도록(이미 `updateRoutine`에서 in-place 교체됨) `loadRoutines()` 호출을 빼고, 성공/실패 토스트를 노출. dirty 처리는 try/catch 분기로 이동해 실패 시 retry 가능하도록.

- [ ] **Step 1: import 추가**

`record.tsx` 상단 import 그룹에 추가:

```tsx
import { useToast } from '@/components/ui/toast';
```

- [ ] **Step 2: 컴포넌트 안에서 toast 훅 호출**

`export default function RecordScreen()` 함수 시작부, 다른 훅 호출들 옆에 추가:

```tsx
const toast = useToast();
```

- [ ] **Step 3: `scheduleSave`에서 setDirty(false) 제거**

기존 (`record.tsx:97-104`):
```tsx
const scheduleSave = useCallback(() => {
  if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  saveTimerRef.current = setTimeout(() => {
    saveTimerRef.current = null;
    setDirty(false);                  // ← 제거
    saveToServerRef.current();
  }, 1500);
}, []);
```

변경:
```tsx
const scheduleSave = useCallback(() => {
  if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  saveTimerRef.current = setTimeout(() => {
    saveTimerRef.current = null;
    saveToServerRef.current();
  }, 1500);
}, []);
```

- [ ] **Step 4: `saveToServer` 변경 — loadRoutines 제거 + 토스트 + dirty 처리**

기존 (`record.tsx:123-131`):
```tsx
const saveToServer = useCallback(async () => {
  if (!routineId) return;
  try {
    await updateRoutine(routineId, buildPayload(latestExercisesRef.current));
    await loadRoutines();
  } catch (e) {
    console.warn('saveToServer failed:', e);
  }
}, [routineId, buildPayload, updateRoutine, loadRoutines]);
```

변경:
```tsx
const saveToServer = useCallback(async () => {
  if (!routineId) return;
  try {
    await updateRoutine(routineId, buildPayload(latestExercisesRef.current));
    setDirty(false);
    toast({ message: '저장 완료', variant: 'success' });
  } catch (e) {
    console.warn('saveToServer failed:', e);
    toast({ message: '저장 실패', variant: 'error' });
    // dirty 유지 → 다음 사용자 입력 시 scheduleSave가 다시 발동
  }
}, [routineId, buildPayload, updateRoutine, toast]);
```

`loadRoutines`가 deps에서 빠졌다는 점 주의.

- [ ] **Step 5: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 6: 수동 확인**

개발 서버에서 record 화면 → 운동 추가 → 다이얼 1회 변경 → 1.5초 대기 → 상단에 "✅ 저장 완료" 토스트 노출 + 카드가 깜빡이지 않는지 확인.

- [ ] **Step 7: 커밋**

```bash
git add src/app/\(tabs\)/record.tsx
git commit -m "fix(record): remove loadRoutines from autosave to stop flicker; add save toast"
```

---

## Task 6: record.tsx — useEffect([routines]) 의미적 동등성 검사

**Files:**
- Modify: `src/app/(tabs)/record.tsx`

**Why:** Task 5로도 부족. `workout-store.updateRoutine` 자체가 `routines` 배열을 새 참조로 교체하므로 effect는 여전히 트리거됨 → `setLocalExercises(routines[0].exercises)` 로 객체 참조가 새로 할당되어 자식 카드 리렌더 발생. 자동저장 직후처럼 값이 동일할 때는 setLocalExercises를 스킵.

- [ ] **Step 1: useEffect 변경**

기존 (`record.tsx:82-91`):
```tsx
useEffect(() => {
  if (routines.length > 0) {
    setLocalExercises(routines[0].exercises);
    setRoutineId(routines[0].id);
  } else {
    setLocalExercises([]);
    setRoutineId(undefined);
  }
  setDirty(false);
}, [routines]);
```

변경:
```tsx
useEffect(() => {
  if (routines.length === 0) {
    setLocalExercises([]);
    setRoutineId(undefined);
    setDirty(false);
    return;
  }
  const incoming = routines[0];
  if (
    incoming.id === routineId &&
    JSON.stringify(incoming.exercises) ===
      JSON.stringify(latestExercisesRef.current)
  ) {
    // 자동저장 결과처럼 값이 동일하면 스킵 (리렌더 방지)
    return;
  }
  setLocalExercises(incoming.exercises);
  setRoutineId(incoming.id);
  setDirty(false);
}, [routines]);
```

deps에 `routineId`, `latestExercisesRef`를 넣지 않는 이유: routineId가 바뀔 때마다 effect를 재실행하면 안 됨 — 유일한 트리거는 routines 자체. ref는 deps 대상 아님.

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 수동 확인**

다이얼을 빠르게 여러 번 조정 → 1.5초마다 토스트 뜨고 화면 깜빡임 없음. 날짜 전환/운동 추가 시에는 정상적으로 데이터가 갱신되는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/app/\(tabs\)/record.tsx
git commit -m "fix(record): skip localExercises sync when routines payload is unchanged"
```

---

## Task 7: record.tsx — 즉시 저장 액션의 Alert를 toast로 교체

**Files:**
- Modify: `src/app/(tabs)/record.tsx`

**Why:** 일관성. 저장 실패 신호는 모두 토스트로. 단, 사용자 확인이 필요한 다이얼로그(이전 루틴 복사 옵션 선택)는 그대로 Alert 유지.

- [ ] **Step 1: `handleSelectExercise` 의 Alert 교체**

기존 (`record.tsx` 의 `handleSelectExercise` 안 두 catch 블록):
```tsx
} catch (e: unknown) {
  Alert.alert('오류', e instanceof Error ? e.message : '추가 실패');
}
```

변경 (둘 다):
```tsx
} catch (e: unknown) {
  toast({
    message: e instanceof Error ? e.message : '추가 실패',
    variant: 'error',
  });
}
```

- [ ] **Step 2: `handleDeleteExercise` 의 Alert 교체**

기존:
```tsx
} catch (e) {
  console.error('Delete routine failed:', e);
  Alert.alert('오류', '루틴 삭제에 실패했습니다.');
  await loadRoutines();
}
```

변경:
```tsx
} catch (e) {
  console.error('Delete routine failed:', e);
  toast({ message: '삭제 실패', variant: 'error' });
  await loadRoutines();
}
```

- [ ] **Step 3: `handleCopyRoutine` 내부 doCopy/doAppend/doOverwrite catch의 Alert 교체**

3개 catch 블록 모두:
```tsx
} catch (e: unknown) {
  Alert.alert('오류', e instanceof Error ? e.message : '...');
}
```
→
```tsx
} catch (e: unknown) {
  toast({
    message: e instanceof Error ? e.message : '복사 실패',
    variant: 'error',
  });
}
```
"붙여넣기 실패", "덮어쓰기 실패", "복사 실패"는 각 분기에 맞게 메시지 조정.

- [ ] **Step 4: 사용자 확인 다이얼로그는 유지**

`handleCopyRoutine` 의 메인 `Alert.alert('이전 루틴 복사', ...)` (선택 다이얼로그) 는 **변경하지 않음**. `handleSubmit` 의 "운동 이름을 입력하세요" 도 create 화면에 있으므로 여기 해당 없음.

- [ ] **Step 5: 사용 안 하는 import 정리**

`Alert` 가 더 이상 어디서도 안 쓰이면 import에서 제거. 메인 다이얼로그(이전 루틴 복사)에서 여전히 쓰면 유지.

Run: `npx tsc --noEmit`
Expected: 에러 없음. 미사용 import 경고 시 제거.

- [ ] **Step 6: 커밋**

```bash
git add src/app/\(tabs\)/record.tsx
git commit -m "refactor(record): replace error Alerts with toasts (keep choice dialogs)"
```

---

## Task 8: exercises/create.tsx — 운동명 중복 검사 + 다이얼로그 + 신호 세팅

**Files:**
- Modify: `src/app/exercises/create.tsx`

**Why:** submit 직전에 store의 exercises 목록과 정규화 비교. 중복이면 "기존 운동 사용?" Alert. "네" → `pendingExerciseToAdd` 세팅 + back. "아니오" → 머무름.

- [ ] **Step 1: import 추가**

`create.tsx` 상단:

```tsx
import { useWorkoutStore } from '@/stores/workout-store';
```

`useExerciseStore` import에서 `exercises`, `loadExercises` 도 함께 destructure.

- [ ] **Step 2: store 데이터/액션 가져오기**

기존 (`create.tsx:27-28`):
```tsx
const { muscleGroups, loadMuscleGroups, addExercise, uploadImage } =
  useExerciseStore();
```

변경:
```tsx
const { muscleGroups, exercises, loadMuscleGroups, loadExercises, addExercise, uploadImage } =
  useExerciseStore();
const setPendingExerciseToAdd = useWorkoutStore((s) => s.setPendingExerciseToAdd);
```

- [ ] **Step 3: 화면 진입 시 exercises 로드**

기존 (`create.tsx:36-38`):
```tsx
useEffect(() => {
  loadMuscleGroups();
}, [loadMuscleGroups]);
```

변경:
```tsx
useEffect(() => {
  loadMuscleGroups();
  loadExercises();
}, [loadMuscleGroups, loadExercises]);
```

- [ ] **Step 4: handleSubmit에 중복 검사 추가**

기존 (`create.tsx:58-80`):
```tsx
const handleSubmit = async () => {
  if (!name.trim()) {
    Alert.alert('오류', '운동 이름을 입력하세요.');
    return;
  }
  setSubmitting(true);
  try {
    const exercise = await addExercise({ ... });
    if (imageUri) { await uploadImage(exercise.id, imageUri); }
    router.back();
  } catch (e: unknown) {
    Alert.alert('오류', e instanceof Error ? e.message : '등록에 실패했습니다.');
  } finally {
    setSubmitting(false);
  }
};
```

변경:
```tsx
const normalize = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, ' ');

const handleSubmit = async () => {
  if (!name.trim()) {
    Alert.alert('오류', '운동 이름을 입력하세요.');
    return;
  }

  const duplicate = exercises.find(
    (e) => normalize(e.name) === normalize(name),
  );

  if (duplicate) {
    Alert.alert(
      '동일한 이름의 운동이 있습니다',
      `"${duplicate.name}" 운동을 오늘 루틴에 추가하시겠습니까?`,
      [
        { text: '아니오, 다른 이름으로 등록', style: 'cancel' },
        {
          text: '네, 기존 운동 추가',
          onPress: () => {
            setPendingExerciseToAdd(duplicate);
            router.back();
          },
        },
      ],
    );
    return;
  }

  setSubmitting(true);
  try {
    const exercise = await addExercise({
      name: name.trim(),
      equipment: equipment.trim() || undefined,
      muscleGroupIds:
        selectedMuscleIds.length > 0 ? selectedMuscleIds : undefined,
    });
    if (imageUri) {
      await uploadImage(exercise.id, imageUri);
    }
    router.back();
  } catch (e: unknown) {
    Alert.alert('오류', e instanceof Error ? e.message : '등록에 실패했습니다.');
  } finally {
    setSubmitting(false);
  }
};
```

- [ ] **Step 5: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 6: 수동 확인 (1) — 중복 X**

새 운동 등록 → 기존에 없는 이름 입력 → 등록하기 → 정상 등록되고 record로 돌아옴. (단, 이번 변경에서는 신규 등록 후 자동 추가 안 함 — spec 결정 사항.)

- [ ] **Step 7: 수동 확인 (2) — 중복 O**

새 운동 등록 → 이미 존재하는 이름 입력 (대소문자/공백 변형 포함) → 등록하기 → 다이얼로그 노출 → "아니오" 시 머무름, "네" 시 record로 돌아옴 (자동 추가는 다음 태스크에서 구현되므로 아직 카드는 안 추가됨).

- [ ] **Step 8: 커밋**

```bash
git add src/app/exercises/create.tsx
git commit -m "feat(exercise-create): detect duplicate name and offer reuse dialog"
```

---

## Task 9: record.tsx — useFocusEffect로 pendingExerciseToAdd 처리

**Files:**
- Modify: `src/app/(tabs)/record.tsx`

**Why:** Task 8에서 세팅한 신호를 record 화면이 포커스될 때 감지해 `handleSelectExercise` 호출 → 자동으로 오늘 루틴에 추가.

- [ ] **Step 1: import 추가**

`record.tsx` 상단:

```tsx
import { useFocusEffect } from 'expo-router';
```

(만약 `expo-router`에서 export되지 않으면 `from '@react-navigation/native'`로 변경.)

- [ ] **Step 2: store에서 신호 + setter 가져오기**

기존 useWorkoutStore destructure에 추가:

```tsx
const {
  selectedDate,
  routines,
  isLoading,
  setDate,
  loadRoutines,
  addRoutine,
  updateRoutine,
  deleteRoutine,
  copyFromRoutine,
  pendingExerciseToAdd,           // 추가
  setPendingExerciseToAdd,        // 추가
} = useWorkoutStore();
```

- [ ] **Step 3: useFocusEffect 추가**

`return (` 직전(다른 hook들 아래)에 추가:

```tsx
useFocusEffect(
  useCallback(() => {
    if (pendingExerciseToAdd) {
      const ex = pendingExerciseToAdd;
      setPendingExerciseToAdd(null);  // 먼저 클리어 → 재진입 방지
      handleSelectExercise(ex);
    }
  }, [pendingExerciseToAdd, handleSelectExercise, setPendingExerciseToAdd]),
);
```

`handleSelectExercise` 가 이 useFocusEffect 호출보다 위에 정의되어 있어야 함 (현재 record.tsx:169 정의 → 그 아래에 useFocusEffect 두면 OK).

- [ ] **Step 4: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 5: 수동 확인 — 전체 플로우**

1. record 화면 (오늘 날짜) → "운동 추가" → picker → "새 운동 등록"
2. 이미 존재하는 이름 입력 → 등록하기
3. 다이얼로그에서 "네, 기존 운동 추가" 탭
4. record 화면으로 돌아오면서 해당 운동 카드가 오늘 루틴에 자동 추가되는지 확인
5. 추가 시 picker 경로와 동일하게 빈 set 1개로 시작하는지 확인

- [ ] **Step 6: 커밋**

```bash
git add src/app/\(tabs\)/record.tsx
git commit -m "feat(record): consume pendingExerciseToAdd on focus to auto-add"
```

---

## Task 10: Maestro E2E — 자동저장 토스트

**Files:**
- Create: `.maestro/record_autosave_toast.yaml`

**Why:** 자동저장 성공 시 토스트가 뜨는지 회귀 방지. (깜빡임 자체는 자동으로 검출 어려움 — 사용자 수동 확인.)

- [ ] **Step 1: 기존 maestro 플로우 확인**

`.maestro/` 폴더 구조와 기존 flow 형식을 본 뒤 동일한 패턴으로 작성. (로그인 처리, appId 등)

Run: `ls .maestro/` 또는 `find . -name "*.yaml" -path "*maestro*"`

- [ ] **Step 2: 플로우 작성**

```yaml
# .maestro/record_autosave_toast.yaml
appId: <기존 플로우의 appId 그대로>
---
- runFlow: login.yaml   # 기존 로그인 플로우 재사용 (없으면 인라인)
- tapOn: "기록"          # 기록 탭
- tapOn: "+ 운동 추가"   # 빈 상태 가정. 이미 운동이 있으면 FAB 버튼 사용
- tapOn:                 # picker에서 첫 운동 선택 (또는 검색)
    text: ".*"           # 첫 항목
    index: 0
- tapOn:                 # 다이얼 영역 (reps)
    id: "dial-reps"      # DialNumberInput에 testID 추가 필요 → 아래 Step 3 참조
- swipe:                 # 드래그로 값 변경
    from: { x: "50%", y: "50%" }
    to: { x: "50%", y: "30%" }
- waitForAnimationToEnd
- extendedWaitUntil:
    visible: "저장 완료"
    timeout: 3000
```

이 플로우는 testID에 의존하므로 다음 단계 필요.

- [ ] **Step 3: 필요한 testID 추가**

`DialNumberInput` 호출부에 testID 부여. `record.tsx`의 `<DialNumberInput value={set.reps} ... />` 가 아니라, 그 안 또는 부모에 `testID="dial-reps"` 추가. 단순히 가능한 위치에 더하기.

만약 testID 추가가 까다로우면 이 E2E는 텍스트 기반(예: "저장 완료" 텍스트만 검증)으로 간소화하고, 입력 트리거를 다른 액션(예: 운동 카드 삭제 + 토스트)으로 대체.

- [ ] **Step 4: 실행**

Run: `maestro test .maestro/record_autosave_toast.yaml`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add .maestro/record_autosave_toast.yaml
# (testID 추가가 있다면 해당 파일도)
git commit -m "test(e2e): verify autosave success toast"
```

---

## Task 11: Maestro E2E — 운동명 중복 다이얼로그

**Files:**
- Create: `.maestro/exercise_create_duplicate.yaml`

**Why:** 중복 다이얼로그와 자동 추가 흐름 회귀 방지.

- [ ] **Step 1: 사전 데이터 준비**

테스트 계정에 이미 등록된 운동 이름 1개를 알아두기 (예: "벤치프레스"). 없으면 플로우 첫 부분에서 신규 등록 후 다시 같은 이름으로 시도.

- [ ] **Step 2: 플로우 작성**

```yaml
# .maestro/exercise_create_duplicate.yaml
appId: <기존 appId>
---
- runFlow: login.yaml
- tapOn: "기록"
- tapOn: "+ 운동 추가"
- tapOn: "새 운동 등록"
- tapOn:
    id: "exercise-name-input"  # create.tsx의 TextInput에 testID 추가 필요
- inputText: "벤치프레스"        # 기존 운동 이름과 동일
- tapOn: "등록하기"
- assertVisible: "동일한 이름의 운동이 있습니다"
- tapOn: "네, 기존 운동 추가"
- assertVisible: "벤치프레스"     # record 화면에 카드가 추가되었는지
```

- [ ] **Step 3: testID 추가**

`create.tsx:96-102` 의 운동 이름 `<TextInput>` 에 `testID="exercise-name-input"` 추가.

- [ ] **Step 4: 실행**

Run: `maestro test .maestro/exercise_create_duplicate.yaml`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add .maestro/exercise_create_duplicate.yaml src/app/exercises/create.tsx
git commit -m "test(e2e): verify duplicate exercise dialog and auto-add flow"
```

---

## Task 12: 사용자 직접 테스트 → 최종 정리

- [ ] **Step 1: 전체 플로우 수동 검증**

체크리스트:
- 자동저장 시 화면 깜빡임 없음 (눈으로 확인)
- 자동저장 성공 시 "✅ 저장 완료" 토스트
- 네트워크 끊은 상태에서 다이얼 변경 → "⚠️ 저장 실패" 토스트, 다시 변경하면 재시도됨
- 운동 카드 삭제 실패 시 "삭제 실패" 토스트
- 새 운동 등록 — 신규 이름은 정상 등록 후 record 복귀 (자동 추가 X)
- 새 운동 등록 — 기존 이름 (대소문자/공백 변형 포함)은 다이얼로그 노출
  - "아니오" → 머무름, 이름 변경 가능
  - "네" → record 복귀 + 해당 운동 카드 자동 추가
- 날짜 변경, 이전 루틴 복사, 운동 picker 등 기존 동작은 모두 정상

- [ ] **Step 2: 사용자 승인 대기**

사용자가 "OK" 하면 다음 단계.

- [ ] **Step 3: stage 브랜치로 병합**

`finishing-a-development-branch` 스킬 또는 직접:

```bash
cd jealth-app
git checkout stage   # 또는 main
git merge record-ux-improvements --no-ff
git push origin stage
```

worktree 정리:
```bash
git worktree remove .worktrees/record-ux-improvements
git branch -d record-ux-improvements
```

---

## Self-Review

**Spec coverage 점검:**
- 깜빡임 해결 (loadRoutines 제거 + useEffect 동등성) → Task 5, 6 ✅
- 토스트 시스템 (store + 컴포넌트 + 마운트) → Task 1, 2, 3 ✅
- 토스트 사용처 (자동저장 성공/실패) → Task 5 ✅
- 즉시 저장 액션 Alert→Toast → Task 7 ✅
- 운동명 중복 검사 + 다이얼로그 → Task 8 ✅
- pendingExerciseToAdd 신호 → Task 4 (필드), Task 8 (set), Task 9 (consume) ✅
- E2E → Task 10, 11 ✅
- 수동 검증 → Task 12 ✅

**Placeholder 점검:** 없음.

**Type 일관성:** `setPendingExerciseToAdd`, `pendingExerciseToAdd`, `Exercise` 타입이 Task 4/8/9 전반에서 동일. `useToast`는 Task 2에서 정의 후 Task 5/7에서 동일하게 사용.

**알려진 가정/의존성:**
- `Exercise` 타입은 `@/types/workout` 에 export되어 있다고 가정 (Task 4 Step 1 에서 확인 필요)
- `GlassSurface` props (`bordered`, `borderRadius`, `style`) 시그니처가 spec과 일치한다고 가정 (Task 2 Step 2 에서 확인)
- `useFocusEffect` import 경로는 expo-router or react-navigation 환경에 맞춰 결정 (Task 9 Step 1)
- `.maestro/` 디렉토리와 기존 flow 패턴이 있다고 가정 (Task 10 Step 1 에서 확인)
