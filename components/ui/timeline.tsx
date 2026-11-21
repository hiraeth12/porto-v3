"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import TextBlockAnimation from "@/components/ui/text-block-animation";
import {
  bottomJourneyData,
  topJourneyData,
  usePrefersReducedMotion,
  useTimelineMotion,
  type JourneyItem,
} from "./timeline-motion";

export type TimelineProps = {
  title?: string;
  periodLabel?: string;
  textColor?: string;
  mutedTextColor?: string;
  activeColor?: string;
  backgroundColor?: string;
  imageUrl?: string;
  imageAlt?: string;
  duration?: number;
  scrollDuration?: number;
};

function JourneyCard({
  item,
  position,
  activeStyle,
  mutedTextStyle,
}: {
  item: JourneyItem;
  position: "top" | "bottom";
  activeStyle: CSSProperties;
  mutedTextStyle: CSSProperties;
}) {
  const isTop = position === "top";

  return (
    <article
      className={
        isTop
          ? "journey-card relative flex h-full w-[var(--journey-card-w)] shrink-0 flex-col justify-start px-[var(--journey-card-px)] pb-[var(--journey-axis-space)] pt-[clamp(2px,0.4vw,8px)]"
          : "journey-card relative flex h-full w-[var(--journey-card-w)] shrink-0 flex-col justify-end px-[var(--journey-card-px)] pb-[clamp(2px,0.4vw,8px)] pt-[var(--journey-axis-space)]"
      }
    >
      <div
        className={
          isTop
            ? "pointer-events-none absolute bottom-0 left-0 top-[var(--journey-dot-offset)] w-0"
            : "pointer-events-none absolute bottom-[var(--journey-dot-offset)] left-0 top-0 w-0"
        }
        aria-hidden="true"
      >
        <div
          className={`jd-${item.id} absolute left-[-5px] ${isTop ? "top-[-5px]" : "bottom-[-5px]"} size-[10px] rounded-full`}
          style={activeStyle}
        />
        <div
          className={`jl-${item.id} absolute inset-y-0 left-[-1px] w-[2px] ${isTop ? "origin-bottom" : "origin-top"}`}
          style={activeStyle}
        />
        <div
          className={`j-node-${item.id} absolute left-[-4px] ${isTop ? "bottom-[-4px]" : "top-[-4px]"} size-[8px] rounded-full`}
          style={activeStyle}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-[var(--journey-stack-gap)]">
        <h3
          className={`title-${item.id} text-[clamp(1.25rem,1.75vw,1.875rem)] font-semibold leading-[1.12] tracking-[-0.025em] tabular-nums text-balance max-[600px]:text-[clamp(1.125rem,5.4vw,1.5rem)]`}
        >
          {item.year} {item.month}
        </h3>

        {item.image ? (
          <div
            className={`jimg-${item.id} relative h-[var(--journey-img-h)] w-full shrink-0 overflow-hidden rounded-[clamp(8px,0.8vw,14px)]`}
          >
            <div className={`jimg-mask-${item.id} h-full w-full overflow-hidden rounded-[clamp(8px,0.8vw,14px)]`}>
              <div className={`jimg-media-${item.id} h-full w-full overflow-hidden rounded-[clamp(8px,0.8vw,14px)]`}>
                <img
                  src={item.image.src}
                  alt={item.image.alt}
                  width={640}
                  height={360}
                  loading="eager"
                  decoding="async"
                  fetchPriority="low"
                  draggable={false}
                  className="block h-full w-full object-cover"
                  style={
                    item.image.position
                      ? { objectPosition: item.image.position }
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        ) : null}

        <p
          className={`description-${item.id} max-w-[36ch] text-[clamp(0.875rem,0.95vw,1.0625rem)] leading-[1.55] text-pretty max-[600px]:text-[clamp(0.875rem,3.8vw,1rem)]`}
          style={mutedTextStyle}
        >
          {item.content}
        </p>
      </div>
    </article>
  );
}

export default function Timeline({
  title = "Timeline",
  periodLabel = "2022 — 2026",
  textColor = "#ffffff",
  mutedTextColor = "#d4d4d8",
  activeColor = "#93c5fd",
  backgroundColor = "#09090b",
  imageUrl = "/timeline/cover-1.webp",
  imageAlt = "Sunlit studio workspace with a long desk and chairs",
  duration,
  scrollDuration = 1.2,
}: TimelineProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const wholeSliderRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [layoutVersion, setLayoutVersion] = useState(0);

  const normalizedDuration = Math.max(0.2, duration ?? scrollDuration);
  const sectionStyle: CSSProperties = { color: textColor, backgroundColor };
  const activeStyle: CSSProperties = { backgroundColor: activeColor };
  const mutedTextStyle: CSSProperties = { color: mutedTextColor };
  const bumpLayoutVersion = useCallback(() => {
    setLayoutVersion((version) => version + 1);
  }, []);

  useTimelineMotion({
    sectionRef,
    wholeSliderRef,
    normalizedDuration,
    reducedMotion,
    layoutVersion,
    onWidthChange: bumpLayoutVersion,
  });

  return (
    <section
      ref={sectionRef}
      id="journey"
      className="relative h-[165vw] w-full max-[600px]:h-[340vh]"
      style={sectionStyle}
      aria-labelledby="journey-title"
    >
      <div className="sticky top-0 flex h-[100svh] w-full items-center overflow-hidden max-[600px]:pt-[64px]">
        <div
          ref={wholeSliderRef}
          className={`flex h-[clamp(520px,76svh,760px)] w-max items-center gap-[clamp(28px,4.5vw,80px)] px-[clamp(24px,5vw,96px)] max-[600px]:h-[min(700px,max(440px,calc(100svh_-_88px)))] max-[600px]:gap-[clamp(20px,7vw,36px)] max-[600px]:px-[clamp(16px,7vw,32px)] ${reducedMotion ? "" : "will-change-transform"}`}
        >
          <div className="h-full w-[clamp(260px,26vw,440px)] shrink-0 overflow-hidden rounded-[clamp(10px,1vw,18px)] max-[600px]:h-[clamp(180px,32svh,260px)] max-[600px]:w-[clamp(240px,78vw,340px)] max-[600px]:rounded-[clamp(12px,4vw,18px)]">
            <img
              src={imageUrl}
              alt={imageAlt}
              width={1200}
              height={800}
              loading="eager"
              decoding="async"
              fetchPriority="low"
              draggable={false}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="relative h-full w-max shrink-0 [--journey-axis-space:clamp(20px,2.6vw,44px)] [--journey-card-px:clamp(16px,2vw,32px)] [--journey-card-w:clamp(240px,23vw,360px)] [--journey-dot-offset:clamp(10px,1vw,18px)] [--journey-gap:clamp(56px,8vw,148px)] [--journey-img-h:clamp(92px,14svh,150px)] [--journey-lead:clamp(170px,15vw,280px)] [--journey-stack-gap:clamp(10px,1vw,16px)] max-[600px]:[--journey-axis-space:clamp(16px,5vw,28px)] max-[600px]:[--journey-card-px:clamp(14px,5vw,24px)] max-[600px]:[--journey-card-w:clamp(220px,68vw,300px)] max-[600px]:[--journey-gap:clamp(36px,12vw,64px)] max-[600px]:[--journey-img-h:clamp(72px,12svh,112px)] max-[600px]:[--journey-lead:clamp(148px,42vw,200px)] max-[600px]:[--journey-stack-gap:clamp(8px,2.4vw,12px)]">
            <div
              className="pointer-events-none absolute left-0 top-1/2 z-10 flex h-[2px] w-full -translate-y-1/2 items-center"
              aria-hidden="true"
            >
              <div className="relative z-10 size-[10px] shrink-0 rounded-full" style={activeStyle} />
              <div className="journey-track relative flex h-[2px] w-full items-center">
                <div className="absolute inset-0 h-[2px] w-full rounded-full opacity-20" style={activeStyle} />
                <div className="journey-line relative h-[2px] w-full origin-left rounded-full will-change-transform" style={activeStyle} />
                <div className="journey-end-dot-pos absolute left-0 top-[-4px] z-10 -ml-[5px] size-[10px] will-change-transform">
                  <div className="journey-end-dot size-full rounded-full" style={activeStyle} />
                </div>
              </div>
            </div>

            <div className="flex h-1/2 w-max items-stretch">
              <div className="flex h-full w-[var(--journey-lead)] shrink-0 flex-col justify-start pr-[clamp(12px,1.5vw,24px)] pt-[clamp(4px,1vw,16px)]">
                <TextBlockAnimation>
                  <h2
                    id="journey-title"
                    className="max-w-[10ch] text-[clamp(2rem,3vw,3.25rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-balance max-[600px]:text-[clamp(1.75rem,8vw,2.25rem)]"
                  >
                    {title}
                  </h2>
                </TextBlockAnimation>
              </div>

              <div className="flex h-full gap-x-[var(--journey-gap)]">
                {topJourneyData.map((item) => (
                  <JourneyCard
                    key={`top-${item.id}`}
                    item={item}
                    position="top"
                    activeStyle={activeStyle}
                    mutedTextStyle={mutedTextStyle}
                  />
                ))}
              </div>
            </div>

            <div className="flex h-1/2 w-max items-stretch">
              <div className="flex h-full w-[calc(var(--journey-lead)_+_(var(--journey-card-w)_+_var(--journey-gap))_/_2)] shrink-0 flex-col justify-start pr-[clamp(12px,1.5vw,24px)] pt-[clamp(20px,2.4vw,40px)]">
                <TextBlockAnimation delay={0.12} duration={0.5} blockColor="var(--portfolio-muted)">
                  <p
                    className="text-[clamp(0.95rem,1.25vw,1.35rem)] font-medium leading-none tracking-[-0.02em] tabular-nums max-[600px]:text-[clamp(0.875rem,4vw,1.05rem)]"
                    style={mutedTextStyle}
                  >
                    {periodLabel}
                  </p>
                </TextBlockAnimation>
              </div>

              <div className="flex h-full gap-x-[var(--journey-gap)]">
                {bottomJourneyData.map((item) => (
                  <JourneyCard
                    key={`bottom-${item.id}`}
                    item={item}
                    position="bottom"
                    activeStyle={activeStyle}
                    mutedTextStyle={mutedTextStyle}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
