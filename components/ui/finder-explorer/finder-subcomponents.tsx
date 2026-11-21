"use client";

import Link from "next/link";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MutableRefObject,
  RefObject,
} from "react";
import type { DocumentTheme } from "@/hooks/use-document-theme";
import {
  ALL_EXPLORER_FILES,
  PORTFOLIO_FOLDERS,
  type ExplorerFileItem,
  type ExplorerFilterSlug,
  type PortfolioFolderConfig,
} from "@/lib/portfolio-documents";
import { preloadPdfViewerChunk } from "@/components/ui/document-viewer/preload-pdf-viewer";
import {
  KIND_FILTER_OPTIONS,
  SORT_COLUMNS,
  getQuickLookMeta,
  type KindFilter,
  type SortDir,
  type SortKey,
} from "./finder-helpers";
import {
  IconArrowLeft,
  IconArrowUpRight,
  IconChevronLeft,
  IconChevronRight,
  IconClear,
  IconFolder,
  IconQuickLook,
  IconSearch,
  IconThemeMoon,
  IconThemeSun,
} from "./finder-icons";

export function FinderAmbientBar({
  theme,
  onToggleTheme,
}: {
  theme: DocumentTheme;
  onToggleTheme: () => void;
}) {
  return (
    <header className="fx-ambient-bar">
      <Link href="/#work" className="fx-back-portfolio-link">
        <span className="fx-back-portfolio-icon">
          <IconArrowLeft />
        </span>
        <span>Back to Portfolio</span>
      </Link>

      <div className="fx-ambient-actions">
        <button
          type="button"
          className="fx-theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <IconThemeMoon /> : <IconThemeSun />}
          <span>{theme === "light" ? "Dark" : "Light"}</span>
        </button>
      </div>
    </header>
  );
}

function FinderToolbarNavigation({
  canGoBackFolder,
  canGoForwardFolder,
  activeFolderTitle,
  onBack,
  onForward,
}: {
  canGoBackFolder: boolean;
  canGoForwardFolder: boolean;
  activeFolderTitle: string;
  onBack: () => void;
  onForward: () => void;
}) {
  return (
    <div className="fx-toolbar-left">
      <div className="fx-traffic-lights" aria-hidden="true">
        <Link
          href="/#work"
          className="fx-traffic-dot fx-traffic-dot--close"
          title="Return to Portfolio"
          tabIndex={-1}
        />
        <span className="fx-traffic-dot fx-traffic-dot--min" />
        <span className="fx-traffic-dot fx-traffic-dot--max" />
      </div>

      <div
        className="fx-nav-cluster"
        role="group"
        aria-label="Folder navigation history"
      >
        <button
          type="button"
          className="fx-icon-btn"
          onClick={onBack}
          aria-label={canGoBackFolder ? "Previous folder" : "Back to Portfolio"}
          title={canGoBackFolder ? "Previous folder" : "Back to Portfolio"}
        >
          <IconChevronLeft />
        </button>
        <button
          type="button"
          className="fx-icon-btn"
          onClick={onForward}
          disabled={!canGoForwardFolder}
          aria-label="Next folder"
          title="Next folder"
        >
          <IconChevronRight />
        </button>
      </div>

      <div className="fx-folder-title-wrap">
        <span className="fx-folder-glyph">
          <IconFolder />
        </span>
        <div>
          <h1 className="fx-folder-title">{activeFolderTitle}</h1>
        </div>
      </div>
    </div>
  );
}

function FinderToolbarActions({
  selectedItem,
  activeFolderTitle,
  searchQuery,
  searchInputRef,
  onSearchChange,
  onQuickLook,
}: {
  selectedItem: ExplorerFileItem | null;
  activeFolderTitle: string;
  searchQuery: string;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onSearchChange: (value: string) => void;
  onQuickLook: () => void;
}) {
  const quickLook = getQuickLookMeta(selectedItem);
  const isProject = selectedItem?.kind === "project";

  return (
    <div className="fx-toolbar-right">
      <button
        type="button"
        className="fx-quicklook-btn"
        disabled={!selectedItem}
        onClick={onQuickLook}
        aria-label={quickLook.ariaLabel}
        title={quickLook.title}
      >
        {isProject ? (
          <>
            <span>Open Project</span>
            <IconArrowUpRight />
          </>
        ) : (
          <>
            <IconQuickLook />
            <span>Quick Look</span>
          </>
        )}
      </button>

      <div className="fx-search-wrap">
        <span className="fx-search-icon">
          <IconSearch />
        </span>
        <input
          ref={searchInputRef}
          type="search"
          className="fx-search-input"
          placeholder={`Search ${activeFolderTitle}…`}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={`Search documents in ${activeFolderTitle}`}
        />
        {searchQuery ? (
          <button
            type="button"
            className="fx-search-clear"
            onClick={() => {
              onSearchChange("");
              searchInputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <IconClear />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function FinderToolbar({
  activeFolder,
  activeFolderTitle,
  kindFilter,
  searchQuery,
  canGoBackFolder,
  canGoForwardFolder,
  selectedItem,
  searchInputRef,
  onNavigateFolder,
  onBack,
  onForward,
  onKindFilterChange,
  onSearchChange,
  onQuickLook,
}: {
  activeFolder: ExplorerFilterSlug;
  activeFolderTitle: string;
  kindFilter: KindFilter;
  searchQuery: string;
  canGoBackFolder: boolean;
  canGoForwardFolder: boolean;
  selectedItem: ExplorerFileItem | null;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onNavigateFolder: (slug: ExplorerFilterSlug) => void;
  onBack: () => void;
  onForward: () => void;
  onKindFilterChange: (kind: KindFilter) => void;
  onSearchChange: (value: string) => void;
  onQuickLook: () => void;
}) {
  return (
    <div className="fx-toolbar">
      <div className="fx-toolbar-top">
        <FinderToolbarNavigation
          canGoBackFolder={canGoBackFolder}
          canGoForwardFolder={canGoForwardFolder}
          activeFolderTitle={activeFolderTitle}
          onBack={onBack}
          onForward={onForward}
        />

        <FinderToolbarActions
          selectedItem={selectedItem}
          activeFolderTitle={activeFolderTitle}
          searchQuery={searchQuery}
          searchInputRef={searchInputRef}
          onSearchChange={onSearchChange}
          onQuickLook={onQuickLook}
        />
      </div>

      <div className="fx-toolbar-sub">
        <div
          className="fx-folder-tabs"
          role="tablist"
          aria-label="Document folders"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeFolder === "all"}
            data-active={activeFolder === "all"}
            className="fx-folder-tab"
            onClick={() => onNavigateFolder("all")}
          >
            <span>All Documents</span>
            <span className="fx-folder-tab-count">
              {ALL_EXPLORER_FILES.length}
            </span>
          </button>

          {PORTFOLIO_FOLDERS.map((folder) => (
            <button
              key={folder.id}
              type="button"
              role="tab"
              aria-selected={activeFolder === folder.id}
              data-active={activeFolder === folder.id}
              className="fx-folder-tab"
              onClick={() => onNavigateFolder(folder.id)}
            >
              <span>{folder.label}</span>
              <span className="fx-folder-tab-count">
                {folder.files.length}
              </span>
            </button>
          ))}
        </div>

        <div
          className="fx-kind-pills"
          role="group"
          aria-label="Filter by file kind"
        >
          {KIND_FILTER_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className="fx-kind-pill"
              data-active={kindFilter === option.key}
              onClick={() => onKindFilterChange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FinderListHeader({
  sortKey,
  sortDir,
  onSortColumn,
}: {
  sortKey: SortKey;
  sortDir: SortDir;
  onSortColumn: (key: SortKey) => void;
}) {
  return (
    <div className="fx-list-header" role="row">
      {SORT_COLUMNS.map((col) => (
        <div
          key={col.key}
          className={col.hideMobile ? "fx-col-hide-mobile" : undefined}
        >
          <button
            type="button"
            className="fx-col-sort-btn"
            data-active={sortKey === col.key}
            onClick={() => onSortColumn(col.key)}
          >
            <span>{col.label}</span>
            {sortKey === col.key ? (
              <span className="fx-sort-indicator" aria-hidden="true">
                {sortDir === "asc" ? "▲" : "▼"}
              </span>
            ) : null}
          </button>
        </div>
      ))}

      <div style={{ textAlign: "right" }}>Action</div>
    </div>
  );
}

function FinderFileRow({
  item,
  index,
  isSelected,
  hasSelection,
  rowRefs,
  onSelect,
  onOpen,
}: {
  item: ExplorerFileItem;
  index: number;
  isSelected: boolean;
  hasSelection: boolean;
  rowRefs: MutableRefObject<Map<string, HTMLButtonElement>>;
  onSelect: (id: string) => void;
  onOpen: (item: ExplorerFileItem, triggerEl?: HTMLElement | null) => void;
}) {
  const isProject = item.kind === "project";

  return (
    <li
      data-selected={isSelected}
      data-kind={item.kind}
      className="fx-row"
    >
      <button
        type="button"
        ref={(el) => {
          if (el) rowRefs.current.set(item.id, el);
          else rowRefs.current.delete(item.id);
        }}
        aria-pressed={isSelected}
        tabIndex={isSelected || (!hasSelection && index === 0) ? 0 : -1}
        className="fx-row-select"
        onMouseEnter={() => {
          if (item.kind === "pdf") {
            preloadPdfViewerChunk();
          }
        }}
        onClick={() => {
          // Single-click selects the row in authentic macOS Finder fashion
          onSelect(item.id);
        }}
        onDoubleClick={(e) => {
          // Double-click opens DocumentViewer or navigates to Project Detail
          onSelect(item.id);
          onOpen(item, e.currentTarget);
        }}
      >
        <div className="fx-cell-name">
          <span
            className="fx-file-thumb"
            data-art={item.art}
            data-kind={item.kind}
            aria-hidden="true"
          >
            {isProject && item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt=""
                className="fx-file-thumb-img"
                draggable={false}
              />
            ) : null}
            <span className="fx-file-thumb-ext">{item.extBadge}</span>
          </span>
          <div className="fx-name-stack">
            <span className="fx-file-title">{item.name}</span>
            <span className="fx-file-subname">
              {item.fileName} · {item.meta}
            </span>
          </div>
        </div>

        <div className="fx-cell-meta fx-col-hide-mobile">{item.meta}</div>

        <div className="fx-cell-folder fx-col-hide-mobile">
          <span className="fx-folder-pill-badge">{item.folderLabel}</span>
        </div>

        <div className="fx-cell-kind fx-col-hide-mobile">
          <span
            className={
              isProject ? "fx-kind-badge fx-kind-badge--project" : "fx-kind-badge"
            }
          >
            {item.kindLabel}
          </span>
        </div>
      </button>

      <div className="fx-cell-actions">
        <button
          type="button"
          className={
            isProject
              ? "fx-row-open-btn fx-row-open-btn--project"
              : "fx-row-open-btn"
          }
          onClick={(e) => {
            onSelect(item.id);
            onOpen(item, rowRefs.current.get(item.id) ?? e.currentTarget);
          }}
          aria-label={
            isProject ? `Open project ${item.name}` : `Open ${item.name}`
          }
        >
          <span>Open</span>
          {isProject ? <IconArrowUpRight /> : null}
        </button>
      </div>
    </li>
  );
}

export function FinderListViewport({
  filteredFiles,
  selectedId,
  activeFolderTitle,
  searchQuery,
  rowRefs,
  onSelectId,
  onOpenItem,
  onKeyDown,
}: {
  filteredFiles: ExplorerFileItem[];
  selectedId: string | null;
  activeFolderTitle: string;
  searchQuery: string;
  rowRefs: MutableRefObject<Map<string, HTMLButtonElement>>;
  onSelectId: (id: string | null) => void;
  onOpenItem: (item: ExplorerFileItem, triggerEl?: HTMLElement | null) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLUListElement>) => void;
}) {
  const hasSelection = Boolean(selectedId);

  return (
    <div className="fx-list-viewport">
      {filteredFiles.length > 0 ? (
        <ul
          className="fx-list-rows"
          aria-label={`${activeFolderTitle} files`}
          onKeyDown={onKeyDown}
        >
          {filteredFiles.map((item, index) => (
            <FinderFileRow
              key={item.id}
              item={item}
              index={index}
              isSelected={item.id === selectedId}
              hasSelection={hasSelection}
              rowRefs={rowRefs}
              onSelect={onSelectId}
              onOpen={onOpenItem}
            />
          ))}
        </ul>
      ) : (
        <div className="fx-empty-state" role="status">
          <p className="fx-empty-title">No matching items found</p>
          <p className="fx-empty-desc">
            No files or projects match &ldquo;{searchQuery}&rdquo; in{" "}
            {activeFolderTitle}. Try clearing the search or switching folders.
          </p>
        </div>
      )}
    </div>
  );
}

export function FinderPathBar({
  activeFolderConfig,
  selectedItem,
  activeFolderDescription,
  onNavigateFolder,
}: {
  activeFolderConfig: PortfolioFolderConfig | null;
  selectedItem: ExplorerFileItem | null;
  activeFolderDescription: string;
  onNavigateFolder: (slug: ExplorerFilterSlug) => void;
}) {
  return (
    <nav className="fx-pathbar" aria-label="Finder path bar">
      <button
        type="button"
        className="fx-path-segment"
        onClick={() => onNavigateFolder("all")}
      >
        <IconFolder />
        <span>Portfolio Documents</span>
      </button>

      {activeFolderConfig ? (
        <>
          <span className="fx-path-sep" aria-hidden="true">
            ▸
          </span>
          <button
            type="button"
            className="fx-path-segment"
            onClick={() => onNavigateFolder(activeFolderConfig.id)}
          >
            <span>{activeFolderConfig.label}</span>
          </button>
        </>
      ) : null}

      {selectedItem ? (
        <>
          {!activeFolderConfig ? (
            <>
              <span className="fx-path-sep" aria-hidden="true">
                ▸
              </span>
              <button
                type="button"
                className="fx-path-segment"
                onClick={() => onNavigateFolder(selectedItem.folderId)}
              >
                <span>{selectedItem.folderLabel}</span>
              </button>
            </>
          ) : null}
          <span className="fx-path-sep" aria-hidden="true">
            ▸
          </span>
          <span className="fx-path-segment fx-path-segment--active">
            {selectedItem.fileName}
          </span>
        </>
      ) : (
        <>
          <span className="fx-path-sep" aria-hidden="true">
            ▸
          </span>
          <span className="fx-path-segment">{activeFolderDescription}</span>
        </>
      )}
    </nav>
  );
}

export function FinderStatusBar({
  itemCount,
  selectedItem,
}: {
  itemCount: number;
  selectedItem: ExplorerFileItem | null;
}) {
  return (
    <footer className="fx-statusbar">
      <span>
        {itemCount} {itemCount === 1 ? "item" : "items"}
        {selectedItem ? ` · "${selectedItem.name}" selected` : ""}
      </span>
      <span className="fx-statusbar-hint">
        <span>Click to select · Double-click or press</span>
        <kbd className="fx-kbd">Space</kbd>
        <span>
          {selectedItem?.kind === "project" ? "to open project" : "to preview"}
        </span>
      </span>
    </footer>
  );
}
