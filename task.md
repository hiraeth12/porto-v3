Add an animated background to my Next.js (App Router) portfolio, placed directly after the "Signature" section on the page.

Project context:

- Next.js App Router with TypeScript, Tailwind-compatible setup
- Layout is in app/layout.tsx, global styles in app/globals.css
- Font: Geist via next/font
- body and html have data-loading="true" set in layout.tsx

Find the component or section named "Signature" and insert the new background right after it, without changing the surrounding markup or layout.

Requirements:

1. Style: NOT blobs, NOT gradient orbs, NOT morphing shapes. Use a minimal, geometric, or technical look such as a subtle dot grid with slow drift, faint moving scan lines, or sparse drifting points. Keep it understated so it supports the content.
2. Performance is the top priority. It must have minimal impact on page load and runtime:
   - Prefer pure CSS (transform and opacity animations only, no layout or paint-heavy properties like top, left, width, or filter on large areas).
   - If canvas is required, cap the particle count (about 30 to 50 max), use requestAnimationFrame, and cap DPR at 1.5.
   - No new npm dependencies. Use only what is already in the project.
   - Pause the animation when the section is off-screen (IntersectionObserver) and when the tab is hidden (document.visibilitychange).
   - Clean up listeners and animation frames on unmount.
3. Accessibility: respect prefers-reduced-motion by disabling or freezing the animation.
4. Layout safety: position it absolute or fixed inside a relative wrapper, with pointer-events: none, aria-hidden="true", and a negative z-index or a z-index below the content. It must not cause horizontal scroll, layout shift, or block clicks.
5. Theme: works in both light and dark mode using CSS variables or the existing color tokens. Use a very low contrast for lines or dots.
6. Make it a client component ("use client") only if needed, and keep it in its own file (for example components/SectionBackground.tsx) so it's easy to remove or tweak.
7. Expose a few simple props or CSS variables (color, speed, density) at the top of the file so I can adjust them without digging into the code.

Deliverables:

- The new background component file
- The minimal change needed to render it after the Signature section
- Any CSS added to globals.css (keep it scoped, with a clear class name prefix)
- A short note explaining the performance choices and how to disable it

Do not refactor unrelated code.
