import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Sse,
  Res,
  MessageEvent,
} from "@nestjs/common";
import { Response } from "express";
import { Observable, map, takeUntil, Subject, interval, merge } from "rxjs";
import { TestingService, TestStep, TestEvent } from "./testing.service";

@Controller("projects/:projectId/testing")
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Get("scenarios")
  getScenarios(@Param("projectId") projectId: string) {
    return this.testingService.getScenarios(projectId);
  }

  @Get("scenarios/:scenarioId")
  getScenario(
    @Param("projectId") projectId: string,
    @Param("scenarioId") scenarioId: string
  ) {
    return this.testingService.getScenario(projectId, scenarioId);
  }

  @Post("scenarios")
  createScenario(
    @Param("projectId") projectId: string,
    @Body() body: { name: string; steps: TestStep[] }
  ) {
    return this.testingService.createScenario(projectId, body.name, body.steps);
  }

  @Put("scenarios/:scenarioId")
  updateScenario(
    @Param("projectId") projectId: string,
    @Param("scenarioId") scenarioId: string,
    @Body() body: { name: string; steps: TestStep[] }
  ) {
    return this.testingService.updateScenario(
      projectId,
      scenarioId,
      body.name,
      body.steps
    );
  }

  @Delete("scenarios/:scenarioId")
  deleteScenario(
    @Param("projectId") projectId: string,
    @Param("scenarioId") scenarioId: string
  ) {
    return this.testingService.deleteScenario(projectId, scenarioId);
  }

  @Post("scenarios/:scenarioId/run")
  runScenario(
    @Param("projectId") projectId: string,
    @Param("scenarioId") scenarioId: string
  ) {
    return this.testingService.runScenario(projectId, scenarioId);
  }

  @Post("scenarios/:scenarioId/stop")
  stopScenario(@Param("scenarioId") scenarioId: string) {
    this.testingService.stopTest(scenarioId);
    return { success: true };
  }

  @Sse("stream")
  streamTestEvents(
    @Param("projectId") projectId: string,
    @Res() res: Response
  ): Observable<MessageEvent> {
    const closeSubject = new Subject<void>();

    res.on("close", () => {
      closeSubject.next();
      closeSubject.complete();
    });

    // Send heartbeat every 30 seconds
    const heartbeat$ = interval(30000).pipe(
      map(() => ({ data: { type: "heartbeat", timestamp: Date.now() } }))
    );

    // Stream test events
    const events$ = this.testingService.getTestStream(projectId).pipe(
      map((event: TestEvent) => ({
        data: event,
      }))
    );

    return merge(heartbeat$, events$).pipe(
      takeUntil(closeSubject),
      map((event) => ({ data: JSON.stringify(event.data) }) as MessageEvent)
    );
  }
}
