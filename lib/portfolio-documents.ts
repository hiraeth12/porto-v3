import type {
  ArtPreset,
  FolderArt,
  FolderFile,
} from "@/components/ui/glass-folder-cards";
import {
  fileNameFromSrc,
  resolveExplorerItemKind,
  type DocumentKind,
  type ExplorerItemKind,
} from "@/lib/document-kind";
import {
  PROJECTS_DATA,
  getProjectBySlug,
  projectToFolderFile,
  type ProjectData,
} from "@/lib/projects-data";

export type FolderCategorySlug = "profile" | "case-studies" | "archive";
export type ExplorerFilterSlug = "all" | FolderCategorySlug;

export type PortfolioFolderConfig = {
  id: FolderCategorySlug;
  label: string;
  description: string;
  art: FolderArt;
  seed?: number;
  tone?: "light" | "dark";
  appearDelay: number;
  files: FolderFile[];
};

type ExplorerBaseItem = {
  id: string;
  file: FolderFile;
  name: string;
  fileName: string;
  href: string;
  meta: string;
  art?: ArtPreset;
  thumbnail?: string;
  folderId: FolderCategorySlug;
  folderLabel: string;
};

export type ExplorerDocumentItem = ExplorerBaseItem & {
  kind: DocumentKind;
  kindLabel: "PDF Document" | "JPEG Image";
  extBadge: "PDF" | "JPG";
};

export type ExplorerProjectItem = ExplorerBaseItem & {
  kind: "project";
  kindLabel: "Project Showcase";
  extBadge: "PRJ";
  projectSlug: string;
  project: ProjectData;
};

export type ExplorerFileItem = ExplorerDocumentItem | ExplorerProjectItem;

const CASE_STUDY_PROJECTS: FolderFile[] = PROJECTS_DATA.filter(
  (project) => (project.folderId ?? "case-studies") === "case-studies",
).map(projectToFolderFile);

const PROFILE_PROJECTS: FolderFile[] = PROJECTS_DATA.filter(
  (project) => project.folderId === "profile",
).map(projectToFolderFile);

const ARCHIVE_PROJECTS: FolderFile[] = PROJECTS_DATA.filter(
  (project) => project.folderId === "archive",
).map(projectToFolderFile);

export const PORTFOLIO_FOLDERS: PortfolioFolderConfig[] = [
  {
    id: "profile",
    label: "Profile",
    description: "Credentials, academic records, and curriculum vitae",
    art: "aurora",
    seed: 3,
    appearDelay: 0,
    files: [
      ...PROFILE_PROJECTS,
      {
        name: "Speaking Certificate",
        meta: "ECCT",
        href: "/documents/ecct.pdf",
      },
      {
        name: "Language Certificate",
        meta: "EPrT",
        art: "dusk",
        href: "/documents/eprt.pdf",
      },
      {
        name: "Academic Transcript",
        meta: "Transcript",
        art: "glacier",
        href: "/documents/transkrip.pdf",
      },
      {
        name: "Curriculum Vitae",
        meta: "ATS",
        art: "verdant",
        href: "/documents/cv.pdf",
      },
    ],
  },
  {
    id: "case-studies",
    label: "Projects",
    description: "Featured projects, architecture decisions, and build notes",
    art: "none",
    tone: "dark",
    appearDelay: 140,
    files: [...CASE_STUDY_PROJECTS],
  },
  {
    id: "archive",
    label: "Certifications & Training",
    description: "Visual explorations, unfinished studies, and references",
    art: "ember",
    seed: 11,
    appearDelay: 280,
    files: [
      ...ARCHIVE_PROJECTS,
      {
        name: "Memulai Pemrograman dengan Java",
        meta: "E-Learning",
        art: "dusk",
        href: "/documents/certification/course-1.pdf",
      },
      {
        name: "Memulai Pemrograman dengan C",
        meta: "E-Learning",
        art: "dusk",
        href: "/documents/certification/course-2.pdf",
      },
      {
        name: "Spec-Driven Development dengan Kiro",
        meta: "E-Learning",
        art: "dusk",
        href: "/documents/certification/course-7.pdf",
      },
      {
        name: "Fundamentals of Deep Learning",
        meta: "Workshop",
        art: "dusk",
        href: "/documents/certification/course-3.pdf",
      },
      {
        name: "Basic Data",
        meta: "E-Learning",
        art: "dusk",
        href: "/documents/certification/course-4.pdf",
      },
      {
        name: "Programming with Python 3.X",
        meta: "E-Learning",
        art: "dusk",
        href: "/documents/certification/course-5.png",
      },
      {
        name: "Python Libraries for Data Science",
        meta: "E-Learning",
        art: "dusk",
        href: "/documents/certification/course-6.png",
      },
      {
        name: "Laboratory Teaching Assistant Algorithms and Programming",
        meta: "Assistant",
        art: "aurora",
        href: "/documents/certification/aslab-1.pdf",
      },
      {
        name: "Laboratory Teaching Assistant Data Structure and Algorithm",
        meta: "Assistant",
        art: "aurora",
        href: "/documents/certification/aslab-2.pdf",
      },
      {
        name: "Laboratory Teaching Assistant Artificial Intelligence",
        meta: "Assistant",
        art: "aurora",
        href: "/documents/certification/aslab-3.pdf",
      },
    ],
  },
];

export const ALL_EXPLORER_FILES: ExplorerFileItem[] = PORTFOLIO_FOLDERS.flatMap(
  (folder) =>
    folder.files
      .map((file, index): ExplorerFileItem | null => {
        if (!file.href) return null;
        const kind: ExplorerItemKind | null = resolveExplorerItemKind(
          file.href,
          file.kind,
        );
        if (!kind) return null;

        const fileName = fileNameFromSrc(file.href, file.name, kind);
        const artPreset =
          typeof file.art === "string" ? (file.art as ArtPreset) : undefined;

        if (kind === "project") {
          const slugFromHref = file.href
            .split(/[?#]/)[0]
            .replace(/^\/project\//i, "")
            .trim();
          const projectSlug = file.projectSlug || slugFromHref;
          const project = getProjectBySlug(projectSlug);
          if (!project) return null;

          return {
            id: `${folder.id}-${index}-project-${project.slug}`,
            file,
            name: project.name,
            fileName,
            href: `/project/${project.slug}`,
            meta: project.category ?? file.meta ?? folder.label,
            art: project.art ?? artPreset ?? "ember",
            thumbnail: project.thumbnail ?? file.image,
            folderId: folder.id,
            folderLabel: folder.label,
            kind: "project",
            kindLabel: "Project Showcase",
            extBadge: "PRJ",
            projectSlug: project.slug,
            project,
          };
        }

        return {
          id: `${folder.id}-${index}-${fileName}`,
          file,
          name: file.name,
          fileName,
          href: file.href,
          meta: file.meta ?? folder.label,
          art: artPreset,
          thumbnail: file.image,
          folderId: folder.id,
          folderLabel: folder.label,
          kind,
          kindLabel: kind === "pdf" ? "PDF Document" : "JPEG Image",
          extBadge: kind === "pdf" ? "PDF" : "JPG",
        };
      })
      .filter((item): item is ExplorerFileItem => item !== null),
);

export function isValidFolderSlug(
  value?: string | null,
): value is FolderCategorySlug {
  return value === "profile" || value === "case-studies" || value === "archive";
}

export function getFolderBySlug(
  slug?: string | null,
): PortfolioFolderConfig | undefined {
  if (!isValidFolderSlug(slug)) return undefined;
  return PORTFOLIO_FOLDERS.find((folder) => folder.id === slug);
}
