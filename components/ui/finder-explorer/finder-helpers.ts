import type { ExplorerItemKind } from "@/lib/document-kind";
import type {
  ExplorerFileItem,
  ExplorerFilterSlug,
} from "@/lib/portfolio-documents";

export type SortKey = "name" | "meta" | "folder" | "kind";
export type SortDir = "asc" | "desc";
export type KindFilter = "all" | ExplorerItemKind;

export const KIND_FILTER_OPTIONS: ReadonlyArray<{
  key: KindFilter;
  label: string;
}> = [
  { key: "all", label: "All Kinds" },
  { key: "project", label: "Projects" },
  { key: "pdf", label: "PDF" },
  { key: "image", label: "JPG" },
];

export const SORT_COLUMNS: ReadonlyArray<{
  key: SortKey;
  label: string;
  hideMobile: boolean;
}> = [
  { key: "name", label: "Name", hideMobile: false },
  { key: "meta", label: "Notes / Meta", hideMobile: true },
  { key: "folder", label: "Folder", hideMobile: true },
  { key: "kind", label: "Kind", hideMobile: true },
];

const COMPARATORS: Record<
  SortKey,
  (a: ExplorerFileItem, b: ExplorerFileItem) => number
> = {
  name: (a, b) => a.name.localeCompare(b.name),
  meta: (a, b) => a.meta.localeCompare(b.meta),
  folder: (a, b) => a.folderLabel.localeCompare(b.folderLabel),
  kind: (a, b) => a.kindLabel.localeCompare(b.kindLabel),
};

export function matchesExplorerQuery(
  item: ExplorerFileItem,
  query: string,
): boolean {
  if (!query) return true;

  const baseFields = [
    item.name,
    item.meta,
    item.folderLabel,
    item.fileName,
    item.kindLabel,
  ];
  if (baseFields.some((field) => field.toLowerCase().includes(query))) {
    return true;
  }

  if (item.kind !== "project") return false;

  const descMatch = item.project.description.toLowerCase().includes(query);
  const techMatch =
    item.project.technologies?.some((tech) =>
      tech.toLowerCase().includes(query),
    ) ?? false;
  return descMatch || techMatch;
}

export function filterExplorerFiles(
  files: ExplorerFileItem[],
  activeFolder: ExplorerFilterSlug,
  kindFilter: KindFilter,
  searchQuery: string,
  sortKey: SortKey,
  sortDir: SortDir,
): ExplorerFileItem[] {
  const query = searchQuery.trim().toLowerCase();

  const matches = files.filter((item) => {
    if (activeFolder !== "all" && item.folderId !== activeFolder) return false;
    if (kindFilter !== "all" && item.kind !== kindFilter) return false;
    return matchesExplorerQuery(item, query);
  });

  const comparator = COMPARATORS[sortKey];
  return matches.toSorted((a, b) => {
    const cmp = comparator(a, b);
    return sortDir === "asc" ? cmp : -cmp;
  });
}

export function getDirectionalSelection(
  key: string,
  currentIndex: number,
  files: ExplorerFileItem[],
): ExplorerFileItem | null {
  if (files.length === 0) return null;
  if (key === "ArrowDown") {
    const nextIndex = currentIndex < files.length - 1 ? currentIndex + 1 : 0;
    return files[nextIndex] ?? null;
  }
  if (key === "ArrowUp") {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : files.length - 1;
    return files[prevIndex] ?? null;
  }
  return null;
}

export function getQuickLookMeta(selectedItem: ExplorerFileItem | null): {
  ariaLabel: string;
  title: string;
} {
  if (!selectedItem) {
    return {
      ariaLabel: "Quick Look (select a file first)",
      title: "Quick Look selected document (Spacebar)",
    };
  }
  if (selectedItem.kind === "project") {
    return {
      ariaLabel: `Open Project ${selectedItem.name}`,
      title: "Open selected project page (Spacebar / Enter)",
    };
  }
  return {
    ariaLabel: `Quick Look ${selectedItem.name}`,
    title: "Quick Look selected document (Spacebar)",
  };
}
