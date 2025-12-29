# ClaudeShip

> **AI-Powered Web Application Builder** — Build full-stack web apps using natural language, powered by Claude Code CLI

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Documentation / 문서

| Language | Link |
|----------|------|
| **English** | [README.en.md](./docs/README.en.md) |
| **한국어** | [README.ko.md](./docs/README.ko.md) |

---

## Quick Start

```bash
# Clone & Install
git clone https://github.com/your-username/claudeship.git
cd claudeship && pnpm install

# Run
pnpm dev
```

Open `http://localhost:13000` and start building!

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ClaudeShip                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Next.js    │    │    NestJS    │    │ Claude Code  │       │
│  │   Frontend   │◄──►│    Backend   │◄──►│     CLI      │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                                    │
│         ▼                   ▼                                    │
│  ┌──────────────┐    ┌──────────────┐                           │
│  │   shadcn/ui  │    │    Prisma    │                           │
│  │  Components  │    │    SQLite    │                           │
│  └──────────────┘    └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

## License

MIT
