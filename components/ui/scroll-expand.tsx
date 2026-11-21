'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

type ConfigKey =
  | 'startWidth'
  | 'startHeight'
  | 'startRadius'
  | 'endRadius'
  | 'mediaZoom'
  | 'mediaEndZoom'
  | 'scrollDistance'
  | 'holdDistance'
  | 'smoothing'
  | 'overlayScrim'
  | 'useWindowScroll'
  | 'enabled';

export interface ScrollExpandProps {
  src?: string;
  mediaType?: 'image' | 'video';
  poster?: string;
  alt?: string;
  title?: string;
  scrollHint?: string;
  startWidth?: number;
  startHeight?: number;
  startRadius?: number;
  endRadius?: number;
  mediaZoom?: number;
  mediaEndZoom?: number;
  scrollDistance?: number;
  holdDistance?: number;
  smoothing?: number;
  overlayScrim?: number;
  useWindowScroll?: boolean;
  enabled?: boolean;
  mediaLoading?: 'eager' | 'lazy';
  mediaDecoding?: 'async' | 'sync' | 'auto';
  mediaPosition?: string;
  contentClassName?: string;
  onRevealChange?: (revealed: boolean) => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}

const ScrollExpand: React.FC<ScrollExpandProps> = ({
  src = '',
  mediaType = 'image',
  poster = '',
  alt = '',
  title = '',
  scrollHint = '',
  startWidth = 42,
  startHeight = 58,
  startRadius = 24,
  endRadius = 0,
  mediaZoom = 1.35,
  mediaEndZoom = 1,
  scrollDistance = 1.2,
  holdDistance = 0.35,
  smoothing = 0.1,
  overlayScrim = 0.45,
  useWindowScroll = false,
  enabled = true,
  mediaLoading = 'eager',
  mediaDecoding = 'async',
  mediaPosition,
  contentClassName = '',
  onRevealChange,
  children,
  className = '',
  style,
  ...rest
}: ScrollExpandProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const mediaRef = useRef<HTMLImageElement & HTMLVideoElement>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const scrimRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);

  const onRevealChangeRef = useRef(onRevealChange);
  const revealedRef = useRef<boolean | null>(null);
  const lastProgressRef = useRef<number>(-1);
  const readProgressRef = useRef<() => number>(() => 0);

  const propsRef = useRef<Required<Pick<ScrollExpandProps, ConfigKey>>>({
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    mediaEndZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    useWindowScroll,
    enabled,
  });

  const applyProgress = useCallback((p: number, force = false) => {
    const clampedP = clamp(p, 0, 1);
    if (!force && Math.abs(clampedP - lastProgressRef.current) < 0.0002) {
      return;
    }
    lastProgressRef.current = clampedP;

    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!frame || !media) return;
    const c = propsRef.current;

    const e = smoothstep(0, 1, clampedP);

    const isExpanding = clampedP > 0.001 && clampedP < 0.999;

    if (clampedP >= 0.999 && c.endRadius <= 0.01) {
      frame.style.clipPath = 'none';
      frame.style.willChange = 'auto';
    } else {
      const w = c.startWidth + (100 - c.startWidth) * e;
      const h = c.startHeight + (100 - c.startHeight) * e;
      const ix = Math.max(0, (100 - w) / 2);
      const iy = Math.max(0, (100 - h) / 2);
      const r = c.startRadius + (c.endRadius - c.startRadius) * e;
      frame.style.clipPath = `inset(${iy.toFixed(3)}% ${ix.toFixed(3)}% ${iy.toFixed(3)}% ${ix.toFixed(3)}% round ${r.toFixed(2)}px)`;
      frame.style.willChange = isExpanding ? 'clip-path' : 'auto';
    }

    const scale =
      clampedP >= 0.999 ? c.mediaEndZoom : c.mediaZoom + (c.mediaEndZoom - c.mediaZoom) * e;
    media.style.transform = `scale(${scale.toFixed(4)})`;
    media.style.willChange = isExpanding ? 'transform' : 'auto';

    if (scrimRef.current) {
      scrimRef.current.style.opacity = `${(c.overlayScrim * e).toFixed(4)}`;
    }

    if (titleRef.current) {
      const out = smoothstep(0.4, 0.88, clampedP);
      const titleOpacity = 1 - out;
      titleRef.current.style.opacity = `${titleOpacity.toFixed(4)}`;
      titleRef.current.style.visibility = titleOpacity <= 0.005 ? 'hidden' : 'visible';
      titleRef.current.style.transform = `translate3d(0, ${(-28 * out).toFixed(2)}px, 0) scale(${(1 + 0.06 * out).toFixed(4)})`;
      titleRef.current.style.willChange = clampedP > 0.35 && clampedP < 0.92 ? 'opacity, transform' : 'auto';
    }

    if (hintRef.current) {
      const gone = smoothstep(0, 0.12, clampedP);
      const hintOpacity = 1 - gone;
      hintRef.current.style.opacity = `${hintOpacity.toFixed(4)}`;
      hintRef.current.style.visibility = hintOpacity <= 0.005 ? 'hidden' : 'visible';
      hintRef.current.style.transform = `translate3d(0, ${(8 * gone).toFixed(2)}px, 0)`;
      hintRef.current.style.willChange = clampedP > 0.001 && clampedP < 0.15 ? 'opacity, transform' : 'auto';
    }

    if (overlayRef.current) {
      const inn = smoothstep(0.68, 1, clampedP);
      const visible = inn > 0.005;
      const interactive = inn >= 0.35;
      overlayRef.current.style.opacity = `${inn.toFixed(4)}`;
      overlayRef.current.style.transform = `translate3d(0, ${(18 * (1 - inn)).toFixed(2)}px, 0)`;
      overlayRef.current.style.visibility = visible ? 'visible' : 'hidden';
      overlayRef.current.style.pointerEvents = interactive ? 'auto' : 'none';
      overlayRef.current.style.willChange = clampedP > 0.64 && clampedP < 0.999 ? 'opacity, transform' : 'auto';
      overlayRef.current.setAttribute('aria-hidden', interactive ? 'false' : 'true');

      if (revealedRef.current !== interactive) {
        revealedRef.current = interactive;
        onRevealChangeRef.current?.(interactive);
      }
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!root || !track || !stage) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let current = 0;
    let target = 0;
    let stageH = 0;
    let running = false;
    let inView = true;
    let lastTick = performance.now();

    const measure = () => {
      const c = propsRef.current;
      stageH = c.useWindowScroll ? window.innerHeight : root.clientHeight;
      if (stageH <= 0) return;

      if (!c.enabled && c.scrollDistance <= 0 && c.holdDistance <= 0) {
        stage.style.height = 'auto';
        stage.style.minHeight = `${stageH}px`;
        track.style.height = 'auto';
        track.style.minHeight = `${stageH}px`;
      } else {
        stage.style.height = `${stageH}px`;
        stage.style.minHeight = `${stageH}px`;
        const trackH = stageH * (1 + Math.max(0, c.scrollDistance) + Math.max(0, c.holdDistance));
        track.style.height = `${trackH}px`;
        track.style.minHeight = `${trackH}px`;
      }

      const w = root.clientWidth || stageH;
      stage.style.setProperty('--se-title-size', `${clamp(w * 0.075, 20, 84)}px`);
    };

    const readProgress = () => {
      const c = propsRef.current;
      if (!c.enabled) return 1;
      const span = stageH * Math.max(0.01, c.scrollDistance);
      if (c.useWindowScroll) {
        const top = track.getBoundingClientRect().top;
        return clamp(-top / span, 0, 1);
      }
      return clamp(root.scrollTop / span, 0, 1);
    };
    readProgressRef.current = readProgress;

    const tick = (now: number) => {
      const c = propsRef.current;
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTick) / 1000));
      lastTick = now;
      const k = c.smoothing <= 0 ? 1 : 1 - Math.exp(-dt / Math.max(0.001, c.smoothing));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0004) {
        current = target;
        running = false;
      }
      applyProgress(current);
      raf = running ? requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (running) return;
      running = true;
      lastTick = performance.now();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const nextTarget = readProgress();
      if (!inView && Math.abs(nextTarget - lastProgressRef.current) < 0.0002 && Math.abs(nextTarget - current) < 0.0002) {
        return;
      }
      target = nextTarget;
      if (propsRef.current.smoothing <= 0 || reduceMotion || !propsRef.current.enabled) {
        current = target;
        applyProgress(current);
        return;
      }
      if (Math.abs(target - current) < 0.0004 && Math.abs(target - lastProgressRef.current) < 0.0002) {
        return;
      }
      kick();
    };

    const onResize = () => {
      measure();
      target = readProgress();
      current = target;
      applyProgress(current, true);
    };

    measure();
    target = readProgress();
    current = target;
    applyProgress(current, true);

    const scroller = useWindowScroll ? window : root;
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(root);

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          if (!entry) return;
          inView = entry.isIntersecting;
          if (mediaType === 'video' && mediaRef.current) {
            if (inView && !reduceMotion) {
              mediaRef.current.play?.().catch(() => {});
            } else {
              mediaRef.current.pause?.();
            }
          }
          if (inView) {
            onScroll();
          }
        },
        { rootMargin: '250px 0px', threshold: 0 }
      );
      io.observe(root);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      io?.disconnect();
    };
  }, [applyProgress, mediaType, useWindowScroll]);

  useEffect(() => {
    onRevealChangeRef.current = onRevealChange;
    propsRef.current = {
      startWidth,
      startHeight,
      startRadius,
      endRadius,
      mediaZoom,
      mediaEndZoom,
      scrollDistance,
      holdDistance,
      smoothing,
      overlayScrim,
      useWindowScroll,
      enabled,
    };

    const root = rootRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!root || !track || !stage) return;

    const stageH = useWindowScroll ? window.innerHeight : root.clientHeight;
    if (stageH > 0) {
      if (!enabled && scrollDistance <= 0 && holdDistance <= 0) {
        stage.style.height = 'auto';
        stage.style.minHeight = `${stageH}px`;
        track.style.height = 'auto';
        track.style.minHeight = `${stageH}px`;
      } else {
        stage.style.height = `${stageH}px`;
        stage.style.minHeight = `${stageH}px`;
        const trackH = stageH * (1 + Math.max(0, scrollDistance) + Math.max(0, holdDistance));
        track.style.height = `${trackH}px`;
        track.style.minHeight = `${trackH}px`;
      }
    }

    applyProgress(readProgressRef.current(), true);
  }, [
    applyProgress,
    enabled,
    endRadius,
    holdDistance,
    mediaZoom,
    mediaEndZoom,
    onRevealChange,
    overlayScrim,
    scrollDistance,
    smoothing,
    startHeight,
    startRadius,
    startWidth,
    useWindowScroll,
  ]);

  const initialIx = enabled ? Math.max(0, (100 - startWidth) / 2) : 0;
  const initialIy = enabled ? Math.max(0, (100 - startHeight) / 2) : 0;
  const initialRadius = enabled ? startRadius : endRadius;
  const initialClipPath =
    !enabled && endRadius <= 0.01
      ? 'none'
      : `inset(${initialIy}% ${initialIx}% ${initialIy}% ${initialIx}% round ${initialRadius}px)`;
  const initialMediaStyle: CSSProperties = {
    transform: `scale(${enabled ? mediaZoom : mediaEndZoom})`,
    ...(mediaPosition ? { objectPosition: mediaPosition, transformOrigin: `center ${mediaPosition.split(' ')[1] || 'center'}` } : {}),
  };

  const trackInitialStyle: CSSProperties | undefined = useWindowScroll
    ? {
        minHeight:
          !enabled && scrollDistance <= 0 && holdDistance <= 0
            ? '100svh'
            : `calc(100svh * ${1 + Math.max(0, scrollDistance) + Math.max(0, holdDistance)})`,
      }
    : undefined;

  const stageInitialStyle: CSSProperties | undefined = useWindowScroll
    ? {
        minHeight: '100svh',
        height: !enabled && scrollDistance <= 0 && holdDistance <= 0 ? 'auto' : '100svh',
      }
    : undefined;

  const overlayInitialStyle: CSSProperties = enabled
    ? {
        opacity: 0,
        transform: 'translate3d(0, 18px, 0)',
        visibility: 'hidden',
        pointerEvents: 'none',
      }
    : {
        opacity: 1,
        transform: 'translate3d(0, 0, 0)',
        visibility: 'visible',
        pointerEvents: 'auto',
      };

  const media =
    mediaType === 'video' ? (
      <video
        ref={mediaRef}
        className="absolute inset-0 w-full h-full object-cover origin-center select-none"
        style={initialMediaStyle}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
      />
    ) : (
      <img
        ref={mediaRef}
        className="absolute inset-0 w-full h-full object-cover origin-center select-none"
        style={initialMediaStyle}
        src={src}
        alt={alt}
        loading={mediaLoading}
        decoding={mediaDecoding}
        draggable={false}
      />
    );

  return (
    <div
      ref={rootRef}
      className={`relative w-full h-full ${useWindowScroll ? '' : 'overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'} ${className}`.trim()}
      style={style}
      {...rest}
    >
      <div ref={trackRef} className="relative w-full" style={trackInitialStyle}>
        <div
          ref={stageRef}
          className="sticky top-0 w-full overflow-hidden [--se-title-size:4rem]"
          style={stageInitialStyle}
        >
          <div
            ref={frameRef}
            className="absolute inset-0"
            style={{ clipPath: initialClipPath }}
          >
            {media}
            <div
              ref={scrimRef}
              className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_top,rgba(10,10,12,0.94)_0%,rgba(10,10,12,0.72)_18%,rgba(10,10,12,0.44)_50%,rgba(10,10,12,0.62)_100%)]"
              style={{ opacity: enabled ? 0 : overlayScrim }}
            />
            {children ? (
              <div
                ref={overlayRef}
                aria-hidden={enabled ? 'true' : 'false'}
                className={`absolute inset-0 flex flex-col items-center justify-center p-[6%] ${contentClassName}`.trim()}
                style={overlayInitialStyle}
              >
                {children}
              </div>
            ) : null}
          </div>
          {title ? (
            <div
              ref={titleRef}
              className="absolute inset-0 flex items-center justify-center m-0 px-[6%] text-center font-bold leading-none tracking-[-0.03em] text-white [font-size:var(--se-title-size)] [text-shadow:0_2px_24px_rgba(0,0,0,0.45)] pointer-events-none"
              style={enabled ? undefined : { opacity: 0, visibility: 'hidden' }}
            >
              {title}
            </div>
          ) : null}
          {scrollHint ? (
            <div
              ref={hintRef}
              className="absolute inset-x-0 bottom-5 text-center text-[0.8125rem] tracking-[0.02em] text-[var(--se-hint-color,rgba(255,255,255,0.55))] pointer-events-none"
              style={enabled ? undefined : { opacity: 0, visibility: 'hidden' }}
            >
              {scrollHint}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ScrollExpand;
