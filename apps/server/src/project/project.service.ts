import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { ConfigService } from "@nestjs/config";
import * as path from "path";
import * as fs from "fs/promises";

@Injectable()
export class ProjectService {
  private readonly projectsBasePath: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    this.projectsBasePath =
      this.configService.get<string>("PROJECTS_BASE_PATH") ||
      path.join(process.env.HOME || "/tmp", "claudplit-projects");
  }

  async findAll() {
    return this.prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        projectType: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async create(dto: CreateProjectDto) {
    const projectPath = path.join(this.projectsBasePath, dto.name);

    // Create project directory
    await fs.mkdir(projectPath, { recursive: true });

    // Create project in database
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        projectType: dto.projectType,
        path: projectPath,
        description: dto.description,
      },
    });

    return project;
  }

  async remove(id: string) {
    const project = await this.findOne(id);

    // Delete from database
    await this.prisma.project.delete({
      where: { id },
    });

    // Optionally delete project directory
    try {
      await fs.rm(project.path, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  }

  getProjectPath(id: string): Promise<string> {
    return this.findOne(id).then((project) => project.path);
  }
}
