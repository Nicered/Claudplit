export type PreviewStatusType = "stopped" | "starting" | "running" | "error";

export interface PreviewStatus {
  status: PreviewStatusType;
  url?: string;
  error?: string;
}

export interface PreviewInfo {
  projectId: string;
  port: number;
  pid: number;
  status: PreviewStatusType;
}
