# ClaudeShip

> **AI-Powered Web Application Builder** — Build full-stack web apps using natural language, powered by Claude Code CLI

[한국어](./README.ko.md) | **English**

---

## Overview

ClaudeShip is a Replit-style AI-powered development environment that enables you to create web applications through natural language conversations. Simply describe what you want to build, and watch as AI generates, modifies, and runs your code in real-time.

### Key Features

| Feature | Description |
|---------|-------------|
| **Natural Language Development** | Describe your app in plain language — AI handles the code |
| **Real-time Preview** | See your changes instantly with integrated dev server |
| **Conversation Context** | AI remembers previous conversations for continuous development |
| **Full-Stack Support** | Choose between Express (Node.js) or FastAPI (Python) backends |
| **File Explorer** | Browse your project structure with a read-only tree view |
| **File Viewer** | View code files with GitHub-style syntax highlighting |
| **Live Progress** | Watch AI operations in real-time (file reads/writes, commands) |
| **Multi-Project Support** | Run up to 99 projects simultaneously with dynamic port allocation |
| **i18n Support** | English and Korean UI support |

---

## Project Types

ClaudeShip supports two project configurations:

### Frontend Only (Default)
- **Stack**: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- **Use Case**: Static sites, SPAs, client-side applications

### Full-Stack Applications
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
claudeship/
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
git clone https://github.com/your-username/claudeship.git
cd claudeship

# Install dependencies
pnpm install

# Run database migrations
pnpm --filter @claudeship/server prisma:migrate
```

---

## Usage

### Starting the Development Server

```bash
# Start both web and API servers (with dynamic port allocation)
pnpm dev

# Or run individually
pnpm dev:web     # Web UI (default: http://localhost:13000)
pnpm dev:server  # API    (default: http://localhost:14000)
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
