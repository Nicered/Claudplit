"use client";

import { ProjectCard } from "./ProjectCard";
import { CreateProjectCard } from "./CreateProjectCard";
import type { ProjectListItem } from "@claudeship/shared";

interface ProjectListProps {
  projects: ProjectListItem[];
  onCreateClick: () => void;
  onDelete?: (id: string) => void;
}

export function ProjectList({
  projects,
  onCreateClick,
  onDelete,
}: ProjectListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} onDelete={onDelete} />
      ))}
      <CreateProjectCard onClick={onCreateClick} />
    </div>
  );
}
