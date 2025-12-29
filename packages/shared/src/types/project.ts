export enum ProjectType {
  WEB = "WEB",
  NATIVE = "NATIVE",
}

export enum BackendFramework {
  NONE = "NONE",
  EXPRESS = "EXPRESS",
  FASTAPI = "FASTAPI",
}

export const projectTypeLabels: Record<ProjectType, string> = {
  [ProjectType.WEB]: "웹앱",
  [ProjectType.NATIVE]: "네이티브 앱",
};

export const backendFrameworkLabels: Record<BackendFramework, string> = {
  [BackendFramework.NONE]: "프론트엔드 전용",
  [BackendFramework.EXPRESS]: "Express (Node.js)",
  [BackendFramework.FASTAPI]: "FastAPI (Python)",
};

export interface Project {
  id: string;
  name: string;
  projectType: ProjectType;
  backendFramework: BackendFramework;
  path: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  name: string;
  projectType: ProjectType;
  backendFramework?: BackendFramework;
  description?: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  projectType: ProjectType;
  backendFramework: BackendFramework;
  updatedAt: Date;
}
