# Home Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `src/app/(tabs)/index.tsx` 를 루틴 데이터 기반 실제 대시보드로 교체한다. PERFORMANCE v1.0 디자인 토큰을 적용하고, 순수 함수 계산 로직은 Jest 로 단위 테스트한다.

**Architecture:** 홈 화면이 `workout-store.selectedDate` 를 건드리지 않도록, `fetchRoutinesByDate(today)` 를 직접 호출해 로컬 state 에 저장한다. `stats-store.volumeData` 는 재사용하고, 지난주 비교 데이터만 홈 로컬 state 로 추가 로드한다. UI 는 `src/components/dashboard/` 아래 5개 컴포넌트로 분리. 계산 로직은 `src/lib/dashboard-metrics.ts` 순수 함수로 분리해 TDD.

**Tech Stack:** Expo SDK 55 / React Native 0.83 / React 19 / TypeScript 5.9 strict / Zustand 5 / react-native-svg (MiniChart) / jest-expo (신규).

**Spec:** [docs/superpowers/specs/2026-04-16-home-dashboard-design.md](../specs/2026-04-16-home-dashboard-design.md)

---

## Task 1: Jest 테스트 인프라 추가

**Files:**
- Modify: `jealth-app/package.json`
- Create: `jealth-app/jest.config.js`

- [ ] **Step 1.1: devDependencies 확인 및 설치**

Run:
```bash
cd jealth-app
npm install --save-dev jest jest-expo @types/jest
```

Expected: `package.json` 에 세 패키지가 devDependencies 로 추가됨.

- [ ] **Step 1.2: jest.config.js 생성**

Create `jealth-app/jest.config.js`:
```js
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
  ],
};
```

- [ ] **Step 1.3: package.json 에 test 스크립트 추가**

Edit `jealth-app/package.json` scripts 섹션:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 1.4: 스모크 테스트 실행**

Create `jealth-app/src/lib/__smoke__.test.ts`:
```ts
describe('jest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `cd jealth-app && npm test -- __smoke__`
Expected: `PASS src/lib/__smoke__.test.ts`. 통과 후 이 파일 삭제.

- [ ] **Step 1.5: 커밋**

```bash
cd jealth-app
git add package.json package-lock.json jest.config.js
git commit -m "chore: add jest-expo test infrastructure"
```

---

## Task 2: 날짜 유틸 모듈 (`src/lib/date.ts`) — TDD

**Files:**
- Create: `jealth-app/src/lib/date.ts`
- Create: `jealth-app/src/lib/date.test.ts`

- [ ] **Step 2.1: 실패 테스트 작성**

Create `jealth-app/src/lib/date.test.ts`:
```ts
import { todayString, addDays, isoDate } from './date';

describe('date utils', () => {
  it('todayString returns YYYY-MM-DD for today (local)', () => {
    const d = new Date();
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(todayString()).toBe(expected);
  });

  it('isoDate formats Date → YYYY-MM-DD', () => {
    expect(isoDate(new Date(2026, 3, 16))).toBe('2026-04-16'); // month is 0-indexed
  });

  it('addDays(+1) moves forward', () => {
    expect(addDays('2026-04-16', 1)).toBe('2026-04-17');
  });

  it('addDays(-7) moves backward across month boundary', () => {
    expect(addDays('2026-04-03', -7)).toBe('2026-03-27');
  });

  it('addDays(-13) moves backward across year boundary', () => {
    expect(addDays('2026-01-05', -13)).toBe('2025-12-23');
  });
});
```

- [ ] **Step 2.2: 테스트 실행해 실패 확인**

Run: `cd jealth-app && npm test -- date.test`
Expected: FAIL — module not found (`./date`).

- [ ] **Step 2.3: 최소 구현**

Create `jealth-app/src/lib/date.ts`:
```ts
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function todayString(): string {
  return isoDate(new Date());
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return isoDate(dt);
}
```

- [ ] **Step 2.4: 테스트 실행해 통과 확인**

Run: `cd jealth-app && npm test -- date.test`
Expected: PASS 5/5.

- [ ] **Step 2.5: 커밋**

```bash
cd jealth-app
git add src/lib/date.ts src/lib/date.test.ts
git commit -m "feat: add date utils (todayString, isoDate, addDays)"
```

---

## Task 3: 메트릭 계산 로직 (`src/lib/dashboard-metrics.ts`) — TDD

**Files:**
- Create: `jealth-app/src/lib/dashboard-metrics.ts`
- Create: `jealth-app/src/lib/dashboard-metrics.test.ts`

- [ ] **Step 3.1: 실패 테스트 작성**

Create `jealth-app/src/lib/dashboard-metrics.test.ts`:
```ts
import {
  computeDailyMetrics,
  computeWeeklyTotal,
  computeWeekOverWeek,
  formatK,
} from './dashboard-metrics';
import type { WorkoutRoutine, VolumeData } from '@/types/workout';

function makeRoutine(exercises: { sets: { reps: number; weight: number; weightUnit?: 'kg' | 'lbs' }[] }[]): WorkoutRoutine {
  return {
    date: '2026-04-16',
    order: 0,
    exercises: exercises.map((ex, i) => ({
      order: i + 1,
      exercise: { id: `ex-${i}`, name: `Ex${i}`, muscleGroups: [] },
      sets: ex.sets.map((s, si) => ({
        round: si + 1,
        reps: s.reps,
        weight: s.weight,
        weightUnit: s.weightUnit ?? 'kg',
      })),
    })),
  };
}

describe('computeDailyMetrics', () => {
  it('empty routines → all zero', () => {
    expect(computeDailyMetrics([])).toEqual({ setCount: 0, volumeKg: 0, estimatedMinutes: 0 });
  });

  it('single routine × 1 exercise × 2 sets (10×50kg) = 1000 volume, 2 sets, 6 min', () => {
    const r = makeRoutine([{ sets: [{ reps: 10, weight: 50 }, { reps: 10, weight: 50 }] }]);
    expect(computeDailyMetrics([r])).toEqual({ setCount: 2, volumeKg: 1000, estimatedMinutes: 6 });
  });

  it('lbs converted: 10 reps × 100 lbs ≈ 453.6 kg', () => {
    const r = makeRoutine([{ sets: [{ reps: 10, weight: 100, weightUnit: 'lbs' }] }]);
    const m = computeDailyMetrics([r]);
    expect(m.setCount).toBe(1);
    expect(m.volumeKg).toBeCloseTo(453.6, 1);
    expect(m.estimatedMinutes).toBe(3);
  });

  it('handles NaN/undefined reps and weight as zero', () => {
    const r: WorkoutRoutine = {
      date: '2026-04-16', order: 0,
      exercises: [{
        order: 1,
        exercise: { id: 'x', name: 'X', muscleGroups: [] },
        sets: [{ round: 1, reps: Number.NaN, weight: Number.NaN, weightUnit: 'kg' }],
      }],
    };
    const m = computeDailyMetrics([r]);
    expect(m.setCount).toBe(1);
    expect(m.volumeKg).toBe(0);
  });
});

describe('computeWeeklyTotal', () => {
  it('empty → 0', () => {
    expect(computeWeeklyTotal([])).toBe(0);
  });

  it('sums volume field', () => {
    const data: VolumeData[] = [
      { date: '2026-04-10', volume: 1000 },
      { date: '2026-04-11', volume: 500 },
      { date: '2026-04-12', volume: 250.5 },
    ];
    expect(computeWeeklyTotal(data)).toBe(1750.5);
  });
});

describe('computeWeekOverWeek', () => {
  it('returns 0 when last week is empty (division guard)', () => {
    expect(computeWeekOverWeek([{ date: '2026-04-10', volume: 1000 }], [])).toBe(0);
  });

  it('+50% when this=1500, last=1000', () => {
    const tw: VolumeData[] = [{ date: '2026-04-10', volume: 1500 }];
    const lw: VolumeData[] = [{ date: '2026-04-03', volume: 1000 }];
    expect(computeWeekOverWeek(tw, lw)).toBe(50);
  });

  it('-25% when this=750, last=1000', () => {
    const tw: VolumeData[] = [{ date: '2026-04-10', volume: 750 }];
    const lw: VolumeData[] = [{ date: '2026-04-03', volume: 1000 }];
    expect(computeWeekOverWeek(tw, lw)).toBe(-25);
  });
});

describe('formatK', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [999.6, '1000'],
    [1000, '1.0K'],
    [1500, '1.5K'],
    [12340, '12.3K'],
  ])('formatK(%p) → %p', (input, expected) => {
    expect(formatK(input)).toBe(expected);
  });
});
```

- [ ] **Step 3.2: 테스트 실행해 실패 확인**

Run: `cd jealth-app && npm test -- dashboard-metrics`
Expected: FAIL — module not found.

- [ ] **Step 3.3: 구현**

Create `jealth-app/src/lib/dashboard-metrics.ts`:
```ts
import type { VolumeData, WorkoutRoutine } from '@/types/workout';

const LBS_TO_KG = 0.4536;
const MIN_PER_SET = 3;

export interface DailyMetrics {
  setCount: number;
  volumeKg: number;
  estimatedMinutes: number;
}

function safeNum(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

export function computeDailyMetrics(routines: WorkoutRoutine[]): DailyMetrics {
  let setCount = 0;
  let volumeKg = 0;
  for (const routine of routines) {
    for (const ex of routine.exercises) {
      for (const set of ex.sets) {
        setCount += 1;
        const reps = safeNum(set.reps);
        const raw = safeNum(set.weight);
        const kg = set.weightUnit === 'lbs' ? raw * LBS_TO_KG : raw;
        volumeKg += reps * kg;
      }
    }
  }
  return {
    setCount,
    volumeKg,
    estimatedMinutes: setCount * MIN_PER_SET,
  };
}

export function computeWeeklyTotal(data: VolumeData[]): number {
  return data.reduce((sum, d) => sum + safeNum(d.volume), 0);
}

export function computeWeekOverWeek(
  thisWeek: VolumeData[],
  lastWeek: VolumeData[],
): number {
  const a = computeWeeklyTotal(thisWeek);
  const b = computeWeeklyTotal(lastWeek);
  if (b === 0) return 0;
  return Math.round(((a - b) / b) * 100);
}

export function formatK(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}
```

- [ ] **Step 3.4: 테스트 통과 확인**

Run: `cd jealth-app && npm test -- dashboard-metrics`
Expected: PASS (모든 describe 통과, 최소 12 cases).

- [ ] **Step 3.5: 커밋**

```bash
cd jealth-app
git add src/lib/dashboard-metrics.ts src/lib/dashboard-metrics.test.ts
git commit -m "feat: add dashboard metrics computation utilities"
```

---

## Task 4: `KpiCard` 컴포넌트

**Files:**
- Create: `jealth-app/src/components/dashboard/kpi-card.tsx`

- [ ] **Step 4.1: 컴포넌트 작성**

Create `jealth-app/src/components/dashboard/kpi-card.tsx`:
```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GlassSurface } from '@/components/glass-surface';
import { DarkTheme, Fonts } from '@/constants/theme';

export interface KpiCardProps {
  label: string;
  value: string;
  unit: string;
}

export function KpiCard({ label, value, unit }: KpiCardProps) {
  return (
    <GlassSurface bordered borderRadius={16} style={styles.card}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.value} selectable numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.unit} numberOfLines={1}>
        {unit}
      </Text>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    gap: 8,
    minHeight: 112,
    borderCurve: 'continuous',
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: DarkTheme.textTertiary,
    letterSpacing: 2.2, // 11px * 0.2em ≈ 2.2
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: Fonts.sans,
    fontSize: 40,
    fontWeight: '900',
    color: DarkTheme.accentCyan,
    lineHeight: 42,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.textSecondary,
    lineHeight: 16,
  },
});
```

- [ ] **Step 4.2: 린트 확인**

Run: `cd jealth-app && npx expo lint src/components/dashboard/kpi-card.tsx`
Expected: 0 errors.

- [ ] **Step 4.3: 커밋**

```bash
cd jealth-app
git add src/components/dashboard/kpi-card.tsx
git commit -m "feat(dashboard): add KpiCard component"
```

---

## Task 5: `KpiRow` 컴포넌트

**Files:**
- Create: `jealth-app/src/components/dashboard/kpi-row.tsx`

- [ ] **Step 5.1: 컴포넌트 작성**

Create `jealth-app/src/components/dashboard/kpi-row.tsx`:
```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { KpiCard } from './kpi-card';

import { formatK, type DailyMetrics } from '@/lib/dashboard-metrics';

export interface KpiRowProps {
  metrics: DailyMetrics | null;
}

const EMPTY = '—';

export function KpiRow({ metrics }: KpiRowProps) {
  const hasData = metrics !== null && metrics.setCount > 0;

  const timeValue = hasData ? String(metrics!.estimatedMinutes) : EMPTY;
  const setsValue = hasData ? String(metrics!.setCount) : EMPTY;
  const volumeValue = hasData ? formatK(metrics!.volumeKg) : EMPTY;

  return (
    <View style={styles.row}>
      <KpiCard label="Time" value={timeValue} unit="MIN" />
      <KpiCard label="Sets" value={setsValue} unit="TOTAL" />
      <KpiCard label="Volume" value={volumeValue} unit="KG" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
});
```

- [ ] **Step 5.2: 린트 확인**

Run: `cd jealth-app && npx expo lint src/components/dashboard/kpi-row.tsx`
Expected: 0 errors.

- [ ] **Step 5.3: 커밋**

```bash
cd jealth-app
git add src/components/dashboard/kpi-row.tsx
git commit -m "feat(dashboard): add KpiRow component"
```

---

## Task 6: `HeroSection` 컴포넌트

**Files:**
- Create: `jealth-app/src/components/dashboard/hero-section.tsx`

- [ ] **Step 6.1: 컴포넌트 작성**

Create `jealth-app/src/components/dashboard/hero-section.tsx`:
```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DarkTheme, Fonts } from '@/constants/theme';

export interface HeroSectionProps {
  hasRoutine: boolean;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export function HeroSection({ hasRoutine }: HeroSectionProps) {
  const badgeActive = hasRoutine;
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.greet}>{greeting()}</Text>
        <Text style={styles.title}>Today&apos;s Session</Text>
      </View>
      <View style={[styles.badge, badgeActive ? styles.badgeActive : styles.badgeIdle]}>
        {badgeActive && <View style={styles.dot} />}
        <Text style={[styles.badgeText, { color: badgeActive ? DarkTheme.accentCyan : DarkTheme.textTertiary }]}>
          {badgeActive ? 'Recording' : 'Ready'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
  },
  left: {
    gap: 4,
    flexShrink: 1,
  },
  greet: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: DarkTheme.textTertiary,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Fonts.sans,
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.textPrimary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  badgeActive: {
    backgroundColor: 'rgba(0, 229, 204, 0.12)',
  },
  badgeIdle: {
    backgroundColor: DarkTheme.bgElevated,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DarkTheme.accentCyan,
  },
  badgeText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
```

- [ ] **Step 6.2: 린트 확인**

Run: `cd jealth-app && npx expo lint src/components/dashboard/hero-section.tsx`
Expected: 0 errors.

- [ ] **Step 6.3: 커밋**

```bash
cd jealth-app
git add src/components/dashboard/hero-section.tsx
git commit -m "feat(dashboard): add HeroSection component"
```

---

## Task 7: `WeeklyVolumeCard` 컴포넌트

**Files:**
- Create: `jealth-app/src/components/dashboard/weekly-volume-card.tsx`

- [ ] **Step 7.1: 컴포넌트 작성**

Create `jealth-app/src/components/dashboard/weekly-volume-card.tsx`:
```tsx
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { GlassSurface } from '@/components/glass-surface';
import { MiniChart } from '@/components/mini-chart';
import { DarkTheme, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  computeWeeklyTotal,
  computeWeekOverWeek,
  formatK,
} from '@/lib/dashboard-metrics';
import type { VolumeData } from '@/types/workout';

export interface WeeklyVolumeCardProps {
  thisWeek: VolumeData[];
  lastWeek: VolumeData[];
  isLoading?: boolean;
}

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const CARD_PADDING = 20;
const EMPTY = '—';

function todayWeekdayIndex(): number {
  // JS: Sunday=0..Saturday=6. Convert to Monday=0..Sunday=6.
  const js = new Date().getDay();
  return (js + 6) % 7;
}

export function WeeklyVolumeCard({ thisWeek, lastWeek, isLoading = false }: WeeklyVolumeCardProps) {
  const { width } = useWindowDimensions();
  const screenPadding = Spacing.four; // 24 — matches ScrollView horizontal padding
  const maxWidth = Math.min(width, MaxContentWidth);
  const chartWidth = Math.max(0, maxWidth - screenPadding * 2 - CARD_PADDING * 2);

  const total = computeWeeklyTotal(thisWeek);
  const delta = computeWeekOverWeek(thisWeek, lastWeek);
  const hasAny = thisWeek.length > 0;
  const values = hasAny ? thisWeek.map((d) => Number(d.volume) || 0) : [0, 0, 0, 0, 0, 0, 0];

  const deltaLabel = !hasAny || lastWeek.length === 0 ? EMPTY : `${delta > 0 ? '↑' : delta < 0 ? '↓' : ''} ${Math.abs(delta)}%`;
  const deltaStyle =
    !hasAny || lastWeek.length === 0
      ? styles.deltaNeutral
      : delta > 0
      ? styles.deltaPositive
      : delta < 0
      ? styles.deltaNegative
      : styles.deltaNeutral;
  const deltaColor =
    !hasAny || lastWeek.length === 0
      ? DarkTheme.textTertiary
      : delta > 0
      ? DarkTheme.statusSuccess
      : delta < 0
      ? DarkTheme.statusDanger
      : DarkTheme.textTertiary;

  const todayIdx = todayWeekdayIndex();

  return (
    <GlassSurface bordered borderRadius={20} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.label}>This Week</Text>
          <Text style={styles.value} selectable>
            {hasAny ? formatK(total) : EMPTY}
          </Text>
          <Text style={styles.unit}>KG</Text>
        </View>
        <View style={[styles.delta, deltaStyle]}>
          <Text style={[styles.deltaText, { color: deltaColor }]}>{deltaLabel}</Text>
        </View>
      </View>

      <View style={[styles.chart, isLoading && styles.chartLoading]}>
        <MiniChart data={values} color={DarkTheme.accentCyan} width={chartWidth} />
      </View>

      <View style={styles.days}>
        {DAY_LABELS.map((d, i) => (
          <Text
            key={d}
            style={[
              styles.day,
              { color: i === todayIdx ? DarkTheme.accentCyan : DarkTheme.textTertiary },
            ]}
          >
            {d}
          </Text>
        ))}
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: CARD_PADDING,
    borderCurve: 'continuous',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    gap: 4,
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: DarkTheme.textTertiary,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: Fonts.sans,
    fontSize: 32,
    fontWeight: '900',
    color: DarkTheme.textPrimary,
    lineHeight: 36,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.textSecondary,
  },
  delta: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderCurve: 'continuous',
  },
  deltaPositive: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
  },
  deltaNegative: {
    backgroundColor: 'rgba(255, 79, 106, 0.12)',
  },
  deltaNeutral: {
    backgroundColor: DarkTheme.bgElevated,
  },
  deltaText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  chart: {
    marginTop: 20,
    height: 112,
    justifyContent: 'center',
  },
  chartLoading: {
    opacity: 0.4,
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  day: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
```

- [ ] **Step 7.2: 린트 확인**

Run: `cd jealth-app && npx expo lint src/components/dashboard/weekly-volume-card.tsx`
Expected: 0 errors.

- [ ] **Step 7.3: 커밋**

```bash
cd jealth-app
git add src/components/dashboard/weekly-volume-card.tsx
git commit -m "feat(dashboard): add WeeklyVolumeCard with WoW delta badge"
```

---

## Task 8: `QuickActions` 컴포넌트

**Files:**
- Create: `jealth-app/src/components/dashboard/quick-actions.tsx`

- [ ] **Step 8.1: 컴포넌트 작성**

Create `jealth-app/src/components/dashboard/quick-actions.tsx`:
```tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DarkTheme, Fonts } from '@/constants/theme';
import { haptic } from '@/lib/haptics';

export interface QuickActionsProps {
  hasRoutine: boolean;
}

export function QuickActions({ hasRoutine }: QuickActionsProps) {
  const router = useRouter();

  const primaryLabel = hasRoutine ? "Continue Today's Workout" : "Start Today's Workout";

  const onPrimary = () => {
    haptic.medium();
    router.push('/(tabs)/record');
  };

  const onSecondary = () => {
    haptic.light();
    router.push('/(tabs)/record?copyOnOpen=1');
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPrimary}
        style={({ pressed }) => [
          styles.primary,
          pressed && { backgroundColor: DarkTheme.accentCyanDim, transform: [{ scale: 0.97 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
      >
        <Text style={styles.primaryText}>{primaryLabel}</Text>
      </Pressable>

      <Pressable
        onPress={onSecondary}
        style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.8 }]}
        accessibilityRole="button"
        accessibilityLabel="Copy Recent Routine"
      >
        <Text style={styles.secondaryText}>Copy Recent Routine</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  primary: {
    backgroundColor: DarkTheme.accentCyan,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
  primaryText: {
    color: DarkTheme.bgPrimary,
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  secondary: {
    backgroundColor: DarkTheme.bgElevated,
    borderWidth: 1,
    borderColor: DarkTheme.bgBorder,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
  secondaryText: {
    color: DarkTheme.textSecondary,
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '600',
  },
});
```

- [ ] **Step 8.2: 린트 확인**

Run: `cd jealth-app && npx expo lint src/components/dashboard/quick-actions.tsx`
Expected: 0 errors.

- [ ] **Step 8.3: 커밋**

```bash
cd jealth-app
git add src/components/dashboard/quick-actions.tsx
git commit -m "feat(dashboard): add QuickActions (start/copy routine)"
```

---

## Task 9: Record 화면의 `copyOnOpen` 파라미터 처리

**Files:**
- Modify: `jealth-app/src/app/(tabs)/record.tsx`

- [ ] **Step 9.1: 파라미터 감지 로직 추가**

Open `jealth-app/src/app/(tabs)/record.tsx`.

기존 import 라인 중 `import { useRouter, useFocusEffect } from 'expo-router';` 를 다음으로 교체:
```ts
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
```

`export default function RecordScreen() {` 바로 아래 (기존 `const router = useRouter();` 근처)에 다음을 추가:
```ts
  const params = useLocalSearchParams<{ copyOnOpen?: string }>();
```

기존 `useFocusEffect(useCallback(() => { ... }, [...]))` 호출 이후(즉 `handleSelectExercise` 감지 블록 다음)에 신규 블록 추가:
```ts
  useFocusEffect(
    useCallback(() => {
      if (params.copyOnOpen === '1') {
        setCopyVisible(true);
        // 파라미터 정리 — 다시 진입 시 중복 오픈 방지
        router.setParams({ copyOnOpen: undefined });
      }
    }, [params.copyOnOpen, router]),
  );
```

- [ ] **Step 9.2: 타입 체크**

Run: `cd jealth-app && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 9.3: 커밋**

```bash
cd jealth-app
git add src/app/\(tabs\)/record.tsx
git commit -m "feat(record): honor ?copyOnOpen=1 deep-link param to auto-open copy modal"
```

---

## Task 10: 홈 화면 재작성 (`src/app/(tabs)/index.tsx`)

**Files:**
- Modify (rewrite): `jealth-app/src/app/(tabs)/index.tsx`

- [ ] **Step 10.1: 홈 화면 전체 교체**

Overwrite `jealth-app/src/app/(tabs)/index.tsx` 를 다음 내용으로:

```tsx
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeroSection } from '@/components/dashboard/hero-section';
import { KpiRow } from '@/components/dashboard/kpi-row';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { WeeklyVolumeCard } from '@/components/dashboard/weekly-volume-card';
import { GradientBackground } from '@/components/gradient-background';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { addDays, todayString } from '@/lib/date';
import { computeDailyMetrics } from '@/lib/dashboard-metrics';
import { fetchVolume } from '@/lib/stats-api';
import { fetchRoutinesByDate } from '@/lib/workout-api';
import { useStatsStore } from '@/stores/stats-store';
import type { VolumeData, WorkoutRoutine } from '@/types/workout';

export default function HomeScreen() {
  const { volumeData, loadStats, isLoading } = useStatsStore();
  const [todayRoutines, setTodayRoutines] = useState<WorkoutRoutine[]>([]);
  const [lastWeek, setLastWeek] = useState<VolumeData[]>([]);

  useFocusEffect(
    useCallback(() => {
      const today = todayString();
      fetchRoutinesByDate(today)
        .then(setTodayRoutines)
        .catch(() => setTodayRoutines([]));
      loadStats();
      const lwEnd = addDays(today, -7);
      const lwStart = addDays(today, -13);
      fetchVolume(lwStart, lwEnd)
        .then(setLastWeek)
        .catch(() => setLastWeek([]));
    }, [loadStats]),
  );

  const metrics = useMemo(() => computeDailyMetrics(todayRoutines), [todayRoutines]);
  const hasRoutine = todayRoutines.some((r) => r.exercises.length > 0);

  return (
    <GradientBackground>
      <ScrollView
        style={{ backgroundColor: 'transparent' }}
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.content}>
            <HeroSection hasRoutine={hasRoutine} />
            <KpiRow metrics={hasRoutine ? metrics : null} />
            <WeeklyVolumeCard thisWeek={volumeData} lastWeek={lastWeek} isLoading={isLoading} />
            <QuickActions hasRoutine={hasRoutine} />
          </View>
        </SafeAreaView>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
  },
  safe: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
});
```

- [ ] **Step 10.2: 타입 체크**

Run: `cd jealth-app && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 10.3: 린트**

Run: `cd jealth-app && npx expo lint src/app/\(tabs\)/index.tsx`
Expected: 0 errors.

- [ ] **Step 10.4: 커밋**

```bash
cd jealth-app
git add src/app/\(tabs\)/index.tsx
git commit -m "feat(home): replace dummy dashboard with real routine-based dashboard"
```

---

## Task 11: `workout-store` todayString 중복 제거

**Files:**
- Modify: `jealth-app/src/stores/workout-store.ts`

- [ ] **Step 11.1: 내부 함수 제거하고 공용 모듈 사용**

Open `jealth-app/src/stores/workout-store.ts`.

상단 import 섹션에 추가:
```ts
import { todayString } from '@/lib/date';
```

기존 파일 상단의 함수를 삭제:
```ts
function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
```

`selectedDate: todayString()` 호출은 그대로 유지 (이제 import 된 함수 사용).

- [ ] **Step 11.2: 타입 체크**

Run: `cd jealth-app && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 11.3: 전체 테스트 재실행**

Run: `cd jealth-app && npm test`
Expected: 모든 describe PASS (date / dashboard-metrics).

- [ ] **Step 11.4: 커밋**

```bash
cd jealth-app
git add src/stores/workout-store.ts
git commit -m "refactor(store): reuse shared todayString() util"
```

---

## Task 12: 더 이상 쓰이지 않는 `dashboard-card` 제거

**Files:**
- Delete: `jealth-app/src/components/dashboard-card.tsx`

- [ ] **Step 12.1: 참조 검색**

Run: `cd jealth-app && grep -rn "dashboard-card\|DashboardCard" src/ || echo "NO REFERENCES"`
Expected: `NO REFERENCES`. (있다면 해당 import 먼저 제거.)

- [ ] **Step 12.2: 파일 삭제**

Run: `rm jealth-app/src/components/dashboard-card.tsx`
Expected: 파일 없어짐.

- [ ] **Step 12.3: 타입 체크**

Run: `cd jealth-app && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 12.4: 커밋**

```bash
cd jealth-app
git add -A src/components/
git commit -m "chore: remove unused DashboardCard (superseded by KpiCard)"
```

---

## Task 13: Maestro E2E — 기존 assertion 수정 + 홈 대시보드 플로우

**Files:**
- Modify: `jealth-app/.maestro/04_tab_navigation.yaml`
- Create: `jealth-app/.maestro/06_home_dashboard.yaml`

- [ ] **Step 13.1: 기존 04 플로우의 `assertVisible` 문구 교체**

Edit `jealth-app/.maestro/04_tab_navigation.yaml`:
- `assertVisible: "오늘의 건강"` 2곳(13행·29행)을 다음으로 교체:
  ```yaml
  - assertVisible: "Today's Session"
  ```

- [ ] **Step 13.2: 새 홈 대시보드 E2E 플로우 작성**

Create `jealth-app/.maestro/06_home_dashboard.yaml`:
```yaml
appId: com.x031pjs.jealthapp
name: "홈 대시보드"
---
- launchApp

- waitForAnimationToEnd:
    timeout: 15000

# 로그인
- runFlow: login_flow.yaml

# 홈 화면 섹션 존재 확인
- assertVisible: "Today's Session"
- assertVisible: "Time"
- assertVisible: "Sets"
- assertVisible: "Volume"
- assertVisible: "This Week"

# 항상 표시되는 Copy Recent Routine CTA 를 통해 /record 이동 확인
- tapOn: "Copy Recent Routine"
- waitForAnimationToEnd

# 홈으로 복귀
- tapOn: "홈"
- assertVisible: "Today's Session"
```

루틴 유무에 따라 Primary 버튼 텍스트가 `Start…` / `Continue…` 로 갈리므로 이 플로우에서는 Primary 를 탭 대상으로 삼지 않는다. Primary 내비게이션은 수동 스모크(Task 14.4)에서 확인한다.

- [ ] **Step 13.3: 로컬 Maestro 실행 (에뮬레이터 가동 중일 때)**

Run (optional, if emulator running):
```bash
cd jealth-app
maestro test .maestro/06_home_dashboard.yaml
maestro test .maestro/04_tab_navigation.yaml
```
Expected: 모든 assertVisible 통과. (에뮬레이터가 없다면 수동 확인으로 대체.)

- [ ] **Step 13.4: 커밋**

```bash
cd jealth-app
git add .maestro/04_tab_navigation.yaml .maestro/06_home_dashboard.yaml
git commit -m "test(e2e): update tab flow + add home dashboard maestro flow"
```

---

## Task 14: 최종 verification

- [ ] **Step 14.1: 전체 테스트 재실행**

Run: `cd jealth-app && npm test`
Expected: date / dashboard-metrics 전부 PASS. 실패 0.

- [ ] **Step 14.2: 타입 체크 전체**

Run: `cd jealth-app && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 14.3: 린트 전체**

Run: `cd jealth-app && npx expo lint`
Expected: 0 errors/warnings (신규 코드 기준).

- [ ] **Step 14.4: 개발 서버 기동 + 수동 스모크 체크**

Run (별도 터미널): `cd jealth-app && npx expo start`
확인 항목:
- 홈 진입 시 로딩 없이 Hero → KPI 3개 → Weekly 차트 → 빠른 액션 2개가 렌더링
- 루틴이 있는 날짜(오늘) 기준 세트/볼륨/분 수치가 기록 탭 내용과 일치
- `Start Today's Workout` 탭 → `/record` 이동
- `Copy Recent Routine` 탭 → `/record` 이동 + CopyRoutineModal 자동 오픈

- [ ] **Step 14.5: 완료 보고**

구현 완료. 수용 기준 재확인:
- [ ] KPI 값 = 오늘 기록 루틴과 일치
- [ ] Weekly 차트 + WoW 배지 표시
- [ ] 루틴 없을 때 `—` + `Ready` 배지 + `Start Today's Workout`
- [ ] 두 CTA 내비게이션 정상
- [ ] 단위 테스트 전부 PASS
- [ ] `DashboardCard` 참조 0
- [ ] PERFORMANCE v1.0 토큰 적용
