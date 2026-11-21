"use client";

/**
 * Lenis smooth-scrolling provider.
 *
 * Initialises Lenis once at the layout level and synchronises it with
 * GSAP's ticker so ScrollTrigger stays perfectly in phase.
 *
 * Usage: wrap {children} in <LenisProvider> inside layout.tsx or page.tsx.
 */

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function resolveHashTarget(rawHash: string): HTMLElement | null {
  const id = decodeURIComponent(rawHash.replace(/^#/, "")).trim();
  if (!id) return null;
  if (id === "work" || id === "folders") {
    return (
      document.getElementById("work") ?? document.getElementById("folders")
    );
  }
  return document.getElementById(id);
}

function jumpToHashTarget(lenis: Lenis | null): boolean {
  if (typeof window === "undefined" || !window.location.hash) return false;
  const target = resolveHashTarget(window.location.hash);
  if (!target) return false;

  ScrollTrigger.refresh();
  const firstY = Math.max(
    0,
    Math.round(target.getBoundingClientRect().top + window.scrollY),
  );
  window.scrollTo({ top: firstY, left: 0, behavior: "instant" });
  ScrollTrigger.update();

  const secondY = Math.max(
    0,
    Math.round(target.getBoundingClientRect().top + window.scrollY),
  );
  if (Math.abs(secondY - window.scrollY) > 2) {
    window.scrollTo({ top: secondY, left: 0, behavior: "instant" });
    ScrollTrigger.update();
  }

  if (lenis) {
    lenis.scrollTo(secondY, { immediate: true, force: true });
  }
  return true;
}

export default function LenisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      smoothWheel: true,
      lerp: 0.08,
    });
    lenisRef.current = lenis;

    let wasLoading =
      document.documentElement.dataset.loading === "true" ||
      document.body.dataset.loading === "true";

    const syncLock = () => {
      const isLoading =
        document.documentElement.dataset.loading === "true" ||
        document.body.dataset.loading === "true";
      const isOverlayLocked =
        document.documentElement.dataset.scrollLock === "true";
      if (isLoading) {
        lenis.stop();
        if (!window.location.hash) {
          window.scrollTo(0, 0);
        } else {
          jumpToHashTarget(lenis);
        }
      } else if (isOverlayLocked) {
        lenis.stop();
      } else {
        lenis.start();
        if (wasLoading && window.location.hash) {
          jumpToHashTarget(lenis);
          window.requestAnimationFrame(() => {
            jumpToHashTarget(lenis);
          });
        }
      }
      wasLoading = isLoading;
    };

    syncLock();

    const rafId = window.requestAnimationFrame(() => {
      if (window.location.hash) {
        jumpToHashTarget(lenis);
      }
    });

    const onHashChange = () => {
      jumpToHashTarget(lenis);
    };
    window.addEventListener("hashchange", onHashChange);

    const observer = new MutationObserver(syncLock);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-loading", "data-scroll-lock"],
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-loading", "data-scroll-lock"],
    });

    // Keep ScrollTrigger in sync with Lenis
    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);

    gsap.ticker.lagSmoothing(0);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("hashchange", onHashChange);
      observer.disconnect();
      gsap.ticker.remove(onTick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
