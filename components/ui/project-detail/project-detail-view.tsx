"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { LazyMotion, domAnimation } from "motion/react";
import * as m from "motion/react-m";
import { useDocumentTheme } from "@/hooks/use-document-theme";
import type { ProjectData } from "@/lib/projects-data";
import {
  normalizeFeatures,
  normalizeImages,
  resolveProjectNavigation,
} from "./project-detail-helpers";
import {
  ProjectFeaturesCard,
  ProjectGalleryCard,
  ProjectOverviewColumn,
  ProjectTopBar,
} from "./project-detail-sections";
import "./project-detail.css";

export type ProjectDetailViewProps = {
  project: ProjectData;
};

export default function ProjectDetailView({ project }: ProjectDetailViewProps) {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");
  const folderParam = searchParams.get("folder");

  const { theme, toggleTheme } = useDocumentTheme();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const nav = resolveProjectNavigation(project, fromParam, folderParam);
  const galleryImages = useMemo(() => normalizeImages(project), [project]);
  const featuresList = useMemo(
    () => normalizeFeatures(project.features),
    [project.features],
  );
  const technologiesList = project.technologies ?? [];

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="pd-page-shell" data-theme={theme}>
        <ProjectTopBar
          nav={nav}
          projectName={project.name}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="pd-main-container">
          <m.section
            className="pd-left-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProjectOverviewColumn
              project={project}
              featuresCount={featuresList.length}
              technologies={technologiesList}
            />
          </m.section>

          <m.section
            className="pd-right-col"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.52,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <ProjectGalleryCard
              projectName={project.name}
              projectCategory={project.category}
              images={galleryImages}
              activeIndex={activeImageIndex}
              onSelectImage={setActiveImageIndex}
            />

            <ProjectFeaturesCard features={featuresList} />
          </m.section>
        </main>
      </div>
    </LazyMotion>
  );
}
