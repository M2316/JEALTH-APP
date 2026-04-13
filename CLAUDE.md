# jealth-app (JEALTH-APP repo)

Expo (React Native) 프론트엔드. 이 파일은 `jealth-app/` 내부 작업 시 자동 로드된다.

## 언어

사용자와의 소통은 한국어.

## 주요 명령어

```bash
npm install              # 의존성 설치
npx expo start           # 개발 서버
npx expo start --web     # 웹 모드
npx expo start --android # 안드로이드
npx expo start --ios     # iOS
npx expo lint            # ESLint
```

### E2E 테스트 (Maestro)

`.maestro/` 디렉터리의 플로우를 사용. 실행 전 에뮬레이터·Metro 서버 확인.

## 아키텍처

- **라우팅**: `expo-router` 파일 기반. `src/app/`
  - `(auth)/` — 로그인·회원가입·비밀번호 찾기 (Stack)
  - `(tabs)/` — 홈·기록·통계·설정 (NativeTabs)
  - `exercises/` — 운동 목록·커스텀 운동 생성 (Stack)
- **인증 흐름**: 루트 `_layout.tsx`에서 `useAuthStore`로 확인 → 미인증 시 `/(auth)/login` 리다이렉트
- **경로 별칭**: `@/*` → `./src/*`, `@/assets/*` → `./assets/*` (tsconfig.json)
- **플랫폼별 파일**: `.web.tsx`/`.web.ts` 접미사로 웹 전용 구현 분리 (예: `token-storage.ts` / `token-storage.web.ts`)
- **상태 관리**: Zustand 스토어 (`src/stores/`). 도메인별 분리:
  - `auth-store.ts` — 사용자 인증 (토큰, 로그인/로그아웃)
  - `workout-store.ts` — 날짜별 루틴 CRUD
  - `exercise-store.ts` — 운동 종목/근육군 관리
  - `stats-store.ts` — 기간별 통계 (볼륨, 개인기록, 근육 비중)
- **API 통신**: `src/lib/api.ts` 커스텀 fetch 래퍼. Bearer 토큰 자동 주입. React Query/SWR 없이 Zustand 스토어에서 직접 호출
- **API Base URL**: 웹 `localhost:3000`, 네이티브 개발 `192.168.0.102:3000`
- **토큰 저장**: 네이티브 `expo-secure-store`, 웹 `localStorage` 폴백
- **테마**: `src/constants/theme.ts` — Colors, Fonts, Spacing. `useTheme()` 훅. 다크 모드 기본
- **디자인**: Glassmorphism. `GlassSurface`, `ThemedText`, `ThemedButton` 공통 컴포넌트
- **빌드**: EAS Build (`eas.json`) — development, preview, production

## 기술 스택

Expo SDK 55 (canary), React 19, React Native 0.83, TypeScript 5.9 (strict), Zustand 5, Reanimated 4, Victory Native. React Compiler 활성화, typed routes.

## Worktree 규칙

- 기능 작업은 **이 repo 내부** `.worktrees/<feature-name>/` 에서 진행 (루트 `jealth/`에 생성 금지).
- 기준 브랜치는 `stage` 우선, 없으면 `main`.
- 생성 예: `git worktree add .worktrees/<name> -b <name> stage`

## 네이티브 모듈 변경 규칙

- 네이티브 패키지를 설치/제거하거나 네이티브 코드를 수정한 경우, 사용자에게 `npx expo run:android` (또는 `npx expo run:ios`)를 다시 실행하여 스마트폰 테스트 앱을 업데이트하라고 안내한다.
- JS 코드만 변경한 경우에는 Metro Hot Reload로 자동 반영되므로 재빌드 안내가 불필요하다.

## 참고 문서

- `docs/page-specification.md` — 페이지별 기능 명세서
- `docs/superpowers/plans/` — 앱 관련 구현 계획서
