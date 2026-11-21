import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProjectDetailView from "@/components/ui/project-detail/project-detail-view";
import { PROJECTS_DATA, getProjectBySlug } from "@/lib/projects-data";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return PROJECTS_DATA.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project Not Found — Sahrul Portfolio",
    };
  }

  return {
    title: `${project.name} — Sahrul Portfolio`,
    description: project.description,
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh" }} />}>
      <ProjectDetailView project={project} />
    </Suspense>
  );
}
