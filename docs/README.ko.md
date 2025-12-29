# ClaudeShip

> **AI 기반 웹 애플리케이션 빌더** — Claude Code CLI를 활용한 자연어 풀스택 앱 개발

**한국어** | [English](./README.en.md)

---

## 개요

ClaudeShip은 자연어 대화를 통해 웹 애플리케이션을 생성할 수 있는 Replit 스타일의 AI 기반 개발 환경입니다. 만들고 싶은 것을 설명하기만 하면, AI가 실시간으로 코드를 생성하고 수정하며 실행합니다.

### 주요 기능

| 기능 | 설명 |
|------|------|
| **자연어 개발** | 일상 언어로 앱을 설명하면 AI가 코드를 작성 |
| **실시간 프리뷰** | 통합 개발 서버로 변경사항을 즉시 확인 |
| **대화 맥락 유지** | 이전 대화 내용을 기억하여 연속적인 개발 가능 |
| **풀스택 지원** | Express (Node.js) 또는 FastAPI (Python) 백엔드 선택 |
| **파일 탐색기** | 읽기 전용 트리 뷰로 프로젝트 구조 탐색 |
| **파일 뷰어** | GitHub 스타일 구문 강조로 코드 파일 확인 |
| **실시간 진행상황** | AI 작업 과정을 실시간으로 확인 (파일 읽기/쓰기, 명령어 실행) |
| **다중 프로젝트 지원** | 동적 포트 할당으로 최대 99개 프로젝트 동시 실행 |
| **다국어 지원** | 영어/한국어 UI 지원 |

---

## 프로젝트 유형

ClaudeShip은 두 가지 프로젝트 구성을 지원합니다:

### 프론트엔드 전용 (기본)
- **스택**: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- **용도**: 정적 사이트, SPA, 클라이언트 사이드 애플리케이션

### 풀스택 애플리케이션
백엔드 프레임워크 선택:

| 백엔드 | 스택 | ORM | 검증 |
|--------|------|-----|------|
| **Express** | Node.js 20+ | Prisma | Zod |
| **FastAPI** | Python 3.11+ | SQLAlchemy 2.0 | Pydantic v2 |

두 옵션 모두 포함:
- 데이터베이스 연동 가이드 (SQLite / PostgreSQL)
- API 엔드포인트 패턴
- 인증 템플릿
- CORS 설정

---

## 기술 스택

### 프론트엔드
- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **UI 라이브러리**: shadcn/ui
- **스타일링**: Tailwind CSS
- **상태 관리**: Zustand

### 백엔드
- **프레임워크**: NestJS 10
- **데이터베이스**: SQLite (Prisma ORM)
- **스트리밍**: Server-Sent Events (SSE)
- **AI 연동**: Claude Code CLI

### 모노레포 구조
```
claudeship/
├── apps/
│   ├── web/              # Next.js 프론트엔드
│   └── server/           # NestJS 백엔드 API
├── packages/
│   └── shared/           # 공유 타입 및 유틸리티
├── design/               # 설계 문서
├── scripts/              # 빌드 및 유틸리티 스크립트
└── projects/             # 사용자 생성 프로젝트 (gitignore)
```

---

## 요구사항

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Claude Code CLI** (`claude` 명령어가 PATH에 있어야 함)

---

## 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/claudeship.git
cd claudeship

# 의존성 설치
pnpm install

# 데이터베이스 마이그레이션 실행
pnpm --filter @claudeship/server prisma:migrate
```

---

## 사용법

### 개발 서버 실행

```bash
# 웹과 API 서버 동시 실행 (동적 포트 할당)
pnpm dev

# 또는 개별 실행
pnpm dev:web     # 웹 UI (기본: http://localhost:13000)
pnpm dev:server  # API    (기본: http://localhost:14000)
```

### 첫 번째 프로젝트 만들기

1. 브라우저에서 `http://localhost:13000` 열기
2. **"새 프로젝트"** 클릭
3. 프로젝트 이름 입력 (예: `my-todo-app`)
4. 프로젝트 유형 선택:
   - **웹 앱** — 웹 애플리케이션용
   - **네이티브 앱** — 네이티브 애플리케이션용 (준비 중)
5. 웹 앱인 경우, 백엔드 스택 선택:
   - **프론트엔드 전용** — Next.js만
   - **Express** — Node.js 백엔드
   - **FastAPI** — Python 백엔드
6. 대화 시작! 만들고 싶은 것을 설명
7. AI가 코드를 생성하고 오른쪽 패널에서 실시간 프리뷰 확인

### 예시 프롬프트

```
"추가, 완료, 삭제 기능이 있는 할 일 목록 앱 만들어줘"

"마크다운 지원과 다크 모드가 있는 블로그 만들어줘"

"판매 데이터를 보여주는 차트가 있는 대시보드 만들어줘"

"JWT를 사용한 사용자 인증 REST API 만들어줘"
```

---

## 사용 가능한 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm lint` | 린터 실행 |
| `pnpm type-check` | TypeScript 타입 검사 |
| `pnpm clean` | 빌드 결과물 정리 |

---

## 커밋 메시지 규칙

Git hook이 `pnpm install` 시 자동으로 커밋 메시지를 검증합니다.

**형식:**
```
[TYPE] 제목

- 불릿 포인트 (선택, 최대 4줄)
```

**허용되는 TYPE:**

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

---

## 라이선스

MIT
