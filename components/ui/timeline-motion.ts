"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type RefObject,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

const MONTH_ORDER = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
} as const;

export type Month = keyof typeof MONTH_ORDER;

export type JourneyImage = {
  src: string;
  alt: string;
  /** Optional CSS object-position, used to keep the subject inside the crop. */
  position?: string;
};

export type JourneyItem = {
  id: string;
  year: string;
  month: Month;
  content: string;
  image?: JourneyImage;
};

type SplitTextInstance = InstanceType<typeof SplitText>;

export const topJourneyData: JourneyItem[] = [
  {
    id: "2022-august",
    year: "2022",
    month: "August",
    content: "Began my undergraduate journey at Telkom University.",
    image: {
      src: "/timeline/timeline-1.webp",
      alt: "New students in maroon blazers posing together on campus during orientation",
      position: "center 68%",
    },
  },
  {
    id: "2024-november",
    year: "2024",
    month: "November",
    content:
      "Served as Logistics Coordinator for a Python Fundamentals study group event.",
    image: {
      src: "/timeline/timeline-3.webp",
      alt: "Orange and chrome race car displayed under colorful studio lights",
      position: "center 58%",
    },
  },
  {
    id: "2025-august",
    year: "2025",
    month: "August",
    content: "Completed a Machine Learning internship at BRIN.",
    image: {
      src: "/timeline/timeline-5.webp",
      alt: "Machine Learning Internship at BRIN",
      position: "center 70%",
    },
  },
  {
    id: "2025-november",
    year: "2025",
    month: "November",
    content:
      "Participated in CONNECTION, a community service event in Sukamaju Village, Bandung.",
    image: {
      src: "/timeline/timeline-6.webp",
      alt: "Orange race car taking a tight corner, seen head-on",
      position: "center 42%",
    },
  },
  {
    id: "2026-may",
    year: "2026",
    month: "May",
    content:
      "Concluded my journey with the Intelligent Systems and Machine Learning Laboratory.",
    image: {
      src: "/timeline/timeline-9.webp",
      alt: "Event Coordinator for Study Group : Introduction to Artificial Intelligence Event",
      position: "center 15%",
    },
  },
];

export const bottomJourneyData: JourneyItem[] = [
  {
    id: "2024-june",
    year: "2024",
    month: "June",
    content:
      "Served as a Teaching Assistant and Inventory Officer at SEA Laboratory.",
    image: {
      src: "/timeline/timeline-2.webp",
      alt: "Lab members posing together in front of a whiteboard with a large monitor and a 3D printer",
      position: "center 58%",
    },
  },
  {
    id: "2025-june",
    year: "2025",
    month: "June",
    content:
      "Concluded my role as a Teaching Assistant & Inventory Officer at SEA Laboratory.",
    image: {
      src: "/timeline/timeline-4.webp",
      alt: "Partways with SEA Laboratory",
      position: "center 10%",
    },
  },
  {
    id: "2025-july",
    year: "2025",
    month: "July",
    content:
      "Joined the Intelligent Systems and Machine Learning Laboratory as Research Coordinator.",
    image: {
      src: "/timeline/timeline-7.webp",
      alt: "Intelligent System and Machine Learning LAB as a Research Coordinator",
      position: "center 68%",
    },
  },
  {
    id: "2026-april",
    year: "2026",
    month: "April",
    content:
      "Organized an Introduction to Artificial Intelligence study group as Event Coordinator.",
    image: {
      src: "/timeline/timeline-8.webp",
      alt: "Event Coordinator for Study Group : Introduction to Artificial Intelligence Event",
      position: "center 25%",
    },
  },
];

const topJourneyIds = new Set(topJourneyData.map((item) => item.id));

const allJourneyItems: JourneyItem[] = [
  ...topJourneyData,
  ...bottomJourneyData,
].sort((a, b) => {
  const yearDiff = Number(a.year) - Number(b.year);
  if (yearDiff !== 0) return yearDiff;
  return MONTH_ORDER[a.month] - MONTH_ORDER[b.month];
});

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQueryList.addEventListener("change", callback);
  return () => mediaQueryList.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches ?? false;
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );
}

function useGSAP(
  callback: () => void | (() => void),
  options?: {
    dependencies?: unknown[];
    scope?: { current: Element | null } | Element | null;
  },
) {
  const deps = options?.dependencies ?? [];
  const scope = options?.scope;

  useLayoutEffect(() => {
    const el =
      scope && typeof scope === "object" && "current" in scope
        ? scope.current
        : (scope as Element | null);

    let cleanup: (() => void) | undefined;
    const ctx = gsap.context(() => {
      const ret = callback();
      if (typeof ret === "function") cleanup = ret;
    }, el ?? undefined);

    return () => {
      ctx.revert();
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

type ItemScrollRange = {
  startPx: number;
  endPx: number;
};

type TimelineMetrics = {
  targetLineWidth: number;
  targetSlideX: number;
  ranges: ItemScrollRange[];
};

function computeTimelineMetrics(
  section: HTMLElement,
  sliderEl: HTMLDivElement | null,
  lineEndPct: number,
): TimelineMetrics {
  const track = section.querySelector<HTMLElement>(".journey-track");
  const trackRect = track?.getBoundingClientRect() ?? null;
  const nodeRects = allJourneyItems.map(
    (item) =>
      section.querySelector<HTMLElement>(`.j-node-${item.id}`)?.getBoundingClientRect() ??
      null,
  );
  const lastNodeRect = nodeRects[nodeRects.length - 1] ?? null;

  const targetLineWidth =
    trackRect && lastNodeRect
      ? Math.max(0, lastNodeRect.left + lastNodeRect.width / 2 - trackRect.left)
      : track?.offsetWidth ?? 0;

  if (track && targetLineWidth > 0) {
    track.style.width = `${targetLineWidth}px`;
  }

  const lastItem = allJourneyItems[allJourneyItems.length - 1];
  const lastCard = section
    .querySelector<HTMLElement>(`.title-${lastItem.id}`)
    ?.closest<HTMLElement>(".journey-card");

  let targetSlideX = -((sliderEl?.offsetWidth ?? 0) * 0.65);
  if (sliderEl && lastCard) {
    const sliderRect = sliderEl.getBoundingClientRect();
    const cardRect = lastCard.getBoundingClientRect();
    const cardRightRelative = cardRect.right - sliderRect.left;
    const viewportWidth = section.clientWidth || window.innerWidth;
    const rightMargin =
      viewportWidth < 600 ? viewportWidth * 0.08 : viewportWidth * 0.12;
    targetSlideX = Math.min(0, -(cardRightRelative - viewportWidth + rightMargin));
  }

  const totalWidth = Math.max(1, targetLineWidth);
  const ratios = nodeRects.map((nodeRect) => {
    if (!trackRect || !nodeRect) return 0;
    const nodeOffset = Math.max(
      0,
      nodeRect.left + nodeRect.width / 2 - trackRect.left,
    );
    return gsap.utils.clamp(0, 1, nodeOffset / totalWidth);
  });

  const lineEndScroll = Math.max(
    1,
    section.offsetHeight * (lineEndPct / 100) - window.innerHeight,
  );
  const sectionSpan = Math.max(1, section.offsetHeight - window.innerHeight);

  const ranges = ratios.map((ratio) => {
    const higherRatios = ratios
      .filter((r) => r > ratio + 1e-4)
      .sort((a, b) => a - b);
    const startPx = ratio * lineEndScroll;
    const maxEndPx =
      higherRatios.length > 0 ? higherRatios[0] * lineEndScroll : sectionSpan;
    const desiredDurationPx = Math.min(
      lineEndScroll * 0.125,
      Math.max(40, (maxEndPx - startPx) * 0.92),
    );
    return {
      startPx,
      endPx: Math.min(sectionSpan, startPx + desiredDurationPx),
    };
  });

  return { targetLineWidth, targetSlideX, ranges };
}

function setupInitialItemStates(
  titleSplits: Partial<Record<string, SplitTextInstance>>,
  descriptionSplits: Partial<Record<string, SplitTextInstance>>,
): void {
  allJourneyItems.forEach((item) => {
    const isTop = topJourneyIds.has(item.id);
    gsap.set(`.jl-${item.id}`, {
      scaleY: 0,
      transformOrigin: isTop ? "bottom center" : "top center",
    });
    gsap.set(`.jd-${item.id}`, { scale: 0, transformOrigin: "center center" });
    gsap.set(`.j-node-${item.id}`, {
      scale: 0,
      transformOrigin: "center center",
    });
    gsap.set(`.title-${item.id}`, { opacity: 1 });
    gsap.set(`.description-${item.id}`, { opacity: 1 });

    if (item.image) {
      gsap.set(`.jimg-${item.id}`, { autoAlpha: 0 });
      gsap.set(`.jimg-mask-${item.id}`, { yPercent: -100, force3D: true });
      gsap.set(`.jimg-media-${item.id}`, { yPercent: 100, force3D: true });
      gsap.set(`.jimg-${item.id} img`, {
        scale: 1.12,
        transformOrigin: "center center",
        force3D: true,
      });
    }

    titleSplits[item.id] = new SplitText(`.title-${item.id}`, {
      type: "lines",
      linesClass: "overflow-hidden pb-[0.12em] -mb-[0.12em]",
      mask: "lines",
    });
    descriptionSplits[item.id] = new SplitText(`.description-${item.id}`, {
      type: "lines",
      linesClass: "overflow-hidden pb-[0.12em] -mb-[0.12em]",
      mask: "lines",
    });

    gsap.set(titleSplits[item.id]?.lines || [], {
      yPercent: 120,
      autoAlpha: 0,
    });
    gsap.set(descriptionSplits[item.id]?.lines || [], {
      yPercent: 120,
      autoAlpha: 0,
    });
  });
}

function animateItemTimeline(params: {
  section: HTMLElement;
  item: JourneyItem;
  index: number;
  metricsRef: RefObject<TimelineMetrics>;
  normalizedDuration: number;
  titleSplits: Partial<Record<string, SplitTextInstance>>;
  descriptionSplits: Partial<Record<string, SplitTextInstance>>;
}): void {
  const {
    section,
    item,
    index,
    metricsRef,
    normalizedDuration,
    titleSplits,
    descriptionSplits,
  } = params;
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: () =>
        `top+=${metricsRef.current.ranges[index]?.startPx ?? 0} top`,
      end: () =>
        `top+=${metricsRef.current.ranges[index]?.endPx ?? 0} top`,
      scrub: true,
      refreshPriority: 0,
    },
  });

  timeline
    .fromTo(
      `.j-node-${item.id}`,
      { scale: 0 },
      { scale: 1, duration: normalizedDuration * 0.2, ease: "back.out(1.7)" },
      0,
    )
    .fromTo(
      `.jl-${item.id}`,
      { scaleY: 0 },
      { scaleY: 1, duration: normalizedDuration * 0.4, ease: "power2.out" },
      0.12 * normalizedDuration,
    )
    .fromTo(
      `.jd-${item.id}`,
      { scale: 0 },
      { scale: 1, duration: normalizedDuration * 0.25, ease: "back.out(1.7)" },
      0.44 * normalizedDuration,
    )
    .fromTo(
      titleSplits[item.id]?.lines || [],
      { yPercent: 120, autoAlpha: 0 },
      {
        yPercent: 0,
        autoAlpha: 1,
        duration: normalizedDuration * 0.5,
        stagger: 0.05,
        ease: "power3.out",
      },
      0.36 * normalizedDuration,
    );

  if (item.image) {
    timeline
      .fromTo(
        `.jimg-${item.id}`,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.001,
          ease: "none",
        },
        0.42 * normalizedDuration,
      )
      .fromTo(
        `.jimg-mask-${item.id}`,
        { yPercent: -100 },
        {
          yPercent: 0,
          duration: normalizedDuration * 0.55,
          ease: "power3.out",
          force3D: true,
        },
        0.42 * normalizedDuration,
      )
      .fromTo(
        `.jimg-media-${item.id}`,
        { yPercent: 100 },
        {
          yPercent: 0,
          duration: normalizedDuration * 0.55,
          ease: "power3.out",
          force3D: true,
        },
        0.42 * normalizedDuration,
      )
      .fromTo(
        `.jimg-${item.id} img`,
        { scale: 1.12 },
        {
          scale: 1,
          duration: normalizedDuration * 0.7,
          ease: "power3.out",
          force3D: true,
        },
        0.42 * normalizedDuration,
      );
  }

  timeline.fromTo(
    descriptionSplits[item.id]?.lines || [],
    { yPercent: 120, autoAlpha: 0 },
    {
      yPercent: 0,
      autoAlpha: 1,
      duration: normalizedDuration * 0.5,
      stagger: 0.06,
      ease: "power3.out",
    },
    0.5 * normalizedDuration,
  );
}

export function useTimelineMotion(params: {
  sectionRef: RefObject<HTMLElement | null>;
  wholeSliderRef: RefObject<HTMLDivElement | null>;
  normalizedDuration: number;
  reducedMotion: boolean;
  layoutVersion: number;
  onWidthChange: () => void;
}): void {
  const {
    sectionRef,
    wholeSliderRef,
    normalizedDuration,
    reducedMotion,
    layoutVersion,
    onWidthChange,
  } = params;

  const metricsRef = useRef<TimelineMetrics>({
    targetLineWidth: 0,
    targetSlideX: 0,
    ranges: [],
  });

  useEffect(() => {
    let lastWidth = window.innerWidth;
    let timer: number | undefined;

    const handleResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const nextWidth = window.innerWidth;
        if (Math.abs(nextWidth - lastWidth) < 2) return;
        lastWidth = nextWidth;
        onWidthChange();
      }, 180);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [onWidthChange]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let decoded = false;
    const decodeImages = () => {
      if (decoded) return;
      decoded = true;
      section.querySelectorAll("img").forEach((img) => {
        if (typeof img.decode === "function") {
          img.decode().catch(() => {});
        }
      });
    };

    if (typeof IntersectionObserver === "undefined") {
      decodeImages();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          decodeImages();
          observer.disconnect();
        }
      },
      { rootMargin: "1200px 0px" },
    );
    observer.observe(section);

    return () => observer.disconnect();
  }, [sectionRef]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const sliderEl = wholeSliderRef.current;
      if (!section) return;

      const isMobile = window.innerWidth < 600;
      const lineEndPct = isMobile ? 88 : 86;

      const syncMetrics = () => {
        metricsRef.current = computeTimelineMetrics(
          section,
          sliderEl,
          lineEndPct,
        );
      };

      syncMetrics();
      ScrollTrigger.addEventListener("refreshInit", syncMetrics);

      const slider = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
          refreshPriority: 0,
        },
        defaults: { ease: "none" },
      });

      slider.fromTo(
        sliderEl,
        { x: 0, force3D: true },
        { x: () => metricsRef.current.targetSlideX, force3D: true },
      );

      if (reducedMotion) {
        gsap.set(".journey-line", {
          scaleX: 1,
          transformOrigin: "left center",
          force3D: true,
        });
        gsap.set(".journey-end-dot-pos", {
          x: () => metricsRef.current.targetLineWidth,
          force3D: true,
        });
        gsap.set(".journey-end-dot", { scale: 1 });
        return () => {
          ScrollTrigger.removeEventListener("refreshInit", syncMetrics);
        };
      }

      gsap.set(".journey-line", {
        scaleX: 0,
        transformOrigin: "left center",
        force3D: true,
      });
      gsap.set(".journey-end-dot-pos", { x: 0, force3D: true });
      gsap.set(".journey-end-dot", {
        scale: 0,
        transformOrigin: "center center",
      });

      gsap.to(".journey-end-dot", {
        scale: 1,
        duration: 0.2,
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "3% top",
          scrub: true,
        },
      });

      const axisTrigger = {
        trigger: section,
        start: "top top",
        end: isMobile ? "88% bottom" : "86% bottom",
        scrub: true,
        invalidateOnRefresh: true,
        refreshPriority: 0,
      };

      gsap.fromTo(
        ".journey-line",
        { scaleX: 0, force3D: true },
        {
          scaleX: 1,
          ease: "none",
          force3D: true,
          scrollTrigger: axisTrigger,
        },
      );

      gsap.fromTo(
        ".journey-end-dot-pos",
        { x: 0, force3D: true },
        {
          x: () => metricsRef.current.targetLineWidth,
          ease: "none",
          force3D: true,
          scrollTrigger: axisTrigger,
        },
      );

      return () => {
        ScrollTrigger.removeEventListener("refreshInit", syncMetrics);
      };
    },
    { dependencies: [reducedMotion, layoutVersion], scope: sectionRef },
  );

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      if (reducedMotion) {
        allJourneyItems.forEach((item) => {
          gsap.set(`.jl-${item.id}`, { scaleY: 1 });
          gsap.set(`.jd-${item.id}`, { scale: 1 });
          gsap.set(`.j-node-${item.id}`, { scale: 1 });
          gsap.set(`.title-${item.id}`, {
            opacity: 1,
            clearProps: "transform",
          });
          gsap.set(`.description-${item.id}`, {
            opacity: 1,
            clearProps: "transform",
          });
          if (item.image) {
            gsap.set(`.jimg-${item.id}`, { autoAlpha: 1 });
            gsap.set([`.jimg-mask-${item.id}`, `.jimg-media-${item.id}`], {
              yPercent: 0,
            });
            gsap.set(`.jimg-${item.id} img`, { scale: 1 });
          }
        });
        ScrollTrigger.refresh();
        return;
      }

      const titleSplits: Partial<Record<string, SplitTextInstance>> = {};
      const descriptionSplits: Partial<Record<string, SplitTextInstance>> = {};
      setupInitialItemStates(titleSplits, descriptionSplits);

      allJourneyItems.forEach((item, index) => {
        animateItemTimeline({
          section,
          item,
          index,
          metricsRef,
          normalizedDuration,
          titleSplits,
          descriptionSplits,
        });
      });

      ScrollTrigger.sort();
      ScrollTrigger.refresh();

      let lastBodyHeight = document.body.scrollHeight;
      let resizeTimer: number | undefined;
      const ro =
        typeof ResizeObserver !== "undefined"
          ? new ResizeObserver(() => {
              const nextHeight = document.body.scrollHeight;
              if (Math.abs(nextHeight - lastBodyHeight) > 2) {
                lastBodyHeight = nextHeight;
                window.clearTimeout(resizeTimer);
                resizeTimer = window.setTimeout(() => {
                  ScrollTrigger.refresh();
                }, 120);
              }
            })
          : null;
      ro?.observe(document.body);

      return () => {
        window.clearTimeout(resizeTimer);
        ro?.disconnect();
        Object.values(titleSplits).forEach((split) => split?.revert?.());
        Object.values(descriptionSplits).forEach((split) => split?.revert?.());
      };
    },
    {
      dependencies: [normalizedDuration, reducedMotion, layoutVersion],
      scope: sectionRef,
    },
  );
}
