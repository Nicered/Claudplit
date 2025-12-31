<p align="center">
  <img src="https://nicered.github.io/claudeship/logo.svg" alt="ClaudeShip" width="120">
</p>

<h1 align="center">ClaudeShip</h1>

<p align="center">
  <strong>Build web applications with natural language</strong><br>
  Describe what you want, AI writes the code
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/claudeship"><img src="https://img.shields.io/npm/v/claudeship.svg" alt="npm"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white" alt="Node.js"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License"></a>
</p>

<p align="center">
  <a href="https://nicered.github.io/claudeship">Website</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="./docs/README.ko.md">한국어</a>
</p>

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

### One Command Install

```bash
npx claudeship
```

That's it! Open [http://localhost:13000](http://localhost:13000) and start building.

### Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9
- **Claude Code CLI** — [claude.ai/code](https://claude.ai/code)

```bash
# Check if you have all requirements
npx claudeship doctor
```

### Installation Options

#### Option 1: npx (Recommended)

```bash
npx claudeship
```

#### Option 2: Global Install

```bash
npm install -g claudeship
claudeship start
```

#### Option 3: From Source

```bash
git clone https://github.com/nicered/claudeship.git
cd claudeship
pnpm install
pnpm dev
```

### CLI Commands

```bash
claudeship              # Start ClaudeShip
claudeship start        # Same as above
claudeship doctor       # Check system requirements
claudeship --help       # Show help
claudeship -p 3000      # Custom web port
claudeship -s 4000      # Custom API port
```

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

## Releasing

Releases are automated via GitHub Actions. When you create a GitHub release:

1. **Create a release** on GitHub with a tag like `v1.0.0`
2. **GitHub Actions automatically**:
   - Builds the project
   - Updates package.json version from the tag
   - Publishes to npm

### Manual Release

```bash
# Bump version
npm version patch  # or minor, major

# Push with tags
git push && git push --tags
```

### Required Secrets

For npm publishing, add `NPM_TOKEN` to your repository secrets:

1. Generate token at [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)
2. Add to GitHub: Settings → Secrets → Actions → `NPM_TOKEN`

---

## License

MIT
