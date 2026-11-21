export type DocumentKind = "pdf" | "image"
export type ExplorerItemKind = DocumentKind | "project"

export type ViewerDocument = {
  src: string
  name: string
  kind: DocumentKind
  meta?: string
}

const IMAGE_EXT_REGEX = /\.(jpe?g|png|webp|avif)$/i
const PDF_EXT_REGEX = /\.pdf$/i
const PROJECT_ROUTE_REGEX = /^\/project\/[^/?#]+/i

/**
 * Resolves whether a given file URL should be opened inside the interactive
 * document viewer as a PDF or raster image. Queries and hashes are stripped
 * before matching the extension.
 */
export function resolveDocumentKind(src?: string): DocumentKind | null {
  if (!src) return null
  const cleanPath = src.split(/[?#]/)[0].trim()
  if (PDF_EXT_REGEX.test(cleanPath)) return "pdf"
  if (IMAGE_EXT_REGEX.test(cleanPath)) return "image"
  return null
}

/**
 * Resolves whether an explorer item is a PDF document, raster image, or
 * dedicated Project Showcase route.
 */
export function resolveExplorerItemKind(
  src?: string,
  explicitKind?: ExplorerItemKind,
): ExplorerItemKind | null {
  if (explicitKind === "project" || explicitKind === "pdf" || explicitKind === "image") {
    return explicitKind
  }
  if (!src) return null
  const cleanPath = src.split(/[?#]/)[0].trim()
  if (PROJECT_ROUTE_REGEX.test(cleanPath)) return "project"
  return resolveDocumentKind(cleanPath)
}

/**
 * Extracts a clean download filename from a source path or falls back to a
 * slugified document title with the appropriate extension.
 */
export function fileNameFromSrc(
  src: string,
  fallbackName?: string,
  kind?: ExplorerItemKind,
): string {
  const cleanPath = src.split(/[?#]/)[0].trim()
  const lastSegment = cleanPath.split("/").filter(Boolean).pop()
  if (kind === "project") {
    const slugBase = (lastSegment || fallbackName || "project")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
    return `${slugBase || "project"}.project`
  }
  if (lastSegment && /\.[a-z0-9]{2,5}$/i.test(lastSegment)) {
    return decodeURIComponent(lastSegment)
  }
  const ext = kind === "pdf" ? ".pdf" : ".jpg"
  const safeBase = (fallbackName || "document")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return `${safeBase || "document"}${ext}`
}
