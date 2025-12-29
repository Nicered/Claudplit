# Claudplit

Claude Code CLI를 활용한 AI 기반 웹 앱 빌더입니다. Replit과 유사한 인터페이스로, 자연어 명령을 통해 웹 애플리케이션을 생성하고 실시간으로 프리뷰할 수 있습니다.

## 주요 기능

- 자연어로 웹 앱 생성 요청
- 실시간 AI 작업 진행 상황 표시 (파일 읽기/쓰기, 명령어 실행 등)
- 실시간 프리뷰 (Next.js 개발 서버)
- 프로젝트 관리 (생성, 삭제, 목록)

## 기술 스택

- **프론트엔드**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **백엔드**: NestJS, Prisma, SQLite
- **AI**: Claude Code CLI
- **상태관리**: Zustand

## 요구사항

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Claude Code CLI (`claude` 명령어가 PATH에 있어야 함)

## 설치

```bash
# 저장소 클론
git clone <repository-url>
cd claudplit

# 의존성 설치
pnpm install

# 데이터베이스 마이그레이션
pnpm --filter @claudplit/server prisma:migrate
```

## 실행

```bash
# 개발 서버 실행 (웹 + API 동시 실행)
pnpm dev

# 또는 개별 실행
pnpm dev:web     # 웹 (http://localhost:13000)
pnpm dev:server  # API (http://localhost:14000)
```

## 프로젝트 구조

```
claudplit/
├── apps/
│   ├── web/           # Next.js 프론트엔드
│   └── server/        # NestJS 백엔드
├── packages/
│   └── shared/        # 공유 타입 및 유틸리티
├── design/            # 설계 문서
└── projects/          # 사용자가 생성한 프로젝트 (gitignore)
```

## 사용법

1. 브라우저에서 `http://localhost:13000` 접속
2. "새 프로젝트" 버튼 클릭
3. 프로젝트 이름 입력 (예: "my-todo-app")
4. 채팅창에 원하는 앱 설명 입력 (예: "할 일 목록 앱을 만들어줘")
5. AI가 코드를 생성하면 오른쪽 프리뷰 패널에서 결과 확인

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm lint` | 린트 검사 |
| `pnpm type-check` | 타입 검사 |
| `pnpm clean` | 빌드 결과물 정리 |

## 커밋 메시지 규칙

Git hook으로 커밋 메시지 형식을 검증합니다. `pnpm install` 시 자동 설치됩니다.

**형식**:
```
[TYPE] 제목

- 불릿 포인트 (선택, 최대 4줄)
```

**허용되는 TYPE**:
| TYPE | 설명 |
|------|------|
| `FEAT` | 새로운 기능 |
| `FIX` | 버그 수정 |
| `DOCS` | 문서 변경 |
| `STYLE` | 코드 포맷팅 |
| `REFACTOR` | 리팩토링 |
| `TEST` | 테스트 |
| `CHORE` | 기타 작업 |
| `PERF` | 성능 개선 |
| `CI` | CI/CD |
| `BUILD` | 빌드 설정 |

**예시**:
```
[FEAT] 사용자 인증 기능 추가

- JWT 토큰 기반 인증 구현
- 로그인/로그아웃 API 추가
```

## 라이선스

MIT
