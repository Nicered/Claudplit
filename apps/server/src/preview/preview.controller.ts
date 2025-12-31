import { Controller, Get, Post, Param, Sse, MessageEvent, Res } from "@nestjs/common";
import { Response } from "express";
import { Observable, map, takeUntil, Subject, interval, merge } from "rxjs";
import { PreviewService } from "./preview.service";
import { FileWatcherService, FileChangeEvent } from "./file-watcher.service";
import { PrismaService } from "../prisma/prisma.service";

@Controller("projects/:projectId/preview")
export class PreviewController {
  constructor(
    private readonly previewService: PreviewService,
    private readonly fileWatcherService: FileWatcherService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get("status")
  getStatus(@Param("projectId") projectId: string) {
    return this.previewService.getStatus(projectId);
  }

  @Get("ready")
  checkReady(@Param("projectId") projectId: string) {
    return this.previewService.checkProjectReady(projectId);
  }

  @Post("start")
  start(@Param("projectId") projectId: string) {
    return this.previewService.start(projectId);
  }

  @Post("stop")
  stop(@Param("projectId") projectId: string) {
    return this.previewService.stop(projectId);
  }

  @Sse("watch")
  async watchFileChanges(
    @Param("projectId") projectId: string,
    @Res() res: Response,
  ): Promise<Observable<MessageEvent>> {
    // Get project path
    const project = await this.prismaService.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return new Observable((subscriber) => {
        subscriber.next({ data: { error: "Project not found" } });
        subscriber.complete();
      });
    }

    // Register this connection
    this.previewService.registerConnection(projectId);

    // Start watching if not already
    let subject = this.fileWatcherService.getChangeSubject(projectId);
    if (!subject) {
      subject = this.fileWatcherService.startWatching(projectId, project.path);
    }

    // Create a close subject to handle cleanup
    const closeSubject = new Subject<void>();

    res.on("close", () => {
      closeSubject.next();
      closeSubject.complete();
      // Unregister connection and potentially stop preview
      this.previewService.unregisterConnection(projectId);
    });

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeat$ = interval(30000).pipe(
      map(() => ({ data: { type: "heartbeat", timestamp: Date.now() } })),
    );

    // Convert file changes to SSE events
    const changes$ = subject.pipe(
      map((change: FileChangeEvent) => ({
        data: {
          type: "file-change" as const,
          projectId: change.projectId,
          changeType: change.type,
          path: change.path,
          timestamp: change.timestamp,
        },
      })),
    );

    return merge(heartbeat$, changes$).pipe(
      takeUntil(closeSubject),
      map((event) => ({ data: JSON.stringify(event.data) }) as MessageEvent),
    );
  }
}
