"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type RefObject } from "react";
import type { ViewerDocument } from "@/lib/document-kind";
import {
  isValidFolderSlug,
  type ExplorerFilterSlug,
} from "@/lib/portfolio-documents";

function appendFolderHistory(
  prev: { entries: ExplorerFilterSlug[]; index: number },
  target: ExplorerFilterSlug,
) {
  if (prev.entries[prev.index] === target) return prev;
  const nextEntries = prev.entries.slice(0, prev.index + 1);
  nextEntries.push(target);
  return { entries: nextEntries, index: nextEntries.length - 1 };
}

export function useFinderNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderParam = searchParams.get("folder");

  const urlFolder: ExplorerFilterSlug = isValidFolderSlug(folderParam)
    ? folderParam
    : "all";

  const [prevUrlFolder, setPrevUrlFolder] =
    useState<ExplorerFilterSlug>(urlFolder);
  const [folderHistory, setFolderHistory] = useState<{
    entries: ExplorerFilterSlug[];
    index: number;
  }>({
    entries: [urlFolder],
    index: 0,
  });

  if (urlFolder !== prevUrlFolder) {
    setPrevUrlFolder(urlFolder);
    setFolderHistory((prev) => appendFolderHistory(prev, urlFolder));
  }

  const activeFolder = folderHistory.entries[folderHistory.index] ?? "all";
  const canGoBackFolder = folderHistory.index > 0;
  const canGoForwardFolder =
    folderHistory.index < folderHistory.entries.length - 1;

  const syncUrlFolder = useCallback(
    (slug: ExplorerFilterSlug) => {
      const url = slug === "all" ? "/documents" : `/documents?folder=${slug}`;
      router.replace(url, { scroll: false });
    },
    [router],
  );

  const navigateFolder = useCallback(
    (slug: ExplorerFilterSlug) => {
      setFolderHistory((prev) => appendFolderHistory(prev, slug));
      syncUrlFolder(slug);
    },
    [syncUrlFolder],
  );

  const handleHistoryBack = useCallback(() => {
    if (!canGoBackFolder) {
      router.push("/#work");
      return;
    }
    const nextIndex = folderHistory.index - 1;
    const target = folderHistory.entries[nextIndex] ?? "all";
    setFolderHistory((prev) => ({ ...prev, index: nextIndex }));
    syncUrlFolder(target);
  }, [canGoBackFolder, folderHistory, router, syncUrlFolder]);

  const handleHistoryForward = useCallback(() => {
    if (!canGoForwardFolder) return;
    const nextIndex = folderHistory.index + 1;
    const target = folderHistory.entries[nextIndex] ?? "all";
    setFolderHistory((prev) => ({ ...prev, index: nextIndex }));
    syncUrlFolder(target);
  }, [canGoForwardFolder, folderHistory, syncUrlFolder]);

  return {
    activeFolder,
    canGoBackFolder,
    canGoForwardFolder,
    navigateFolder,
    handleHistoryBack,
    handleHistoryForward,
  };
}

function isEditableElement(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable
  );
}

export function useFinderSearchShortcut(
  activeDoc: ViewerDocument | null,
  searchInputRef: RefObject<HTMLInputElement | null>,
): void {
  useEffect(() => {
    if (activeDoc) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (!isEditableElement(event.target) && event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeDoc, searchInputRef]);
}
