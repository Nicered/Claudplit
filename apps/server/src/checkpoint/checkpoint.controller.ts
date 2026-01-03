import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { CheckpointService } from "./checkpoint.service";

@Controller("projects/:projectId/checkpoints")
export class CheckpointController {
  constructor(private readonly checkpointService: CheckpointService) {}

  @Get()
  getCheckpoints(
    @Param("projectId") projectId: string,
    @Query("limit") limit?: string
  ) {
    return this.checkpointService.getCheckpoints(
      projectId,
      limit ? parseInt(limit, 10) : 50
    );
  }

  @Get("status")
  getStatus(@Param("projectId") projectId: string) {
    return this.checkpointService.getStatus(projectId);
  }

  @Post()
  createCheckpoint(
    @Param("projectId") projectId: string,
    @Body() body: { message: string }
  ) {
    return this.checkpointService.createCheckpoint(projectId, body.message);
  }

  @Post("auto")
  autoCheckpoint(@Param("projectId") projectId: string) {
    return this.checkpointService.autoCheckpoint(projectId);
  }

  @Get("diff")
  getDiff(
    @Param("projectId") projectId: string,
    @Query("from") fromHash: string,
    @Query("to") toHash?: string
  ) {
    return this.checkpointService.getDiff(projectId, fromHash, toHash);
  }

  @Post(":hash/restore")
  restoreCheckpoint(
    @Param("projectId") projectId: string,
    @Param("hash") hash: string
  ) {
    return this.checkpointService.restoreCheckpoint(projectId, hash);
  }
}
