"use client";

import { useLayoutEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface MeasuredSignatureElements {
  bodyPath: SVGPathElement | null;
  sPath: SVGPathElement | null;
  flourishPath: SVGPathElement | null;
  dots: NodeListOf<SVGCircleElement>;
  metaEl: HTMLDivElement | null;
  lengths: number[];
}

function measureAndResetSignature(
  svg: SVGSVGElement,
  backdropEl: HTMLDivElement,
  foregroundViewport: HTMLDivElement,
): MeasuredSignatureElements {
  const bodyPath = svg.querySelector<SVGPathElement>(".stroke-body");
  const sPath = svg.querySelector<SVGPathElement>(".stroke-s");
  const flourishPath = svg.querySelector<SVGPathElement>(".stroke-flourish");
  const dots = svg.querySelectorAll<SVGCircleElement>(".ink-dot");

  const paths = [bodyPath, sPath, flourishPath].filter(Boolean) as SVGPathElement[];
  const lengths: number[] = [];
  paths.forEach((p) => {
    const len = p.getTotalLength();
    lengths.push(len);
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len}`;
  });

  dots.forEach((d) => {
    gsap.set(d, { opacity: 0, scale: 0, transformOrigin: "center center" });
  });

  const metaEl = backdropEl.querySelector<HTMLDivElement>(".signature-backdrop-meta");
  gsap.set(svg, { opacity: 0 });
  if (metaEl) {
    gsap.set(metaEl, { opacity: 0 });
  }
  gsap.set(foregroundViewport, { "--sh-mute-opacity": 0, opacity: 1 });

  return { bodyPath, sPath, flourishPath, dots, metaEl, lengths };
}

function buildSignatureTimeline(params: {
  heroRoot: HTMLElement;
  foregroundViewport: HTMLDivElement;
  foregroundCopy: HTMLDivElement | null;
  svg: SVGSVGElement;
  elements: MeasuredSignatureElements;
  isDesktop: boolean;
}): void {
  const { heroRoot, foregroundViewport, foregroundCopy, svg, elements, isDesktop } = params;
  const endScale = isDesktop ? 0.44 : 0.62;
  const endRadius = isDesktop ? 24 : 18;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: heroRoot,
      start: "top top",
      end: "+=1800",
      scrub: true,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      refreshPriority: 1,
      invalidateOnRefresh: true,
    },
  });

  tl.to(
    foregroundViewport,
    { scale: endScale, borderRadius: `${endRadius}px`, duration: 0.55, ease: "power1.inOut" },
    0,
  );
  tl.to(
    foregroundViewport,
    { "--sh-mute-opacity": 1, opacity: 0.78, duration: 0.6, ease: "power2.inOut" },
    0.18,
  );

  if (foregroundCopy) {
    tl.to(foregroundCopy, { opacity: 0, y: 24, duration: 0.28, ease: "power1.out" }, 0.04);
  }
  if (elements.metaEl) {
    tl.to(elements.metaEl, { opacity: 0.55, duration: 0.2, ease: "power1.out" }, 0.24);
  }

  tl.to(svg, { opacity: 1, duration: 0.06, ease: "none" }, 0.2);

  if (elements.bodyPath && elements.lengths[0]) {
    tl.to(elements.bodyPath, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, 0.22);
  }
  if (elements.sPath && elements.lengths[1]) {
    tl.to(elements.sPath, { strokeDashoffset: 0, duration: 0.3, ease: "none" }, 0.38);
  }
  if (elements.flourishPath && elements.lengths[2]) {
    tl.to(elements.flourishPath, { strokeDashoffset: 0, duration: 0.22, ease: "none" }, 0.56);
  }
  if (elements.dots.length > 0) {
    tl.to(
      elements.dots,
      { opacity: 1, scale: 1, duration: 0.08, stagger: 0.03, ease: "none" },
      0.74,
    );
  }
  tl.to({}, { duration: 0.16 }, 0.84);
}

export function useSignatureHeroScroll(params: {
  backdropContainerRef: RefObject<HTMLDivElement | null>;
  signatureRef: RefObject<SVGSVGElement | null>;
  heroRootRef?: RefObject<HTMLElement | null>;
  foregroundViewportRef?: RefObject<HTMLDivElement | null>;
  foregroundCopyRef?: RefObject<HTMLDivElement | null>;
}): void {
  const {
    backdropContainerRef,
    signatureRef,
    heroRootRef,
    foregroundViewportRef,
    foregroundCopyRef,
  } = params;

  useLayoutEffect(() => {
    const svg = signatureRef.current;
    const backdropEl = backdropContainerRef.current;
    if (!svg || !backdropEl) return;

    const heroRoot =
      heroRootRef?.current || (backdropEl.closest(".sh-root") as HTMLElement | null);
    const foregroundViewport =
      foregroundViewportRef?.current ||
      (heroRoot?.querySelector(".sh-viewport") as HTMLDivElement | null);
    const foregroundCopy =
      foregroundCopyRef?.current ||
      (heroRoot?.querySelector(".sh-content") as HTMLDivElement | null);

    if (!heroRoot || !foregroundViewport) return;

    const elements = measureAndResetSignature(svg, backdropEl, foregroundViewport);

    const ctx = gsap.context(() => {
      gsap.matchMedia().add(
        {
          isDesktop: "(min-width: 768px)",
          isMobile: "(max-width: 767px)",
        },
        (context) => {
          buildSignatureTimeline({
            heroRoot,
            foregroundViewport,
            foregroundCopy,
            svg,
            elements,
            isDesktop: Boolean(context.conditions?.isDesktop),
          });
        },
      );
    }, heroRoot);

    ScrollTrigger.sort();
    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, [backdropContainerRef, signatureRef, heroRootRef, foregroundViewportRef, foregroundCopyRef]);
}
