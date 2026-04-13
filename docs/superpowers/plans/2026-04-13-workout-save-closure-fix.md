# Workout 기록 저장 stale closure 버그 수정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Production에서 세트의 반복횟수/중량 입력이 저장되지 않는 `record.tsx`의 stale closure 버그를 고친다.

**Architecture:** `scheduleSave` 가 mount 시점의 `saveToServer` 클로저(routineId=undefined)를 영원히 capture 하는 문제를, 매 렌더마다 최신 `saveToServer` 를 가리키는 `useRef` 동기화 패턴으로 해결한다. `saveToServer` 내부에서 setter 안티패턴(`setLocalExercises` 안에서 비동기 트리거)을 제거하고 `latestExercisesRef`로 최신 상태를 참조한다.

**Tech Stack:** Expo (React Native 0.83, React 19, TypeScript 5.9).

---

## 파일 구조

**수정:**
- `jealth-app/src/app/(tabs)/record.tsx` — `scheduleSave` stale closure 수정, `saveToServer` 내부 setter 안티패턴 제거

---

## Task 1: `record.tsx` stale closure 수정

**Files:**
- Modify: `jealth-app/src/app/(tabs)/record.tsx:95-135`

- [ ] **Step 1: import 갱신 및 ref 추가**

파일 상단 React import를 확인한다. 이미 `useRef` 가 import 되어 있으므로 추가 import는 없다.

`jealth-app/src/app/(tabs)/record.tsx:66` 에 있는 `saveTimerRef` 선언 바로 아래에 최신 save 함수를 참조할 ref 를 추가한다.

기존 (line 66):

```typescript
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

다음으로 교체한다:

```typescript
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveToServerRef = useRef<() => void>(() => undefined);
  const latestExercisesRef = useRef<WE[]>([]);
```

- [ ] **Step 2: `saveToServer` 를 순수 함수로 교체**

`jealth-app/src/app/(tabs)/record.tsx:122-135` 의 `saveToServer` 정의 전체를 아래로 교체한다. 이전 구현은 `setLocalExercises` setter 안에서 비동기 트리거를 수행하는 안티패턴이었으므로 `latestExercisesRef` 를 읽어 제거한다.

기존:

```typescript
  const saveToServer = useCallback(async () => {
    try {
      setLocalExercises((current) => {
        if (routineId) {
          updateRoutine(routineId, buildPayload(current)).then(() =>
            loadRoutines(),
          );
        }
        return current;
      });
    } catch {
      // silent
    }
  }, [routineId, buildPayload, updateRoutine, loadRoutines]);
```

다음으로 교체한다:

```typescript
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

- [ ] **Step 3: `saveToServer` / `localExercises` ref 동기화 effect 추가**

`jealth-app/src/app/(tabs)/record.tsx:89` 의 `useEffect(() => { loadRoutines(); }, [selectedDate, loadRoutines]);` 바로 아래에 다음 두 `useEffect` 를 추가한다.

```typescript
  useEffect(() => {
    saveToServerRef.current = saveToServer;
  }, [saveToServer]);

  useEffect(() => {
    latestExercisesRef.current = localExercises;
  }, [localExercises]);
```

- [ ] **Step 4: `scheduleSave` 가 ref 를 호출하도록 수정**

`jealth-app/src/app/(tabs)/record.tsx:95-103` 의 `scheduleSave` 를 다음으로 교체한다.

기존:

```typescript
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setDirty((d) => {
        if (d) saveToServer();
        return false;
      });
    }, 1500);
  }, []);
```

다음으로 교체한다:

```typescript
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      setDirty(false);
      saveToServerRef.current();
    }, 1500);
  }, []);
```

**주의:** `setDirty` 를 setter function 형태로 두고 그 안에서 사이드이펙트를 호출하던 패턴을 제거했다. Strict Mode 이중 호출을 방지하고, save 는 항상 ref 의 최신 함수를 사용하므로 stale closure 가 사라진다.

- [ ] **Step 5: TypeScript/Lint 확인**

Run: `cd jealth-app && npx tsc --noEmit`
Expected: `jealth-app/src/app/(tabs)/record.tsx` 관련 에러 없음

Run: `cd jealth-app && npx expo lint`
Expected: `record.tsx` 관련 새 경고 없음 (기존 프로젝트 잔존 경고는 무시)

- [ ] **Step 6: 수동 검증 (사용자 합의 필요)**

실기기/시뮬레이터에서 아래 시나리오를 수행한다. 가능하면 백엔드의 HTTP 로그와 함께 관측한다(API 측 plan: `jealth_api/docs/superpowers/plans/2026-04-13-api-logging-interceptor.md` 참조).

1. 새 계정 or 기록이 없는 날짜 선택 → 운동 추가 → 첫 세트 reps/weight 를 키보드 오버레이로 입력 → 1.5초 대기
2. 백엔드 콘솔에 `PATCH /routines/<id> -> 200 ..ms user=<uid>` 로그가 찍히는지 확인 (로깅 인터셉터가 배포된 경우)
3. 화면을 다른 탭으로 이동 후 돌아와서 입력값이 유지되는지 확인
4. DialNumberInput 드래그로 값을 변경 후 1.5초 내 연속 변경 시에도 마지막 값만 저장되는 debounce 유지 확인

Expected: 2번에서 PATCH 호출이 관측되고, 3번에서 값 유지, 4번에서 debounce 동작.

- [ ] **Step 7: 커밋**

```bash
git add jealth-app/src/app/\(tabs\)/record.tsx
git commit -m "fix(app): save workout set edits via ref to avoid stale closure"
```

---

## Self-Review 결과

- **Spec coverage:** "운동 기록 세트 저장 안 되는 버그 수정" → Task 1 에서 `record.tsx` 수정으로 커버.
- **Placeholder scan:** TBD/TODO/"적절히 처리" 없음. 모든 코드 블록 완결.
- **Type consistency:** `WE` 타입은 `record.tsx` 기존 import(`WorkoutExercise as WE`)를 그대로 사용.
