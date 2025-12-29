import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Observable, Subject } from "rxjs";
import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";

export interface ClaudeStreamEvent {
  type: "init" | "text" | "tool_use" | "tool_result" | "complete" | "error";
  content?: string;
  tool?: {
    name: string;
    input?: Record<string, unknown>;
  };
  error?: string;
  sessionId?: string;
  cost?: number;
}

@Injectable()
export class ClaudeCliService {
  private readonly logger = new Logger(ClaudeCliService.name);
  private readonly cliPath: string;
  private activeProcesses: Map<string, ChildProcess> = new Map();

  constructor(private configService: ConfigService) {
    this.cliPath = this.configService.get<string>("CLAUDE_CLI_PATH") || "claude";
  }

  executePrompt(
    projectPath: string,
    prompt: string,
    sessionId: string
  ): Observable<ClaudeStreamEvent> {
    return new Observable((subscriber) => {
      // Check if project path exists
      if (!fs.existsSync(projectPath)) {
        this.logger.error(`Project path does not exist: ${projectPath}`);
        subscriber.next({
          type: "error",
          error: `프로젝트 경로가 존재하지 않습니다: ${projectPath}`,
        });
        subscriber.complete();
        return;
      }

      // Escape prompt for shell
      const escapedPrompt = prompt.replace(/'/g, "'\\''");
      const cliCommand = `${this.cliPath} -p '${escapedPrompt}' --output-format stream-json --verbose --dangerously-skip-permissions`;

      // Use script to emulate PTY for real-time output
      const command = `script -q -c "${cliCommand.replace(/"/g, '\\"')}" /dev/null`;

      this.logger.log(`Executing Claude CLI in ${projectPath}`);
      this.logger.log(`Command: ${command}`);

      const proc = spawn(command, [], {
        cwd: projectPath,
        env: { ...process.env },
        shell: true,
      });

      this.logger.log(`Process spawned with PID: ${proc.pid}`);

      proc.on("spawn", () => {
        this.logger.log(`Process started successfully`);
      });

      this.activeProcesses.set(sessionId, proc);

      let buffer = "";

      proc.stdout.on("data", (data: Buffer) => {
        const chunk = data.toString();
        this.logger.log(`[stdout chunk] received ${chunk.length} bytes`);

        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const event = JSON.parse(line);
              const parsed = this.parseEvent(event);
              this.logger.log(`[Parsed] type=${parsed?.type || 'null'}, raw=${event.type}`);
              if (parsed) {
                subscriber.next(parsed);
              }
            } catch (e) {
              this.logger.debug(`Non-JSON line: ${line.substring(0, 100)}`);
            }
          }
        }
      });

      proc.stderr.on("data", (data: Buffer) => {
        const message = data.toString();
        this.logger.warn(`[stderr] ${message}`);
      });

      proc.on("close", (code, signal) => {
        this.logger.log(`Process closed with code=${code}, signal=${signal}`);
        this.activeProcesses.delete(sessionId);

        if (buffer.trim()) {
          try {
            const event = JSON.parse(buffer);
            const parsed = this.parseEvent(event);
            if (parsed) {
              subscriber.next(parsed);
            }
          } catch (e) {
            // Ignore
          }
        }

        if (code === 0) {
          subscriber.complete();
        } else {
          subscriber.error(new Error(`Claude CLI exited with code ${code}`));
        }
      });

      proc.on("error", (error) => {
        this.logger.error(`Process error: ${error.message}`);
        this.activeProcesses.delete(sessionId);
        subscriber.error(error);
      });

      return () => {
        if (proc && !proc.killed) {
          proc.kill("SIGTERM");
          this.activeProcesses.delete(sessionId);
        }
      };
    });
  }

  stopSession(sessionId: string): boolean {
    const proc = this.activeProcesses.get(sessionId);
    if (proc && !proc.killed) {
      proc.kill("SIGTERM");
      this.activeProcesses.delete(sessionId);
      return true;
    }
    return false;
  }

  async checkInstallation(): Promise<{ installed: boolean; version?: string }> {
    return new Promise((resolve) => {
      const proc = spawn(this.cliPath, ["--version"], { shell: false });
      let output = "";

      proc.stdout.on("data", (data) => {
        output += data.toString();
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve({ installed: true, version: output.trim() });
        } else {
          resolve({ installed: false });
        }
      });

      proc.on("error", () => {
        resolve({ installed: false });
      });
    });
  }

  private parseEvent(raw: Record<string, unknown>): ClaudeStreamEvent | null {
    const type = raw.type as string;

    switch (type) {
      case "system":
        if (raw.subtype === "init") {
          return {
            type: "init",
            sessionId: raw.session_id as string,
          };
        }
        return null;

      case "assistant":
        const message = raw.message as Record<string, unknown>;
        const content = message?.content as Array<Record<string, unknown>>;

        if (content && content.length > 0) {
          // Process all content items, return the first meaningful one
          for (const item of content) {
            if (item.type === "text" && item.text) {
              return {
                type: "text",
                content: item.text as string,
              };
            }

            if (item.type === "tool_use") {
              return {
                type: "tool_use",
                tool: {
                  name: item.name as string,
                  input: item.input as Record<string, unknown>,
                },
              };
            }
          }
        }
        return null;

      case "user":
        const userMessage = raw.message as Record<string, unknown>;
        const userContent = userMessage?.content as Array<Record<string, unknown>>;

        if (userContent && userContent.length > 0) {
          const item = userContent[0];
          if (item.type === "tool_result") {
            return {
              type: "tool_result",
              content: item.content as string,
            };
          }
        }
        return null;

      case "result":
        return {
          type: "complete",
          content: raw.result as string,
          cost: raw.total_cost_usd as number,
        };

      default:
        return null;
    }
  }
}
