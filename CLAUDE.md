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

### 빌드/실행 규칙 (네이티브 빌드)

**`npx expo run:android` / `run:ios` 같은 네이티브 빌드는 절대 백그라운드에서 실행하지 않는다.** 대신 사용자가 진행 상황을 볼 수 있도록 **별도 터미널 창을 띄워서** 포그라운드로 실행한다. Windows 기준:

```bash
# 새 cmd 창에서 빌드 실행 (Claude는 이 명령으로 띄우기만 하고 진행은 사용자가 모니터)
start "expo build" cmd /k "cd /d C:\cj && npx expo run:android"
```

이유: 네이티브 빌드는 5~15분 소요되며 진행 로그와 실패 원인을 사용자가 즉시 볼 수 있어야 한다. 백그라운드 실행 시 멈춘 것처럼 보이고 디버깅이 어려워진다.

> Windows MAX_PATH(260자) 충돌 회피: 워크트리는 `C:\cj` 같은 짧은 경로에 둔다 (`git worktree move` 사용).

### E2E 테스트 (Maestro)

`.maestro/` 디렉터리의 플로우를 사용. 실행 전 에뮬레이터·Metro 서버 확인.

### 에뮬레이터 자동화 테스트 팁

Claude가 adb로 직접 에뮬레이터를 조작해 UI를 검증할 때 쓴다.

**Metro 연결 루틴** (에뮬레이터 부팅 직후 dev 앱은 Dev Launcher를 띄운다):

```bash
adb reverse tcp:8081 tcp:8081            # host Metro -> 에뮬레이터 localhost
# Dev Launcher에서 "http://10.0.2.2:8081" 행을 탭하거나, 아래처럼 딥링크로 바로 로드:
adb shell am start -W -a android.intent.action.VIEW \
  -d "exp+jealth-app://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081" \
  com.x031pjs.jealthapp
```

**스크린샷 캡처 + 리사이즈** (`adb exec-out screencap`은 1080×2424로 찍히는데, Claude Read는 높이 1980px 이상을 차단한다 — 반드시 리사이즈 필요):

```bash
adb exec-out screencap -p > C:/tmp/cur.png
powershell -Command "Add-Type -AssemblyName System.Drawing; \$img = [System.Drawing.Image]::FromFile('C:\tmp\cur.png'); \$nh = 1400; \$nw = [int](\$img.Width * \$nh / \$img.Height); \$bmp = New-Object System.Drawing.Bitmap(\$nw, \$nh); \$g = [System.Drawing.Graphics]::FromImage(\$bmp); \$g.DrawImage(\$img, 0, 0, \$nw, \$nh); \$bmp.Save('C:\tmp\cur_small.png'); \$img.Dispose(); \$bmp.Dispose()"
```

`file scroll-1.png scroll-2.png` 로 비교 전에 `md5sum` 으로 동일 여부를 먼저 본다 (스와이프가 먹혔는지 빠르게 판정).

**JS 레이아웃 디버깅**: 의심 컴포넌트에 `onLayout={(e) => console.log('[tag] layout', e.nativeEvent.layout)}` 임시로 박고 `adb logcat -d -s ReactNativeJS:V | grep -A 4 "tag"` 로 실제 width/height/y를 확인. 추측 대신 숫자로 판정.

**Hot reload 트리거**: 파일 저장 후 `curl -s http://localhost:8081/reload` 또는 dev menu(`adb shell input keyevent 82`) → Reload.

### `@gorhom/bottom-sheet` v5 주의

- `enableDynamicSizing` 기본값이 `true` 다. 자식이 `flex: 1` 레이아웃이면 시트가 0 높이로 수축해 내부가 통째로 깨진다. snap point로 고정 높이를 쓰려면 **반드시 `enableDynamicSizing={false}`** 로 끄고 시작.
- 하단 sticky 입력창은 `BottomSheetFooter`(absolute overlay) + `paddingBottom` 보정보다, 시트 내부를 `View flex:1` 컬럼으로 잡고 `list(flex:1) + input(intrinsic)` 형제 레이아웃이 더 예측 가능하다.

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
