"use client"

import dynamic from "next/dynamic"
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, useReducedMotion } from "motion/react"
import * as m from "motion/react-m"
import { useFocusTrap } from "@/hooks/use-focus-trap"
import { useScrollLock } from "@/hooks/use-scroll-lock"
import { fileNameFromSrc, type DocumentKind, type ViewerDocument } from "@/lib/document-kind"
import { ViewerLoadingState } from "./viewer-states"
import {
  ViewerHeaderToolbar,
  ViewerMobileDock,
  type FitMode,
  type ViewerController,
} from "./viewer-toolbar"
import "./document-viewer.css"

const LazyPdfViewer = dynamic(() => import("./pdf-viewer"), {
  ssr: false,
  loading: () => <ViewerLoadingState kind="pdf" label="Loading PDF engine…" />,
})

const LazyImageViewer = dynamic(() => import("./image-viewer"), {
  ssr: false,
  loading: () => <ViewerLoadingState kind="image" label="Loading image viewer…" />,
})

const VIEWER_EASE = [0.22, 1, 0.36, 1] as const
const IMAGE_MIN_ZOOM = 1
const IMAGE_MAX_ZOOM = 4
const PDF_ZOOM_STEPS = [0.6, 0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2, 2.5]
const PDF_MIN_ZOOM = PDF_ZOOM_STEPS[0]
const PDF_MAX_ZOOM = PDF_ZOOM_STEPS[PDF_ZOOM_STEPS.length - 1]

export type ViewerMediaStatus = "loading" | "ready" | "error"

export type ViewerImperativeActions = {
  zoomIn?: () => void
  zoomOut?: () => void
  resetZoom?: () => void
  scrollToPage?: (page: number) => void
}

export type DocumentViewerProps = {
  doc: ViewerDocument | null
  onClose: () => void
  returnFocusRef?: RefObject<HTMLElement | null>
}

function getViewerMotionConfig(prefersReducedMotion: boolean | null) {
  if (prefersReducedMotion) {
    return {
      backdropTransition: { duration: 0.12, ease: VIEWER_EASE },
      bezelInitial: { opacity: 0 },
      bezelAnimate: { opacity: 1 },
      bezelExit: { opacity: 0 },
      bezelTransition: { duration: 0.14, ease: VIEWER_EASE },
    }
  }
  return {
    backdropTransition: { duration: 0.24, ease: VIEWER_EASE },
    bezelInitial: { opacity: 0, y: 18, scale: 0.975 },
    bezelAnimate: { opacity: 1, y: 0, scale: 1 },
    bezelExit: { opacity: 0, y: 12, scale: 0.985 },
    bezelTransition: { duration: 0.34, ease: VIEWER_EASE },
  }
}

function runControllerAction(
  key: string,
  controller: ViewerController | null,
): boolean {
  if (!controller) return false
  const directActions: Record<string, () => void> = {
    "+": controller.zoomIn,
    "=": controller.zoomIn,
    "-": controller.zoomOut,
    _: controller.zoomOut,
    "0": controller.resetZoom,
  }
  const direct = directActions[key]
  if (direct) {
    direct()
    return true
  }
  if ((key === "ArrowLeft" || key === "PageUp") && controller.prevPage && controller.canPrevPage) {
    controller.prevPage()
    return true
  }
  if ((key === "ArrowRight" || key === "PageDown") && controller.nextPage && controller.canNextPage) {
    controller.nextPage()
    return true
  }
  return false
}

function handleViewerKeyCommand(
  event: KeyboardEvent,
  onClose: () => void,
  controller: ViewerController | null,
): void {
  if (event.key === "Escape") {
    event.preventDefault()
    event.stopPropagation()
    onClose()
    return
  }

  if (event.metaKey || event.ctrlKey || event.altKey) return

  if (runControllerAction(event.key, controller)) {
    event.preventDefault()
  }
}

function useViewerSession(
  kind: DocumentKind,
  actionsRef: MutableRefObject<ViewerImperativeActions | null>,
) {
  const [status, setStatus] = useState<ViewerMediaStatus>("loading")
  const [zoom, setZoom] = useState(1)
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [fitMode, setFitModeState] = useState<FitMode>("width")

  const isPdf = kind === "pdf"

  const zoomIn = useCallback(() => {
    if (!isPdf) {
      actionsRef.current?.zoomIn?.()
      return
    }
    setZoom((prev) => PDF_ZOOM_STEPS.find((step) => step > prev + 0.01) ?? PDF_MAX_ZOOM)
  }, [actionsRef, isPdf])

  const zoomOut = useCallback(() => {
    if (!isPdf) {
      actionsRef.current?.zoomOut?.()
      return
    }
    const reversed = [...PDF_ZOOM_STEPS].reverse()
    setZoom((prev) => reversed.find((step) => step < prev - 0.01) ?? PDF_MIN_ZOOM)
  }, [actionsRef, isPdf])

  const resetZoom = useCallback(() => {
    if (!isPdf) {
      actionsRef.current?.resetZoom?.()
      setZoom(1)
      return
    }
    setFitModeState("width")
    setZoom(1)
  }, [actionsRef, isPdf])

  const goToPage = useCallback(
    (target: number) => {
      if (pageCount < 1) return
      const clamped = Math.max(1, Math.min(pageCount, target))
      setPage(clamped)
      actionsRef.current?.scrollToPage?.(clamped)
    },
    [actionsRef, pageCount],
  )

  const handleSetFitMode = useCallback((mode: FitMode) => {
    setFitModeState(mode)
    setZoom(1)
  }, [])

  const controller = useMemo<ViewerController | null>(() => {
    if (status !== "ready") return null
    if (!isPdf) {
      return {
        zoom,
        minZoom: IMAGE_MIN_ZOOM,
        maxZoom: IMAGE_MAX_ZOOM,
        canZoomIn: zoom < IMAGE_MAX_ZOOM - 0.02,
        canZoomOut: zoom > IMAGE_MIN_ZOOM + 0.02,
        zoomIn,
        zoomOut,
        resetZoom,
      }
    }
    return {
      zoom,
      minZoom: PDF_MIN_ZOOM,
      maxZoom: PDF_MAX_ZOOM,
      canZoomIn: zoom < PDF_MAX_ZOOM - 0.01,
      canZoomOut: zoom > PDF_MIN_ZOOM + 0.01,
      zoomIn,
      zoomOut,
      resetZoom,
      page,
      pageCount,
      canPrevPage: page > 1,
      canNextPage: page < pageCount,
      prevPage: () => goToPage(page - 1),
      nextPage: () => goToPage(page + 1),
      fitMode,
      setFitMode: handleSetFitMode,
    }
  }, [fitMode, goToPage, handleSetFitMode, isPdf, page, pageCount, resetZoom, status, zoom, zoomIn, zoomOut])

  return {
    status,
    zoom,
    fitMode,
    controller,
    setStatus,
    setZoom,
    setPage,
    setPageCount,
  }
}

function useDocumentViewerEvents(
  portalRootRef: RefObject<HTMLDivElement | null>,
  onClose: () => void,
  activeController: ViewerController | null,
): void {
  // Isolate pointerdown events from GlassFolder's document-level outside-click listener
  // so interacting with or closing the modal never collapses the open folder behind it.
  useEffect(() => {
    const rootEl = portalRootRef.current
    if (!rootEl) return

    const stopPointerBubble = (event: PointerEvent) => {
      event.stopPropagation()
    }

    rootEl.addEventListener("pointerdown", stopPointerBubble)
    return () => {
      rootEl.removeEventListener("pointerdown", stopPointerBubble)
    }
  }, [portalRootRef])

  // Capture-phase keyboard handler:
  // Intercepts Escape before GlassFolder's bubble-phase Escape listener runs,
  // and wires keyboard shortcuts for zoom and PDF page navigation.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      handleViewerKeyCommand(event, onClose, activeController)
    }

    document.addEventListener("keydown", onKeyDown, { capture: true })
    return () => {
      document.removeEventListener("keydown", onKeyDown, { capture: true })
    }
  }, [onClose, activeController])
}

function DocumentViewerBody({
  doc,
  titleId,
  downloadName,
  portalRootRef,
  onClose,
}: {
  doc: ViewerDocument
  titleId: string
  downloadName: string
  portalRootRef: RefObject<HTMLDivElement | null>
  onClose: () => void
}) {
  const actionsRef = useRef<ViewerImperativeActions | null>(null)
  const session = useViewerSession(doc.kind, actionsRef)
  useDocumentViewerEvents(portalRootRef, onClose, session.controller)

  return (
    <div className="dv-panel">
      <ViewerHeaderToolbar
        titleId={titleId}
        name={doc.name}
        meta={doc.meta}
        kind={doc.kind}
        src={doc.src}
        downloadName={downloadName}
        controller={session.controller}
        onClose={onClose}
      />

      <div className="dv-stage">
        {doc.kind === "pdf" ? (
          <LazyPdfViewer
            src={doc.src}
            downloadName={downloadName}
            zoom={session.zoom}
            fitMode={session.fitMode}
            status={session.status}
            actionsRef={actionsRef}
            onLoaded={(loadedPages) => {
              session.setPageCount(loadedPages)
              session.setPage(1)
              session.setStatus("ready")
            }}
            onError={() => session.setStatus("error")}
            onPageChange={session.setPage}
          />
        ) : (
          <LazyImageViewer
            src={doc.src}
            name={doc.name}
            downloadName={downloadName}
            scale={session.zoom}
            status={session.status}
            actionsRef={actionsRef}
            onScaleChange={session.setZoom}
            onStatusChange={session.setStatus}
          />
        )}

        <ViewerMobileDock
          kind={doc.kind}
          name={doc.name}
          src={doc.src}
          downloadName={downloadName}
          controller={session.controller}
        />
      </div>
    </div>
  )
}

export default function DocumentViewer({
  doc,
  onClose,
  returnFocusRef,
}: DocumentViewerProps) {
  const titleId = useId()
  const portalRootRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = useReducedMotion()

  const isOpen = Boolean(doc)
  const motionConfig = getViewerMotionConfig(prefersReducedMotion)

  useScrollLock(isOpen)
  useFocusTrap(isOpen, panelRef, returnFocusRef)

  if (typeof document === "undefined") return null

  const downloadName = doc
    ? fileNameFromSrc(doc.src, doc.name, doc.kind)
    : "document"

  return createPortal(
    <AnimatePresence>
      {doc ? (
        <div
          ref={portalRootRef}
          className="dv-portal-root"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onClose()
            }
          }}
        >
          <m.div
            className="dv-backdrop"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={motionConfig.backdropTransition}
            onClick={onClose}
          />

          <m.div
            ref={panelRef}
            className="dv-bezel"
            initial={motionConfig.bezelInitial}
            animate={motionConfig.bezelAnimate}
            exit={motionConfig.bezelExit}
            transition={motionConfig.bezelTransition}
          >
            <DocumentViewerBody
              key={doc.src}
              doc={doc}
              titleId={titleId}
              downloadName={downloadName}
              portalRootRef={portalRootRef}
              onClose={onClose}
            />
          </m.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
