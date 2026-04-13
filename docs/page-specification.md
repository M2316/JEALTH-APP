# Jealth 앱 페이지별 기능 명세서

> 작성일: 2026-04-06

---

## 목차

1. [인증 (Auth) 섹션](#1-인증-auth-섹션)
2. [메인 탭 (Tabs) 섹션](#2-메인-탭-tabs-섹션)
3. [운동 관리 (Exercises) 섹션](#3-운동-관리-exercises-섹션)
4. [앱 전역 동작](#4-앱-전역-동작)
5. [API 엔드포인트 요약](#5-api-엔드포인트-요약)

---

## 1. 인증 (Auth) 섹션

### 1-1. 로그인 (`/(auth)/login`)

| 항목 | 내용 |
|------|------|
| **소스 파일** | `jealth-app/src/app/(auth)/login.tsx` |
| **목적** | 사용자 인증 및 앱 진입 |
| **입력 필드** | 이메일, 비밀번호 |
| **UI** | Glassmorphism (GlassSurface) 다크 테마 |

**주요 기능**

- 이메일/비밀번호 로그인 (`POST /auth/login`)
- 로그인 실패 시 에러 메시지 표시
- 로딩 상태 표시

**네비게이션**

- 회원가입 페이지 링크
- 비밀번호 찾기 링크

---

### 1-2. 회원가입 (`/(auth)/register`)

| 항목 | 내용 |
|------|------|
| **소스 파일** | `jealth-app/src/app/(auth)/register.tsx` |
| **목적** | 신규 계정 생성 |
| **입력 필드** | 이름, 이메일, 비밀번호, 비밀번호 확인 |

**유효성 검증**

- 이메일 형식 검증 (정규식)
- 비밀번호 6자 이상
- 비밀번호 일치 확인

**주요 기능**

- 계정 생성 (`POST /auth/register`)
- 필드별 에러 메시지 표시
- 성공 시 플랫폼별 알림 (iOS: native Alert, Web: window.alert) 후 로그인 페이지로 이동

---

### 1-3. 비밀번호 찾기 (`/(auth)/forgot-password`)

| 항목 | 내용 |
|------|------|
| **소스 파일** | `jealth-app/src/app/(auth)/forgot-password.tsx` |
| **목적** | 비밀번호 재설정 요청 |
| **입력 필드** | 이메일 |

**주요 기능**

- 비밀번호 재설정 이메일 발송 요청 (`POST /auth/forgot-password`)
- 보안상 성공/실패 관계없이 동일한 성공 메시지 표시
- 2단계 UI 전환: 입력 폼 → 완료 확인 화면

---

## 2. 메인 탭 (Tabs) 섹션

하단 탭 네비게이션 4개: **홈** / **기록** / **통계** / **설정**

레이아웃: `jealth-app/src/app/(tabs)/_layout.tsx` (NativeTabs 기반)

---

### 2-1. 홈 — 대시보드 (`/(tabs)/index`)

| 항목 | 내용 |
|------|------|
| **소스 파일** | `jealth-app/src/app/(tabs)/index.tsx` |
| **목적** | 최근 7일간 핵심 지표 요약 |
| **데이터 상태** | 현재 더미 데이터 사용 (API 미연동) |
| **UI** | GradientBackground, ScrollView, SafeAreaView |

**표시 카드 (3개)**

| 카드 | 데이터 | 단위 | 시각화 |
|------|--------|------|--------|
| 운동 시간 | 최근 7일 | 분 (min) | MiniChart (스파크라인) |
| 칼로리 소모 | 최근 7일 | kcal | MiniChart (스파크라인) |
| 체중 | 최근 7일 | kg | MiniChart (스파크라인) |

**사용 컴포넌트**: DashboardCard, MiniChart

---

### 2-2. 기록 — 운동 기록 (`/(tabs)/record`)

| 항목 | 내용 |
|------|------|
| **소스 파일** | `jealth-app/src/app/(tabs)/record.tsx` |
| **목적** | 일자별 운동 루틴 기록 및 관리 |

#### 날짜 선택

- DateSelector 컴포넌트로 좌/우 화살표 탐색
- 화면 가장자리 스와이프 제스처로 날짜 변경
- GlassCalendar 달력 팝업으로 특정 날짜 선택
- 날짜 변경 시 햅틱 피드백

#### 운동 추가

- ExercisePickerModal로 기존 운동 선택
- 근육 그룹별 필터링
- 모달 내에서 새 운동 생성 페이지(`/exercises/create`)로 이동 가능

#### 세트 관리

- 세트별 반복 횟수(reps), 무게(weight), 단위(kg/lbs) 편집
- 세트 추가: 마지막 세트 복제
- 세트 삭제: 인덱스 기반 제거

#### 운동 삭제

- 운동 항목 제거
- 루틴 내 운동이 모두 비면 루틴 자체 삭제

#### 루틴 복사

- CopyRoutineModal로 최근 14일간 루틴 목록 표시
- 선택한 루틴을 현재 날짜로 복사

#### 자동 저장

- 편집 후 1.5초 디바운스 자동 저장 (`PATCH /routines/{id}`)

#### UI 상태

- 로딩: 스피너
- 빈 상태: 안내 메시지 + 운동 추가/루틴 복사 버튼
- 기록 존재 시: 운동 카드 리스트 + FAB 버튼

#### API 연동

| 메서드 | 엔드포인트 | 용도 |
|--------|-----------|------|
| GET | `/routines?date={date}` | 날짜별 루틴 조회 |
| POST | `/routines` | 루틴 생성 |
| PATCH | `/routines/{id}` | 루틴 수정 |
| DELETE | `/routines/{id}` | 루틴 삭제 |
| POST | `/routines/{id}/copy` | 루틴 복사 |

---

### 2-3. 통계 (`/(tabs)/stats`)

| 항목 | 내용 |
|------|------|
| **소스 파일** | `jealth-app/src/app/(tabs)/stats.tsx` |
| **목적** | 운동 통계 시각화 및 개인 기록 확인 |

#### 기간 선택

- PeriodSelector로 **주간 / 월간 / 연간** 토글
- 기간 변경 시 데이터 자동 갱신

#### 섹션 구성 (3개)

| 섹션 | 컴포넌트 | 설명 |
|------|----------|------|
| 볼륨 차트 | VolumeChart | 기간별 일일 총 볼륨 막대 차트 (SVG) |
| 개인 기록 | PersonalRecords | 운동별 최고 중량 카드, 수평 스크롤 |
| 근육 분포 | MuscleBreakdown | 근육 그룹별 세트 수 수평 바 차트 |

#### 인터랙션

- Pull-to-refresh 지원
- 기간 변경 시 3개 API 병렬 요청

#### API 연동

| 메서드 | 엔드포인트 | 용도 |
|--------|-----------|------|
| GET | `/stats/volume?start={date}&end={date}` | 볼륨 데이터 |
| GET | `/stats/records` | 개인 기록 (선택: `?exerciseId=`) |
| GET | `/stats/muscle-breakdown?start={date}&end={date}` | 근육 분포 |

---

### 2-4. 설정 (`/(tabs)/settings`)

| 항목 | 내용 |
|------|------|
| **소스 파일** | `jealth-app/src/app/(tabs)/settings.tsx` |
| **목적** | 앱 설정 및 계정 관리 |

**현재 기능**

- 로그아웃 버튼: 토큰 삭제 후 로그인 페이지로 자동 이동

---

## 3. 운동 관리 (Exercises) 섹션

### 3-1. 운동 목록 (`/exercises`)

| 항목 | 내용 |
|------|------|
| **소스 파일** | `jealth-app/src/app/exercises/index.tsx` |
| **목적** | 운동 데이터베이스 탐색 |

**주요 기능**

- 실시간 검색: 입력 즉시 필터링 (`GET /exercises?search=`)
- 근육 그룹 뱃지 필터링
- FlatList로 운동 목록 렌더링
- 검색 결과 없을 시 빈 상태 안내 메시지

**네비게이션**

- 헤더 좌측: 뒤로가기 버튼
- 헤더 우측: 운동 추가(+) 버튼 → `/exercises/create`

---

### 3-2. 운동 생성 (`/exercises/create`)

| 항목 | 내용 |
|------|------|
| **소스 파일** | `jealth-app/src/app/exercises/create.tsx` |
| **목적** | 커스텀 운동 등록 |

**입력 필드**

| 필드 | 타입 | 필수 여부 |
|------|------|----------|
| 운동 이름 | TextInput | 필수 |
| 장비 | TextInput | 선택 |
| 근육 그룹 | 토글 뱃지 (다중 선택) | 선택 |
| 사진 | 이미지 피커 (1:1 크롭) | 선택 |

**주요 기능**

- 이름 필수 검증
- 운동 생성 (`POST /exercises`)
- 이미지 선택 시 별도 업로드 (`POST /exercises/{id}/image`, FormData)
- 성공 시 이전 화면으로 복귀
- 실패 시 에러 알림 표시

---

## 4. 앱 전역 동작

### 인증 라우팅

- **소스 파일**: `jealth-app/src/app/_layout.tsx`
- 앱 시작 시 SecureStorage에서 토큰 복원
- 토큰 유무에 따라 자동 리다이렉트:
  - 인증됨 → `/(tabs)` (홈)
  - 미인증 → `/(auth)/login`
- 토큰 로딩 중 스피너 표시

### 상태 관리 (Zustand)

| 스토어 | 파일 | 관리 데이터 |
|--------|------|------------|
| Auth Store | `stores/auth-store.ts` | user, token, isAuthenticated, isLoading |
| Workout Store | `stores/workout-store.ts` | selectedDate, routines[], isLoading |
| Exercise Store | `stores/exercise-store.ts` | muscleGroups[], exercises[], isLoading |
| Stats Store | `stores/stats-store.ts` | period, volumeData[], personalRecords[], muscleBreakdown[] |

### API 클라이언트

- **소스 파일**: `jealth-app/src/lib/api.ts`
- 개발 URL: Web `http://localhost:3000`, Mobile `http://192.168.0.102:3000`
- 프로덕션 URL: `https://api.jealth.com`
- 모든 요청에 Bearer 토큰 자동 주입
- ApiError 클래스로 에러 핸들링

### 테마

- 다크 테마 고정
- Primary: `#07111E`, Surface: `#0E1E2F` / `#142438`
- Accent: `#00E5CC` (시안)
- Text: `#FFFFFF` (primary) / `#89A8C4` (secondary) / `#496680` (tertiary)
- Semantic: Red `#FF4F6A` / Green `#34C759` / Orange `#FF9500`

### 플랫폼 지원

- iOS, Android, Web (Expo Router)
- 플랫폼별 파일 분리: `.web.tsx` 접미사
- 플랫폼별 토큰 저장소 분리 (`token-storage.ts` / `token-storage.web.ts`)

---

## 5. API 엔드포인트 요약

### Auth

| 메서드 | 엔드포인트 | 용도 | 인증 |
|--------|-----------|------|------|
| POST | `/auth/login` | 로그인 | 불필요 |
| POST | `/auth/register` | 회원가입 | 불필요 |
| POST | `/auth/forgot-password` | 비밀번호 찾기 | 불필요 |

### Exercises

| 메서드 | 엔드포인트 | 용도 | 인증 |
|--------|-----------|------|------|
| GET | `/exercises` | 운동 목록 조회 (검색: `?search=`) | 필요 |
| GET | `/exercises/muscle-groups` | 근육 그룹 조회 | 필요 |
| POST | `/exercises` | 운동 생성 | 필요 |
| POST | `/exercises/{id}/image` | 운동 이미지 업로드 (FormData) | 필요 |

### Routines

| 메서드 | 엔드포인트 | 용도 | 인증 |
|--------|-----------|------|------|
| GET | `/routines?date={date}` | 날짜별 루틴 조회 | 필요 |
| POST | `/routines` | 루틴 생성 | 필요 |
| PATCH | `/routines/{id}` | 루틴 수정 | 필요 |
| DELETE | `/routines/{id}` | 루틴 삭제 | 필요 |
| POST | `/routines/{id}/copy` | 루틴 복사 | 필요 |

### Stats

| 메서드 | 엔드포인트 | 용도 | 인증 |
|--------|-----------|------|------|
| GET | `/stats/volume?start={date}&end={date}` | 볼륨 데이터 | 필요 |
| GET | `/stats/records` | 개인 기록 (선택: `?exerciseId=`) | 필요 |
| GET | `/stats/muscle-breakdown?start={date}&end={date}` | 근육 분포 | 필요 |

---

## 타입 정의 참조

### Auth (`types/auth.ts`)

- `User`: id, email, name, createdAt, updatedAt
- `LoginRequest` / `LoginResponse`
- `RegisterRequest` / `RegisterResponse`

### Workout (`types/workout.ts`)

- `MuscleGroup`: id, name, nameKo
- `Exercise`: id, name, equipment, imageUrl, muscleGroups[]
- `WeightUnit`: `'kg'` | `'lbs'`
- `WorkoutSet`: round, reps, weight, weightUnit
- `WorkoutExercise`: exercise, order, sets[]
- `WorkoutRoutine`: id, date, exercises[]
- `CreateRoutinePayload`: API 제출용 구조체
- `VolumeData`: date, volume
- `PersonalRecord`: name, maxWeight, date
- `MuscleBreakdownItem`: muscleGroup, setCount
