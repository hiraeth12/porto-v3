"use client"

import * as React from "react"
import {
  fanSlot,
  hashString,
  paintFolderArt,
  recipeOf,
  rng,
  type ArtPreset,
  type ArtRecipe,
  type FolderArt,
} from "./glass-folder-art"

export type { ArtPreset, ArtRecipe, FolderArt }

/**
 * Glass Folder Cards - frosted 3D glass folder with stacked contents.
 */

export type FolderFile = {
  name: string
  /** A short second line: a size, a date, a kind. */
  meta?: string
  /** Makes the file a picture: a generated artworkâ€¦ */
  art?: ArtPreset | ArtRecipe
  /** â€¦or an image of your own. Without either, the file is a sheet of paper. */
  image?: string
  /** Rendered as a link when the folder is open. */
  href?: string
  /** Optional explicit content kind ("pdf" | "image" | "project"). */
  kind?: "pdf" | "image" | "project"
  /** Optional slug reference when kind === "project". */
  projectSlug?: string
}

export type FolderMenuItem = {
  label: string
  onSelect?: () => void
  /** Drawn in red, for the one you would want to think twice about. */
  danger?: boolean
}

export type GlassFolderProps = {
  label?: string
  /** The second line. Defaults to the number of files, which rolls as you add. */
  meta?: string
  /** `light` is milk glass, `dark` is smoked glass. */
  tone?: "light" | "dark"
  /** What the back panel holds. A preset, your own recipe, or `none` for a plain frosted back. */
  art?: FolderArt
  /** A different arrangement of the same recipe. */
  seed?: number
  /** Your own picture for the back panel, instead of generated art. */
  image?: string
  /** The folder's contents. Read once; after that the folder owns the list. */
  files?: FolderFile[]
  /** `add` drops new files in, `more` opens a menu, `none` hides the key. */
  action?: "add" | "more" | "none"
  /** What `add` puts in the folder. Return nothing for an "Untitled" sheet. */
  onAdd?: (files: FolderFile[]) => FolderFile | void
  onFilesChange?: (files: FolderFile[]) => void
  /** Items for the `more` menu. An Open / Close item is always first. */
  menu?: FolderMenuItem[]
  /** Where the label sits on the front panel. */
  labelPlacement?: "bottom-left" | "top-left" | "top-right"
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Called when a file is chosen while the folder is open. */
  onFileSelect?: (
    file: FolderFile,
    index: number,
    event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  ) => void
  /** Width in px. Everything else scales with it; the height is 0.96 Ã— width. */
  width?: number
  /** Assemble itself the first time it scrolls into view. */
  appear?: boolean
  /** Delay before that entrance, in ms â€” for staggering a row of folders. */
  appearDelay?: number
  className?: string
  style?: React.CSSProperties
}

function ArtCanvas({
  art,
  seed,
  w,
  h,
  density,
  priority,
  className,
}: {
  art: ArtPreset | ArtRecipe
  seed: number
  w: number
  h: number
  density: number
  priority: number
  className?: string
}) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = React.useState(false)
  const recipe = recipeOf(art)
  const key = JSON.stringify(recipe)
  const pw = Math.round(w * density)
  const ph = Math.round(h * density)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    let live = true
    let io: IntersectionObserver | null = null

    const startPaint = () => {
      paintFolderArt(JSON.parse(key) as ArtRecipe, seed, pw, ph, priority).then((src) => {
        const c = ref.current
        if (!live || !c) return
        c.width = src.width
        c.height = src.height
        c.getContext("2d")?.drawImage(src, 0, 0)
        setReady(true)
      })
    }

    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            io?.disconnect()
            io = null
            startPaint()
          }
        },
        { rootMargin: "200px 0px" },
      )
      io.observe(el)
    } else {
      startPaint()
    }

    return () => {
      live = false
      io?.disconnect()
    }
  }, [key, seed, pw, ph, priority])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={className}
      data-ready={ready || undefined}
      style={{ width: w, height: h, maxWidth: "none" }}
    />
  )
}

// ---------------------------------------------------------------------------
// Geometry, in the folder's own units. The stage is drawn at 340 Ã— 272 and
// scaled to `width`, so the shapes can be fixed paths.

const W = 340
const H = 272
const HEADROOM = 54 // room above the back panel for the files to rise into
const FRONT_TOP = 74
const FRONT_H = H - FRONT_TOP
const SHEET_W = 272
const SHEET_H = 184

const BACK_PATH =
  "M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 250A22 22 0 0 1 318 272L22 272A22 22 0 0 1 0 250Z"
const FRONT_PATH =
  "M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 " +
  (FRONT_H - 22) +
  "A22 22 0 0 1 318 " +
  FRONT_H +
  "L22 " +
  FRONT_H +
  "A22 22 0 0 1 0 " +
  (FRONT_H - 22) +
  "Z"

const MAX_VISIBLE = 4

const SAMPLE_FILES: FolderFile[] = [
  { name: "Cover â€” final", meta: "PNG Â· 4.8 MB", art: "ember" },
  { name: "Moodboard", meta: "24 images", art: "dusk" },
  { name: "Brief.pdf", meta: "PDF Â· 1.2 MB" },
]

function resolveMenuTargetIndex(key: string, current: number, total: number): number | "close" | null {
  if (key === "Tab") return "close"
  const targets: Record<string, number> = {
    ArrowDown: current + 1,
    ArrowUp: current - 1,
    Home: 0,
    End: total - 1,
  }
  return key in targets ? targets[key] : null
}

function attachFolderPointerTilt(el: HTMLDivElement): () => void {
  let raf = 0
  let px = 0
  let py = 0
  const write = () => {
    raf = 0
    el.style.setProperty("--gf-px", px.toFixed(3))
    el.style.setProperty("--gf-py", py.toFixed(3))
  }
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(write)
  }
  const move = (e: PointerEvent) => {
    if (e.pointerType === "touch") return
    const r = el.getBoundingClientRect()
    px = ((e.clientX - r.left) / r.width) * 2 - 1
    py = ((e.clientY - r.top) / r.height) * 2 - 1
    schedule()
  }
  const leave = () => {
    px = 0
    py = 0
    schedule()
  }
  el.addEventListener("pointermove", move)
  el.addEventListener("pointerleave", leave)
  return () => {
    el.removeEventListener("pointermove", move)
    el.removeEventListener("pointerleave", leave)
    cancelAnimationFrame(raf)
  }
}

function attachFolderDismissListeners({
  open,
  menuOpen,
  setOpen,
  setMenuOpen,
  rootRef,
  menuRef,
  keyRef,
  hitRef,
}: {
  open: boolean
  menuOpen: boolean
  setOpen: (next: boolean) => void
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  rootRef: React.RefObject<HTMLDivElement | null>
  menuRef: React.RefObject<HTMLDivElement | null>
  keyRef: React.RefObject<HTMLButtonElement | null>
  hitRef: React.RefObject<HTMLButtonElement | null>
}): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return
    if (menuOpen) {
      setMenuOpen(false)
      keyRef.current?.focus()
      return
    }
    setOpen(false)
    hitRef.current?.focus()
  }

  const onDown = (e: PointerEvent) => {
    const t = e.target as Node
    const outsideMenu = !menuRef.current?.contains(t) && !keyRef.current?.contains(t)
    if (menuOpen && outsideMenu) setMenuOpen(false)
    if (open && !menuOpen && !rootRef.current?.contains(t)) setOpen(false)
  }

  document.addEventListener("keydown", onKey)
  document.addEventListener("pointerdown", onDown)
  return () => {
    document.removeEventListener("keydown", onKey)
    document.removeEventListener("pointerdown", onDown)
  }
}

function useFolderEntrance(
  rootRef: React.RefObject<HTMLDivElement | null>,
  appear: boolean,
  appearDelay: number,
): boolean {
  const [entered, setEntered] = React.useState(!appear)

  React.useEffect(() => {
    if (!appear) return
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === "undefined") {
      setEntered(true)
      return
    }
    let timer = 0
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        io.disconnect()
        timer = window.setTimeout(() => setEntered(true), appearDelay)
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      window.clearTimeout(timer)
    }
  }, [rootRef, appear, appearDelay])

  return entered
}

function useFolderPointerTilt(rootRef: React.RefObject<HTMLDivElement | null>): void {
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    return attachFolderPointerTilt(el)
  }, [rootRef])
}

function useFolderDismiss(opts: {
  open: boolean
  menuOpen: boolean
  setOpen: (next: boolean) => void
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  rootRef: React.RefObject<HTMLDivElement | null>
  menuRef: React.RefObject<HTMLDivElement | null>
  keyRef: React.RefObject<HTMLButtonElement | null>
  hitRef: React.RefObject<HTMLButtonElement | null>
}): void {
  const { open, menuOpen, setOpen, setMenuOpen, rootRef, menuRef, keyRef, hitRef } = opts

  React.useEffect(() => {
    if (!open && !menuOpen) return
    return attachFolderDismissListeners({
      open,
      menuOpen,
      setOpen,
      setMenuOpen,
      rootRef,
      menuRef,
      keyRef,
      hitRef,
    })
  }, [open, menuOpen, setOpen, setMenuOpen, rootRef, menuRef, keyRef, hitRef])

  React.useEffect(() => {
    if (menuOpen) menuRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus()
  }, [menuOpen, menuRef])
}

function useControlledOpen(
  openProp: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange?: (open: boolean) => void,
) {
  const [openState, setOpenState] = React.useState(defaultOpen)
  const open = openProp ?? openState
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOpenState(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange],
  )
  return [open, setOpen] as const
}

function GlassFolderBackPanel({
  image,
  art,
  seed,
  density,
}: {
  image?: string
  art: FolderArt
  seed: number
  density: number
}) {
  return (
    <>
      <div className="gf-back" style={{ clipPath: "path('" + BACK_PATH + "')" }} aria-hidden="true">
        {image ? (
          <img className="gf-art" src={image} alt="" width={W + 24} height={H + 24} draggable={false} />
        ) : art !== "none" ? (
          <ArtCanvas className="gf-art" art={art} seed={seed} w={W + 24} h={H + 24} density={density} priority={0} />
        ) : null}
        <div className="gf-back-sheen" />
      </div>
      <svg className="gf-rim gf-back-rim" viewBox={"0 0 " + W + " " + H} aria-hidden="true">
        <path d={BACK_PATH} />
      </svg>
    </>
  )
}

function GlassFolderFrontPanel({
  uid,
  bump,
  open,
  label,
  count,
  metaLine,
  hitRef,
  onToggleOpen,
}: {
  uid: string
  bump: number
  open: boolean
  label: string
  count: number
  metaLine: string
  hitRef: React.RefObject<HTMLButtonElement | null>
  onToggleOpen: () => void
}) {
  return (
    <div
      key={bump}
      className={"gf-front" + (bump ? " gf-front--bump" : "")}
      style={{ clipPath: "path('" + FRONT_PATH + "')" }}
    >
      <div className="gf-tint" aria-hidden="true" />
      <div className="gf-spec" aria-hidden="true" />
      <svg className="gf-rim gf-front-rim" viewBox={"0 0 " + W + " " + FRONT_H} aria-hidden="true">
        <defs>
          <linearGradient id={"gf-rim-" + uid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="0.35" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <path d={FRONT_PATH} stroke={"url(#gf-rim-" + uid + ")"} />
      </svg>
      <button
        ref={hitRef}
        type="button"
        className="gf-hit"
        aria-expanded={open}
        aria-label={(open ? "Close " : "Open ") + label + ", " + count + (count === 1 ? " item" : " items")}
        onClick={onToggleOpen}
      />
      <div className="gf-label">
        <span className="gf-title">{label}</span>
        <span className="gf-meta" key={metaLine}>
          {metaLine}
        </span>
      </div>
    </div>
  )
}

function GlassFolderSheetArtwork({
  file,
  density,
}: {
  file: FolderFile
  density: number
}) {
  if (file.image) {
    return <img className="gf-sheet-art" src={file.image} alt="" width={SHEET_W} height={SHEET_H} draggable={false} />
  }
  if (file.art) {
    return (
      <ArtCanvas
        className="gf-sheet-art"
        art={file.art}
        seed={hashString(file.name) % 997}
        w={SHEET_W}
        h={SHEET_H}
        density={Math.min(density, 1.25)}
        priority={1}
      />
    )
  }
  return (
    <span className="gf-lines" aria-hidden="true">
      <i style={{ width: "86%" }} />
      <i style={{ width: "92%" }} />
      <i style={{ width: "64%" }} />
      <i style={{ width: "88%" }} />
      <i style={{ width: "42%" }} />
    </span>
  )
}

function GlassFolderSheet({
  file,
  fileId,
  visibleIndex,
  visibleCount,
  absoluteIndex,
  dropped,
  density,
  onClearDropped,
  onFileSelect,
}: {
  file: FolderFile
  fileId: number
  visibleIndex: number
  visibleCount: number
  absoluteIndex: number
  dropped: number | null
  density: number
  onClearDropped: () => void
  onFileSelect?: GlassFolderProps["onFileSelect"]
}) {
  const slot = fanSlot(visibleIndex, visibleCount)
  const jitter = rng(hashString(file.name) + fileId)
  const picture = Boolean(file.art || file.image)
  const inner = (
    <>
      <GlassFolderSheetArtwork file={file} density={density} />
      <span className="gf-sheet-head">
        <span className="gf-sheet-name">{file.name}</span>
        {file.meta ? <span className="gf-sheet-meta">{file.meta}</span> : null}
      </span>
    </>
  )
  const common = {
    className: "gf-sheet" + (picture ? " gf-sheet--art" : "") + (fileId === dropped ? " gf-sheet--drop" : ""),
    style: {
      "--gf-slot": slot,
      "--gf-depth": visibleCount - 1 - visibleIndex,
      "--gf-jx": ((jitter() - 0.5) * 10).toFixed(2) + "px",
      "--gf-jr": ((jitter() - 0.5) * 3.2).toFixed(2) + "deg",
      zIndex: visibleIndex + 1,
    } as React.CSSProperties,
    onAnimationEnd: fileId === dropped ? onClearDropped : undefined,
  }

  // FolderCardSwap integration: stop propagation on file clicks so selecting a file never triggers a deck swap.
  const handleSheetClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.stopPropagation()
    onFileSelect?.(file, absoluteIndex, e)
  }

  return (
    <li className="gf-sheet-slot">
      {file.href ? (
        <a {...common} href={file.href} onClick={handleSheetClick}>
          {inner}
        </a>
      ) : (
        <button {...common} type="button" onClick={handleSheetClick}>
          {inner}
        </button>
      )}
    </li>
  )
}

function GlassFolderActionKey({
  action,
  label,
  uid,
  bump,
  menuOpen,
  keyRef,
  onAddFile,
  onToggleMenu,
}: {
  action: "add" | "more" | "none"
  label: string
  uid: string
  bump: number
  menuOpen: boolean
  keyRef: React.RefObject<HTMLButtonElement | null>
  onAddFile: () => void
  onToggleMenu: () => void
}) {
  if (action === "none") return null

  return (
    <button
      ref={keyRef}
      type="button"
      className={"gf-key gf-key--" + action}
      aria-label={action === "add" ? "Add a file to " + label : "More options for " + label}
      aria-haspopup={action === "more" ? "menu" : undefined}
      aria-expanded={action === "more" ? menuOpen : undefined}
      aria-controls={action === "more" ? "gf-menu-" + uid : undefined}
      // FolderCardSwap integration: stop propagation so action key clicks never trigger a deck swap.
      onClick={(e) => {
        e.stopPropagation()
        if (action === "add") onAddFile()
        else onToggleMenu()
      }}
    >
      {action === "add" ? (
        <svg key={bump} className="gf-glyph gf-glyph--plus" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4.5v15M4.5 12h15" />
        </svg>
      ) : (
        <svg className="gf-glyph gf-glyph--more" viewBox="0 0 30 12" aria-hidden="true">
          <rect x="1" y="1.5" width="8" height="9" rx="3.4" />
          <rect x="11" y="1.5" width="8" height="9" rx="3.4" />
          <rect x="21" y="1.5" width="8" height="9" rx="3.4" />
        </svg>
      )}
    </button>
  )
}

function GlassFolderMenu({
  uid,
  label,
  menuOpen,
  menuItems,
  menuRef,
  keyRef,
  onCloseMenu,
  onKeyDown,
}: {
  uid: string
  label: string
  menuOpen: boolean
  menuItems: FolderMenuItem[]
  menuRef: React.RefObject<HTMLDivElement | null>
  keyRef: React.RefObject<HTMLButtonElement | null>
  onCloseMenu: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      ref={menuRef}
      id={"gf-menu-" + uid}
      role="menu"
      aria-label={label + " options"}
      className="gf-menu"
      data-open={menuOpen || undefined}
      onKeyDown={onKeyDown}
      // FolderCardSwap integration: isolate menu interactions from parent deck swap handlers.
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, i) => (
        <button
          key={item.label + i}
          type="button"
          role="menuitem"
          tabIndex={menuOpen ? -1 : undefined}
          disabled={!menuOpen}
          className={"gf-menu-item" + (item.danger ? " gf-menu-item--danger" : "")}
          onClick={(e) => {
            e.stopPropagation()
            onCloseMenu()
            keyRef.current?.focus()
            item.onSelect?.()
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export default function GlassFolder({
  label = "My Files",
  meta,
  tone = "light",
  art = "aurora",
  seed = 3,
  image,
  files: initialFiles = SAMPLE_FILES,
  action = "add",
  onAdd,
  onFilesChange,
  menu = [],
  labelPlacement = "bottom-left",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onFileSelect,
  width = 340,
  appear = true,
  appearDelay = 0,
  className,
  style,
}: GlassFolderProps) {
  const uid = React.useId().replace(/:/g, "")
  const rootRef = React.useRef<HTMLDivElement>(null)
  const filesRef = React.useRef<HTMLUListElement>(null)
  const hitRef = React.useRef<HTMLButtonElement>(null)
  const keyRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const [files, setFiles] = React.useState<FolderFile[]>(initialFiles)
  // ids survive re-renders so a newly added file is the only one that animates in
  const [fileIds, setFileIds] = React.useState<number[]>(() => initialFiles.map((_, i) => i))
  const nextId = React.useRef(initialFiles.length)
  const [dropped, setDropped] = React.useState<number | null>(null)
  const [bump, setBump] = React.useState(0)

  const [open, setOpen] = useControlledOpen(openProp, defaultOpen, onOpenChange)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const entered = useFolderEntrance(rootRef, appear, appearDelay)

  const k = width / W
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1
  const density = Math.min(1.5, Math.max(1, dpr)) * k

  useFolderPointerTilt(rootRef)
  useFolderDismiss({ open, menuOpen, setOpen, setMenuOpen, rootRef, menuRef, keyRef, hitRef })

  React.useEffect(() => {
    filesRef.current?.toggleAttribute("inert", !open)
  }, [open])

  const addFile = () => {
    const made = onAdd?.(files)
    const file: FolderFile = made || { name: "Untitled " + (files.length + 1), meta: "Just now" }
    const next = [...files, file]
    const id = nextId.current++
    setFileIds((current) => [...current, id])
    setFiles(next)
    setDropped(id)
    setBump((b) => b + 1)
    onFilesChange?.(next)
  }

  const menuItems: FolderMenuItem[] = [
    { label: open ? "Close folder" : "Open folder", onSelect: () => setOpen(!open) },
    ...menu,
  ]

  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])
    const at = items.indexOf(document.activeElement as HTMLElement)
    const target = resolveMenuTargetIndex(e.key, at, items.length)
    if (target === "close") setMenuOpen(false)
    else if (target !== null) {
      e.preventDefault()
      items[(target + items.length) % items.length]?.focus()
    }
  }

  // the newest files sit at the front of the stack, nearest the glass
  const start = Math.max(0, files.length - MAX_VISIBLE)
  const visible = files.slice(start)
  const count = files.length
  const metaLine = meta ?? count + (count === 1 ? " item" : " items")

  return (
    <div
      ref={rootRef}
      className={"gf-root" + (className ? " " + className : "")}
      data-tone={tone}
      data-open={open || undefined}
      data-entered={entered || undefined}
      data-place={labelPlacement}
      style={{ width, height: (H + HEADROOM) * k, ...style }}
    >
      <style>{GF_CSS}</style>
      <div className="gf-stage" style={{ transform: "translateY(" + HEADROOM * k + "px) scale(" + k + ")" }}>
        <div className="gf-tilt">
          <div className="gf-shadow" aria-hidden="true" />

          <GlassFolderBackPanel image={image} art={art} seed={seed} density={density} />

          <GlassFolderFrontPanel
            uid={uid}
            bump={bump}
            open={open}
            label={label}
            count={count}
            metaLine={metaLine}
            hitRef={hitRef}
            onToggleOpen={() => {
              setMenuOpen(false)
              setOpen(!open)
            }}
          />

          {/* the contents: after the glass in tab order, beneath it on screen */}
          <ul ref={filesRef} className="gf-files" aria-label={label + " contents"}>
            {visible.map((file, v) => (
              <GlassFolderSheet
                key={fileIds[start + v]}
                file={file}
                fileId={fileIds[start + v]}
                visibleIndex={v}
                visibleCount={visible.length}
                absoluteIndex={start + v}
                dropped={dropped}
                density={density}
                onClearDropped={() => setDropped(null)}
                onFileSelect={onFileSelect}
              />
            ))}
          </ul>

          <GlassFolderActionKey
            action={action}
            label={label}
            uid={uid}
            bump={bump}
            menuOpen={menuOpen}
            keyRef={keyRef}
            onAddFile={addFile}
            onToggleMenu={() => setMenuOpen((prev) => !prev)}
          />

          {action === "more" ? (
            <GlassFolderMenu
              uid={uid}
              label={label}
              menuOpen={menuOpen}
              menuItems={menuItems}
              menuRef={menuRef}
              keyRef={keyRef}
              onCloseMenu={() => setMenuOpen(false)}
              onKeyDown={onMenuKey}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

const GF_CSS = `
.gf-root {
  --gf-px: 0;
  --gf-py: 0;
  --gf-ease: cubic-bezier(.2, .8, .2, 1);
  --gf-spring: cubic-bezier(.34, 1.36, .5, 1);
  --gf-hinge: 0deg;
  --gf-lift: 42px;
  --gf-spread: 0px;
  --gf-fan: 0deg;
  --gf-stack: 15px;
  --gf-ink: #141416;
  --gf-ink-soft: rgba(20, 20, 22, .55);
  position: relative;
  display: inline-block;
  flex: none;
  vertical-align: top;
  font-family: var(--portfolio-body, ui-sans-serif, system-ui, sans-serif);
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  isolation: isolate;
}
.gf-root[data-tone="dark"] { --gf-ink: #f5f5f7; --gf-ink-soft: rgba(245, 245, 247, .58); }
.gf-root:hover, .gf-root:focus-within { --gf-hinge: -11deg; --gf-lift: -34px; --gf-spread: 8px; --gf-fan: 1.4deg; --gf-stack: 10px; }
.gf-root[data-open] { --gf-hinge: -24deg; --gf-lift: -96px; --gf-spread: 40px; --gf-fan: 5deg; --gf-stack: 30px; }

.gf-stage {
  position: absolute;
  left: 0;
  top: 0;
  width: 340px;
  height: 272px;
  transform-origin: 0 0;
}
.gf-tilt {
  position: absolute;
  inset: 0;
  transform: perspective(1400px) rotateX(calc(var(--gf-py) * -3deg)) rotateY(calc(var(--gf-px) * 4deg));
  transition: transform .9s var(--gf-ease);
}

.gf-shadow {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: -6px;
  height: 60px;
  border-radius: 40px;
  background: rgba(16, 18, 24, .34);
  filter: blur(22px);
  opacity: 0;
  transform: translateX(calc(var(--gf-px) * -8px));
  transition: transform .9s var(--gf-ease), opacity .9s var(--gf-ease);
}
.gf-root[data-tone="dark"] .gf-shadow { background: rgba(0, 0, 0, .62); }
.gf-root:hover .gf-shadow,
.gf-root:focus-within .gf-shadow,
.gf-root[data-open] .gf-shadow { opacity: .72; }

.gf-back {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #e7e7e9;
}
.gf-root[data-tone="dark"] .gf-back { background: #252529; }
.gf-art {
  position: absolute;
  left: -12px;
  top: -12px;
  max-width: none;
  object-fit: cover;
  transform: translate(calc(var(--gf-px) * -7px), calc(var(--gf-py) * -6px)) scale(1.02);
  transition: transform 1.1s var(--gf-ease), opacity 1.2s var(--gf-ease), filter 1.2s var(--gf-ease);
}
canvas.gf-art { opacity: 0; filter: blur(14px) saturate(.6); }
canvas.gf-art[data-ready] { opacity: 1; filter: none; }
.gf-back-sheen {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, .12);
  pointer-events: none;
}

.gf-rim {
  position: absolute;
  left: 0;
  top: 0;
  max-width: none;
  overflow: visible;
  pointer-events: none;
  fill: none;
}
.gf-back-rim { width: 340px; height: 272px; }
.gf-back-rim path { stroke: rgba(255, 255, 255, .45); stroke-width: 1; }
.gf-root[data-tone="dark"] .gf-back-rim path { stroke: rgba(255, 255, 255, .16); }

/* ---- files ---------------------------------------------------------------- */
.gf-files {
  position: absolute;
  inset: 0;
  z-index: 5;
  margin: 0;
  padding: 0;
  list-style: none;
  pointer-events: none;
  /* nothing hangs out of the bottom of the pocket, however tall the stack */
  clip-path: inset(-400px -400px 10px -400px);
}
.gf-sheet-slot { display: contents; }
.gf-sheet {
  all: unset;
  box-sizing: border-box;
  position: absolute;
  left: 34px;
  top: 96px;
  width: 272px;
  height: 184px;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  pointer-events: auto;
  background: #ffffff;
  transform-origin: 50% 100%;
  transform:
    translate(calc(var(--gf-jx) + var(--gf-slot) * var(--gf-spread)), calc(var(--gf-lift) + var(--gf-depth) * var(--gf-stack) * -1))
    rotate(calc(var(--gf-jr) + var(--gf-slot) * var(--gf-fan)));
  transition:
    transform .75s var(--gf-spring) calc(var(--gf-depth) * 40ms),
    box-shadow .4s var(--gf-ease),
    translate .9s var(--gf-ease),
    opacity .9s var(--gf-ease);
}
.gf-root[data-tone="dark"] .gf-sheet { background: #2c2c30; }
.gf-sheet--art { background: #1a1a1d; }
.gf-root[data-open] .gf-sheet:hover,
.gf-root[data-open] .gf-sheet:focus-visible {
  transform:
    translate(calc(var(--gf-jx) + var(--gf-slot) * var(--gf-spread)), calc(var(--gf-lift) + var(--gf-depth) * var(--gf-stack) * -1 - 18px))
    rotate(calc(var(--gf-slot) * var(--gf-fan) * .6));
  transition-delay: 0s;
}
.gf-sheet:focus-visible { outline: 2px solid #4c8dff; outline-offset: 2px; }
.gf-sheet-art {
  position: absolute;
  left: 0;
  top: 0;
  width: 272px;
  height: 184px;
  max-width: none;
  object-fit: cover;
  transition: opacity .9s var(--gf-ease), filter .9s var(--gf-ease);
}
canvas.gf-sheet-art { opacity: 0; filter: blur(10px); }
canvas.gf-sheet-art[data-ready] { opacity: 1; filter: none; }
.gf-sheet--art::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(0, 0, 0, .22);
  pointer-events: none;
}
.gf-sheet-head {
  position: absolute;
  left: 14px;
  right: 14px;
  top: 11px;
  z-index: 1;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  white-space: nowrap;
}
.gf-sheet-name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12.5px;
  font-weight: 560;
  letter-spacing: -.005em;
  color: #18181b;
}
.gf-sheet-meta {
  flex: none;
  font-family: inherit;
  font-size: 10px;
  letter-spacing: .02em;
  color: rgba(24, 24, 27, .5);
}
.gf-root[data-tone="dark"] .gf-sheet-name, .gf-sheet--art .gf-sheet-name { color: #fafafa; }
.gf-root[data-tone="dark"] .gf-sheet-meta, .gf-sheet--art .gf-sheet-meta { color: rgba(250, 250, 250, .66); }
.gf-lines {
  position: absolute;
  left: 14px;
  right: 14px;
  top: 40px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.gf-lines i {
  display: block;
  height: 5px;
  border-radius: 3px;
  background: rgba(24, 24, 27, .08);
}
.gf-lines i:first-child { height: 9px; margin-bottom: 4px; background: rgba(24, 24, 27, .14); }
.gf-root[data-tone="dark"] .gf-lines i { background: rgba(255, 255, 255, .08); }
.gf-root[data-tone="dark"] .gf-lines i:first-child { background: rgba(255, 255, 255, .16); }

.gf-sheet--drop { animation: gf-drop .85s var(--gf-ease) both; }
@keyframes gf-drop {
  0% { translate: 0 -190px; rotate: -9deg; opacity: 0; }
  35% { opacity: 1; }
  72% { translate: 0 10px; rotate: 1deg; }
  100% { translate: 0 0; rotate: 0deg; opacity: 1; }
}

/* ---- front glass ----------------------------------------------------------- */
.gf-front {
  position: absolute;
  left: 0;
  top: 74px;
  width: 340px;
  height: 198px;
  z-index: 10;
  transform-origin: 50% 100%;
  transform: perspective(760px) rotateX(var(--gf-hinge));
  transition: transform .8s var(--gf-spring), translate 1s var(--gf-ease), opacity 1s var(--gf-ease);
}
.gf-front--bump { animation: gf-bump .7s var(--gf-ease) .38s both; }
@keyframes gf-bump {
  0% { scale: 1; }
  35% { scale: 1.018 .975; }
  70% { scale: .996 1.006; }
  100% { scale: 1; }
}
.gf-tint {
  position: absolute;
  inset: 0;
  background: rgba(246, 246, 244, .92);
}
.gf-root[data-tone="dark"] .gf-tint {
  background: rgba(28, 28, 32, .94);
}
.gf-spec {
  position: absolute;
  inset: 0;
  background: transparent;
  opacity: 0;
  pointer-events: none;
}
.gf-root[data-tone="dark"] .gf-spec { mix-blend-mode: screen; opacity: .16; }
.gf-front-rim { width: 340px; height: 198px; }
.gf-front-rim path { stroke-width: 2.4; transition: stroke-width .3s var(--gf-ease); }
.gf-root[data-tone="dark"] .gf-front-rim { opacity: .55; }

.gf-hit {
  all: unset;
  position: absolute;
  inset: 0;
  z-index: 1;
  cursor: pointer;
}
.gf-hit:focus-visible ~ .gf-label .gf-title { text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 4px; }
.gf-front:has(.gf-hit:focus-visible) .gf-front-rim path { stroke-width: 5; }

.gf-label {
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 200px;
  pointer-events: none;
  color: var(--gf-ink);
}
.gf-root[data-place="bottom-left"] .gf-label { left: 28px; bottom: 32px; }
.gf-root[data-place="top-left"] .gf-label { left: 28px; top: 34px; }
.gf-root[data-place="top-right"] .gf-label { right: 32px; top: 52px; align-items: flex-start; }
.gf-title {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: -.012em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gf-meta {
  font-family: inherit;
  font-size: 12px;
  letter-spacing: .03em;
  color: var(--gf-ink-soft);
  white-space: nowrap;
  animation: gf-roll .5s var(--gf-ease) both;
}
@keyframes gf-roll {
  from { opacity: 0; translate: 0 7px; filter: blur(3px); }
  to { opacity: 1; translate: 0 0; filter: blur(0); }
}

/* ---- the key: + or Â·Â·Â· ------------------------------------------------------ */
.gf-key {
  all: unset;
  box-sizing: border-box;
  position: absolute;
  right: 22px;
  bottom: 22px;
  z-index: 12;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform .35s var(--gf-spring), box-shadow .35s var(--gf-ease), background .35s var(--gf-ease);
}
.gf-key:hover { transform: translateY(-2px); }
.gf-key:active { transform: translateY(0) scale(.93); transition-duration: .12s; }
.gf-key:focus-visible { outline: 2px solid #4c8dff; outline-offset: 3px; }
.gf-key--add {
  color: #fff;
  background: #18181b;
}
.gf-root[data-tone="dark"] .gf-key--add {
  color: #111113;
  background: #f5f5f7;
}
.gf-key--more {
  color: #111113;
  background: #f0f0f1;
}
.gf-root[data-tone="dark"] .gf-key--more {
  color: #f5f5f7;
  background: #303036;
}
.gf-key--more[aria-expanded="true"] { transform: scale(.96); }
.gf-glyph { display: block; max-width: none; fill: none; stroke: currentColor; stroke-linecap: round; }
.gf-glyph--plus { width: 26px; height: 26px; stroke-width: 1.6; animation: gf-turn .6s var(--gf-spring); }
.gf-glyph--more { width: 30px; height: 12px; stroke-width: 1.7; }
@keyframes gf-turn { from { rotate: -90deg; } to { rotate: 0deg; } }

/* ---- menu ------------------------------------------------------------------- */
.gf-menu {
  position: absolute;
  right: 22px;
  bottom: 90px;
  z-index: 20;
  min-width: 176px;
  padding: 6px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  background: rgba(252, 252, 253, .72);
  -webkit-backdrop-filter: blur(24px) saturate(1.6);
  backdrop-filter: blur(24px) saturate(1.6);
  border: 1px solid rgba(0, 0, 0, .14);
  transform-origin: 100% 100%;
  opacity: 0;
  visibility: hidden;
  transform: translateY(6px) scale(.94);
  transition: opacity .2s var(--gf-ease), transform .32s var(--gf-spring), visibility 0s .32s;
}
.gf-menu[data-open] { opacity: 1; visibility: visible; transform: none; transition-delay: 0s; }
.gf-root[data-tone="dark"] .gf-menu { background: rgba(30, 30, 34, .72); border-color: rgba(255, 255, 255, .14); }
.gf-menu-item {
  all: unset;
  box-sizing: border-box;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 450;
  color: #18181b;
  cursor: pointer;
}
.gf-root[data-tone="dark"] .gf-menu-item { color: #f4f4f5; }
.gf-menu-item:hover, .gf-menu-item:focus-visible { background: rgba(24, 24, 27, .07); }
.gf-root[data-tone="dark"] .gf-menu-item:hover, .gf-root[data-tone="dark"] .gf-menu-item:focus-visible { background: rgba(255, 255, 255, .09); }
.gf-menu-item--danger { color: #d92d20; }
.gf-root[data-tone="dark"] .gf-menu-item--danger { color: #ff6b5e; }

/* ---- entrance: the folder assembles itself ---------------------------------- */
.gf-root:not([data-entered]) .gf-back,
.gf-root:not([data-entered]) .gf-back-rim { translate: 0 22px; opacity: 0; }
.gf-root:not([data-entered]) .gf-sheet { translate: 0 -120px; opacity: 0; }
.gf-root:not([data-entered]) .gf-front { translate: 0 46px; opacity: 0; }
.gf-root:not([data-entered]) .gf-key { opacity: 0; scale: .6; }
.gf-root:not([data-entered]) .gf-shadow { opacity: 0; }
.gf-back, .gf-back-rim { transition: translate 1s var(--gf-ease), opacity .9s var(--gf-ease); }
.gf-root[data-entered] .gf-sheet { transition-delay: calc(var(--gf-depth) * 40ms), 0s, calc(.18s + var(--gf-depth) * 90ms), calc(.18s + var(--gf-depth) * 90ms); }
.gf-root[data-entered] .gf-front { transition-delay: 0s, .42s, .42s; }
.gf-key { transition: transform .35s var(--gf-spring), box-shadow .35s var(--gf-ease), opacity .6s var(--gf-ease) .7s, scale .7s var(--gf-spring) .7s; }

@media (prefers-reduced-motion: reduce) {
  .gf-root *, .gf-root *::before, .gf-root *::after {
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    animation: none !important;
  }
  .gf-tilt { transform: none; }
}
`
