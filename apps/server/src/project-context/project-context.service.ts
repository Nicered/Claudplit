import { Injectable, NotFoundException } from "@nestjs/common";
import { ProjectService } from "../project/project.service";
import * as fs from "fs/promises";
import * as path from "path";

export interface ProjectContext {
  name: string;
  overview: string;
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
  };
  designDirection: {
    style: string;
    colorScheme: string;
    tone: string;
  };
  coreFeatures: string[];
  codingConventions: {
    components: string;
    functions: string;
    files: string;
  };
  agentInstructions: string[];
}

const CONTEXT_FILENAME = "PROJECT.md";

const DEFAULT_CONTEXT_TEMPLATE = `# Project Name

## Overview
[Project description]

## Tech Stack
- Frontend: Next.js 15, TypeScript, Tailwind CSS
- Backend: Express, Prisma, SQLite
- Auth: NextAuth.js

## Design Direction
- Style: Minimal, Clean
- Color Scheme: Blue-based primary
- Tone: Professional, Trustworthy

## Core Features
1. User Authentication
2. Dashboard
3. ...

## Coding Conventions
- Components: PascalCase
- Functions: camelCase
- Files: kebab-case

## Agent Instructions
- Respond in Korean
- Request confirmation at each step
- Use shadcn/ui components
`;

@Injectable()
export class ProjectContextService {
  constructor(private projectService: ProjectService) {}

  async getContext(projectId: string): Promise<string | null> {
    const projectPath = await this.projectService.getProjectPath(projectId);
    const contextPath = path.join(projectPath, CONTEXT_FILENAME);

    try {
      const content = await fs.readFile(contextPath, "utf-8");
      return content;
    } catch {
      return null;
    }
  }

  async getContextParsed(projectId: string): Promise<ProjectContext | null> {
    const content = await this.getContext(projectId);
    if (!content) return null;

    return this.parseProjectMd(content);
  }

  async createContext(projectId: string, content?: string): Promise<string> {
    const projectPath = await this.projectService.getProjectPath(projectId);
    const contextPath = path.join(projectPath, CONTEXT_FILENAME);

    const finalContent = content || DEFAULT_CONTEXT_TEMPLATE;
    await fs.writeFile(contextPath, finalContent, "utf-8");

    return finalContent;
  }

  async updateContext(projectId: string, content: string): Promise<string> {
    const projectPath = await this.projectService.getProjectPath(projectId);
    const contextPath = path.join(projectPath, CONTEXT_FILENAME);

    // Check if file exists
    try {
      await fs.access(contextPath);
    } catch {
      throw new NotFoundException(`PROJECT.md not found for project ${projectId}`);
    }

    await fs.writeFile(contextPath, content, "utf-8");
    return content;
  }

  async deleteContext(projectId: string): Promise<void> {
    const projectPath = await this.projectService.getProjectPath(projectId);
    const contextPath = path.join(projectPath, CONTEXT_FILENAME);

    try {
      await fs.unlink(contextPath);
    } catch {
      throw new NotFoundException(`PROJECT.md not found for project ${projectId}`);
    }
  }

  async hasContext(projectId: string): Promise<boolean> {
    const projectPath = await this.projectService.getProjectPath(projectId);
    const contextPath = path.join(projectPath, CONTEXT_FILENAME);

    try {
      await fs.access(contextPath);
      return true;
    } catch {
      return false;
    }
  }

  private parseProjectMd(content: string): ProjectContext {
    const lines = content.split("\n");
    const context: ProjectContext = {
      name: "",
      overview: "",
      techStack: { frontend: [], backend: [], database: [] },
      designDirection: { style: "", colorScheme: "", tone: "" },
      coreFeatures: [],
      codingConventions: { components: "", functions: "", files: "" },
      agentInstructions: [],
    };

    let currentSection = "";
    let currentContent: string[] = [];

    const processSection = () => {
      const text = currentContent.join("\n").trim();

      switch (currentSection.toLowerCase()) {
        case "overview":
          context.overview = text;
          break;

        case "tech stack":
          for (const line of currentContent) {
            if (line.toLowerCase().includes("frontend:")) {
              context.techStack.frontend = this.parseListItems(line.split(":")[1] || "");
            } else if (line.toLowerCase().includes("backend:")) {
              context.techStack.backend = this.parseListItems(line.split(":")[1] || "");
            } else if (line.toLowerCase().includes("database:") || line.toLowerCase().includes("db:")) {
              context.techStack.database = this.parseListItems(line.split(":")[1] || "");
            }
          }
          break;

        case "design direction":
          for (const line of currentContent) {
            if (line.toLowerCase().includes("style:")) {
              context.designDirection.style = line.split(":")[1]?.trim() || "";
            } else if (line.toLowerCase().includes("color")) {
              context.designDirection.colorScheme = line.split(":")[1]?.trim() || "";
            } else if (line.toLowerCase().includes("tone:")) {
              context.designDirection.tone = line.split(":")[1]?.trim() || "";
            }
          }
          break;

        case "core features":
          context.coreFeatures = currentContent
            .filter(line => line.match(/^\s*\d+\./))
            .map(line => line.replace(/^\s*\d+\.\s*/, "").trim());
          break;

        case "coding conventions":
          for (const line of currentContent) {
            if (line.toLowerCase().includes("component")) {
              context.codingConventions.components = line.split(":")[1]?.trim() || "";
            } else if (line.toLowerCase().includes("function")) {
              context.codingConventions.functions = line.split(":")[1]?.trim() || "";
            } else if (line.toLowerCase().includes("file")) {
              context.codingConventions.files = line.split(":")[1]?.trim() || "";
            }
          }
          break;

        case "agent instructions":
          context.agentInstructions = currentContent
            .filter(line => line.match(/^\s*-/))
            .map(line => line.replace(/^\s*-\s*/, "").trim());
          break;
      }
    };

    for (const line of lines) {
      // Check for project name (first h1)
      if (line.startsWith("# ") && !context.name) {
        context.name = line.replace("# ", "").trim();
        continue;
      }

      // Check for section header
      if (line.startsWith("## ")) {
        if (currentSection) {
          processSection();
        }
        currentSection = line.replace("## ", "").trim();
        currentContent = [];
        continue;
      }

      // Add line to current section
      if (currentSection && line.trim()) {
        currentContent.push(line);
      }
    }

    // Process last section
    if (currentSection) {
      processSection();
    }

    return context;
  }

  private parseListItems(text: string): string[] {
    return text
      .split(",")
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  getDefaultTemplate(): string {
    return DEFAULT_CONTEXT_TEMPLATE;
  }

  generateContextFromProject(
    name: string,
    projectType: string,
    backendFramework: string | null,
    description?: string
  ): string {
    const isFullstack = backendFramework && backendFramework !== "NONE";

    let techStack = "";
    if (projectType === "WEB") {
      techStack = "- Frontend: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui";
      if (isFullstack) {
        if (backendFramework === "EXPRESS") {
          techStack += "\n- Backend: Express, Prisma, SQLite";
        } else if (backendFramework === "FASTAPI") {
          techStack += "\n- Backend: FastAPI, SQLAlchemy, SQLite";
        }
      }
    }

    return `# ${name}

## Overview
${description || "[Project description]"}

## Tech Stack
${techStack}

## Design Direction
- Style: Minimal, Clean
- Color Scheme: Blue-based primary
- Tone: Professional, Modern

## Core Features
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]

## Coding Conventions
- Components: PascalCase
- Functions: camelCase
- Files: kebab-case

## Agent Instructions
- Respond in Korean
- Request confirmation at each step
- Use shadcn/ui components
- Follow incremental building strategy
`;
  }
}
