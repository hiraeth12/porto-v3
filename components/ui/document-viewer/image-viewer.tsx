"use client"

import { useEffect, useRef, type MutableRefObject } from "react"
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch"
import type { ViewerImperativeActions, ViewerMediaStatus } from "./document-viewer"
import { ViewerErrorState, ViewerLoadingState } from "./viewer-states"

const MIN_ZOOM = 1
const MAX_ZOOM = 4
const ZOOM_STEP = 0.35

export default function ImageViewer({
  src,
  name,
  downloadName,
  scale,
  status,
  actionsRef,
  onScaleChange,
  onStatusChange,
}: {
  src: string
  name: string
  downloadName: string
  scale: number
  status: ViewerMediaStatus
  actionsRef: MutableRefObject<ViewerImperativeActions | null>
  onScaleChange: (next: number) => void
  onStatusChange: (next: ViewerMediaStatus) => void
}) {
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null)

  useEffect(() => {
    actionsRef.current = {
      zoomIn: () => transformRef.current?.zoomIn(ZOOM_STEP, 200, "easeOutCubic"),
      zoomOut: () => transformRef.current?.zoomOut(ZOOM_STEP, 200, "easeOutCubic"),
      resetZoom: () => transformRef.current?.resetTransform(220, "easeOutCubic"),
    }
    return () => {
      actionsRef.current = null
    }
  }, [actionsRef])

  return (
    <div
      className="dv-image-stage"
      data-zoomed={scale > 1.02 ? "true" : undefined}
      data-lenis-prevent
    >
      {status === "loading" ? (
        <ViewerLoadingState kind="image" label="Loading high-resolution image…" />
      ) : null}

      {status === "error" ? (
        <ViewerErrorState
          src={src}
          downloadName={downloadName}
          message="The image file could not be loaded. You can still download the original file directly."
        />
      ) : null}

      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={MIN_ZOOM}
        maxScale={MAX_ZOOM}
        centerOnInit
        limitToBounds
        wheel={{ step: 0.14 }}
        pinch={{ step: 5 }}
        panning={{ disabled: scale <= 1.02, velocityDisabled: false }}
        doubleClick={{ mode: "toggle", step: 2, animationTime: 220 }}
        onTransform={(_ref, state) => {
          const next = Number(state.scale.toFixed(2))
          if (Math.abs(scale - next) >= 0.01) {
            onScaleChange(next)
          }
        }}
      >
        <TransformComponent
          wrapperClass="dv-transform-wrapper"
          contentClass="dv-transform-content"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={name}
            decoding="async"
            draggable={false}
            className="dv-image-el"
            onLoad={() => onStatusChange("ready")}
            onError={() => onStatusChange("error")}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}
