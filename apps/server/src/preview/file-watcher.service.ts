import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { watch, FSWatcher } from "chokidar";
import { Subject } from "rxjs";
import * as path from "path";

export interface FileChangeEvent {
  projectId: string;
  type: "add" | "change" | "unlink";
  path: string;
  timestamp: number;
}

@Injectable()
export class FileWatcherService implements OnModuleDestroy {
  private readonly logger = new Logger(FileWatcherService.name);
  private watchers: Map<string, FSWatcher> = new Map();
  private changeSubjects: Map<string, Subject<FileChangeEvent>> = new Map();

  /**
   * Start watching a project directory for file changes
   */
  startWatching(projectId: string, projectPath: string): Subject<FileChangeEvent> {
    // Stop existing watcher if any
    this.stopWatching(projectId);

    const subject = new Subject<FileChangeEvent>();
    this.changeSubjects.set(projectId, subject);

    // Patterns to watch (frontend source files)
    const watchPatterns = [
      path.join(projectPath, "**/*.{ts,tsx,js,jsx,css,scss,json,html}"),
      path.join(projectPath, "frontend/**/*.{ts,tsx,js,jsx,css,scss,json,html}"),
    ];

    // Patterns to ignore
    const ignorePatterns = [
      "**/node_modules/**",
      "**/.next/**",
      "**/.git/**",
      "**/dist/**",
      "**/build/**",
      "**/__pycache__/**",
      "**/venv/**",
      "**/*.log",
    ];

    const watcher = watch(watchPatterns, {
      ignored: ignorePatterns,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    // Debounce rapid changes
    let debounceTimer: NodeJS.Timeout | null = null;
    let pendingChanges: FileChangeEvent[] = [];

    const emitChanges = () => {
      if (pendingChanges.length > 0) {
        // Emit only the most recent change for each file
        const uniqueChanges = new Map<string, FileChangeEvent>();
        pendingChanges.forEach((change) => {
          uniqueChanges.set(change.path, change);
        });

        uniqueChanges.forEach((change) => {
          subject.next(change);
        });

        pendingChanges = [];
      }
    };

    const scheduleEmit = (event: FileChangeEvent) => {
      pendingChanges.push(event);

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(emitChanges, 300);
    };

    watcher.on("add", (filePath) => {
      this.logger.debug(`[${projectId}] File added: ${filePath}`);
      scheduleEmit({
        projectId,
        type: "add",
        path: filePath,
        timestamp: Date.now(),
      });
    });

    watcher.on("change", (filePath) => {
      this.logger.debug(`[${projectId}] File changed: ${filePath}`);
      scheduleEmit({
        projectId,
        type: "change",
        path: filePath,
        timestamp: Date.now(),
      });
    });

    watcher.on("unlink", (filePath) => {
      this.logger.debug(`[${projectId}] File deleted: ${filePath}`);
      scheduleEmit({
        projectId,
        type: "unlink",
        path: filePath,
        timestamp: Date.now(),
      });
    });

    watcher.on("error", (error: Error) => {
      this.logger.error(`[${projectId}] Watcher error: ${error.message}`);
    });

    this.watchers.set(projectId, watcher);
    this.logger.log(`Started watching project: ${projectId}`);

    return subject;
  }

  /**
   * Stop watching a project
   */
  stopWatching(projectId: string): void {
    const watcher = this.watchers.get(projectId);
    if (watcher) {
      watcher.close();
      this.watchers.delete(projectId);
      this.logger.log(`Stopped watching project: ${projectId}`);
    }

    const subject = this.changeSubjects.get(projectId);
    if (subject) {
      subject.complete();
      this.changeSubjects.delete(projectId);
    }
  }

  /**
   * Get the change subject for a project
   */
  getChangeSubject(projectId: string): Subject<FileChangeEvent> | undefined {
    return this.changeSubjects.get(projectId);
  }

  /**
   * Check if a project is being watched
   */
  isWatching(projectId: string): boolean {
    return this.watchers.has(projectId);
  }

  onModuleDestroy() {
    // Clean up all watchers
    for (const [projectId] of this.watchers) {
      this.stopWatching(projectId);
    }
  }
}
