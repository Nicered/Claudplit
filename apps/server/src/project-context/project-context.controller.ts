import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ProjectContextService } from "./project-context.service";

interface CreateContextDto {
  content?: string;
}

interface UpdateContextDto {
  content: string;
}

interface GenerateContextDto {
  name: string;
  projectType: string;
  backendFramework?: string;
  description?: string;
}

@Controller("projects/:projectId/context")
export class ProjectContextController {
  constructor(private readonly projectContextService: ProjectContextService) {}

  /**
   * Get PROJECT.md content
   */
  @Get()
  async getContext(@Param("projectId") projectId: string) {
    const content = await this.projectContextService.getContext(projectId);
    const exists = content !== null;

    return {
      exists,
      content,
    };
  }

  /**
   * Get parsed PROJECT.md as structured data
   */
  @Get("parsed")
  async getContextParsed(@Param("projectId") projectId: string) {
    const parsed = await this.projectContextService.getContextParsed(projectId);
    return {
      exists: parsed !== null,
      context: parsed,
    };
  }

  /**
   * Check if PROJECT.md exists
   */
  @Get("exists")
  async hasContext(@Param("projectId") projectId: string) {
    const exists = await this.projectContextService.hasContext(projectId);
    return { exists };
  }

  /**
   * Get default template
   */
  @Get("template")
  getTemplate() {
    return {
      template: this.projectContextService.getDefaultTemplate(),
    };
  }

  /**
   * Create PROJECT.md
   */
  @Post()
  async createContext(
    @Param("projectId") projectId: string,
    @Body() dto: CreateContextDto
  ) {
    const content = await this.projectContextService.createContext(
      projectId,
      dto.content
    );
    return { content };
  }

  /**
   * Generate PROJECT.md from project info
   */
  @Post("generate")
  async generateContext(
    @Param("projectId") projectId: string,
    @Body() dto: GenerateContextDto
  ) {
    const content = this.projectContextService.generateContextFromProject(
      dto.name,
      dto.projectType,
      dto.backendFramework || null,
      dto.description
    );

    // Also save the generated content
    await this.projectContextService.createContext(projectId, content);

    return { content };
  }

  /**
   * Update PROJECT.md
   */
  @Put()
  async updateContext(
    @Param("projectId") projectId: string,
    @Body() dto: UpdateContextDto
  ) {
    const content = await this.projectContextService.updateContext(
      projectId,
      dto.content
    );
    return { content };
  }

  /**
   * Delete PROJECT.md
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteContext(@Param("projectId") projectId: string) {
    await this.projectContextService.deleteContext(projectId);
  }
}
