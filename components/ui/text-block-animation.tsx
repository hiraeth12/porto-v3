"use client";

import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(SplitText, ScrollTrigger);
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(reducedMotionQuery);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(reducedMotionQuery).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export interface TextBlockAnimationProps {
  children: ReactNode;
  animateOnScroll?: boolean;
  delay?: number;
  blockColor?: string;
  stagger?: number;
  duration?: number;
  className?: string;
}

export default function TextBlockAnimation({
  children,
  animateOnScroll = true,
  delay = 0,
  blockColor = "var(--portfolio-ink)",
  stagger = 0.08,
  duration = 0.55,
  className,
}: TextBlockAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion) return;

    const target =
      container.querySelector<HTMLElement>("h1, h2, h3, h4, h5, h6, p") ??
      container;

    let split: InstanceType<typeof SplitText> | null = null;
    const wrappers: Array<{ wrapper: HTMLDivElement; line: HTMLElement }> = [];

    const ctx = gsap.context(() => {
      split = new SplitText(target, {
        type: "lines",
        linesClass: "block-line-parent",
      });

      const lines = (split.lines ?? []) as HTMLElement[];
      if (!lines.length) return;

      const blocks: HTMLDivElement[] = [];

      lines.forEach((line) => {
        const wrapper = document.createElement("div");
        wrapper.className = "text-block-line-wrap";
        wrapper.style.position = "relative";
        wrapper.style.display = "block";
        wrapper.style.overflow = "hidden";
        wrapper.style.paddingBlock = "0.08em";
        wrapper.style.marginBlock = "-0.08em";

        const block = document.createElement("div");
        block.className = "text-block-revealer";
        block.setAttribute("aria-hidden", "true");
        block.style.position = "absolute";
        block.style.inset = "0";
        block.style.backgroundColor = blockColor;
        block.style.zIndex = "2";
        block.style.transform = "scaleX(0)";
        block.style.transformOrigin = "left center";
        block.style.pointerEvents = "none";
        block.style.willChange = "transform";

        line.parentNode?.insertBefore(wrapper, line);
        wrapper.appendChild(line);
        wrapper.appendChild(block);

        gsap.set(line, { opacity: 0, yPercent: 14 });

        wrappers.push({ wrapper, line });
        blocks.push(block);
      });

      const tl = gsap.timeline({
        defaults: { ease: "expo.inOut" },
        scrollTrigger: animateOnScroll
          ? {
              trigger: container,
              start: "top 86%",
              end: "bottom 12%",
              toggleActions: "play none none reverse",
            }
          : undefined,
        delay,
      });

      tl.to(blocks, {
        scaleX: 1,
        duration,
        stagger,
        transformOrigin: "left center",
      })
        .set(
          lines,
          {
            opacity: 1,
            stagger,
          },
          `<${duration * 0.48}`,
        )
        .to(
          lines,
          {
            yPercent: 0,
            duration: duration * 0.85,
            stagger,
            ease: "expo.out",
          },
          `<`,
        )
        .to(
          blocks,
          {
            scaleX: 0,
            duration,
            stagger,
            transformOrigin: "right center",
          },
          `<${duration * 0.35}`,
        );
    }, container);

    return () => {
      ctx.revert();
      wrappers.forEach(({ wrapper, line }) => {
        if (wrapper.parentNode) {
          wrapper.parentNode.insertBefore(line, wrapper);
          wrapper.remove();
        }
        gsap.set(line, { clearProps: "all" });
      });
      split?.revert();
    };
  }, [
    animateOnScroll,
    delay,
    blockColor,
    stagger,
    duration,
    prefersReducedMotion,
  ]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {children}
    </div>
  );
}
