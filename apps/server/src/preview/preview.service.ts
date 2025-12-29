import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { spawn, ChildProcess } from "child_process";
import { ProjectService } from "../project/project.service";
import { PrismaService } from "../prisma/prisma.service";
import { BackendFramework } from "@prisma/client";
import * as net from "net";
import * as fs from "fs";
import * as path from "path";

export interface PreviewInfo {
  projectId: string;
  port: number;
  backendPort?: number;
  pid: number;
  backendPid?: number;
  status: "stopped" | "starting" | "running" | "error";
  process?: ChildProcess;
  backendProcess?: ChildProcess;
}

export interface PreviewStatus {
  status: "stopped" | "starting" | "running" | "error";
  url?: string;
  backendUrl?: string;
  error?: string;
}

@Injectable()
export class PreviewService {
  private readonly logger = new Logger(PreviewService.name);
  private previews: Map<string, PreviewInfo> = new Map();
  private readonly portRange = { min: 3001, max: 3099 };

  constructor(
    private projectService: ProjectService,
    private prisma: PrismaService
  ) {}

  async getStatus(projectId: string): Promise<PreviewStatus> {
    const preview = this.previews.get(projectId);
    if (!preview) {
      return { status: "stopped" };
    }

    return {
      status: preview.status,
      url:
        preview.status === "running"
          ? `http://localhost:${preview.port}`
          : undefined,
      backendUrl:
        preview.status === "running" && preview.backendPort
          ? `http://localhost:${preview.backendPort}`
          : undefined,
    };
  }

  async checkProjectReady(projectId: string): Promise<{
    ready: boolean;
    hasPackageJson: boolean;
    hasNodeModules: boolean;
    hasDevScript: boolean;
  }> {
    try {
      const projectPath = await this.projectService.getProjectPath(projectId);
      const packageJsonPath = path.join(projectPath, "package.json");
      const nodeModulesPath = path.join(projectPath, "node_modules");

      const hasPackageJson = fs.existsSync(packageJsonPath);
      const hasNodeModules = fs.existsSync(nodeModulesPath);

      let hasDevScript = false;
      if (hasPackageJson) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
          hasDevScript = !!packageJson.scripts?.dev;
        } catch {
          // Invalid package.json
        }
      }

      return {
        ready: hasPackageJson && hasDevScript,
        hasPackageJson,
        hasNodeModules,
        hasDevScript,
      };
    } catch {
      return {
        ready: false,
        hasPackageJson: false,
        hasNodeModules: false,
        hasDevScript: false,
      };
    }
  }

  async start(projectId: string): Promise<PreviewStatus> {
    // Check if already running
    const existing = this.previews.get(projectId);
    if (existing && existing.status === "running") {
      return {
        status: "running",
        url: `http://localhost:${existing.port}`,
        backendUrl: existing.backendPort
          ? `http://localhost:${existing.backendPort}`
          : undefined,
      };
    }

    try {
      // Get project info from database
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return { status: "error", error: "프로젝트를 찾을 수 없습니다." };
      }

      const isFullstack = project.backendFramework !== BackendFramework.NONE;

      if (isFullstack) {
        return this.startFullstack(projectId, project.path, project.backendFramework);
      } else {
        return this.startFrontendOnly(projectId, project.path);
      }
    } catch (error) {
      this.logger.error(`Failed to start preview: ${error}`);
      this.previews.delete(projectId);
      return {
        status: "error",
        error: error instanceof Error ? error.message : "Failed to start preview",
      };
    }
  }

  private async startFrontendOnly(
    projectId: string,
    projectPath: string
  ): Promise<PreviewStatus> {
    // Check if package.json exists
    const packageJsonPath = path.join(projectPath, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      return {
        status: "error",
        error: "프로젝트가 아직 준비되지 않았습니다. AI가 작업을 완료할 때까지 기다려주세요.",
      };
    }

    // Read and validate package.json
    let packageJson: { scripts?: Record<string, string> };
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    } catch (e) {
      return {
        status: "error",
        error: "package.json 파일을 읽을 수 없습니다.",
      };
    }

    // Check if dev script exists
    if (!packageJson.scripts?.dev) {
      return {
        status: "error",
        error: "package.json에 dev 스크립트가 없습니다.",
      };
    }

    // Check if node_modules exists
    const nodeModulesPath = path.join(projectPath, "node_modules");
    if (!fs.existsSync(nodeModulesPath)) {
      this.logger.log(`Installing dependencies for project ${projectId}`);
      try {
        await this.installDependencies(projectPath);
      } catch (e) {
        return {
          status: "error",
          error: "의존성 설치에 실패했습니다.",
        };
      }
    }

    const port = await this.findAvailablePort();

    this.logger.log(
      `Starting preview for project ${projectId} on port ${port}`
    );

    const previewInfo: PreviewInfo = {
      projectId,
      port,
      pid: 0,
      status: "starting",
    };

    this.previews.set(projectId, previewInfo);

    // Start the dev server
    const proc = spawn("npm", ["run", "dev", "--", "--port", String(port)], {
      cwd: projectPath,
      shell: true,
      env: { ...process.env, PORT: String(port) },
    });

    previewInfo.process = proc;
    previewInfo.pid = proc.pid || 0;

    this.setupProcessHandlers(proc, projectId, previewInfo);

    // Wait for server to start
    await this.waitForServer(port, 30000);
    previewInfo.status = "running";

    return {
      status: "running",
      url: `http://localhost:${port}`,
    };
  }

  private async startFullstack(
    projectId: string,
    projectPath: string,
    backendFramework: BackendFramework
  ): Promise<PreviewStatus> {
    const frontendPath = path.join(projectPath, "frontend");
    const backendPath = path.join(projectPath, "backend");

    // Check if directories exist
    if (!fs.existsSync(frontendPath) || !fs.existsSync(backendPath)) {
      return {
        status: "error",
        error: "frontend/ 또는 backend/ 디렉토리가 없습니다.",
      };
    }

    // Get available ports
    const frontendPort = await this.findAvailablePort();
    const backendPort = await this.findAvailablePort();

    this.logger.log(
      `Starting fullstack preview: frontend=${frontendPort}, backend=${backendPort}`
    );

    const previewInfo: PreviewInfo = {
      projectId,
      port: frontendPort,
      backendPort,
      pid: 0,
      status: "starting",
    };

    this.previews.set(projectId, previewInfo);

    // Start backend first
    try {
      await this.startBackendServer(
        backendPath,
        backendPort,
        backendFramework,
        previewInfo
      );
    } catch (error) {
      this.previews.delete(projectId);
      return {
        status: "error",
        error: `백엔드 서버 시작 실패: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }

    // Start frontend
    try {
      await this.startFrontendServer(
        frontendPath,
        frontendPort,
        backendPort,
        previewInfo
      );
    } catch (error) {
      // Stop backend if frontend fails
      if (previewInfo.backendProcess) {
        previewInfo.backendProcess.kill("SIGTERM");
      }
      this.previews.delete(projectId);
      return {
        status: "error",
        error: `프론트엔드 서버 시작 실패: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }

    previewInfo.status = "running";

    return {
      status: "running",
      url: `http://localhost:${frontendPort}`,
      backendUrl: `http://localhost:${backendPort}`,
    };
  }

  private async startBackendServer(
    backendPath: string,
    port: number,
    framework: BackendFramework,
    previewInfo: PreviewInfo
  ): Promise<void> {
    // Install dependencies if needed
    if (framework === BackendFramework.EXPRESS) {
      const nodeModulesPath = path.join(backendPath, "node_modules");
      if (!fs.existsSync(nodeModulesPath)) {
        await this.installDependencies(backendPath);
      }
    } else if (framework === BackendFramework.FASTAPI) {
      const venvPath = path.join(backendPath, "venv");
      if (!fs.existsSync(venvPath)) {
        // Create venv and install dependencies
        await this.installPythonDependencies(backendPath);
      }
    }

    let proc: ChildProcess;

    if (framework === BackendFramework.EXPRESS) {
      proc = spawn("npm", ["run", "dev"], {
        cwd: backendPath,
        shell: true,
        env: { ...process.env, PORT: String(port) },
      });
    } else {
      // FastAPI
      const venvActivate =
        process.platform === "win32"
          ? path.join(backendPath, "venv", "Scripts", "activate")
          : path.join(backendPath, "venv", "bin", "activate");

      const cmd =
        process.platform === "win32"
          ? `${venvActivate} && uvicorn app.main:app --reload --port ${port}`
          : `source ${venvActivate} && uvicorn app.main:app --reload --port ${port}`;

      proc = spawn(cmd, [], {
        cwd: backendPath,
        shell: true,
        env: { ...process.env },
      });
    }

    previewInfo.backendProcess = proc;
    previewInfo.backendPid = proc.pid || 0;

    this.setupProcessHandlers(proc, `${previewInfo.projectId}-backend`, previewInfo);

    // Wait for backend server
    await this.waitForServer(port, 30000);
  }

  private async startFrontendServer(
    frontendPath: string,
    port: number,
    backendPort: number,
    previewInfo: PreviewInfo
  ): Promise<void> {
    const nodeModulesPath = path.join(frontendPath, "node_modules");
    if (!fs.existsSync(nodeModulesPath)) {
      await this.installDependencies(frontendPath);
    }

    const proc = spawn("npm", ["run", "dev", "--", "--port", String(port)], {
      cwd: frontendPath,
      shell: true,
      env: {
        ...process.env,
        PORT: String(port),
        NEXT_PUBLIC_API_URL: `http://localhost:${backendPort}`,
      },
    });

    previewInfo.process = proc;
    previewInfo.pid = proc.pid || 0;

    this.setupProcessHandlers(proc, `${previewInfo.projectId}-frontend`, previewInfo);

    // Wait for frontend server
    await this.waitForServer(port, 30000);
  }

  private setupProcessHandlers(
    proc: ChildProcess,
    label: string,
    previewInfo: PreviewInfo
  ): void {
    proc.stdout?.on("data", (data: Buffer) => {
      this.logger.debug(`[${label}] ${data.toString()}`);
    });

    proc.stderr?.on("data", (data: Buffer) => {
      this.logger.debug(`[${label} stderr] ${data.toString()}`);
    });

    proc.on("close", (code) => {
      this.logger.log(`[${label}] closed with code ${code}`);
    });

    proc.on("error", (error) => {
      this.logger.error(`[${label}] error: ${error.message}`);
      previewInfo.status = "error";
    });
  }

  private installPythonDependencies(backendPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const createVenv = spawn("python", ["-m", "venv", "venv"], {
        cwd: backendPath,
        shell: true,
      });

      createVenv.on("close", (code) => {
        if (code !== 0) {
          reject(new Error("Failed to create venv"));
          return;
        }

        const venvPip =
          process.platform === "win32"
            ? path.join(backendPath, "venv", "Scripts", "pip")
            : path.join(backendPath, "venv", "bin", "pip");

        const requirementsPath = path.join(backendPath, "requirements.txt");
        if (!fs.existsSync(requirementsPath)) {
          resolve();
          return;
        }

        const install = spawn(venvPip, ["install", "-r", "requirements.txt"], {
          cwd: backendPath,
          shell: true,
        });

        install.on("close", (installCode) => {
          if (installCode === 0) {
            resolve();
          } else {
            reject(new Error("pip install failed"));
          }
        });

        install.on("error", reject);
      });

      createVenv.on("error", reject);
    });
  }

  async stop(projectId: string): Promise<PreviewStatus> {
    const preview = this.previews.get(projectId);
    if (!preview) {
      return { status: "stopped" };
    }

    this.logger.log(`Stopping preview for project ${projectId}`);

    // Stop frontend process
    if (preview.process) {
      preview.process.kill("SIGTERM");
    }

    // Stop backend process (for fullstack projects)
    if (preview.backendProcess) {
      preview.backendProcess.kill("SIGTERM");
    }

    this.previews.delete(projectId);

    return { status: "stopped" };
  }

  getPreviewPort(projectId: string): number | null {
    const preview = this.previews.get(projectId);
    return preview?.status === "running" ? preview.port : null;
  }

  async stopAll(): Promise<void> {
    for (const [projectId, preview] of this.previews) {
      if (preview.process) {
        preview.process.kill("SIGTERM");
      }
    }
    this.previews.clear();
  }

  private async findAvailablePort(): Promise<number> {
    for (let port = this.portRange.min; port <= this.portRange.max; port++) {
      const isAvailable = await this.isPortAvailable(port);
      if (isAvailable) {
        return port;
      }
    }
    throw new Error("No available port found");
  }

  private isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
      server.on("error", () => resolve(false));
    });
  }

  private waitForServer(port: number, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const check = () => {
        const socket = new net.Socket();

        socket.setTimeout(1000);
        socket.once("connect", () => {
          socket.destroy();
          resolve();
        });
        socket.once("timeout", () => {
          socket.destroy();
          retry();
        });
        socket.once("error", () => {
          socket.destroy();
          retry();
        });

        socket.connect(port, "localhost");
      };

      const retry = () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error("Server start timeout"));
        } else {
          setTimeout(check, 500);
        }
      };

      check();
    });
  }

  private installDependencies(projectPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn("npm", ["install"], {
        cwd: projectPath,
        shell: true,
        env: { ...process.env },
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install exited with code ${code}`));
        }
      });

      proc.on("error", (error) => {
        reject(error);
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        if (!proc.killed) {
          proc.kill("SIGTERM");
          reject(new Error("npm install timeout"));
        }
      }, 60000);
    });
  }
}
