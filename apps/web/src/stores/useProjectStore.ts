import { create } from "zustand";
import { api } from "@/lib/api";
import type { Project, ProjectListItem, CreateProjectInput } from "@claudeship/shared";

interface ProjectState {
  projects: ProjectListItem[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  createProject: (data: CreateProjectInput) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await api.get<ProjectListItem[]>("/projects");
      set({ projects, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch projects",
        isLoading: false,
      });
    }
  },

  createProject: async (data: CreateProjectInput) => {
    set({ isLoading: true, error: null });
    try {
      const project = await api.post<Project>("/projects", data);
      set((state) => ({
        projects: [
          {
            id: project.id,
            name: project.name,
            projectType: project.projectType,
            backendFramework: project.backendFramework,
            updatedAt: project.updatedAt,
          },
          ...state.projects,
        ],
        isLoading: false,
      }));
      return project;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create project",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/projects/${id}`);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to delete project",
        isLoading: false,
      });
      throw error;
    }
  },

  fetchProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await api.get<Project>(`/projects/${id}`);
      set({ currentProject: project, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch project",
        isLoading: false,
      });
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  clearError: () => set({ error: null }),
}));
