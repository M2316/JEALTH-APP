# Home Dashboard 리디자인 설계 (spec)

> 작성일: 2026-04-16
> 범위: `jealth-app/` (앱 repo 단독). API 변경 없음.

## 1. 목적

홈 탭(`src/app/(tabs)/index.tsx`)을 임시 더미 데이터 카드(운동시간/칼로리/체중) 화면에서, **실제 스토어 데이터로 채우는 진짜 대시보드**로 교체한다. PERFORMANCE 디자인 시스템 v1.0 토큰을 적용한다.

## 2. 범위 결정 사항 (브레인스토밍 결과)

| 항목 | 결정 |
|------|------|
| 데이터 방향 | 기존 더미 카드 컨셉(운동시간/칼로리/체중)은 유지 대상에서 제외. 루틴 기반으로 계산 가능한 실제 지표로 전면 교체 |
| 데이터 소스 | **루틴 기반 계산만**. 별도 입력/헬스킷 연동 없음. API·타입 변경 없음 |
| KPI 3종 | 오늘 운동시간(추정) / 오늘 세트 수 / 오늘 총 볼륨 |
| 하단 섹션 | 이번 주 볼륨 차트 1개(크게) + 빠른 액션 CTA 2개 |
| 디자인 | PERFORMANCE v1.0 엄격 적용. 기존 `GlassSurface`·`GradientBackground`·`ThemedText` 재활용 |
| 폰트 | Barlow 폰트 추가 설치 없음. 기존 `Fonts.sans` + `fontWeight: '900'` + `letterSpacing` 으로 유사 임팩트 |
| 빈 상태 | 값 없을 때 "—"(em dash) 플레이스홀더 표시 |

## 3. 아키텍처

### 3-1. 데이터 흐름

```
[홈 화면 진입 (useFocusEffect)]
  ├─ fetchRoutinesByDate(today)      → 로컬 useState todayRoutines[]
  ├─ useStatsStore.loadStats('week') → 이번 주 volumeData[]
  └─ fetchVolume(지난주 범위)         → 로컬 useState lastWeek[]

[todayRoutines]
  └─ computeDailyMetrics()           → { setCount, volumeKg, estimatedMinutes }

[volumeData + lastWeek]
  ├─ computeWeeklyTotal()            → 이번 주 총 볼륨 kg
  └─ computeWeekOverWeek()           → 지난주 대비 ±%
```

- **오늘 루틴은 `workout-store` 를 쓰지 않는다.** `workout-store.selectedDate` 는 record 화면에서 사용자가 바꿀 수 있는 상태라, 홈이 이를 공유하면 "오늘의 대시보드" 가 아닌 "선택된 날짜의 대시보드" 가 되어 의도와 어긋난다. 홈은 `fetchRoutinesByDate(todayString())` 를 직접 호출해 로컬 state 에 저장한다.
- 이번 주 volumeData 는 `stats-store` 가 이미 병렬 로드 기능을 제공하므로 재사용.
- 지난주 비교용 데이터는 홈 화면 로컬 상태. 스토어에 넣지 않는다 (홈에서만 쓰므로 YAGNI).
- `todayString()` 헬퍼는 `workout-store.ts` 에서 파일 상단에 동일 로직이 있다. 중복 방지 위해 `src/lib/date.ts` (신규) 로 추출해 공용 사용.

### 3-2. 파일 구조

| 경로 | 역할 |
|------|------|
| `src/app/(tabs)/index.tsx` | 화면 컴포지션. 스토어 호출 + 섹션 배치만 |
| `src/components/dashboard/hero-section.tsx` | 인사말 + `TODAY'S SESSION` 제목 + 상태 배지 |
| `src/components/dashboard/kpi-row.tsx` | 3열 KPI 카드 Row |
| `src/components/dashboard/kpi-card.tsx` | 단일 KPI 카드 (label / value / unit) |
| `src/components/dashboard/weekly-volume-card.tsx` | 이번 주 볼륨 합계 + ±% 배지 + 7일 스파크라인 |
| `src/components/dashboard/quick-actions.tsx` | Primary / Secondary CTA 2개 |
| `src/lib/dashboard-metrics.ts` | 루틴 → 지표 순수 계산 함수 (테스트 대상) |
| `src/lib/dashboard-metrics.test.ts` | 계산 함수 단위 테스트 |
| `src/lib/date.ts` | `todayString()`, `isoDate()`, `addDays()` 등 공용 날짜 유틸 (신규, 기존 중복 정리) |

기존 `src/components/dashboard-card.tsx`, `src/components/mini-chart.tsx` 는 재활용하거나, 더 이상 쓰지 않으면 삭제한다.

### 3-3. 네이밍 규칙

- 디렉토리: `src/components/dashboard/` (기존 `workout/` 와 동일한 도메인별 분리 패턴 유지)
- 파일: kebab-case (`.tsx`) — 프로젝트 규칙
- 컴포넌트 export: PascalCase named export (`HeroSection`, `KpiRow`, `KpiCard`, `WeeklyVolumeCard`, `QuickActions`)

## 4. 섹션 상세 사양

### 4-1. Hero Section

**Props**: `{ hasRoutine: boolean }`

**레이아웃**: 가로 Row. justify-content: space-between, align-items: center.
- 좌측 Column, gap 4:
  - 인사말: 11px 700 UPPERCASE letterSpacing 0.2em textTertiary. 로컬 시간 기반 `GOOD MORNING`(0-11시) / `GOOD AFTERNOON`(12-17시) / `GOOD EVENING`(18-23시)
  - 제목: `TODAY'S SESSION` — 28px 700 textPrimary
- 우측: 상태 배지 (radius-pill, 높이 28, 패딩 수평 12):
  - `hasRoutine === true`: 배경 `rgba(0,229,204,0.12)`, 좌측 6px 도트(accentCyan), 텍스트 `RECORDING` 11px 700 UPPERCASE accentCyan
  - `hasRoutine === false`: 배경 `bgElevated`, 텍스트 `READY` 11px 700 UPPERCASE textTertiary

**패딩**: 상 24 / 하 20 / 좌우 0 (상위 ScrollView 의 `Spacing.four` 적용).

### 4-2. KPI Row / KPI Card

**KpiRow Props**: `{ metrics: { setCount: number; volumeKg: number; estimatedMinutes: number } | null }` (null = 로딩/빈 상태)

**레이아웃**: flexDirection row, gap 12. 카드 3개 `flex: 1` 균등 분할.

**KpiCard Props**: `{ label: string; value: string; unit: string }`
- `GlassSurface bordered`, padding 16, borderRadius 16.
- 내부 Column, gap 8.
- Label: 11px 700 UPPERCASE letterSpacing 0.2em textTertiary.
- Value: 40px 900 accentCyan `fontVariant: ['tabular-nums']` lineHeight 42.
- Unit: 12px 600 textSecondary lineHeight 16.

**값 포맷** (호출 측 책임):
- TIME(MIN): `String(estimatedMinutes)` 또는 `—`
- SETS(TOTAL): `String(setCount)` 또는 `—`
- VOLUME(KG): `volumeKg >= 1000 ? (volumeKg/1000).toFixed(1) + 'K' : Math.round(volumeKg).toString()` 또는 `—`
- `metrics === null` 또는 해당 수치가 0 이고 `setCount === 0` 이면 모두 `—` 로 표시.

### 4-3. Weekly Volume Card

**Props**: `{ thisWeek: VolumeData[]; lastWeek: VolumeData[]; isLoading: boolean }`

**구조** (`GlassSurface bordered`, padding 20, borderRadius 20):

1. 헤더 Row (justify-content space-between, align-items flex-start):
   - 좌측 Column:
     - Label `THIS WEEK` 11px 700 UPPERCASE 0.2em textTertiary
     - Value `{formatK(total)}` 32px 900 textPrimary tabular-nums
     - Unit `KG` 12px 600 textSecondary
   - 우측 배지 (radius-pill, padding 수평 10 / 수직 4):
     - `delta > 0`: 배경 `rgba(52,199,89,0.12)` 텍스트 statusSuccess `↑ {Math.abs(delta)}%`
     - `delta < 0`: 배경 `rgba(255,79,106,0.12)` 텍스트 statusDanger `↓ {Math.abs(delta)}%`
     - `delta === 0` 또는 lastWeek 비어있음: 배경 bgElevated 텍스트 textTertiary `—`
     - 숫자 11px 700 UPPERCASE
2. 차트 영역 (margin-top 20, 높이 112):
   - `MiniChart` (기존 재활용): 7일 값 배열, color=accentCyan, width=카드 내부 폭.
   - 차트 하단 요일 레이블 Row (`MON TUE WED THU FRI SAT SUN` 현지 요일, 오늘은 accentCyan, 나머지 textTertiary 10px 600 UPPERCASE, 균등 간격).

**로딩**: `isLoading === true` 면 차트 영역을 높이 112의 `bgElevated` 박스 + opacity 0.4. 헤더 값은 `—`.

**`formatK` 유틸**: 1000 이상 → `(n/1000).toFixed(1)+'K'`, 아니면 `Math.round(n)`.

### 4-4. Quick Actions

**Props**: `{ hasRoutine: boolean }`

**내부**: 세로 Column, gap 8.

- **Primary 버튼**
  - 배경 accentCyan, 높이 52, borderRadius 26.
  - 텍스트: `hasRoutine ? 'CONTINUE TODAY\\'S WORKOUT' : 'START TODAY\\'S WORKOUT'`. 14px 700 UPPERCASE letterSpacing 0.1em, 색 bgPrimary.
  - press 시 `transform: [{ scale: 0.97 }]` 150ms ease, haptic medium, `router.push('/(tabs)/record')`.
  - disabled 없음 (항상 활성).

- **Secondary 버튼**
  - 배경 bgElevated, border 1px bgBorder, 높이 44, borderRadius 22.
  - 텍스트: `COPY RECENT ROUTINE` 14px 600 textSecondary.
  - press 시 haptic light, `router.push('/(tabs)/record?copyOnOpen=1')` 로 이동.
  - Record 탭에서 `useLocalSearchParams` 로 `copyOnOpen=1` 감지 시 `setCopyVisible(true)` 호출 후 URL 파라미터 정리(`router.setParams({ copyOnOpen: undefined })`).

## 5. 계산 로직 (`src/lib/dashboard-metrics.ts`)

```ts
import type { VolumeData, WorkoutRoutine } from '@/types/workout';

const LBS_TO_KG = 0.4536;
const MIN_PER_SET = 3;

export interface DailyMetrics {
  setCount: number;
  volumeKg: number;
  estimatedMinutes: number;
}

export function computeDailyMetrics(routines: WorkoutRoutine[]): DailyMetrics {
  const exercises = routines.flatMap((r) => r.exercises);
  let setCount = 0;
  let volumeKg = 0;
  for (const ex of exercises) {
    for (const set of ex.sets) {
      setCount += 1;
      const w = set.weightUnit === 'lbs' ? set.weight * LBS_TO_KG : set.weight;
      volumeKg += (Number(set.reps) || 0) * (Number(w) || 0);
    }
  }
  return {
    setCount,
    volumeKg,
    estimatedMinutes: setCount * MIN_PER_SET,
  };
}

export function computeWeeklyTotal(data: VolumeData[]): number {
  return data.reduce((sum, d) => sum + (Number(d.volume) || 0), 0);
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

## 6. 홈 화면 컴포지션 (`src/app/(tabs)/index.tsx`)

```tsx
// 의사 코드 수준 — 구현 단계에서 타입 정비
const today = todayString(); // src/lib/date.ts
const { volumeData, loadStats, isLoading } = useStatsStore();
const [todayRoutines, setTodayRoutines] = useState<WorkoutRoutine[]>([]);
const [lastWeek, setLastWeek] = useState<VolumeData[]>([]);

useFocusEffect(useCallback(() => {
  fetchRoutinesByDate(today).then(setTodayRoutines).catch(() => setTodayRoutines([]));
  loadStats();
  const lwEnd = addDays(today, -7);
  const lwStart = addDays(today, -13);
  fetchVolume(lwStart, lwEnd).then(setLastWeek).catch(() => setLastWeek([]));
}, [today, loadStats]));

const metrics = useMemo(() => computeDailyMetrics(todayRoutines), [todayRoutines]);
const hasRoutine = todayRoutines.some((r) => r.exercises.length > 0);

return (
  <GradientBackground>
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
      <SafeAreaView style={styles.safe}>
        <HeroSection hasRoutine={hasRoutine} />
        <KpiRow metrics={hasRoutine ? metrics : null} />
        <WeeklyVolumeCard thisWeek={volumeData} lastWeek={lastWeek} isLoading={isLoading} />
        <QuickActions hasRoutine={hasRoutine} />
      </SafeAreaView>
    </ScrollView>
  </GradientBackground>
);
```

- 섹션 사이 `gap: Spacing.four` (24) — 디자인 시스템 `sp-6` section element gap 에 해당.
- ScrollView contentContainer 좌우 padding `Spacing.four` (24).
- 상단 safe area 는 ScrollView `contentInsetAdjustmentBehavior="automatic"` 에 맡긴다.
- 하단 `BottomTabInset + Spacing.four` 로 하단 네이티브 탭 가림 방지.

## 7. 에러·로딩·빈 상태

| 상태 | 처리 |
|------|------|
| 로딩 중 (초기) | KPI 3개 `—`, Hero 배지 `READY`, WeeklyVolume 차트 opacity 0.4 placeholder |
| stats-api 실패 | `stats-store` 가 기존 데이터 유지. volumeData 가 비어있으면 헤더 `—`, 차트 placeholder |
| 지난주 API 실패 | `setLastWeek([])` → 배지 `—` |
| 루틴 없음 | 모든 KPI `—`, Hero `READY`, Primary CTA `START TODAY'S WORKOUT` |

- 에러 토스트 없음 (홈은 passive 화면, 기록 탭과 달리 실패를 사용자가 재시도할 필요 없음).

## 8. 접근성 / 반응형

- 모든 CTA 터치 영역 ≥ 48x48.
- KPI 값은 `<Text selectable>` — 숫자 복사 가능.
- `useWindowDimensions()` 로 가로폭 측정 후 `MiniChart` width 계산. `Dimensions` 사용 금지.
- `MaxContentWidth` (800) 적용 유지 — 태블릿/웹.

## 9. 테스트 전략

### 9-1. 단위 테스트 (`src/lib/dashboard-metrics.test.ts`)

Jest 기반. 기존 테스트 인프라 존재 여부는 plan 단계에서 확인 후 필요 시 설정 추가.

테스트 케이스:
1. `computeDailyMetrics([])` → `{ setCount: 0, volumeKg: 0, estimatedMinutes: 0 }`
2. 단일 루틴 × 1운동 × 2세트(10회 × 50kg) → `{ setCount: 2, volumeKg: 1000, estimatedMinutes: 6 }`
3. lbs 단위 세트(10회 × 100lbs) → volumeKg 는 `10 * 100 * 0.4536 = 453.6` 근사치 (소숫점 오차 허용)
4. `reps` 또는 `weight` 가 문자열/undefined 인 비정상 세트 → 0 으로 처리
5. `computeWeeklyTotal([])` → 0
6. `computeWeekOverWeek(a, b)` — `b === 0` 일 때 0 반환 확인
7. `formatK(999.6)` → `'1000'`, `formatK(1500)` → `'1.5K'`, `formatK(0)` → `'0'`

### 9-2. E2E (Maestro)

- 기존 `.maestro/` 플로우에 `home-dashboard.yaml` 추가 (plan 단계 세부).
- 시나리오: 로그인 → 홈 탭 → 4개 섹션(Hero / KPI Row / Weekly / Quick Actions) 텍스트 존재 확인 → `START TODAY'S WORKOUT` 탭 → record 화면 이동 확인.

## 10. 마이그레이션 / 정리

- `src/components/dashboard-card.tsx` — KpiCard 로 대체. 다른 곳에서 사용하지 않음을 grep 으로 확인 후 삭제.
- `src/components/mini-chart.tsx` — WeeklyVolumeCard 에서 재사용. 유지.
- 기존 `DUMMY` 객체 제거 (index.tsx 내부).
- `src/stores/workout-store.ts` 의 파일 상단 `todayString()` 를 `src/lib/date.ts` 에서 import 하도록 변경 (중복 제거). `src/components/workout/date-selector.tsx` 의 `addDays` 와 동일 동작인 함수도 `src/lib/date.ts` 로 통합 고려 — plan 단계에서 참조 범위 확인 후 결정.

## 11. 범위 외 (Out of Scope)

- 체중/칼로리 입력 UI 및 API 엔드포인트 (향후 작업).
- HealthKit/Google Fit 연동.
- AI 인사이트 섹션.
- Barlow/JetBrains Mono 폰트 번들 추가.
- 홈 화면 onboarding 카드.

## 12. 수용 기준

- [ ] 홈 진입 시 오늘 세트 수·볼륨·운동시간이 오늘 기록된 루틴과 일치한다.
- [ ] 이번 주 볼륨 차트가 `stats-store.volumeData` 값과 일치하며, 지난주 대비 % 배지가 표시된다.
- [ ] 루틴이 없을 때 모든 수치가 `—` 로 표시되고 Hero 배지가 `READY` 다.
- [ ] `START TODAY'S WORKOUT` 버튼이 `/record` 로 이동한다.
- [ ] `COPY RECENT ROUTINE` 버튼이 `/record` 이동 + CopyRoutineModal 자동 오픈을 트리거한다.
- [ ] `computeDailyMetrics`, `computeWeeklyTotal`, `computeWeekOverWeek`, `formatK` 단위 테스트 전부 통과.
- [ ] `dashboard-card.tsx` 가 다른 곳에서 import 되지 않음을 확인 후 삭제.
- [ ] PERFORMANCE v1.0 토큰(bg-primary, accent-cyan, 11px UPPERCASE 레이블, 40px+ KPI 수치)이 적용된다.
