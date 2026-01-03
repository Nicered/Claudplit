import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ProjectService, EnvVariable } from "./project.service";
import { CreateProjectDto } from "./dto/create-project.dto";

@Controller("projects")
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  findAll() {
    return this.projectService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.projectService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectService.create(dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.projectService.remove(id);
  }

  // ==================== Environment Variables ====================

  @Get(":id/env")
  getEnvFiles(@Param("id") id: string) {
    return this.projectService.getEnvFiles(id);
  }

  @Get(":id/env/file")
  getEnvFile(@Param("id") id: string, @Query("path") envPath: string) {
    return this.projectService.getEnvFile(id, envPath);
  }

  @Put(":id/env/file")
  updateEnvFile(
    @Param("id") id: string,
    @Query("path") envPath: string,
    @Body() body: { variables: EnvVariable[] }
  ) {
    return this.projectService.updateEnvFile(id, envPath, body.variables);
  }

  @Post(":id/env/file")
  createEnvFile(
    @Param("id") id: string,
    @Query("path") envPath: string,
    @Body() body: { variables: EnvVariable[] }
  ) {
    return this.projectService.createEnvFile(id, envPath, body.variables);
  }

  @Delete(":id/env/variable")
  deleteEnvVariable(
    @Param("id") id: string,
    @Query("path") envPath: string,
    @Query("key") key: string
  ) {
    return this.projectService.deleteEnvVariable(id, envPath, key);
  }
}
