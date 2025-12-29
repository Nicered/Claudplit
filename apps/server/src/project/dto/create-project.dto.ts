import { ProjectType } from "@prisma/client";

export class CreateProjectDto {
  name: string;
  projectType: ProjectType;
  description?: string;
}
