"use client"

import { useEffect } from "react"

let activeLockCount = 0
let previousHtmlOverflow = ""

/**
 * Locks page scroll in-place while a modal overlay is active.
 * Coordinates with LenisProvider via `data-scroll-lock="true"` on `<html>`
 * so Lenis pauses without jumping to the top of the page.
 */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked || typeof document === "undefined") return

    const html = document.documentElement
    if (activeLockCount === 0) {
      previousHtmlOverflow = html.style.overflow
      html.dataset.scrollLock = "true"
      html.style.overflow = "hidden"
    }
    activeLockCount += 1

    return () => {
      activeLockCount = Math.max(0, activeLockCount - 1)
      if (activeLockCount === 0) {
        delete html.dataset.scrollLock
        html.style.overflow = previousHtmlOverflow
      }
    }
  }, [locked])
}
