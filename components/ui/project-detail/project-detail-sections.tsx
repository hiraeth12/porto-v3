import { useMemo } from "react";
import Link from "next/link";
import type { DocumentTheme } from "@/hooks/use-document-theme";
import type {
  ProjectData,
  ProjectFeature,
  ProjectImage,
} from "@/lib/projects-data";
import type { ProjectNavigationMeta } from "./project-detail-helpers";
import {
  IconArrowLeft,
  IconCode,
  IconExternalArrow,
  IconGithub,
  IconLayers,
  IconSparkle,
  IconThemeMoon,
  IconThemeSun,
} from "./project-detail-icons";

export function ProjectTopBar({
  nav,
  projectName,
  theme,
  onToggleTheme,
}: {
  nav: ProjectNavigationMeta;
  projectName: string;
  theme: DocumentTheme;
  onToggleTheme: () => void;
}) {
  return (
    <header className="pd-top-bar">
      <div className="pd-nav-left">
        <Link href={nav.backHref} className="pd-back-btn">
          <span className="pd-back-icon">
            <IconArrowLeft />
          </span>
          <span>{nav.backLabel}</span>
        </Link>

        <nav className="pd-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/#work" className="pd-breadcrumb-link">
            Portfolio
          </Link>
          <span className="pd-breadcrumb-sep" aria-hidden="true">
            /
          </span>
          <Link
            href={`/documents?folder=${nav.folderSlug}`}
            className="pd-breadcrumb-link"
          >
            {nav.folderConfig?.label ?? "Projects"}
          </Link>
          <span className="pd-breadcrumb-sep" aria-hidden="true">
            /
          </span>
          <span className="pd-breadcrumb-current" aria-current="page">
            {projectName}
          </span>
        </nav>
      </div>

      <button
        type="button"
        className="pd-theme-toggle"
        onClick={onToggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? <IconThemeMoon /> : <IconThemeSun />}
        <span>{theme === "light" ? "Dark" : "Light"}</span>
      </button>
    </header>
  );
}

function ProjectMetaPills({
  category,
  date,
}: {
  category?: string;
  date?: string;
}) {
  if (!category && !date) return null;
  return (
    <div className="pd-eyebrow-row">
      {category ? <span className="pd-eyebrow-pill">{category}</span> : null}
      {date ? <span className="pd-date-pill">{date}</span> : null}
    </div>
  );
}

function ProjectMetricsGrid({
  technologiesCount,
  featuresCount,
}: {
  technologiesCount: number;
  featuresCount: number;
}) {
  if (technologiesCount === 0 && featuresCount === 0) return null;
  return (
    <div className="pd-metrics-grid" aria-label="Project scope summary">
      <div className="pd-bezel-shell">
        <div className="pd-metric-card">
          <span className="pd-metric-icon">
            <IconCode />
          </span>
          <div className="pd-metric-copy">
            <span className="pd-metric-value">{technologiesCount}</span>
            <span className="pd-metric-label">Total Technologies</span>
          </div>
        </div>
      </div>

      <div className="pd-bezel-shell">
        <div className="pd-metric-card">
          <span className="pd-metric-icon">
            <IconLayers />
          </span>
          <div className="pd-metric-copy">
            <span className="pd-metric-value">{featuresCount}</span>
            <span className="pd-metric-label">Key Features</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectActionLinks({
  liveDemo,
  github,
}: {
  liveDemo?: string;
  github?: string;
}) {
  if (!liveDemo && !github) return null;
  return (
    <div className="pd-actions-row">
      {liveDemo ? (
        <a
          href={liveDemo}
          target="_blank"
          rel="noopener noreferrer"
          className="pd-cta-btn pd-cta-btn--primary"
        >
          <span>Live Demo</span>
          <span className="pd-cta-icon-circle">
            <IconExternalArrow />
          </span>
        </a>
      ) : null}

      {github ? (
        <a
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          className="pd-cta-btn pd-cta-btn--secondary"
        >
          <span>GitHub</span>
          <span className="pd-cta-icon-circle">
            <IconGithub />
          </span>
        </a>
      ) : null}
    </div>
  );
}

function ProjectTechSection({ technologies }: { technologies: string[] }) {
  if (technologies.length === 0) return null;
  return (
    <div className="pd-tech-section">
      <h2 className="pd-section-heading">
        <span className="pd-section-heading-icon">
          <IconCode />
        </span>
        <span>Technologies Used</span>
      </h2>

      <ul className="pd-tech-list" aria-label="Technologies used">
        {technologies.map((tech) => (
          <li key={tech} className="pd-tech-pill">
            <span className="pd-tech-dot" aria-hidden="true" />
            <span>{tech}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProjectOverviewColumn({
  project,
  featuresCount,
  technologies,
}: {
  project: ProjectData;
  featuresCount: number;
  technologies: string[];
}) {
  return (
    <>
      <ProjectMetaPills category={project.category} date={project.date} />

      <div className="pd-title-block">
        <h1 className="pd-title">{project.name}</h1>
        <div className="pd-title-accent-bar" aria-hidden="true" />
      </div>

      <p className="pd-description">{project.description}</p>

      <ProjectMetricsGrid
        technologiesCount={technologies.length}
        featuresCount={featuresCount}
      />

      <ProjectActionLinks liveDemo={project.liveDemo} github={project.github} />

      <ProjectTechSection technologies={technologies} />
    </>
  );
}

function GalleryThumbnails({
  images,
  activeIndex,
  onSelect,
}: {
  images: ProjectImage[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const imageEntries = useMemo(() => {
    const seen = new Map<string, number>();
    return images.map((img) => {
      const count = seen.get(img.src) ?? 0;
      seen.set(img.src, count + 1);
      return {
        key: count === 0 ? img.src : `${img.src}#${count}`,
        img,
      };
    });
  }, [images]);

  if (images.length <= 1) return null;
  return (
    <div
      className="pd-gallery-thumbs"
      role="tablist"
      aria-label="Project screenshots"
    >
      {imageEntries.map((entry, idx) => (
        <button
          key={entry.key}
          type="button"
          role="tab"
          aria-selected={idx === activeIndex}
          data-active={idx === activeIndex}
          className="pd-gallery-thumb-btn"
          onClick={() => onSelect(idx)}
          aria-label={`View screenshot ${idx + 1}: ${entry.img.alt}`}
        >
          <img src={entry.img.src} alt="" draggable={false} />
        </button>
      ))}
    </div>
  );
}

export function ProjectGalleryCard({
  projectName,
  projectCategory,
  images,
  activeIndex,
  onSelectImage,
}: {
  projectName: string;
  projectCategory?: string;
  images: ProjectImage[];
  activeIndex: number;
  onSelectImage: (index: number) => void;
}) {
  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="pd-bezel-shell">
      <div className="pd-gallery-core">
        <div className="pd-gallery-stage">
          {activeImage ? (
            <img
              src={activeImage.src}
              alt={activeImage.alt}
              className="pd-gallery-img"
              draggable={false}
            />
          ) : (
            <div className="pd-gallery-fallback">
              <strong>{projectName}</strong>
              <span>{projectCategory ?? "Project Showcase"}</span>
            </div>
          )}
        </div>

        {activeImage?.caption ? (
          <div className="pd-gallery-caption-bar">
            <span>{activeImage.caption}</span>
            {images.length > 1 ? (
              <span>
                {activeIndex + 1} / {images.length}
              </span>
            ) : null}
          </div>
        ) : null}

        <GalleryThumbnails
          images={images}
          activeIndex={activeIndex}
          onSelect={onSelectImage}
        />
      </div>
    </div>
  );
}

export function ProjectFeaturesCard({
  features,
}: {
  features: ProjectFeature[];
}) {
  if (features.length === 0) return null;

  return (
    <div className="pd-bezel-shell">
      <div className="pd-features-core">
        <div className="pd-features-header">
          <h2 className="pd-section-heading">
            <span className="pd-section-heading-icon">
              <IconSparkle />
            </span>
            <span>Key Features</span>
          </h2>
          <span className="pd-date-pill">
            {features.length} {features.length === 1 ? "Capability" : "Capabilities"}
          </span>
        </div>

        <ul className="pd-features-list">
          {features.map((feature) => (
            <li key={feature.title} className="pd-feature-item">
              <span className="pd-feature-bullet" aria-hidden="true" />
              <div className="pd-feature-copy">
                <h3 className="pd-feature-title">{feature.title}</h3>
                {feature.description ? (
                  <p className="pd-feature-desc">{feature.description}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
