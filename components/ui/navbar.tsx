"use client"

import * as React from "react"
import {
  AnimatePresence,
  LayoutGroup,
  useReducedMotion,
  type TargetAndTransition,
  type Transition,
} from "motion/react"
import * as m from "motion/react-m"
import StaggeredMenu, { type StaggeredMenuItem } from "./staggered-menu"
import "./navbar.css"

export interface NavbarLink {
  label: string
  href: string
}

export interface NavbarProps {
  brand?: string
  navLinks?: NavbarLink[]
  navCta?: NavbarLink
  themeToggle?: boolean
  mode: "light" | "dark"
  onToggleTheme: () => void
  fg: string
  fixedNav?: boolean
  style?: React.CSSProperties
}

interface SectionTarget {
  id: string
  label: string
}

interface ResolvedNavbarLink extends NavbarLink {
  key: string
}

/** Scroll distance (px) before downward scroll collapses the navbar into the island. */
const COLLAPSE_AT = 80
/** Scroll distance (px) near the top below which upward scroll restores the full navbar. */
const TOP_RESTORE_AT = 12
/** Continuous downward travel (px) needed to trigger collapse. */
const DOWN_INTENT = 6
/** Fallback duration (ms) to hold drawer visibility while StaggeredMenu's 0.32s close tween completes. */
const MENU_CLOSE_HOLD = 360
/** Viewport ratio (from the top) of the activation line used to resolve the active section. */
const ACTIVATION_RATIO = 0.4
/** Trailing settle (ms) before committing a new active section, prevents flicker at boundaries. */
const SECTION_SETTLE_MS = 120
/** Optional section id that maps to the CTA label when it has no in-page anchor (e.g. mailto). */
const CONTACT_SECTION_ID = "contact"
/** Pixel tolerance for treating the document as scrolled to its very bottom. */
const BOTTOM_TOLERANCE = 2
/** Visibility thresholds for the final section, so reaching the page bottom triggers a resolve. */
const TAIL_THRESHOLDS = [0, 0.25, 0.5, 0.75, 0.9, 1]

const EMPTY_NAV_LINKS: NavbarLink[] = []

const HOME_SECTION: SectionTarget = { id: "home", label: "Home" }

const DEFAULT_SOCIAL_ITEMS = [
  { label: "GitHub", link: "https://github.com/hiraeth12", key: "social-github" },
  { label: "LinkedIn", link: "https://www.linkedin.com/in/sahrulfirdaus/", key: "social-linkedin" },
  { label: "Email", link: "mailto:sahrulfirdauz9987@gmail.com", key: "social-email" },
]

const ISLAND_MENU_COLORS = ["#B497CF", "#5227FF"]

const islandSpring: Transition = {
  type: "spring",
  visualDuration: 0.46,
  bounce: 0.14,
}

const itemEnterTransition: Transition = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1],
}

const itemExitTransition: Transition = {
  duration: 0.14,
  ease: [0.4, 0, 1, 1],
}

const labelSwap: Transition = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1],
}

const hamburgerReducedTransition: Transition = {
  duration: 0.12,
  ease: [0.22, 1, 0.36, 1],
}

const hamburgerTapTransition: Transition = {
  type: "spring",
  stiffness: 560,
  damping: 24,
}

function getHamburgerMotion(open: boolean, hovered: boolean, reduceMotion: boolean | null): {
  box: TargetAndTransition
  top: TargetAndTransition
  bottom: TargetAndTransition
} {
  if (reduceMotion) {
    return {
      box: {
        rotate: 0,
        scale: 1,
        transition: hamburgerReducedTransition,
      },
      top: {
        x: 0,
        y: open ? 0 : -3.5,
        scaleX: 1,
        rotate: open ? 45 : 0,
        transition: hamburgerReducedTransition,
      },
      bottom: {
        x: open ? 0 : -3.4,
        y: open ? 0 : 3.5,
        scaleX: open ? 1 : 0.62,
        rotate: open ? -45 : 0,
        transition: hamburgerReducedTransition,
      },
    }
  }

  if (open) {
    return {
      box: {
        rotate: 90,
        scale: hovered ? 1.06 : 1,
        transition: {
          rotate: { type: "spring", visualDuration: 0.26, bounce: 0.22, delay: 0.03 },
          scale: { type: "spring", stiffness: 420, damping: 24 },
        },
      },
      top: {
        x: 0,
        y: 0,
        scaleX: 1,
        rotate: -45,
        transition: {
          y: { type: "spring", visualDuration: 0.11, bounce: 0.1 },
          x: { duration: 0.1, ease: [0.22, 1, 0.36, 1] },
          scaleX: { duration: 0.1, ease: [0.22, 1, 0.36, 1] },
          rotate: { type: "spring", visualDuration: 0.26, bounce: 0.38, delay: 0.13 },
        },
      },
      bottom: {
        x: 0,
        y: 0,
        scaleX: 1,
        rotate: 45,
        transition: {
          y: { type: "spring", visualDuration: 0.11, bounce: 0.1 },
          x: { type: "spring", visualDuration: 0.14, bounce: 0.2 },
          scaleX: { type: "spring", visualDuration: 0.14, bounce: 0.28 },
          rotate: { type: "spring", visualDuration: 0.27, bounce: 0.4, delay: 0.155 },
        },
      },
    }
  }

  return {
    box: {
      rotate: 0,
      scale: 1,
      transition: {
        rotate: { duration: 0.13, ease: [0.22, 1, 0.36, 1] },
        scale: { type: "spring", stiffness: 420, damping: 24 },
      },
    },
    top: {
      x: 0,
      y: hovered ? -4.1 : -3.5,
      scaleX: 1,
      rotate: 0,
      transition: {
        rotate: { duration: 0.11, ease: [0.22, 1, 0.36, 1] },
        y: { type: "spring", visualDuration: 0.2, bounce: 0.28, delay: 0.11 },
        x: { duration: 0.14, ease: [0.22, 1, 0.36, 1], delay: 0.11 },
        scaleX: { duration: 0.14, ease: [0.22, 1, 0.36, 1] },
      },
    },
    bottom: {
      x: -3.4,
      y: hovered ? 4.1 : 3.5,
      scaleX: 0.62,
      rotate: 0,
      transition: {
        rotate: { duration: 0.11, ease: [0.22, 1, 0.36, 1] },
        y: { type: "spring", visualDuration: 0.2, bounce: 0.28, delay: 0.11 },
        x: { type: "spring", visualDuration: 0.22, bounce: 0.35, delay: 0.135 },
        scaleX: { type: "spring", visualDuration: 0.22, bounce: 0.35, delay: 0.135 },
      },
    },
  }
}

/**
 * Normalizes and deduplicates navigation links + optional CTA at the source,
 * producing stable unique React keys even if callers pass duplicate `#about` targets.
 */
function buildUniqueNavbarEntries(
  navLinks: NavbarLink[],
  navCta?: NavbarLink,
): ResolvedNavbarLink[] {
  const raw: Array<{ link: NavbarLink; isCta: boolean }> = navLinks.map((link) => ({
    link,
    isCta: false,
  }))

  if (navCta) {
    const exactDuplicate = navLinks.some(
      (item) =>
        item.href.trim() === navCta.href.trim() &&
        item.label.trim().toLowerCase() === navCta.label.trim().toLowerCase(),
    )
    if (!exactDuplicate) {
      raw.push({ link: navCta, isCta: true })
    }
  }

  const exactSeen = new Set<string>()
  const keyCounts = new Map<string, number>()
  const entries: ResolvedNavbarLink[] = []

  for (const { link } of raw) {
    const href = link.href.trim()
    const label = link.label.trim()
    if (!href || !label) continue

    const signature = `${href}::${label.toLowerCase()}`
    if (exactSeen.has(signature)) continue
    exactSeen.add(signature)

    const baseKey = `nav-${href}::${label}`
    const occurrence = keyCounts.get(baseKey) ?? 0
    keyCounts.set(baseKey, occurrence + 1)

    entries.push({
      label,
      href,
      key: occurrence === 0 ? baseKey : `${baseKey}::${occurrence}`,
    })
  }

  return entries
}

function buildNavbarMenuItems(entries: ResolvedNavbarLink[]): StaggeredMenuItem[] {
  return entries.map((entry) => ({
    label: entry.label,
    ariaLabel: entry.href.startsWith("#") ? `Go to ${entry.label}` : entry.label,
    link: entry.href,
    key: `menu-${entry.key}`,
  }))
}

/**
 * Maps navbar links to observable section targets. Only in-page anchors (`#id`) are used.
 * The CTA (e.g. a `mailto:` Contact link) is mapped to `#contact` when it has no anchor of its own.
 */
function buildSectionTargets(navLinks: NavbarLink[], navCta?: NavbarLink): SectionTarget[] {
  const targets: SectionTarget[] = []
  const seen = new Set<string>()
  const add = (id: string, label: string) => {
    if (!id || seen.has(id)) return
    seen.add(id)
    targets.push({ id, label })
  }

  for (const link of navLinks) {
    if (link.href.startsWith("#")) add(link.href.slice(1), link.label)
  }
  if (navCta?.href.startsWith("#")) {
    add(navCta.href.slice(1), navCta.label)
  } else {
    add(CONTACT_SECTION_ID, navCta?.label ?? "Contact")
  }
  return targets
}

function assignMergedRef(
  forwardedRef: React.ForwardedRef<HTMLElement>,
  localRef: React.MutableRefObject<HTMLElement | null>,
  node: HTMLElement | null,
): void {
  localRef.current = node
  if (typeof forwardedRef === "function") {
    forwardedRef(node)
  } else if (forwardedRef) {
    forwardedRef.current = node
  }
}

function clearTimerRef(timerRef: React.MutableRefObject<number>): void {
  if (!timerRef.current) return
  window.clearTimeout(timerRef.current)
  timerRef.current = 0
}

function attachNavbarScrollWatcher({
  menuOpenRef,
  interactiveExpandedRef,
  setScrolledCollapsed,
  setInteractiveExpanded,
}: {
  menuOpenRef: React.MutableRefObject<boolean>
  interactiveExpandedRef: React.MutableRefObject<boolean>
  setScrolledCollapsed: (value: boolean) => void
  setInteractiveExpanded: (value: boolean) => void
}): () => void {
  let lastY = Math.max(0, window.scrollY)
  let cachedY = lastY
  let downTravel = 0
  let frame = 0
  let hasCollapsed = lastY > COLLAPSE_AT
  let wasExpanded = interactiveExpandedRef.current

  if (hasCollapsed) {
    setScrolledCollapsed(true)
  }

  const update = () => {
    frame = 0
    const rawY = cachedY
    const y = Math.max(0, rawY)
    const dy = y - lastY
    lastY = y

    // A click-expanded island needs fresh downward intent before scroll collapses it again.
    const isExpanded = interactiveExpandedRef.current
    if (isExpanded && !wasExpanded) downTravel = 0
    wasExpanded = isExpanded

    if (Math.round(rawY) <= TOP_RESTORE_AT) {
      downTravel = 0
      if (hasCollapsed) {
        hasCollapsed = false
        setScrolledCollapsed(false)
        setInteractiveExpanded(false)
      }
      return
    }

    if (dy <= 0) {
      if (dy < 0) downTravel = 0
      return
    }

    downTravel += dy
    if (y <= COLLAPSE_AT || downTravel <= DOWN_INTENT) return

    if (!hasCollapsed) {
      hasCollapsed = true
      setScrolledCollapsed(true)
    }
    if (!menuOpenRef.current) {
      setInteractiveExpanded(false)
    }
  }

  const onScroll = () => {
    cachedY = window.scrollY
    if (!frame) frame = window.requestAnimationFrame(update)
  }

  window.addEventListener("scroll", onScroll, { passive: true })
  return () => {
    window.removeEventListener("scroll", onScroll)
    if (frame) window.cancelAnimationFrame(frame)
  }
}

function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia(query)
    const sync = () => setMatches(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [query])

  return matches
}

/**
 * Tracks the section currently under the activation line (ACTIVATION_RATIO of viewport height).
 * IntersectionObserver is the trigger: every crossing of the thin activation band schedules a
 * deterministic resolve — the last section (in DOM order) whose top has passed the line wins.
 * Gaps between observed sections keep the previous section; above the first one resolves to Home.
 */
function useActiveSection(targetsKey: string): SectionTarget {
  const [active, setActive] = React.useState<SectionTarget>(HOME_SECTION)

  React.useEffect(() => {
    const targets = JSON.parse(targetsKey) as SectionTarget[]
    const observed = targets
      .map((target) => ({ target, el: document.getElementById(target.id) }))
      .filter((entry): entry is { target: SectionTarget; el: HTMLElement } => entry.el !== null)

    if (!observed.length) return

    let timer = 0

    const last = observed[observed.length - 1]

    const resolve = (): SectionTarget => {
      const viewportH = window.innerHeight
      const line = viewportH * ACTIVATION_RATIO
      // A short final section (e.g. footer) may never reach the line: at page bottom, it wins if visible.
      const atBottom =
        window.scrollY + viewportH >= document.documentElement.scrollHeight - BOTTOM_TOLERANCE
      if (atBottom && last.el.getBoundingClientRect().top < viewportH) return last.target

      let next = HOME_SECTION
      for (const { target, el } of observed) {
        if (el.getBoundingClientRect().top <= line) next = target
      }
      return next
    }

    const schedule = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        timer = 0
        const next = resolve()
        setActive((prev) => (prev.id === next.id ? prev : next))
      }, SECTION_SETTLE_MS)
    }

    const topPct = Math.round(ACTIVATION_RATIO * 100)
    const observer = new IntersectionObserver(schedule, {
      rootMargin: `-${topPct}% 0px -${99 - topPct}% 0px`,
      threshold: 0,
    })
    // IntersectionObserver delivers an initial record per element, which also resolves the mount state.
    observed.forEach(({ el }) => observer.observe(el))
    // Visibility steps of the final section re-trigger the resolve near the page bottom.
    const tailObserver = new IntersectionObserver(schedule, { threshold: TAIL_THRESHOLDS })
    tailObserver.observe(last.el)
    window.addEventListener("resize", schedule, { passive: true })

    return () => {
      observer.disconnect()
      tailObserver.disconnect()
      window.clearTimeout(timer)
      window.removeEventListener("resize", schedule)
    }
  }, [targetsKey])

  return active
}

function useNavbarOutsideDismiss({
  active,
  navRef,
  onCollapse,
}: {
  active: boolean
  navRef: React.RefObject<HTMLElement | null>
  onCollapse: () => void
}): void {
  React.useEffect(() => {
    if (!active) return

    const onDocumentPointerDown = (e: PointerEvent) => {
      const navEl = navRef.current
      if (!navEl || navEl.contains(e.target as Node)) return
      onCollapse()
    }

    const onDocumentKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCollapse()
    }

    document.addEventListener("pointerdown", onDocumentPointerDown, { passive: true })
    document.addEventListener("keydown", onDocumentKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onDocumentPointerDown)
      document.removeEventListener("keydown", onDocumentKeyDown)
    }
  }, [active, navRef, onCollapse])
}

function useNavbarMenuController(setInteractiveExpanded: (value: boolean) => void) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [menuVisible, setMenuVisible] = React.useState(false)
  const menuOpenRef = React.useRef(false)
  const closeHoldTimerRef = React.useRef(0)

  React.useEffect(() => () => clearTimerRef(closeHoldTimerRef), [])

  const finishCloseHold = React.useCallback(() => {
    clearTimerRef(closeHoldTimerRef)
    if (!menuOpenRef.current) {
      setMenuVisible(false)
    }
  }, [])

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      clearTimerRef(closeHoldTimerRef)
      menuOpenRef.current = nextOpen
      setMenuOpen(nextOpen)
      if (nextOpen) {
        setMenuVisible(true)
      } else {
        setInteractiveExpanded(false)
        closeHoldTimerRef.current = window.setTimeout(() => {
          closeHoldTimerRef.current = 0
          setMenuVisible(false)
        }, MENU_CLOSE_HOLD)
      }
    },
    [setInteractiveExpanded],
  )

  const toggleMenu = React.useCallback(() => {
    handleOpenChange(!menuOpenRef.current)
  }, [handleOpenChange])

  return {
    menuOpen,
    menuVisible,
    menuOpenRef,
    handleOpenChange,
    finishCloseHold,
    toggleMenu,
  }
}

function useNavbarClickHandlers({
  collapsed,
  islandMode,
  menuOpenRef,
  setInteractiveExpanded,
}: {
  collapsed: boolean
  islandMode: boolean
  menuOpenRef: React.MutableRefObject<boolean>
  setInteractiveExpanded: (value: boolean) => void
}) {
  // Capture phase: a click anywhere on the collapsed island (except the hamburger action) expands it.
  // Stopping propagation here keeps the brand toggle from also handling the same click.
  const handleIslandClickCapture = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!collapsed || menuOpenRef.current) return
      const target = e.target as HTMLElement | null
      if (target?.closest(".sh-actions")) return
      e.preventDefault()
      e.stopPropagation()
      setInteractiveExpanded(true)
    },
    [collapsed, menuOpenRef, setInteractiveExpanded],
  )

  // Brand acts as the island control while scrolled: click again to return to collapsed state.
  const handleBrandToggle = React.useCallback(() => {
    if (!islandMode || collapsed || menuOpenRef.current) return
    setInteractiveExpanded(false)
  }, [islandMode, collapsed, menuOpenRef, setInteractiveExpanded])

  return { handleIslandClickCapture, handleBrandToggle }
}

function useNavbarIslandController(
  fixedNav: boolean,
  navRef: React.RefObject<HTMLElement | null>,
) {
  const [scrolledCollapsed, setScrolledCollapsed] = React.useState(false)
  const [interactiveExpanded, setInteractiveExpanded] = React.useState(false)
  const interactiveExpandedRef = React.useRef(false)

  React.useEffect(() => {
    interactiveExpandedRef.current = interactiveExpanded
  }, [interactiveExpanded])

  const collapseExpanded = React.useCallback(() => {
    setInteractiveExpanded(false)
  }, [])

  const menu = useNavbarMenuController(setInteractiveExpanded)

  // Downward scroll past threshold collapses into Dynamic Island;
  // mid-page upward scroll stays collapsed, while reaching absolute top (scrollY <= 0) restores full navbar.
  React.useEffect(() => {
    if (!fixedNav) return
    return attachNavbarScrollWatcher({
      menuOpenRef: menu.menuOpenRef,
      interactiveExpandedRef,
      setScrolledCollapsed,
      setInteractiveExpanded,
    })
  }, [fixedNav, menu.menuOpenRef])

  const islandMode = fixedNav && scrolledCollapsed
  const collapsed = islandMode && !interactiveExpanded

  useNavbarOutsideDismiss({
    active: islandMode && interactiveExpanded && !menu.menuOpen,
    navRef,
    onCollapse: collapseExpanded,
  })

  const click = useNavbarClickHandlers({
    collapsed,
    islandMode,
    menuOpenRef: menu.menuOpenRef,
    setInteractiveExpanded,
  })

  return {
    collapsed,
    islandMode,
    menuOpen: menu.menuOpen,
    menuVisible: menu.menuVisible,
    handleMenuOpenChange: menu.handleOpenChange,
    handleMenuCloseComplete: menu.finishCloseHold,
    toggleMenu: menu.toggleMenu,
    ...click,
  }
}

const THEME_ICON_CENTER = 9
const THEME_RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const

const THEME_RAY_SPECS = THEME_RAY_ANGLES.map((deg, index) => {
  const rad = ((deg - 90) * Math.PI) / 180
  const ux = Number(Math.cos(rad).toFixed(4))
  const uy = Number(Math.sin(rad).toFixed(4))
  const rInner = 5.3
  const rOuter = 7.35
  const x1 = Number((THEME_ICON_CENTER + ux * rInner).toFixed(2))
  const y1 = Number((THEME_ICON_CENTER + uy * rInner).toFixed(2))
  const x2 = Number((THEME_ICON_CENTER + ux * rOuter).toFixed(2))
  const y2 = Number((THEME_ICON_CENTER + uy * rOuter).toFixed(2))
  return {
    key: `ray-${deg}`,
    index,
    ux,
    uy,
    d: `M ${x1} ${y1} L ${x2} ${y2}`,
  }
})

const themeReducedTransition: Transition = {
  duration: 0.12,
  ease: [0.22, 1, 0.36, 1],
}

const themeTapTransition: Transition = {
  type: "spring",
  stiffness: 560,
  damping: 24,
}

function getThemeIconMotion(
  isSun: boolean,
  hovered: boolean,
  reduceMotion: boolean | null,
): {
  sunCore: TargetAndTransition
  rayRing: TargetAndTransition
  getRay: (index: number, ux: number, uy: number) => TargetAndTransition
  moon: TargetAndTransition
  starMajor: TargetAndTransition
  starMinor: TargetAndTransition
} {
  if (reduceMotion) {
    return {
      sunCore: {
        opacity: isSun ? 1 : 0,
        scale: 1,
        rotate: 0,
        transition: themeReducedTransition,
      },
      rayRing: {
        rotate: 0,
        transition: themeReducedTransition,
      },
      getRay: () => ({
        x: 0,
        y: 0,
        scale: 1,
        pathLength: 1,
        opacity: isSun ? 1 : 0,
        transition: themeReducedTransition,
      }),
      moon: {
        opacity: isSun ? 0 : 1,
        scale: 1,
        rotate: 0,
        pathLength: 1,
        transition: themeReducedTransition,
      },
      starMajor: {
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0,
        opacity: isSun ? 0 : 1,
        transition: themeReducedTransition,
      },
      starMinor: {
        x: 0,
        y: 0,
        scale: 1,
        opacity: isSun ? 0 : 1,
        transition: themeReducedTransition,
      },
    }
  }

  return {
    sunCore: isSun
      ? {
          opacity: 1,
          scale: hovered ? 1.07 : 1,
          rotate: 0,
          transition: {
            opacity: { duration: 0.14, delay: 0.05 },
            scale: {
              type: "spring",
              visualDuration: 0.34,
              bounce: 0.38,
              delay: hovered ? 0 : 0.05,
            },
            rotate: { type: "spring", visualDuration: 0.36, bounce: 0.2 },
          },
        }
      : {
          opacity: 0,
          scale: 0.25,
          rotate: -90,
          transition: {
            opacity: { duration: 0.14, delay: 0.04 },
            scale: { duration: 0.18, ease: [0.4, 0, 1, 1] },
            rotate: { duration: 0.18, ease: [0.4, 0, 1, 1] },
          },
        },
    rayRing: isSun
      ? {
          rotate: hovered ? 22.5 : 0,
          transition: { type: "spring", visualDuration: 0.44, bounce: 0.24 },
        }
      : {
          rotate: -45,
          transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
        },
    getRay: (index, ux, uy) => {
      if (isSun) {
        const enterDelay = hovered ? 0 : 0.07 + index * 0.022
        return {
          x: hovered ? ux * 0.85 : 0,
          y: hovered ? uy * 0.85 : 0,
          scale: 1,
          pathLength: 1,
          opacity: 1,
          transition: {
            x: { type: "spring", visualDuration: 0.3, bounce: 0.34, delay: enterDelay },
            y: { type: "spring", visualDuration: 0.3, bounce: 0.34, delay: enterDelay },
            scale: {
              type: "spring",
              visualDuration: 0.3,
              bounce: 0.34,
              delay: 0.07 + index * 0.022,
            },
            pathLength: {
              duration: 0.22,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.07 + index * 0.022,
            },
            opacity: { duration: 0.1, delay: 0.07 + index * 0.022 },
          },
        }
      }

      const exitDelay = (7 - index) * 0.012
      return {
        x: -ux * 2.7,
        y: -uy * 2.7,
        scale: 0.35,
        pathLength: 0,
        opacity: 0,
        transition: {
          x: { duration: 0.16, ease: [0.4, 0, 1, 1], delay: exitDelay },
          y: { duration: 0.16, ease: [0.4, 0, 1, 1], delay: exitDelay },
          scale: { duration: 0.16, ease: [0.4, 0, 1, 1], delay: exitDelay },
          pathLength: { duration: 0.14, ease: [0.4, 0, 1, 1], delay: exitDelay },
          opacity: { duration: 0.1, delay: 0.05 + exitDelay },
        },
      }
    },
    moon: !isSun
      ? {
          opacity: 1,
          pathLength: 1,
          scale: 1,
          rotate: hovered ? -14 : 0,
          transition: {
            opacity: { duration: 0.12, delay: 0.06 },
            pathLength: { duration: 0.36, ease: [0.22, 1, 0.36, 1], delay: 0.06 },
            scale: { type: "spring", visualDuration: 0.38, bounce: 0.28, delay: 0.06 },
            rotate: {
              type: "spring",
              visualDuration: 0.42,
              bounce: 0.34,
              delay: hovered ? 0 : 0.06,
            },
          },
        }
      : {
          opacity: 0,
          pathLength: 0,
          scale: 0.55,
          rotate: 65,
          transition: {
            opacity: { duration: 0.12, delay: 0.06 },
            pathLength: { duration: 0.18, ease: [0.4, 0, 1, 1] },
            scale: { duration: 0.18, ease: [0.4, 0, 1, 1] },
            rotate: { duration: 0.18, ease: [0.4, 0, 1, 1] },
          },
        },
    starMajor: !isSun
      ? {
          x: hovered ? -0.35 : 0,
          y: hovered ? 0.25 : 0,
          scale: hovered ? 1.2 : 1,
          rotate: hovered ? 45 : 0,
          opacity: 1,
          transition: {
            x: { type: "spring", visualDuration: 0.32, bounce: 0.3, delay: hovered ? 0 : 0.18 },
            y: { type: "spring", visualDuration: 0.32, bounce: 0.3, delay: hovered ? 0 : 0.18 },
            scale: {
              type: "spring",
              visualDuration: 0.34,
              bounce: 0.45,
              delay: hovered ? 0 : 0.18,
            },
            rotate: {
              type: "spring",
              visualDuration: 0.38,
              bounce: 0.36,
              delay: hovered ? 0 : 0.18,
            },
            opacity: { duration: 0.12, delay: 0.18 },
          },
        }
      : {
          x: -3.5,
          y: 4,
          scale: 0,
          rotate: -90,
          opacity: 0,
          transition: {
            x: { duration: 0.16, ease: [0.4, 0, 1, 1] },
            y: { duration: 0.16, ease: [0.4, 0, 1, 1] },
            scale: { duration: 0.15, ease: [0.4, 0, 1, 1] },
            rotate: { duration: 0.16, ease: [0.4, 0, 1, 1] },
            opacity: { duration: 0.11, delay: 0.04 },
          },
        },
    starMinor: !isSun
      ? {
          x: hovered ? 0.45 : 0,
          y: hovered ? -0.45 : 0,
          scale: hovered ? 1.18 : 1,
          opacity: 1,
          transition: {
            x: { type: "spring", visualDuration: 0.3, bounce: 0.3, delay: hovered ? 0 : 0.23 },
            y: { type: "spring", visualDuration: 0.3, bounce: 0.3, delay: hovered ? 0 : 0.23 },
            scale: {
              type: "spring",
              visualDuration: 0.3,
              bounce: 0.42,
              delay: hovered ? 0 : 0.23,
            },
            opacity: { duration: 0.12, delay: 0.23 },
          },
        }
      : {
          x: -5.2,
          y: 1.5,
          scale: 0,
          opacity: 0,
          transition: {
            x: { duration: 0.14, ease: [0.4, 0, 1, 1] },
            y: { duration: 0.14, ease: [0.4, 0, 1, 1] },
            scale: { duration: 0.14, ease: [0.4, 0, 1, 1] },
            opacity: { duration: 0.1, delay: 0.03 },
          },
        },
  }
}

function ThemeToggleIcon({
  mode,
  hovered,
  pressed,
  reduceMotion,
}: {
  mode: "light" | "dark"
  hovered: boolean
  pressed: boolean
  reduceMotion: boolean | null
}) {
  const isSun = mode === "dark"
  const motionSpec = getThemeIconMotion(isSun, hovered, reduceMotion)

  return (
    <m.svg
      className="sh-theme-icon"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      initial={false}
      animate={{ scale: reduceMotion ? 1 : pressed ? 0.84 : 1 }}
      transition={reduceMotion ? themeReducedTransition : themeTapTransition}
    >
      <m.g
        initial={false}
        animate={motionSpec.rayRing}
        style={{ transformOrigin: "9px 9px" }}
      >
        {THEME_RAY_SPECS.map((ray) => (
          <m.path
            key={ray.key}
            d={ray.d}
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            initial={false}
            animate={motionSpec.getRay(ray.index, ray.ux, ray.uy)}
            style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
          />
        ))}
      </m.g>

      <m.circle
        cx="9"
        cy="9"
        r="3.15"
        stroke="currentColor"
        strokeWidth="1.35"
        initial={false}
        animate={motionSpec.sunCore}
        style={{ transformOrigin: "9px 9px" }}
      />

      <m.path
        d="M14.6 11.1A5.9 5.9 0 0 1 6.9 3.4a5.9 5.9 0 1 0 7.7 7.7Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={motionSpec.moon}
        style={{ transformOrigin: "9px 9px" }}
      />

      <m.path
        d="M12.5 3.65 L12.9 4.6 L13.85 5 L12.9 5.4 L12.5 6.35 L12.1 5.4 L11.15 5 L12.1 4.6 Z"
        fill="currentColor"
        initial={false}
        animate={motionSpec.starMajor}
        style={{ transformOrigin: "12.5px 5px" }}
      />

      <m.circle
        cx="14.2"
        cy="7.5"
        r="0.8"
        fill="currentColor"
        initial={false}
        animate={motionSpec.starMinor}
        style={{ transformOrigin: "14.2px 7.5px" }}
      />
    </m.svg>
  )
}

function NavbarBrandContent({
  collapsed,
  brand,
  section,
}: {
  collapsed: boolean
  brand: string
  section: SectionTarget
}) {
  const labelKey = collapsed ? `section-${section.id}` : "brand"
  const labelText = collapsed ? section.label : brand

  return (
    <>
      <AnimatePresence initial={false}>
        {collapsed && (
          <m.span
            key="brand-logo"
            className="sh-brand-logo"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.45 }}
            animate={{ opacity: 1, scale: 1, transition: itemEnterTransition }}
            exit={{ opacity: 0, scale: 0.45, transition: itemExitTransition }}
          />
        )}
      </AnimatePresence>
      <m.span layout="position" className="sh-brand-labelWrap" transition={islandSpring}>
        <AnimatePresence initial={false} mode="popLayout">
          <m.span
            key={labelKey}
            className="sh-brand-label"
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -7 }}
            transition={labelSwap}
          >
            {labelText}
          </m.span>
        </AnimatePresence>
      </m.span>
    </>
  )
}

function NavbarBrand({
  collapsed,
  islandMode,
  brand,
  section,
  onToggle,
}: {
  collapsed: boolean
  islandMode: boolean
  brand: string
  section: SectionTarget
  onToggle: () => void
}) {
  const content = <NavbarBrandContent collapsed={collapsed} brand={brand} section={section} />

  if (islandMode) {
    return (
      <m.button
        type="button"
        layout="position"
        className="sh-brand"
        transition={islandSpring}
        aria-expanded={!collapsed}
        aria-label={
          collapsed
            ? `Expand navigation, current section: ${section.label}`
            : "Collapse navigation"
        }
        onClick={onToggle}
      >
        {content}
        <span className="sh-sr-only" aria-live="polite">
          {collapsed ? section.label : ""}
        </span>
      </m.button>
    )
  }

  return (
    <m.a layout="position" className="sh-brand" href="#" transition={islandSpring}>
      {content}
    </m.a>
  )
}

function NavbarThemeButton({
  mode,
  onToggleTheme,
}: {
  mode: "light" | "dark"
  onToggleTheme: () => void
}) {
  const reduceMotion = useReducedMotion()
  const [hovered, setHovered] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)

  return (
    <button
      type="button"
      className="sh-icon-btn sh-theme"
      aria-label={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") setHovered(true)
      }}
      onPointerLeave={() => {
        setHovered(false)
        setPressed(false)
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onClick={onToggleTheme}
    >
      <ThemeToggleIcon
        mode={mode}
        hovered={hovered}
        pressed={pressed}
        reduceMotion={reduceMotion}
      />
    </button>
  )
}

function NavbarHamburgerButton({
  open,
  onToggle,
  buttonRef,
}: {
  open: boolean
  onToggle: () => void
  buttonRef: React.RefObject<HTMLButtonElement | null>
}) {
  const reduceMotion = useReducedMotion()
  const [hovered, setHovered] = React.useState(false)
  const motionSpec = getHamburgerMotion(open, hovered, reduceMotion)

  return (
    <m.button
      ref={buttonRef}
      type="button"
      className="sh-icon-btn sh-hamburger"
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      aria-controls="staggered-menu-panel"
      whileTap={{ scale: reduceMotion ? 1 : 0.85 }}
      transition={hamburgerTapTransition}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onToggle}
    >
      <m.span
        className="sh-hamburger-box"
        aria-hidden="true"
        initial={false}
        animate={motionSpec.box}
      >
        <m.span
          className="sh-hamburger-line sh-hamburger-line--top"
          initial={false}
          animate={motionSpec.top}
        />
        <m.span
          className="sh-hamburger-line sh-hamburger-line--bottom"
          initial={false}
          animate={motionSpec.bottom}
        />
      </m.span>
    </m.button>
  )
}

const Navbar = React.forwardRef<HTMLElement, NavbarProps>(function Navbar(
  {
    brand = "Sahrul",
    navLinks = EMPTY_NAV_LINKS,
    navCta,
    themeToggle = true,
    mode,
    onToggleTheme,
    fg,
    fixedNav = false,
    style,
  },
  forwardedRef,
) {
  const localNavRef = React.useRef<HTMLElement | null>(null)
  const hamburgerBtnRef = React.useRef<HTMLButtonElement | null>(null)
  const setNavRef = React.useCallback(
    (node: HTMLElement | null) => assignMergedRef(forwardedRef, localNavRef, node),
    [forwardedRef],
  )

  // The menu panel goes full-width (and covers the toggle) at <=1024px, matching the CSS breakpoint
  const panelCoversToggle = useMatchMedia("(max-width: 1024px)")
  const island = useNavbarIslandController(fixedNav, localNavRef)
  const effectiveCollapsed = island.collapsed && !(island.menuOpen && panelCoversToggle)

  const uniqueEntries = React.useMemo(
    () => buildUniqueNavbarEntries(navLinks, navCta),
    [navLinks, navCta],
  )
  const menuItems = React.useMemo(
    () => buildNavbarMenuItems(uniqueEntries),
    [uniqueEntries],
  )
  // Serialized so inline `navLinks` arrays from parents don't re-create the observer every render.
  const sectionTargetsKey = JSON.stringify(buildSectionTargets(navLinks, navCta))
  const activeSection = useActiveSection(sectionTargetsKey)

  const showIslandSurface =
    island.islandMode && !(island.menuOpen && panelCoversToggle)

  return (
    <nav
      ref={setNavRef}
      className="sh-nav navbar"
      data-fixed={fixedNav ? "true" : undefined}
      data-island={effectiveCollapsed ? "collapsed" : "expanded"}
      data-island-mode={island.islandMode ? "true" : undefined}
      data-menu-open={island.menuOpen ? "true" : undefined}
      data-menu-visible={island.menuVisible ? "true" : undefined}
      data-section={activeSection.id}
      style={fixedNav ? style : undefined}
      aria-label="Primary"
    >
      <LayoutGroup id="sh-navbar-island">
        <m.div
          layout
          className="sh-island"
          initial={false}
          transition={islandSpring}
          onClickCapture={island.handleIslandClickCapture}
        >
          <m.span
            layout
            aria-hidden="true"
            className="sh-island-surface"
            initial={false}
            animate={{
              opacity: showIslandSurface ? 1 : 0,
              scale: showIslandSurface ? 1 : 0.97,
              borderRadius: effectiveCollapsed ? 16 : 18,
            }}
            style={{ borderRadius: 16 }}
            transition={islandSpring}
          />

          <NavbarBrand
            collapsed={effectiveCollapsed}
            islandMode={island.islandMode}
            brand={brand}
            section={activeSection}
            onToggle={island.handleBrandToggle}
          />

          <m.div layout="position" className="sh-actions" transition={islandSpring}>
            <AnimatePresence initial={false} mode="popLayout">
              {themeToggle && !effectiveCollapsed && (
                <m.div
                  key="theme-toggle"
                  layout="position"
                  className="sh-action-item"
                  initial={{ opacity: 0, scale: 0.78 }}
                  animate={{ opacity: 1, scale: 1, transition: itemEnterTransition }}
                  exit={{ opacity: 0, scale: 0.78, transition: itemExitTransition }}
                >
                  <NavbarThemeButton mode={mode} onToggleTheme={onToggleTheme} />
                </m.div>
              )}
            </AnimatePresence>

            <m.div layout="position" className="sh-action-item" transition={islandSpring}>
              <NavbarHamburgerButton
                open={island.menuOpen}
                onToggle={island.toggleMenu}
                buttonRef={hamburgerBtnRef}
              />
            </m.div>
          </m.div>
        </m.div>
      </LayoutGroup>

      <div className="sh-menu-drawer">
        <StaggeredMenu
          items={menuItems}
          socialItems={DEFAULT_SOCIAL_ITEMS}
          displaySocials
          displayItemNumbering={false}
          showLogo={false}
          renderHeader={false}
          open={island.menuOpen}
          onOpenChange={island.handleMenuOpenChange}
          onCloseComplete={island.handleMenuCloseComplete}
          externalToggleRef={hamburgerBtnRef}
          isFixed={false}
          colors={ISLAND_MENU_COLORS}
          menuButtonColor={fg}
          openMenuButtonColor={panelCoversToggle ? "#111110" : fg}
          accentColor="#5227FF"
          className="sh-menu"
          position="left"
        />
      </div>
    </nav>
  )
})

export default Navbar
