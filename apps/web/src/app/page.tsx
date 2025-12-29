"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ProjectList } from "@/components/project/ProjectList";
import { CreateProjectModal } from "@/components/project/CreateProjectModal";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTranslation } from "@/lib/i18n";
import type { ProjectType } from "@claudeship/shared";

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { projects, isLoading, fetchProjects, createProject, deleteProject } =
    useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (data: {
    name: string;
    projectType: ProjectType;
  }) => {
    try {
      const project = await createProject(data);
      setIsModalOpen(false);
      router.push(`/project/${project.id}`);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm(t("project.deleteConfirm"))) {
      try {
        await deleteProject(id);
      } catch (error) {
        console.error("Failed to delete project:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">{t("home.title")}</h2>
          <p className="mt-1 text-muted-foreground">
            {projects.length === 0 ? t("home.createFirst") : `${projects.length} ${projects.length === 1 ? "project" : "projects"}`}
          </p>
        </div>

        {isLoading && projects.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : (
          <ProjectList
            projects={projects}
            onCreateClick={() => setIsModalOpen(true)}
            onDelete={handleDeleteProject}
          />
        )}
      </main>

      <CreateProjectModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateProject}
        isLoading={isLoading}
      />
    </div>
  );
}
