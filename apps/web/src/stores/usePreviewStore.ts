import { create } from "zustand";
import { api } from "@/lib/api";
import type { PreviewStatus, PreviewStatusType, BackendFramework } from "@claudeship/shared";

interface DirectoryStatus {
  hasPackageJson: boolean;
  hasNodeModules: boolean;
  hasDevScript: boolean;
}

interface BackendDirectoryStatus {
  // Express (Node.js)
  hasPackageJson?: boolean;
  hasNodeModules?: boolean;
  hasDevScript?: boolean;
  // FastAPI (Python)
  hasRequirementsTxt?: boolean;
  hasVenv?: boolean;
  hasMainPy?: boolean;
}

interface ProjectReadyStatus {
  ready: boolean;
  isFullstack: boolean;
  backendFramework?: BackendFramework;
  frontend: DirectoryStatus;
  backend?: BackendDirectoryStatus;
}

interface PreviewState {
  status: PreviewStatusType;
  url: string | null;
  error: string | null;
  isLoading: boolean;
  projectReady: ProjectReadyStatus;

  startPreview: (projectId: string) => Promise<void>;
  stopPreview: (projectId: string) => Promise<void>;
  refreshPreview: () => void;
  fetchStatus: (projectId: string) => Promise<void>;
  checkProjectReady: (projectId: string) => Promise<void>;
  clearError: () => void;
}

export const usePreviewStore = create<PreviewState>((set, get) => ({
  status: "stopped",
  url: null,
  error: null,
  isLoading: false,
  projectReady: {
    ready: false,
    isFullstack: false,
    frontend: {
      hasPackageJson: false,
      hasNodeModules: false,
      hasDevScript: false,
    },
  },

  startPreview: async (projectId: string) => {
    set({ isLoading: true, error: null, status: "starting" });
    try {
      const result = await api.post<PreviewStatus>(
        `/projects/${projectId}/preview/start`
      );
      set({
        status: result.status,
        url: result.url || null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to start preview",
        status: "error",
        isLoading: false,
      });
    }
  },

  stopPreview: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post<PreviewStatus>(`/projects/${projectId}/preview/stop`);
      set({ status: "stopped", url: null, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to stop preview",
        isLoading: false,
      });
    }
  },

  refreshPreview: () => {
    const currentUrl = get().url;
    if (currentUrl) {
      // Force refresh by updating URL with timestamp
      set({ url: `${currentUrl.split("?")[0]}?t=${Date.now()}` });
    }
  },

  fetchStatus: async (projectId: string) => {
    try {
      const result = await api.get<PreviewStatus>(
        `/projects/${projectId}/preview/status`
      );
      set({
        status: result.status,
        url: result.url || null,
      });
    } catch (error) {
      set({ status: "stopped", url: null });
    }
  },

  checkProjectReady: async (projectId: string) => {
    try {
      const result = await api.get<ProjectReadyStatus>(
        `/projects/${projectId}/preview/ready`
      );
      set({ projectReady: result });
    } catch (error) {
      set({
        projectReady: {
          ready: false,
          isFullstack: false,
          frontend: {
            hasPackageJson: false,
            hasNodeModules: false,
            hasDevScript: false,
          },
        },
      });
    }
  },

  clearError: () => set({ error: null }),
}));
