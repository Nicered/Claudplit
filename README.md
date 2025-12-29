# ClaudeShip

> **Build web applications with natural language** — Describe what you want, AI writes the code

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[한국어 문서](./docs/README.ko.md)**

---

## What is ClaudeShip?

ClaudeShip is an AI-powered development environment that transforms how you build web applications. Instead of writing code line by line, simply describe what you want in natural language — the AI generates, modifies, and runs your code in real-time.

Think of it as having an experienced developer working alongside you, instantly translating your ideas into working code while you watch the live preview update.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ClaudeShip Workflow                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   1. Describe        2. AI Generates       3. Live Preview          │
│   ┌─────────┐        ┌─────────────┐       ┌─────────────┐          │
│   │  "Make  │   →    │  Claude AI  │   →   │   Running   │          │
│   │  a todo │        │  writes     │       │   App in    │          │
│   │  app"   │        │  code       │       │   Browser   │          │
│   └─────────┘        └─────────────┘       └─────────────┘          │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                     Real-time Interface                       │  │
│   │  ┌────────────┐  ┌────────────────┐  ┌──────────────────┐    │  │
│   │  │   Files    │  │     Chat       │  │    Preview       │    │  │
│   │  │  Explorer  │  │   (You + AI)   │  │  (Your App)      │    │  │
│   │  └────────────┘  └────────────────┘  └──────────────────┘    │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

1. **Start a conversation** — Tell the AI what you want to build
2. **Watch the magic** — AI generates files, installs packages, runs commands
3. **See it live** — Your app runs in a live preview as changes happen
4. **Iterate naturally** — Keep chatting to refine and add features

---

## Key Features

### Natural Language Development
Describe your app in plain English (or Korean). No need to know the exact syntax — the AI understands your intent and writes production-ready code.

```
"Create a todo list with add, complete, and delete features"
"Add a dark mode toggle to the header"
"Connect to a SQLite database and show user data"
```

### Conversation Memory
The AI remembers your entire conversation history. Continue where you left off, reference previous changes, and build incrementally without re-explaining context.

### Live Preview
See your changes instantly. ClaudeShip runs a development server that hot-reloads as the AI modifies your code, giving you immediate visual feedback.

### File Explorer
Browse your project structure in a read-only tree view. Click any file to view its contents with syntax highlighting, just like in VS Code.

### Full-Stack Support
Choose your stack when creating a project:

| Configuration | Frontend | Backend | Database |
|--------------|----------|---------|----------|
| **Frontend Only** | Next.js 15 + TypeScript | — | — |
| **+ Express** | Next.js 15 | Express + Prisma | SQLite/PostgreSQL |
| **+ FastAPI** | Next.js 15 | FastAPI + SQLAlchemy | SQLite/PostgreSQL |

### Multi-Project
Run up to 99 projects simultaneously with automatic port allocation. Each project gets its own isolated environment.

### Internationalization
Full English and Korean UI support. Switch languages anytime from the header.

---

## Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Claude Code CLI** — Install from [claude.ai/code](https://claude.ai/code)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/claudeship.git
cd claudeship

# Install dependencies
pnpm install

# Set up the database
pnpm --filter @claudeship/server prisma:migrate

# Start development servers
pnpm dev
```

Open [http://localhost:13000](http://localhost:13000) and start building!

---

## Architecture

ClaudeShip is a monorepo with three main packages:

```
claudeship/
├── apps/
│   ├── web/              # Next.js 15 frontend
│   │   ├── components/   # React components (Chat, Preview, FileExplorer)
│   │   ├── stores/       # Zustand state management
│   │   └── lib/          # Utilities, i18n, API client
│   │
│   └── server/           # NestJS 10 backend
│       ├── chat/         # Claude Code CLI integration
│       ├── project/      # Project CRUD operations
│       ├── preview/      # Dev server management
│       └── file/         # File tree & content API
│
├── packages/
│   └── shared/           # Shared TypeScript types
│
└── projects/             # User-generated projects (gitignored)
```

### Tech Stack

**Frontend**: Next.js 15 (App Router), TypeScript, shadcn/ui, Tailwind CSS, Zustand

**Backend**: NestJS 10, Prisma ORM, SQLite, Server-Sent Events (SSE)

**AI Integration**: Claude Code CLI with streaming output

---

## Example Prompts

Get started with these example prompts:

```
"Create a blog with markdown support and a dark theme"

"Build a dashboard showing sales charts with recharts"

"Make a kanban board where I can drag tasks between columns"

"Create a REST API for user authentication with JWT"

"Add form validation with error messages to the signup page"
```

---

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all development servers |
| `pnpm dev:web` | Start frontend only (port 13000) |
| `pnpm dev:server` | Start backend only (port 14000) |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | TypeScript type checking |

---

## Contributing

Contributions are welcome! Please follow the commit message convention:

```
[TYPE] Title

- Bullet point (optional, max 4 lines)
```

**Types**: `FEAT`, `FIX`, `DOCS`, `STYLE`, `REFACTOR`, `TEST`, `CHORE`, `PERF`, `CI`, `BUILD`

---

## License

MIT
