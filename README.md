# Claudplit

> **AI-Powered Web Application Builder** — Build full-stack web apps using natural language, powered by Claude Code CLI

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Overview

Claudplit is a Replit-style AI-powered development environment that enables you to create web applications through natural language conversations. Simply describe what you want to build, and watch as AI generates, modifies, and runs your code in real-time.

### Key Features

| Feature | Description |
|---------|-------------|
| **Natural Language Development** | Describe your app in plain language — AI handles the code |
| **Real-time Preview** | See your changes instantly with integrated dev server |
| **Full-Stack Support** | Choose between Express (Node.js) or FastAPI (Python) backends |
| **File Explorer** | Browse your project structure with a read-only tree view |
| **Live Progress** | Watch AI operations in real-time (file reads/writes, commands) |
| **Project Management** | Create, organize, and manage multiple projects |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Claudplit                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Next.js    │    │    NestJS    │    │ Claude Code  │       │
│  │   Frontend   │◄──►│    Backend   │◄──►│     CLI      │       │
│  │  (Port 13000)│    │  (Port 14000)│    │              │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                                    │
│         ▼                   ▼                                    │
│  ┌──────────────┐    ┌──────────────┐                           │
│  │   shadcn/ui  │    │    Prisma    │                           │
│  │  Components  │    │    SQLite    │                           │
│  └──────────────┘    └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### Project Types

Claudplit supports two project configurations:

#### Frontend Only (Default)
- **Stack**: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- **Use Case**: Static sites, SPAs, client-side applications

#### Full-Stack Applications
Choose your backend framework:

| Backend | Stack | ORM | Validation |
|---------|-------|-----|------------|
| **Express** | Node.js 20+ | Prisma | Zod |
| **FastAPI** | Python 3.11+ | SQLAlchemy 2.0 | Pydantic v2 |

Both options include:
- Database integration guides (SQLite / PostgreSQL)
- API endpoint patterns
- Authentication templates
- CORS configuration

---

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: Zustand

### Backend
- **Framework**: NestJS 10
- **Database**: SQLite (via Prisma ORM)
- **Streaming**: Server-Sent Events (SSE)
- **AI Integration**: Claude Code CLI

### Monorepo Structure
```
claudplit/
├── apps/
│   ├── web/              # Next.js frontend
│   └── server/           # NestJS backend API
├── packages/
│   └── shared/           # Shared types & utilities
├── design/               # Design documents
├── scripts/              # Build & utility scripts
└── projects/             # User-generated projects (gitignored)
```

---

## Requirements

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Claude Code CLI** (`claude` command must be in PATH)

---

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/claudplit.git
cd claudplit

# Install dependencies
pnpm install

# Run database migrations
pnpm --filter @claudplit/server prisma:migrate
```

---

## Usage

### Starting the Development Server

```bash
# Start both web and API servers
pnpm dev

# Or run individually
pnpm dev:web     # Web UI (http://localhost:13000)
pnpm dev:server  # API    (http://localhost:14000)
```

### Creating Your First Project

1. Open `http://localhost:13000` in your browser
2. Click **"New Project"**
3. Enter a project name (e.g., `my-todo-app`)
4. Select project type:
   - **Web App** — For web applications
   - **Native App** — For native applications (coming soon)
5. If Web App, choose backend stack:
   - **Frontend Only** — Next.js only
   - **Express** — Node.js backend
   - **FastAPI** — Python backend
6. Start chatting! Describe what you want to build
7. Watch AI generate code and see live preview on the right panel

### Example Prompts

```
"Create a todo list app with add, complete, and delete features"

"Build a blog with markdown support and dark mode"

"Make a dashboard with charts showing sales data"

"Create a REST API for user authentication with JWT"
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development servers |
| `pnpm build` | Production build |
| `pnpm lint` | Run linter |
| `pnpm type-check` | TypeScript type checking |
| `pnpm clean` | Clean build artifacts |

---

## Commit Message Convention

Git hooks automatically validate commit messages on `pnpm install`.

**Format:**
```
[TYPE] Title

- Bullet point (optional, max 4 lines)
```

**Allowed Types:**

| Type | Description |
|------|-------------|
| `FEAT` | New feature |
| `FIX` | Bug fix |
| `DOCS` | Documentation |
| `STYLE` | Code formatting |
| `REFACTOR` | Refactoring |
| `TEST` | Tests |
| `CHORE` | Miscellaneous |
| `PERF` | Performance |
| `CI` | CI/CD |
| `BUILD` | Build configuration |

---

## License

MIT

---

<br>

# 한국어 (Korean)

---

## 개요

Claudplit은 자연어 대화를 통해 웹 애플리케이션을 생성할 수 있는 Replit 스타일의 AI 기반 개발 환경입니다. 만들고 싶은 것을 설명하기만 하면, AI가 실시간으로 코드를 생성하고 수정하며 실행합니다.

### 주요 기능

| 기능 | 설명 |
|------|------|
| **자연어 개발** | 일상 언어로 앱을 설명하면 AI가 코드를 작성 |
| **실시간 프리뷰** | 통합 개발 서버로 변경사항을 즉시 확인 |
| **풀스택 지원** | Express (Node.js) 또는 FastAPI (Python) 백엔드 선택 |
| **파일 탐색기** | 읽기 전용 트리 뷰로 프로젝트 구조 탐색 |
| **실시간 진행상황** | AI 작업 과정을 실시간으로 확인 (파일 읽기/쓰기, 명령어 실행) |
| **프로젝트 관리** | 여러 프로젝트 생성, 정리, 관리 |

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         Claudplit                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Next.js    │    │    NestJS    │    │ Claude Code  │       │
│  │   프론트엔드  │◄──►│    백엔드    │◄──►│     CLI      │       │
│  │  (Port 13000)│    │  (Port 14000)│    │              │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                                    │
│         ▼                   ▼                                    │
│  ┌──────────────┐    ┌──────────────┐                           │
│  │   shadcn/ui  │    │    Prisma    │                           │
│  │   컴포넌트   │    │    SQLite    │                           │
│  └──────────────┘    └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### 프로젝트 유형

Claudplit은 두 가지 프로젝트 구성을 지원합니다:

#### 프론트엔드 전용 (기본)
- **스택**: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- **용도**: 정적 사이트, SPA, 클라이언트 사이드 애플리케이션

#### 풀스택 애플리케이션
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
claudplit/
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
git clone https://github.com/your-username/claudplit.git
cd claudplit

# 의존성 설치
pnpm install

# 데이터베이스 마이그레이션 실행
pnpm --filter @claudplit/server prisma:migrate
```

---

## 사용법

### 개발 서버 실행

```bash
# 웹과 API 서버 동시 실행
pnpm dev

# 또는 개별 실행
pnpm dev:web     # 웹 UI (http://localhost:13000)
pnpm dev:server  # API    (http://localhost:14000)
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
