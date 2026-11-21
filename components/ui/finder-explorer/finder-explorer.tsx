"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { LazyMotion, domAnimation } from "motion/react";
import * as m from "motion/react-m";
import type { ViewerDocument } from "@/lib/document-kind";
import { preloadPdfViewerChunk } from "@/components/ui/document-viewer/preload-pdf-viewer";
import { useDocumentTheme } from "@/hooks/use-document-theme";
import {
  ALL_EXPLORER_FILES,
  PORTFOLIO_FOLDERS,
  type ExplorerFileItem,
} from "@/lib/portfolio-documents";
import {
  filterExplorerFiles,
  getDirectionalSelection,
  type KindFilter,
  type SortDir,
  type SortKey,
} from "./finder-helpers";
import { useFinderNavigation, useFinderSearchShortcut } from "./finder-hooks";
import {
  FinderAmbientBar,
  FinderListHeader,
  FinderListViewport,
  FinderPathBar,
  FinderStatusBar,
  FinderToolbar,
} from "./finder-subcomponents";
import "./finder-explorer.css";

const DocumentViewer = dynamic(
  () => import("@/components/ui/document-viewer/document-viewer"),
  { ssr: false },
);

export default function FinderExplorer() {
  const router = useRouter();
  const { theme, toggleTheme } = useDocumentTheme();
  const nav = useFinderNavigation();

  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);
  const [activeDoc, setActiveDoc] = useState<ViewerDocument | null>(null);
  const [viewerMounted, setViewerMounted] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const rowRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useFinderSearchShortcut(activeDoc, searchInputRef);

  const filteredFiles = useMemo(
    () =>
      filterExplorerFiles(
        ALL_EXPLORER_FILES,
        nav.activeFolder,
        kindFilter,
        searchQuery,
        sortKey,
        sortDir,
      ),
    [nav.activeFolder, kindFilter, searchQuery, sortKey, sortDir],
  );

  const effectiveSelectedId = useMemo(() => {
    if (filteredFiles.length === 0 || selectedId === null) {
      return null;
    }
    if (selectedId && filteredFiles.some((f) => f.id === selectedId)) {
      return selectedId;
    }
    return filteredFiles[0].id;
  }, [filteredFiles, selectedId]);

  const selectedItem = useMemo(
    () =>
      effectiveSelectedId
        ? filteredFiles.find((item) => item.id === effectiveSelectedId) ?? null
        : null,
    [filteredFiles, effectiveSelectedId],
  );

  const openExplorerItem = useCallback(
    (item: ExplorerFileItem, triggerEl?: HTMLElement | null) => {
      if (item.kind === "project") {
        const folderParam =
          nav.activeFolder !== "all" ? `&folder=${nav.activeFolder}` : "";
        router.push(`${item.href}?from=documents${folderParam}`);
        return;
      }

      if (item.kind === "pdf") {
        preloadPdfViewerChunk();
      }
      returnFocusRef.current =
        triggerEl ?? rowRefs.current.get(item.id) ?? null;
      setViewerMounted(true);
      setActiveDoc({
        src: item.href,
        name: item.name,
        kind: item.kind,
        meta: `${item.meta} · ${item.folderLabel}`,
      });
    },
    [nav.activeFolder, router],
  );

  const handleCloseViewer = useCallback(() => {
    setActiveDoc(null);
  }, []);

  const handleSortColumn = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
        return;
      }
      setSortKey(key);
      setSortDir("asc");
    },
    [sortKey],
  );

  const handleListKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLUListElement>) => {
      if (activeDoc || filteredFiles.length === 0) return;

      const isActionButton =
        event.target instanceof HTMLElement &&
        Boolean(event.target.closest(".fx-row-open-btn"));

      const currentIndex = filteredFiles.findIndex(
        (item) => item.id === effectiveSelectedId,
      );
      const directionalTarget = getDirectionalSelection(
        event.key,
        currentIndex,
        filteredFiles,
      );

      if (directionalTarget) {
        event.preventDefault();
        setSelectedId(directionalTarget.id);
        rowRefs.current.get(directionalTarget.id)?.focus();
      } else if (
        !isActionButton &&
        (event.key === " " || event.key === "Enter") &&
        selectedItem
      ) {
        event.preventDefault();
        openExplorerItem(selectedItem, rowRefs.current.get(selectedItem.id));
      } else if (event.key === "Escape" && searchQuery) {
        event.preventDefault();
        setSearchQuery("");
      }
    },
    [
      activeDoc,
      effectiveSelectedId,
      filteredFiles,
      openExplorerItem,
      searchQuery,
      selectedItem,
    ],
  );

  const activeFolderConfig = useMemo(
    () =>
      nav.activeFolder === "all"
        ? null
        : PORTFOLIO_FOLDERS.find((f) => f.id === nav.activeFolder) ?? null,
    [nav.activeFolder],
  );

  const activeFolderTitle = activeFolderConfig
    ? activeFolderConfig.label
    : "All Documents";

  const activeFolderDescription = activeFolderConfig
    ? activeFolderConfig.description
    : "Complete archive of credentials, case studies, and engineering references";

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="fx-page-shell" data-theme={theme}>
        <FinderAmbientBar theme={theme} onToggleTheme={toggleTheme} />

        <m.main
          className="fx-window-bezel"
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="fx-window"
            role="region"
            aria-label="macOS Finder File Explorer"
          >
            <FinderToolbar
              activeFolder={nav.activeFolder}
              activeFolderTitle={activeFolderTitle}
              kindFilter={kindFilter}
              searchQuery={searchQuery}
              canGoBackFolder={nav.canGoBackFolder}
              canGoForwardFolder={nav.canGoForwardFolder}
              selectedItem={selectedItem}
              searchInputRef={searchInputRef}
              onNavigateFolder={nav.navigateFolder}
              onBack={nav.handleHistoryBack}
              onForward={nav.handleHistoryForward}
              onKindFilterChange={setKindFilter}
              onSearchChange={setSearchQuery}
              onQuickLook={() => {
                if (selectedItem) {
                  openExplorerItem(
                    selectedItem,
                    rowRefs.current.get(selectedItem.id),
                  );
                }
              }}
            />

            <FinderListHeader
              sortKey={sortKey}
              sortDir={sortDir}
              onSortColumn={handleSortColumn}
            />

            <FinderListViewport
              filteredFiles={filteredFiles}
              selectedId={effectiveSelectedId}
              activeFolderTitle={activeFolderTitle}
              searchQuery={searchQuery}
              rowRefs={rowRefs}
              onSelectId={setSelectedId}
              onOpenItem={openExplorerItem}
              onKeyDown={handleListKeyDown}
            />

            <FinderPathBar
              activeFolderConfig={activeFolderConfig}
              selectedItem={selectedItem}
              activeFolderDescription={activeFolderDescription}
              onNavigateFolder={nav.navigateFolder}
            />

            <FinderStatusBar
              itemCount={filteredFiles.length}
              selectedItem={selectedItem}
            />
          </div>
        </m.main>

        {viewerMounted ? (
          <DocumentViewer
            doc={activeDoc}
            onClose={handleCloseViewer}
            returnFocusRef={returnFocusRef}
          />
        ) : null}
      </div>
    </LazyMotion>
  );
}
