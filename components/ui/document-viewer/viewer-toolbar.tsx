"use client"

import type { DocumentKind } from "@/lib/document-kind"

export type FitMode = "width" | "page"

export type ViewerController = {
  zoom: number
  minZoom: number
  maxZoom: number
  canZoomIn: boolean
  canZoomOut: boolean
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  page?: number
  pageCount?: number
  canPrevPage?: boolean
  canNextPage?: boolean
  prevPage?: () => void
  nextPage?: () => void
  fitMode?: FitMode
  setFitMode?: (mode: FitMode) => void
}

type ToolbarProps = {
  titleId: string
  name: string
  meta?: string
  kind: DocumentKind
  src: string
  downloadName: string
  controller: ViewerController | null
  onClose: () => void
}

/* Precision 1.5px stroke inline SVG icons */
function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function IconZoomOut() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
      <path d="M8 11h6" />
    </svg>
  )
}

function IconZoomIn() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </svg>
  )
}

function IconFitWidth() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h16" />
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
    </svg>
  )
}

function IconFitPage() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 7h6" />
      <path d="M9 17h6" />
    </svg>
  )
}

function IconReset() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

export function ViewerHeaderToolbar({
  titleId,
  name,
  meta,
  kind,
  src,
  downloadName,
  controller,
  onClose,
}: ToolbarProps) {
  const zoomPercent = Math.round((controller?.zoom ?? 1) * 100)
  const hasPages = kind === "pdf" && (controller?.pageCount ?? 0) > 0

  return (
    <header className="dv-header">
      <div className="dv-identity">
        <span className="dv-kind-badge">{kind === "pdf" ? "PDF" : "JPG"}</span>
        <div className="dv-titles">
          <h2 id={titleId} className="dv-title">
            {name}
          </h2>
          {meta ? <span className="dv-meta">{meta}</span> : null}
        </div>
      </div>

      <div className="dv-toolbar-group">
        {/* Desktop Controls Cluster */}
        <div className="dv-toolbar-cluster dv-desktop-only">
          {hasPages ? (
            <>
              <button
                type="button"
                className="dv-btn dv-btn--icon"
                onClick={controller?.prevPage}
                disabled={!controller?.canPrevPage}
                aria-label="Previous page"
                title="Previous page (Left arrow)"
              >
                <IconChevronLeft />
              </button>
              <span
                className="dv-readout dv-readout--page"
                aria-live="polite"
                aria-atomic="true"
              >
                {controller?.page ?? 1}
                <span className="dv-readout-muted">/</span>
                {controller?.pageCount ?? 1}
              </span>
              <button
                type="button"
                className="dv-btn dv-btn--icon"
                onClick={controller?.nextPage}
                disabled={!controller?.canNextPage}
                aria-label="Next page"
                title="Next page (Right arrow)"
              >
                <IconChevronRight />
              </button>
              <span className="dv-divider" aria-hidden="true" />
            </>
          ) : null}

          <button
            type="button"
            className="dv-btn dv-btn--icon"
            onClick={controller?.zoomOut}
            disabled={!controller?.canZoomOut}
            aria-label="Zoom out"
            title="Zoom out (-)"
          >
            <IconZoomOut />
          </button>
          <button
            type="button"
            className="dv-btn"
            onClick={controller?.resetZoom}
            aria-label={`Reset zoom (currently ${zoomPercent}%)`}
            title="Reset zoom (0)"
          >
            {zoomPercent}%
          </button>
          <button
            type="button"
            className="dv-btn dv-btn--icon"
            onClick={controller?.zoomIn}
            disabled={!controller?.canZoomIn}
            aria-label="Zoom in"
            title="Zoom in (+)"
          >
            <IconZoomIn />
          </button>

          {kind === "pdf" && controller?.setFitMode ? (
            <>
              <span className="dv-divider" aria-hidden="true" />
              <button
                type="button"
                className="dv-btn dv-btn--icon"
                data-active={controller.fitMode === "width"}
                onClick={() => controller.setFitMode?.("width")}
                aria-label="Fit to width"
                title="Fit to width"
              >
                <IconFitWidth />
              </button>
              <button
                type="button"
                className="dv-btn dv-btn--icon"
                data-active={controller.fitMode === "page"}
                onClick={() => controller.setFitMode?.("page")}
                aria-label="Fit to page"
                title="Fit to page"
              >
                <IconFitPage />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="dv-btn dv-btn--icon"
              onClick={controller?.resetZoom}
              aria-label="Reset view"
              title="Reset view (0)"
            >
              <IconReset />
            </button>
          )}
        </div>

        {/* Download Button (Desktop) */}
        <a
          href={src}
          download={downloadName}
          className="dv-btn dv-btn--primary dv-desktop-only"
          aria-label={`Download ${name}`}
        >
          <IconDownload />
          <span>Download</span>
        </a>

        {/* Close Button (Always visible, initial focus target) */}
        <button
          type="button"
          data-autofocus="true"
          className="dv-btn dv-btn--icon dv-btn--close"
          onClick={onClose}
          aria-label="Close document viewer"
          title="Close (Esc)"
        >
          <IconClose />
        </button>
      </div>
    </header>
  )
}

export function ViewerMobileDock({
  kind,
  name,
  src,
  downloadName,
  controller,
}: {
  kind: DocumentKind
  name: string
  src: string
  downloadName: string
  controller: ViewerController | null
}) {
  const zoomPercent = Math.round((controller?.zoom ?? 1) * 100)
  const hasPages = kind === "pdf" && (controller?.pageCount ?? 0) > 0

  return (
    <nav className="dv-mobile-dock" aria-label="Document controls">
      {hasPages ? (
        <>
          <button
            type="button"
            className="dv-btn dv-btn--icon"
            onClick={controller?.prevPage}
            disabled={!controller?.canPrevPage}
            aria-label="Previous page"
          >
            <IconChevronLeft />
          </button>
          <span className="dv-readout dv-readout--page" aria-live="polite">
            {controller?.page ?? 1}
            <span className="dv-readout-muted">/</span>
            {controller?.pageCount ?? 1}
          </span>
          <button
            type="button"
            className="dv-btn dv-btn--icon"
            onClick={controller?.nextPage}
            disabled={!controller?.canNextPage}
            aria-label="Next page"
          >
            <IconChevronRight />
          </button>
          <span className="dv-divider" aria-hidden="true" />
        </>
      ) : null}

      <button
        type="button"
        className="dv-btn dv-btn--icon"
        onClick={controller?.zoomOut}
        disabled={!controller?.canZoomOut}
        aria-label="Zoom out"
      >
        <IconZoomOut />
      </button>
      <button
        type="button"
        className="dv-btn"
        onClick={controller?.resetZoom}
        aria-label={`Reset zoom (${zoomPercent}%)`}
      >
        {zoomPercent}%
      </button>
      <button
        type="button"
        className="dv-btn dv-btn--icon"
        onClick={controller?.zoomIn}
        disabled={!controller?.canZoomIn}
        aria-label="Zoom in"
      >
        <IconZoomIn />
      </button>

      <span className="dv-divider" aria-hidden="true" />

      <a
        href={src}
        download={downloadName}
        className="dv-btn dv-btn--icon dv-btn--primary"
        aria-label={`Download ${name}`}
      >
        <IconDownload />
      </a>
    </nav>
  )
}
