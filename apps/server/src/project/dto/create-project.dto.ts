import { ProjectType, BackendFramework } from "@prisma/client";

export class CreateProjectDto {
  name: string;
  projectType: ProjectType;
  backendFramework?: BackendFramework;
  description?: string;
}
