export enum ProjectType {
  WEB = "WEB",
  NATIVE = "NATIVE",
}

export const projectTypeLabels: Record<ProjectType, string> = {
  [ProjectType.WEB]: "웹앱",
  [ProjectType.NATIVE]: "네이티브 앱",
};

export interface Project {
  id: string;
  name: string;
  projectType: ProjectType;
  path: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  name: string;
  projectType: ProjectType;
  description?: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  projectType: ProjectType;
  updatedAt: Date;
}
