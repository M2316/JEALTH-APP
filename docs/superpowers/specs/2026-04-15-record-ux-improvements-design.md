# 운동 기록 화면 UX 개선 (자동저장 깜빡임 / 토스트 / 운동명 중복 검사)

- 작성일: 2026-04-15
- 대상 repo: `jealth-app` (앱 단독 작업, API 변경 없음)
- 관련 화면: `src/app/(tabs)/record.tsx`, `src/app/exercises/create.tsx`

## 배경 / 문제

운동 기록 화면(`record.tsx`)은 사용자가 다이얼을 드래그해 reps/weight를 조정하면 1.5초 debounce 후 서버에 자동저장한다. 현재 다음 세 가지 UX 문제가 있다.

1. **저장 시 화면이 깜빡인다.** 자동저장 성공 후 `loadRoutines()`로 서버 데이터를 다시 받아 `localExercises`를 통째로 덮어쓰면서 운동 카드 전체가 리렌더된다.
2. **저장 성공 여부에 대한 가시적 피드백이 없다.** 사용자는 "정말 저장됐는지" 확신할 수 없다.
3. **운동 등록 시 같은 이름의 운동이 이미 있어도 중복 등록이 가능하다.** 운동 사전에 동일 이름이 누적된다.

이 스펙은 위 3가지를 한 PR로 해결한다. (스크롤 부자연스러움은 사용자 재테스트 후 별도 진행 — 이번 스코프 외)

## 결정 사항 요약

| # | 결정 | 근거 |
|---|---|---|
| 1 | 자동저장 성공 후 `loadRoutines()` 호출을 제거. 낙관적 업데이트로 store만 갱신. | 깜빡임의 직접 원인. `workout-store.updateRoutine`이 이미 응답을 받아 store routines를 in-place 교체한다. 추가 fetch 불필요. |
| 2 | `useEffect([routines])`에서 의미적 동등성 검사 후 동일하면 setLocalExercises를 스킵. | 자동저장 결과(같은 값)로 인한 불필요한 리렌더 차단. 외부 변경(날짜/픽커/복사)은 여전히 흡수. |
| 3 | 자체 토스트 시스템 신규 구현 (Glass 디자인 일관성). | 서드파티 토스트는 디자인 시스템과 이질감. 의존성 추가 회피. |
| 4 | 토스트 트리거: 자동저장 **성공**만 + 모든 저장 액션의 **실패**. | 즉각적인 명시적 액션은 결과가 화면에 즉시 보이므로 성공 토스트가 노이즈. 자동저장은 비가시적이므로 안심 신호 필요. 실패는 어떤 액션이든 알아야 한다. |
| 5 | 운동명 중복 검사는 **클라이언트만**. submit 시 1회. | 운동은 사용자 개인 사전(`createdBy`로 유저별 묶임). 1인 1계정이라 race 위험 없음. 즉각 피드백 + 네트워크 라운드트립 회피. |
| 6 | 중복 발견 시 `Alert.alert`로 "기존 운동을 오늘 루틴에 추가하시겠습니까?" 다이얼로그. "네" → 신규 등록 취소 + 기존 운동을 오늘 루틴에 자동 추가 후 record 복귀. | 사용자가 항상 "운동 추가" 맥락에서 이 화면에 도달한다는 전제. 다이얼로그가 약속한 행동을 그대로 수행. |
| 7 | record↔create 간 신호 전달은 `workout-store.pendingExerciseToAdd` 임시 필드 사용. | 타입 안전, 라우터 의존 X. expo-router search params는 string만 지원하고 tab 라우팅과 충돌 위험. |

## 1. 자동저장 깜빡임 해결

### 현재 동작 (`record.tsx`)

```ts
const saveToServer = useCallback(async () => {
  if (!routineId) return;
  try {
    await updateRoutine(routineId, buildPayload(latestExercisesRef.current));
    await loadRoutines();   // ← 깜빡임 원인
  } catch (e) {
    console.warn('saveToServer failed:', e);
  }
}, [...]);

useEffect(() => {
  if (routines.length > 0) {
    setLocalExercises(routines[0].exercises);  // ← routines가 새 객체라 항상 트리거
    setRoutineId(routines[0].id);
  } else { ... }
  setDirty(false);
}, [routines]);
```

`workout-store.updateRoutine`는 이미 응답으로 받은 routine으로 store의 해당 항목을 in-place 교체한다(`workout-store.ts:59-65`). 따라서 `loadRoutines()`는 불필요하고, 그 호출이 routines 객체 전체 참조를 새로 만들어 effect를 트리거하는 게 아니라 — `updateRoutine`만으로도 routines 배열이 새 참조가 되므로 — 효과는 동일하게 발생한다. 따라서 **두 가지를 함께 처리**해야 한다:

### 변경

**(a) `record.tsx::saveToServer`에서 `loadRoutines()` 제거 + 토스트 + dirty 처리 정리**

```ts
const saveToServer = useCallback(async () => {
  if (!routineId) return;
  try {
    await updateRoutine(routineId, buildPayload(latestExercisesRef.current));
    setDirty(false);
    toast.show({ message: '저장 완료', variant: 'success' });
  } catch (e) {
    console.warn('saveToServer failed:', e);
    toast.show({ message: '저장 실패', variant: 'error' });
    // dirty 유지 → 다음 액션 시 자연스러운 retry
  }
}, [routineId, buildPayload, updateRoutine, toast]);
```

`scheduleSave`의 timer 콜백에서 `setDirty(false)`를 미리 하던 부분 제거 → `saveToServer` 내부의 try/catch에서 결정.

**(b) `record.tsx::useEffect([routines])`에서 의미적 동등성 검사**

```ts
useEffect(() => {
  if (routines.length === 0) {
    setLocalExercises([]);
    setRoutineId(undefined);
    setDirty(false);
    return;
  }
  const incoming = routines[0];
  // 자동저장 결과처럼 값이 사실상 동일하면 스킵
  if (
    incoming.id === routineId &&
    JSON.stringify(incoming.exercises) === JSON.stringify(latestExercisesRef.current)
  ) {
    return;
  }
  setLocalExercises(incoming.exercises);
  setRoutineId(incoming.id);
  setDirty(false);
}, [routines]);
```

`JSON.stringify` 비교는 구조가 단순(reps/weight/order/sets)하고 키 순서가 안정적이라 충분. deep-equal 라이브러리 도입 불필요.

### 영향 범위

- `loadRoutines()`는 다음 경로에서만 호출됨 (그대로 유지):
  - 날짜 변경 시 (`useEffect([selectedDate])`)
  - 운동 추가 (`handleSelectExercise`)
  - 복사 (`doCopy`, `doOverwrite`, `doAppend`)
  - 운동 카드 삭제 (`handleDeleteExercise`)
- 자동저장 경로에서만 제거.

## 2. 토스트 시스템

### 파일 구성

- **신규** `src/stores/toast-store.ts` — Zustand store
- **신규** `src/components/ui/toast.tsx` — `Toast` 컴포넌트, `ToastHost`, `useToast()` 훅
- **수정** `src/app/_layout.tsx` — 루트에 `<ToastHost />` 마운트 (GestureHandlerRootView 안쪽)
- **수정** `src/constants/theme.ts` — `accentRed: '#FF6B6B'` 추가

### Store

```ts
type ToastVariant = 'success' | 'error';
interface ToastState {
  current: { id: number; message: string; variant: ToastVariant } | null;
  show: (opts: { message: string; variant: ToastVariant }) => void;
  hide: () => void;
}
```

- `show()` 호출 시 새 id 부여, `current` 교체. 큐잉 없음 — 마지막 토스트만 표시. (자동저장 연타 시 누적 방지)
- `hide()` 는 `current = null`.

### 컴포넌트

- `ToastHost`: store 구독. `current` 변경 시 mount/unmount. SafeArea top + 8px에 absolute 배치, `pointerEvents="box-none"` 으로 하위 터치 통과.
- `Toast`:
  - `GlassSurface bordered` 캡슐 (border-radius 22).
  - 좌측 아이콘: success → `✅`, error → `⚠️`.
  - 텍스트: `Fonts.body`, 14px, weight 600, `DarkTheme.textPrimary`.
  - border 색: success → `DarkTheme.accentCyan`, error → `DarkTheme.accentRed`.
  - 패딩: 가로 `Spacing.md`, 세로 `Spacing.sm`.
- 애니메이션 (Reanimated 4):
  - mount: `translateY: -40 → 0`, `opacity: 0 → 1`, `withSpring({ damping: 18, stiffness: 220 })`.
  - 자동 닫힘 타이머: success 1500ms, error 3000ms.
  - dismiss: `translateY: 0 → -40`, `opacity: 1 → 0`, `withTiming(200)` → 완료 후 `hide()`.
- 새 토스트가 들어오면 기존 타이머 클리어 후 새 자동 닫힘 타이머 설정.

### 사용처 (`record.tsx`)

| 위치 | 토스트 |
|---|---|
| `saveToServer` 성공 | `success` "저장 완료" |
| `saveToServer` 실패 | `error` "저장 실패" |
| `handleSelectExercise` 실패 | 기존 `Alert.alert('오류', ...)` → `error` "추가 실패: ${메시지}" |
| `handleDeleteExercise` 실패 | 기존 `Alert.alert('오류', '루틴 삭제에 실패했습니다.')` → `error` "삭제 실패" |
| `handleCopyRoutine` 의 doCopy/doAppend/doOverwrite 실패 | 기존 `Alert.alert('오류', ...)` → `error` 메시지 |

다음 `Alert.alert`는 **유지** (사용자 확인이 필요한 다이얼로그):
- `handleCopyRoutine`의 "이전 루틴 복사 — 붙여넣기/덮어쓰기" 선택 다이얼로그.

## 3. 운동명 중복 검사

### 파일 구성

- **수정** `src/app/exercises/create.tsx`
- **수정** `src/stores/workout-store.ts` — `pendingExerciseToAdd` 필드 + setter

### `exercises/create.tsx` 변경

```ts
const { exercises, loadExercises, addExercise, uploadImage } = useExerciseStore();
const { setPendingExerciseToAdd } = useWorkoutStore();

useEffect(() => {
  loadMuscleGroups();
  loadExercises();   // ← 추가. 중복 검사용 최신 목록 보장
}, [loadMuscleGroups, loadExercises]);

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

  // 기존 등록 로직 그대로
  setSubmitting(true);
  try { ... } finally { setSubmitting(false); }
};
```

정규화 규칙: 앞뒤 공백 제거 + 소문자 + 연속 공백을 1개로. ("벤치프레스" / "벤치프레스 " / "Bench press" / "bench  press" 동일 처리).

### `workout-store.ts` 변경

```ts
interface WorkoutState {
  ...
  pendingExerciseToAdd: Exercise | null;
  setPendingExerciseToAdd: (e: Exercise | null) => void;
}

// initial: pendingExerciseToAdd: null,
setPendingExerciseToAdd: (e) => set({ pendingExerciseToAdd: e }),
```

### `record.tsx` 신호 처리

```ts
const { pendingExerciseToAdd, setPendingExerciseToAdd } = useWorkoutStore();

useFocusEffect(
  useCallback(() => {
    if (pendingExerciseToAdd) {
      const ex = pendingExerciseToAdd;
      setPendingExerciseToAdd(null);     // 먼저 클리어 → 재진입 방지
      handleSelectExercise(ex);
    }
  }, [pendingExerciseToAdd, handleSelectExercise, setPendingExerciseToAdd]),
);
```

`handleSelectExercise`는 이미 picker에서 호출되는 함수이므로 그대로 재사용. 내부에서 routine 생성/업데이트 + `loadRoutines()` 호출.

## 4. 데이터 흐름 다이어그램

### 자동저장 (변경 후)

```
[다이얼 드래그]
  → setLocalExercises (즉시 UI 반영)
  → setDirty(true) + scheduleSave (1.5s debounce)
  → saveToServer:
      updateRoutine API
      ├ 성공: store.routines in-place 갱신 + setDirty(false) + toast.success
      └ 실패: toast.error  (dirty 유지 → 다음 액션 시 retry)

[useEffect([routines])]:
  새 routines vs latestExercisesRef 의미적 동등성 검사
  ├ 동일: skip
  └ 다름: setLocalExercises(routines[0].exercises) (날짜/픽커/복사 등 외부 변경 흡수)
```

### 운동 등록 — 중복 검출

```
[create 화면] 등록하기 탭
  → exercises 목록에서 normalize 비교
  ├ 중복 없음: 기존 로직(addExercise → uploadImage → router.back())
  └ 중복 있음: Alert
      ├ "아니오": Alert 닫고 머무름
      └ "네": setPendingExerciseToAdd(duplicate) + router.back()
                  ↓
[record 화면 onFocus] pendingExerciseToAdd 감지
  → setPendingExerciseToAdd(null) 클리어
  → handleSelectExercise(duplicate) → 오늘 루틴에 추가
```

## 5. 에러 처리

- **자동저장 실패**: `setDirty(false)`를 try 성공 분기에서만 수행 → 실패 시 dirty 유지 → 다음 사용자 입력이 다시 scheduleSave 트리거 → 자연스러운 retry. 사용자에게는 error 토스트로 알림.
- **중복 검사 실패**: `loadExercises()` 가 실패하면 `exercises` 가 비거나 stale. 이 경우 중복 검사는 통과되어 신규 등록이 되며, 서버에 실제 중복이 들어갈 수 있음. 1인 사용 + 운동 사전 규모가 작아 사실상 무해. 향후 필요시 서버측 unique 제약 추가 (이번 스펙 외).
- **`pendingExerciseToAdd` 신호 누수**: `useFocusEffect` 진입 즉시 클리어 → 다른 화면으로 이동 후 record 재진입해도 재실행되지 않음.

## 6. 테스트 전략

### Maestro E2E (신규)

1. **`record_autosave_no_flicker.yaml`**
   - 운동 추가 → 다이얼 1회 변경 → 2초 대기 → "저장 완료" 토스트 visible 확인
   - 운동 카드의 reps 값이 변경된 값으로 유지되는지 텍스트 검증
   - 깜빡임 자체는 자동화로 검출 어려움 → 사용자 수동 확인.

2. **`exercise_create_duplicate.yaml`**
   - record → 운동 추가 → 새 운동 등록 → 이미 존재하는 이름 입력 → 등록하기
   - "동일한 이름의 운동이 있습니다" 다이얼로그 visible 확인
   - "네, 기존 운동 추가" 탭
   - record 화면에 해당 운동 카드 추가 확인

### 수동 검증 (사용자 직접)

- 깜빡임 부재 확인.
- 토스트 디자인 (위치, 색상, 애니메이션) 만족 여부.
- 같은 이름 등록 시도 — 다이얼로그 + 자동 추가 흐름.

## 7. 작업 순서

1. **토스트 시스템** (다른 변경에서 사용하므로 먼저)
   - theme `accentRed` 추가
   - `toast-store.ts` 생성
   - `toast.tsx` (Toast + ToastHost) 생성
   - `_layout.tsx` 에 ToastHost 마운트
2. **자동저장 깜빡임 해결**
   - `record.tsx::saveToServer` 정리 (loadRoutines 제거 + 토스트 + dirty 처리)
   - `record.tsx::useEffect([routines])` 동등성 검사 추가
   - `record.tsx::scheduleSave` timer 콜백에서 setDirty 제거
3. **운동명 중복 검사**
   - `workout-store.ts` `pendingExerciseToAdd` 추가
   - `exercises/create.tsx` loadExercises + 중복 검사 + 다이얼로그 + 신호 세팅
   - `record.tsx` `useFocusEffect` 로 신호 처리
4. **즉시 저장 액션의 Alert→Toast 일부 교체** (record.tsx 내 에러만)
5. **Maestro E2E 추가**
6. **사용자 직접 테스트** → 승인 후 단일 커밋 → 사용자 승인 후 병합

## 8. 스코프 외 (이번 스펙 제외)

- 스크롤 부자연스러움: 사용자 재테스트 후 별도 스펙.
- 서버측 운동명 unique 제약 (`Exercise.name`): API 변경이 필요하므로 별도 PR/스펙. 이번 클라 검사로 1인 사용 시나리오는 충분히 커버.
- 토스트 retry 액션 / 큐잉 / multi-toast: YAGNI.
- 다른 화면(통계, 설정 등)에서의 토스트 사용: 이번 스코프는 record 도메인만.
