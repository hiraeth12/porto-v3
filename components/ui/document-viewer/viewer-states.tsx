"use client"

import type { DocumentKind } from "@/lib/document-kind"

export function ViewerLoadingState({
  kind,
  label = "Preparing document preview…",
}: {
  kind: DocumentKind
  label?: string
}) {
  return (
    <div className="dv-state-overlay" role="status" aria-live="polite">
      <div
        className={
          "dv-skeleton-sheet" +
          (kind === "image" ? " dv-skeleton-sheet--landscape" : "")
        }
        aria-hidden="true"
      >
        <div className="dv-skeleton-bar" style={{ width: "38%", height: 14 }} />
        <div className="dv-skeleton-bar" style={{ width: "68%" }} />
        <div className="dv-skeleton-bar" style={{ width: "92%", marginTop: 12 }} />
        <div className="dv-skeleton-bar" style={{ width: "86%" }} />
        <div className="dv-skeleton-bar" style={{ width: "74%" }} />
        <div className="dv-skeleton-bar" style={{ width: "88%", marginTop: 12 }} />
        <div className="dv-skeleton-bar" style={{ width: "52%" }} />
      </div>
      <span className="dv-state-label">{label}</span>
    </div>
  )
}

export function ViewerErrorState({
  src,
  downloadName,
  message = "This document could not be rendered inside the preview window.",
}: {
  src: string
  downloadName: string
  message?: string
}) {
  return (
    <div className="dv-state-overlay" role="alert">
      <div className="dv-error-card">
        <div className="dv-error-icon" aria-hidden="true">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <line x1="12" y1="12" x2="12" y2="16" />
            <circle cx="12" cy="19" r="0.6" fill="currentColor" />
          </svg>
        </div>
        <h3 className="dv-error-title">Unable to display file</h3>
        <p className="dv-error-desc">{message}</p>
        <div className="dv-error-actions">
          <a
            href={src}
            download={downloadName}
            className="dv-btn dv-btn--primary"
          >
            Download file
          </a>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="dv-btn dv-btn--close"
          >
            Open in new tab
          </a>
        </div>
      </div>
    </div>
  )
}
