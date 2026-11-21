"use client"

import { useEffect, type RefObject } from "react"

const FOCUSABLE_SELECTOR = [
  "a[href]:not([tabindex='-1'])",
  "button:not([disabled]):not([tabindex='-1'])",
  "input:not([disabled]):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])",
].join(",")

/**
 * Traps Tab / Shift+Tab focus within `containerRef` while `active` is true,
 * focuses the preferred initial control on mount, and restores focus to
 * `returnFocusRef` when deactivated.
 */
export function useFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  returnFocusRef?: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!active || typeof document === "undefined") return

    const container = containerRef.current
    const previouslyFocused =
      returnFocusRef?.current ?? (document.activeElement as HTMLElement | null)

    const focusInitial = () => {
      if (!container) return
      const preferred =
        container.querySelector<HTMLElement>("[data-autofocus='true']") ??
        container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
        container
      preferred?.focus({ preventScroll: true })
    }

    const rafId = requestAnimationFrame(focusInitial)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !container) return
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null)

      if (focusables.length === 0) {
        event.preventDefault()
        container.focus({ preventScroll: true })
        return
      }

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const current = document.activeElement as HTMLElement | null

      if (event.shiftKey) {
        if (!current || current === first || !container.contains(current)) {
          event.preventDefault()
          last.focus({ preventScroll: true })
        }
      } else {
        if (!current || current === last || !container.contains(current)) {
          event.preventDefault()
          first.focus({ preventScroll: true })
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener("keydown", handleKeyDown)
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        requestAnimationFrame(() => {
          previouslyFocused.focus({ preventScroll: true })
        })
      }
    }
  }, [active, containerRef, returnFocusRef])
}
