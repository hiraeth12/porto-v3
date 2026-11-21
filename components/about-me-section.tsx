"use client";

import { useCallback, useState, useSyncExternalStore, type CSSProperties } from "react";
import ProfileCard from "@/components/ui/profile-card";
import ScrollExpand from "@/components/ui/scroll-expand";

export interface AboutMeSectionProps {
  /** Active portfolio theme used to style the ProfileCard frame and controls. */
  theme: "light" | "dark";
  /** Optional contact handler overriding the default mailto action. */
  onContactClick?: () => void;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const MOBILE_VIEWPORT_QUERY = "(max-width: 767px)";

function subscribeMediaQuery(query: string, onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(query);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getMediaQuerySnapshot(query: string): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(query).matches;
}

function getMediaQueryServerSnapshot(): boolean {
  return false;
}

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeMediaQuery(query, onStoreChange),
    [query],
  );
  const getSnapshot = useCallback(() => getMediaQuerySnapshot(query), [query]);
  return useSyncExternalStore(subscribe, getSnapshot, getMediaQueryServerSnapshot);
}

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: EventTarget & { saveData?: boolean };
};

function subscribeConstrainedDevice(onStoreChange: () => void): () => void {
  if (typeof navigator === "undefined") return () => {};
  const conn = (navigator as NavigatorWithHints).connection;
  if (!conn || typeof conn.addEventListener !== "function") return () => {};
  conn.addEventListener("change", onStoreChange);
  return () => conn.removeEventListener("change", onStoreChange);
}

function getConstrainedDeviceSnapshot(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as NavigatorWithHints;
  const cores = nav.hardwareConcurrency ?? 0;
  const memory = nav.deviceMemory ?? 0;
  const saveData = Boolean(nav.connection?.saveData);
  return saveData || (cores > 0 && cores <= 2) || (memory > 0 && memory <= 2);
}

function useConstrainedDevice(): boolean {
  return useSyncExternalStore(
    subscribeConstrainedDevice,
    getConstrainedDeviceSnapshot,
    getMediaQueryServerSnapshot,
  );
}

function getExpandPreset(isMobile: boolean, reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      startWidth: 100,
      startHeight: 100,
      startRadius: 0,
      endRadius: 0,
      mediaZoom: 1.08,
      mediaEndZoom: 1.08,
      scrollDistance: 0,
      holdDistance: 0,
      smoothing: 0,
      overlayScrim: 0.82,
    };
  }

  if (isMobile) {
    return {
      startWidth: 78,
      startHeight: 44,
      startRadius: 20,
      endRadius: 0,
      mediaZoom: 1.24,
      mediaEndZoom: 1.1,
      scrollDistance: 0.95,
      holdDistance: 0.35,
      smoothing: 0,
      overlayScrim: 0.82,
    };
  }

  return {
    startWidth: 42,
    startHeight: 58,
    startRadius: 24,
    endRadius: 0,
    mediaZoom: 1.28,
    mediaEndZoom: 1.08,
    scrollDistance: 1.1,
    holdDistance: 0.4,
    smoothing: 0,
    overlayScrim: 0.8,
  };
}

/**
 * Scroll-driven About Me showcase combining ScrollExpand (initial compact media
 * expanding seamlessly into the viewport) and ProfileCard (3D tilt, holo, glare,
 * parallax) alongside responsive About Me copy.
 */
export default function AboutMeSection({ theme, onContactClick }: AboutMeSectionProps) {
  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const isMobile = useMediaQuery(MOBILE_VIEWPORT_QUERY);
  const isLowPower = useConstrainedDevice();
  const [isRevealed, setIsRevealed] = useState(false);

  const effectiveRevealed = prefersReducedMotion || isRevealed;
  const expandPreset = getExpandPreset(isMobile, prefersReducedMotion);

  const handleRevealChange = useCallback((revealed: boolean) => {
    setIsRevealed(revealed);
  }, []);

  const handleContact = useCallback(() => {
    if (onContactClick) {
      onContactClick();
      return;
    }
    window.location.href = "mailto:hello@example.com?subject=Portfolio%20conversation";
  }, [onContactClick]);

  return (
    <section
      className="about-section"
      id="about"
      aria-label="About Me"
      data-revealed={effectiveRevealed ? "true" : "false"}
      data-reduced-motion={prefersReducedMotion ? "true" : "false"}
    >
      <ScrollExpand
        src="/reel-poster.jpg"
        mediaType="image"
        alt="McLaren Formula 1 car in the pit lane under night floodlights"
        title="About Me"
        scrollHint="Scroll to explore"
        useWindowScroll
        enabled={!prefersReducedMotion}
        mediaLoading="eager"
        mediaDecoding="async"
        mediaPosition="center 36%"
        contentClassName="about-expand-overlay"
        onRevealChange={handleRevealChange}
        {...expandPreset}
      >
        <div className="about-grid about-expand-grid">
          <div className="about-card-column">
            <ProfileCard
              name="Sahrul Ridho Firdaus"
              title="Software Engineer"
              handle="sahrulfirdaus"
              status="Available for work"
              contactText="Contact"
              avatarUrl="/avatar.webp"
              holo={isLowPower ? 0.45 : 0.8}
              glare={isLowPower ? 0.25 : 0.35}
              tiltStrength={12}
              parallax={8}
              radius={16}
              enableTilt={!prefersReducedMotion}
              intro={!prefersReducedMotion}
              introTrigger={prefersReducedMotion ? false : effectiveRevealed}
              showUserInfo
              enableMobileTilt={false}
              disableBackdropBlur={isLowPower}
              theme={theme}
              className="about-profile-card"
              onContactClick={handleContact}
            />
          </div>

          <div className="about-copy about-expand-copy">
            <h2
              className="about-reveal-item"
              style={{ "--about-delay": "0ms" } as CSSProperties}
            >
              Beyond the Code.
            </h2>
            <p
              className="about-reveal-item"
              style={{ "--about-delay": "80ms" } as CSSProperties}
            >
              Building software, working with data, and exploring the possibilities of AI.
            </p>

            <dl className="about-specs about-expand-specs" aria-label="Core focus areas">
              <div
                className="about-spec-item about-reveal-item"
                style={{ "--about-delay": "140ms" } as CSSProperties}
              >
                <dt>Discipline</dt>
                <dd>Software Engineering, Data &amp; AI/ML</dd>
              </div>
              <div
                className="about-spec-item about-reveal-item"
                style={{ "--about-delay": "200ms" } as CSSProperties}
              >
                <dt>Approach</dt>
                <dd>Analytical thinking, practical experimentation, and reliable solutions.</dd>
              </div>
            </dl>
          </div>
        </div>
      </ScrollExpand>
    </section>
  );
}
