"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import * as m from "motion/react-m";
import FolderCardSwap from "@/components/ui/folder-card-swap";
import GlassFolder, {
  type FolderMenuItem,
  type GlassFolderProps,
} from "@/components/ui/glass-folder-cards";
import {
  resolveExplorerItemKind,
  type ViewerDocument,
} from "@/lib/document-kind";
import {
  ALL_EXPLORER_FILES,
  PORTFOLIO_FOLDERS,
  type FolderCategorySlug,
  type PortfolioFolderConfig,
} from "@/lib/portfolio-documents";

const DocumentViewer = dynamic(
  () => import("@/components/ui/document-viewer/document-viewer"),
  { ssr: false },
);

export default function PortfolioFolders() {
  const router = useRouter();
  const [activeDoc, setActiveDoc] = useState<ViewerDocument | null>(null);
  const [viewerMounted, setViewerMounted] = useState(false);
  const [openFolderId, setOpenFolderId] = useState<FolderCategorySlug | null>(
    null,
  );
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const handleFileSelect = useCallback<
    NonNullable<GlassFolderProps["onFileSelect"]>
  >(
    (file, _index, event) => {
      const kind = resolveExplorerItemKind(file.href, file.kind);
      if (!kind || !file.href) return;

      // Preserve browser-native new-tab gestures (Ctrl/Cmd/Shift/Middle click)
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }

      event.preventDefault();

      // Dedicated Project Showcase route navigation
      if (kind === "project") {
        router.push(file.href);
        return;
      }

      returnFocusRef.current = event.currentTarget;
      setViewerMounted(true);
      setActiveDoc({
        src: file.href,
        name: file.name,
        kind,
        meta: file.meta,
      });
    },
    [router],
  );

  const handleCloseViewer = useCallback(() => {
    setActiveDoc(null);
  }, []);

  const folderMenus = useMemo<Record<FolderCategorySlug, FolderMenuItem[]>>(
    () => ({
      profile: [
        {
          label: "Open All in Finder",
          onSelect: () => {
            router.push("/documents?folder=profile");
          },
        },
        {
          label: "List All Documents",
          onSelect: () => {
            router.push("/documents");
          },
        },
      ],
      "case-studies": [
        {
          label: "Open All in Finder",
          onSelect: () => {
            router.push("/documents?folder=case-studies");
          },
        },
        {
          label: "List All Documents",
          onSelect: () => {
            router.push("/documents");
          },
        },
      ],
      archive: [
        {
          label: "Open All in Finder",
          onSelect: () => {
            router.push("/documents?folder=archive");
          },
        },
        {
          label: "List All Documents",
          onSelect: () => {
            router.push("/documents");
          },
        },
      ],
    }),
    [router],
  );

  const handleStackChange = useCallback(() => {
    setOpenFolderId(null);
  }, []);

  const handleEnterFront = useCallback(
    (
      _frontIndex: number,
      folder: PortfolioFolderConfig,
      triggerEl: HTMLElement | null,
    ) => {
      const firstFile = folder.files[0];
      if (!firstFile || !firstFile.href) {
        setOpenFolderId((prev) => (prev === folder.id ? null : folder.id));
        return;
      }
      const kind = resolveExplorerItemKind(firstFile.href, firstFile.kind);
      if (!kind) return;
      if (kind === "project") {
        router.push(firstFile.href);
        return;
      }
      returnFocusRef.current = triggerEl;
      setViewerMounted(true);
      setActiveDoc({
        src: firstFile.href,
        name: firstFile.name,
        kind,
        meta: firstFile.meta,
      });
    },
    [router],
  );

  const renderFolder = useCallback(
    (folder: PortfolioFolderConfig, { isFront }: { isFront: boolean }) => (
      <GlassFolder
        label={folder.label}
        art={folder.art}
        seed={folder.seed}
        tone={folder.tone}
        files={folder.files}
        open={isFront ? openFolderId === folder.id : false}
        onOpenChange={(nextOpen) => {
          if (!isFront) return;
          setOpenFolderId(nextOpen ? folder.id : null);
        }}
        onFileSelect={handleFileSelect}
        action="more"
        menu={folderMenus[folder.id]}
        appearDelay={folder.appearDelay}
      />
    ),
    [folderMenus, handleFileSelect, openFolderId],
  );

  return (
    <>
      <div className="portfolio-folders">
        <FolderCardSwap
          items={PORTFOLIO_FOLDERS}
          renderFolder={renderFolder}
          activeFolderOpen={openFolderId !== null}
          autoplay={false}
          onChange={handleStackChange}
          onEnterFront={handleEnterFront}
        />
      </div>

      <m.div
        className="portfolio-folders-actions"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{
          duration: 0.55,
          delay: 0.24,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <Link href="/documents" className="portfolio-open-all-btn group">
          <span className="portfolio-open-all-label">Open All Documents</span>
          <span className="portfolio-open-all-count">
            {ALL_EXPLORER_FILES.length} items
          </span>
          <span className="portfolio-open-all-icon" aria-hidden="true">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17 17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </span>
        </Link>
      </m.div>

      {viewerMounted ? (
        <DocumentViewer
          doc={activeDoc}
          onClose={handleCloseViewer}
          returnFocusRef={returnFocusRef}
        />
      ) : null}
    </>
  );
}
