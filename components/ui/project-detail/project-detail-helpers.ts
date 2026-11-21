import {
  getFolderBySlug,
  isValidFolderSlug,
  type FolderCategorySlug,
  type PortfolioFolderConfig,
} from "@/lib/portfolio-documents";
import type {
  ProjectData,
  ProjectFeature,
  ProjectImage,
} from "@/lib/projects-data";

export function normalizeImages(project: ProjectData): ProjectImage[] {
  const raw = project.images ?? [];
  const normalized: ProjectImage[] = raw.map((item, index) => {
    if (typeof item === "string") {
      return {
        src: item,
        alt: `${project.name} screenshot ${index + 1}`,
      };
    }
    return item;
  });

  if (normalized.length === 0 && project.thumbnail) {
    normalized.push({
      src: project.thumbnail,
      alt: `${project.name} preview`,
    });
  }

  return normalized;
}

export function normalizeFeatures(
  features?: Array<string | ProjectFeature>,
): ProjectFeature[] {
  if (!features) return [];
  return features.map((item) =>
    typeof item === "string" ? { title: item } : item,
  );
}

export type ProjectNavigationMeta = {
  folderSlug: FolderCategorySlug;
  folderConfig: PortfolioFolderConfig | undefined;
  backHref: string;
  backLabel: string;
};

export function resolveProjectNavigation(
  project: ProjectData,
  fromParam: string | null,
  folderParam: string | null,
): ProjectNavigationMeta {
  const validFolderParam = isValidFolderSlug(folderParam) ? folderParam : null;
  const folderSlug: FolderCategorySlug =
    validFolderParam ?? project.folderId ?? "case-studies";
  const folderConfig = getFolderBySlug(folderSlug);

  if (fromParam === "documents") {
    return {
      folderSlug,
      folderConfig,
      backHref: validFolderParam
        ? `/documents?folder=${validFolderParam}`
        : "/documents",
      backLabel: "Back to Finder",
    };
  }

  return {
    folderSlug,
    folderConfig,
    backHref: "/#work",
    backLabel: "Back to Work",
  };
}
