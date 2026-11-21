"use client"

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import type { ViewerImperativeActions, ViewerMediaStatus } from "./document-viewer"
import { ViewerErrorState, ViewerLoadingState } from "./viewer-states"
import type { FitMode } from "./viewer-toolbar"

// Use local static worker copied from node_modules/pdfjs-dist/build/pdf.worker.min.mjs
// so both Turbopack and Webpack load the exact version-matched worker reliably.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs"

const DEFAULT_ASPECT = 595 / 842 // Standard A4 portrait ratio

export default function PdfViewer({
  src,
  downloadName,
  zoom,
  fitMode,
  status,
  actionsRef,
  onLoaded,
  onError,
  onPageChange,
}: {
  src: string
  downloadName: string
  zoom: number
  fitMode: FitMode
  status: ViewerMediaStatus
  actionsRef: MutableRefObject<ViewerImperativeActions | null>
  onLoaded: (numPages: number) => void
  onError: () => void
  onPageChange: (page: number) => void
}) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])

  const [numPages, setNumPages] = useState<number>(0)
  const [pageAspect, setPageAspect] = useState<number>(DEFAULT_ASPECT)
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 820,
    height: 680,
  })

  // Register smooth-scroll handler without pushing state back up via effects
  useEffect(() => {
    actionsRef.current = {
      scrollToPage: (target: number) => {
        const node = pageRefs.current[target - 1]
        node?.scrollIntoView({ behavior: "smooth", block: "start" })
      },
    }
    return () => {
      actionsRef.current = null
    }
  }, [actionsRef])

  // Track available viewport inside the PDF scroll stage
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el || typeof ResizeObserver === "undefined") return

    const updateSize = () => {
      setStageSize({
        width: el.clientWidth,
        height: el.clientHeight,
      })
    }
    updateSize()

    const ro = new ResizeObserver(updateSize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Compute target page width in px based on fitMode + zoom
  const renderedPageWidth = useMemo(() => {
    const horizontalPad = stageSize.width < 640 ? 20 : 64
    const verticalPad = stageSize.width < 640 ? 96 : 64
    const availW = Math.max(240, stageSize.width - horizontalPad)
    const availH = Math.max(280, stageSize.height - verticalPad)

    const baseWidth =
      fitMode === "page"
        ? Math.min(availW, availH * pageAspect)
        : Math.min(availW, 860)

    return Math.round(baseWidth * zoom)
  }, [stageSize.width, stageSize.height, fitMode, pageAspect, zoom])

  const renderedPageHeight = useMemo(
    () => Math.round(renderedPageWidth / (pageAspect || DEFAULT_ASPECT)),
    [renderedPageWidth, pageAspect],
  )

  // Observe visible pages during continuous scroll to keep the page indicator in sync
  useEffect(() => {
    const root = scrollContainerRef.current
    if (!root || status !== "ready" || numPages < 1) return

    const ratios = new Map<number, number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pageAttr = Number(
            (entry.target as HTMLElement).dataset.pageNumber,
          )
          if (!Number.isNaN(pageAttr)) {
            ratios.set(pageAttr, entry.intersectionRatio)
          }
        }
        let bestPage = 1
        let bestRatio = -1
        ratios.forEach((ratio, pageNum) => {
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestPage = pageNum
          }
        })
        if (bestRatio > 0.05) {
          onPageChange(bestPage)
        }
      },
      {
        root,
        threshold: [0.1, 0.25, 0.5, 0.75],
      },
    )

    pageRefs.current.forEach((el) => {
      if (el) io.observe(el)
    })

    return () => io.disconnect()
  }, [status, numPages, renderedPageWidth, onPageChange])

  const dpr =
    typeof window === "undefined"
      ? 1
      : Math.min(2, Math.max(1, window.devicePixelRatio || 1))

  return (
    <div
      ref={scrollContainerRef}
      className="dv-pdf-scroll"
      data-lenis-prevent
      tabIndex={-1}
    >
      {status === "loading" ? (
        <ViewerLoadingState kind="pdf" label="Rendering PDF pages…" />
      ) : null}

      {status === "error" ? (
        <ViewerErrorState
          src={src}
          downloadName={downloadName}
          message="The PDF document could not be rendered. You can download it or open it directly in a new tab."
        />
      ) : null}

      <Document
        file={src}
        suspense={false}
        className="dv-pdf-document"
        loading={null}
        error={null}
        onLoadSuccess={({ numPages: loadedPages }) => {
          setNumPages(loadedPages)
          onLoaded(loadedPages)
        }}
        onLoadError={(err) => {
          console.error("[PdfViewer] onLoadError:", err)
          onError()
        }}
        onSourceError={(err) => {
          console.error("[PdfViewer] onSourceError:", err)
          onError()
        }}
      >
        {Array.from({ length: numPages }, (_, index) => {
          const pageNumber = index + 1
          return (
            <div
              key={pageNumber}
              ref={(el) => {
                pageRefs.current[index] = el
              }}
              data-page-number={pageNumber}
              className="dv-pdf-page-slot"
              style={{
                minWidth: renderedPageWidth,
                minHeight: renderedPageHeight,
              }}
            >
              <Page
                pageNumber={pageNumber}
                suspense={false}
                width={renderedPageWidth}
                devicePixelRatio={dpr}
                renderTextLayer
                renderAnnotationLayer
                loading={null}
                onLoadSuccess={(page) => {
                  if (
                    pageNumber === 1 &&
                    page.originalWidth > 0 &&
                    page.originalHeight > 0
                  ) {
                    setPageAspect(page.originalWidth / page.originalHeight)
                  }
                }}
              />
              {numPages > 1 ? (
                <span className="dv-pdf-page-badge" aria-hidden="true">
                  {pageNumber} / {numPages}
                </span>
              ) : null}
            </div>
          )
        })}
      </Document>
    </div>
  )
}
