"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ProjectList } from "@/components/project/ProjectList";
import { CreateProjectModal } from "@/components/project/CreateProjectModal";
import { useProjectStore } from "@/stores/useProjectStore";
import type { ProjectType } from "@claudeship/shared";

export default function Home() {
  const router = useRouter();
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
    if (confirm("정말 이 프로젝트를 삭제하시겠습니까?")) {
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
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">내 프로젝트</h2>
        </div>

        {isLoading && projects.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            로딩 중...
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
