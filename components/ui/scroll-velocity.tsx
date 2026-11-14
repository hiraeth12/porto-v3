'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from 'motion/react';
import * as m from 'motion/react-m';

interface VelocityMapping {
  input: [number, number];
  output: [number, number];
}

interface VelocityTextProps {
  children: React.ReactNode;
  baseVelocity: number;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  damping: number;
  stiffness: number;
  numCopies: number;
  velocityMapping?: VelocityMapping;
  parallaxClassName?: string;
  scrollerClassName?: string;
  parallaxStyle?: React.CSSProperties;
  scrollerStyle?: React.CSSProperties;
  separator?: React.ReactNode;
  pauseOnHover: boolean;
  hoveredRef: React.RefObject<boolean>;
  inViewRef: React.RefObject<boolean>;
  fadeEdges: boolean;
  skewWithVelocity: number;
  scaleWithVelocity: number;
  outline: boolean;
  gap: number;
  fontSize?: number | string;
  fontWeight?: number | string;
  color?: string;
  draggable: boolean;
}

interface ScrollVelocityProps {
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  texts: React.ReactNode[];
  velocity?: number;
  className?: string;
  damping?: number;
  stiffness?: number;
  numCopies?: number;
  velocityMapping?: VelocityMapping;
  parallaxClassName?: string;
  scrollerClassName?: string;
  parallaxStyle?: React.CSSProperties;
  scrollerStyle?: React.CSSProperties;
  separator?: React.ReactNode;
  pauseOnHover?: boolean;
  fadeEdges?: boolean;
  skewWithVelocity?: number;
  scaleWithVelocity?: number;
  outlineAlternate?: boolean;
  gap?: number;
  fontSize?: number | string;
  fontWeight?: number | string;
  color?: string;
  draggable?: boolean;
}

interface DragState {
  active: boolean;
  pointerId: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  travel: number;
}

const DEFAULT_TEXTS: React.ReactNode[] = [];
const DEFAULT_VELOCITY_MAPPING: VelocityMapping = { input: [0, 1000], output: [0, 5] };

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

const FADE_STEPS = Array.from({ length: 9 }, (_, i) => i / 8);

const FADE_MASK = `linear-gradient(to right, ${[
  ...FADE_STEPS.map(t => `rgba(0, 0, 0, ${smootherstep(t).toFixed(3)}) ${(t * 15).toFixed(1)}%`),
  ...FADE_STEPS.map(t => `rgba(0, 0, 0, ${smootherstep(1 - t).toFixed(3)}) ${(85 + t * 15).toFixed(1)}%`),
].join(', ')})`;

const FADE_MASK_STYLE: React.CSSProperties = {
  WebkitMaskImage: FADE_MASK,
  maskImage: FADE_MASK,
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
};

const OUTLINE_STYLE: React.CSSProperties = {
  WebkitTextFillColor: 'transparent',
  WebkitTextStroke: 'max(1px, 0.028em) currentColor',
};

const DRAGGABLE_STYLE: React.CSSProperties = {
  cursor: 'grab',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  touchAction: 'pan-y',
};

function wrap(min: number, max: number, v: number): number {
  const range = max - min;
  const mod = (((v - min) % range) + range) % range;
  return mod + min;
}

function buildVelocityTypeStyle({
  fontSize,
  fontWeight,
  color,
  outline,
}: {
  fontSize?: number | string;
  fontWeight?: number | string;
  color?: string;
  outline: boolean;
}): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (fontSize !== undefined) {
    style.fontSize = typeof fontSize === 'number' ? `${fontSize}px` : fontSize;
    style.lineHeight = 1;
  }
  if (fontWeight !== undefined) style.fontWeight = fontWeight;
  if (color) style.color = color;
  return outline ? { ...style, ...OUTLINE_STYLE } : style;
}

function buildParallaxContainerStyle(
  fadeEdges: boolean,
  draggable: boolean,
  parallaxStyle?: React.CSSProperties,
): React.CSSProperties {
  return {
    ...(fadeEdges ? FADE_MASK_STYLE : undefined),
    ...(draggable ? DRAGGABLE_STYLE : undefined),
    ...parallaxStyle,
  };
}

function stepVelocityPhysics({
  delta,
  baseVelocity,
  pauseOnHover,
  hoveredRef,
  skewWithVelocity,
  scaleWithVelocity,
  directionFactor,
  pace,
  fling,
  drag,
  baseX,
  skewX,
  scaleY,
  velocityFactor,
  smoothVelocity,
}: {
  delta: number;
  baseVelocity: number;
  pauseOnHover: boolean;
  hoveredRef: React.RefObject<boolean>;
  skewWithVelocity: number;
  scaleWithVelocity: number;
  directionFactor: React.MutableRefObject<number>;
  pace: React.MutableRefObject<number>;
  fling: React.MutableRefObject<number>;
  drag: React.MutableRefObject<DragState>;
  baseX: MotionValue<number>;
  skewX: MotionValue<number>;
  scaleY: MotionValue<number>;
  velocityFactor: MotionValue<number>;
  smoothVelocity: MotionValue<number>;
}): void {
  const grab = drag.current;
  const seconds = Math.min(delta, 64) / 1000;
  const targetPace = grab.active || (pauseOnHover && hoveredRef.current) ? 0 : 1;
  pace.current += (targetPace - pace.current) * (1 - Math.exp(-delta / 150));

  const factor = velocityFactor.get();
  if (factor < 0) directionFactor.current = -1;
  else if (factor > 0) directionFactor.current = 1;

  const baseMove = directionFactor.current * baseVelocity * (delta / 1000);
  const moveBy = baseMove + directionFactor.current * baseMove * factor;
  let travel = moveBy * pace.current;

  if (!grab.active && fling.current !== 0) {
    travel += fling.current * seconds;
    fling.current *= Math.exp(-delta / 420);
    if (Math.abs(fling.current) < 4) fling.current = 0;
  }

  baseX.set(baseX.get() + travel);

  if (!skewWithVelocity && !scaleWithVelocity && skewX.get() === 0 && scaleY.get() === 1) {
    return;
  }

  const thrown = grab.active ? grab.velocity : fling.current;
  const scrollSurge = Math.tanh(Math.abs(smoothVelocity.get()) / 1600) * pace.current;
  const throwSurge = Math.tanh(Math.abs(thrown) / 2000);
  const surge = Math.max(scrollSurge, throwSurge);
  const heading =
    throwSurge > scrollSurge
      ? Math.sign(thrown)
      : Math.sign(travel) || directionFactor.current * Math.sign(baseVelocity);
  const ease = 1 - Math.exp(-delta / 110);
  const nextSkew = skewX.get() + (-heading * skewWithVelocity * surge - skewX.get()) * ease;
  const nextScale = scaleY.get() + (1 + scaleWithVelocity * surge - scaleY.get()) * ease;
  skewX.set(Math.abs(nextSkew) < 0.01 && !skewWithVelocity ? 0 : nextSkew);
  scaleY.set(Math.abs(nextScale - 1) < 0.0005 && !scaleWithVelocity ? 1 : nextScale);
}

function startDragGesture(
  event: React.PointerEvent<HTMLDivElement>,
  drag: React.MutableRefObject<DragState>,
  fling: React.MutableRefObject<number>,
): void {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  const grab = drag.current;
  grab.active = true;
  grab.pointerId = event.pointerId;
  grab.lastX = event.clientX;
  grab.lastTime = event.timeStamp;
  grab.velocity = 0;
  grab.travel = 0;
  fling.current = 0;
  event.currentTarget.setPointerCapture?.(event.pointerId);
  event.currentTarget.style.cursor = 'grabbing';
}

function moveDragGesture(
  event: React.PointerEvent<HTMLDivElement>,
  drag: React.MutableRefObject<DragState>,
  baseX: MotionValue<number>,
): void {
  const grab = drag.current;
  if (!grab.active || event.pointerId !== grab.pointerId) return;
  const dx = event.clientX - grab.lastX;
  const dt = Math.max(event.timeStamp - grab.lastTime, 1);
  grab.lastX = event.clientX;
  grab.lastTime = event.timeStamp;
  grab.travel += Math.abs(dx);
  baseX.set(baseX.get() + dx);
  grab.velocity += ((dx / dt) * 1000 - grab.velocity) * (1 - Math.exp(-dt / 50));
}

function endDragGesture(
  event: React.PointerEvent<HTMLDivElement>,
  drag: React.MutableRefObject<DragState>,
  fling: React.MutableRefObject<number>,
): void {
  const grab = drag.current;
  if (!grab.active || event.pointerId !== grab.pointerId) return;
  grab.active = false;
  const resting = event.timeStamp - grab.lastTime > 90;
  fling.current = resting ? 0 : Math.max(-5000, Math.min(5000, grab.velocity));
  grab.velocity = 0;
  if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
  event.currentTarget.style.cursor = 'grab';
}

function useVelocityDrag(draggable: boolean, baseX: MotionValue<number>) {
  const fling = useRef<number>(0);
  const drag = useRef<DragState>({
    active: false,
    pointerId: -1,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    travel: 0,
  });

  if (!draggable) {
    return { drag, fling, handlers: {} };
  }

  return {
    drag,
    fling,
    handlers: {
      onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => startDragGesture(e, drag, fling),
      onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => moveDragGesture(e, drag, baseX),
      onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => endDragGesture(e, drag, fling),
      onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => endDragGesture(e, drag, fling),
      onClickCapture: (e: React.MouseEvent<HTMLDivElement>) => {
        if (drag.current.travel > 6) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
    },
  };
}

function useElementWidth<T extends HTMLElement>(ref: React.RefObject<T | null>): number {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof ResizeObserver === 'undefined') {
      const updateWidth = () => setWidth(element.offsetWidth);
      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}

function VelocityCopyTrack({
  numCopies,
  copyRef,
  className,
  gap,
  separator,
  children,
}: {
  numCopies: number;
  copyRef: React.RefObject<HTMLSpanElement | null>;
  className: string;
  gap: number;
  separator?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      {Array.from({ length: numCopies }, (_, i) => (
        <span
          className={`flex-shrink-0 ${className}`}
          key={i}
          ref={i === 0 ? copyRef : null}
          aria-hidden={i > 0 ? true : undefined}
          style={!separator && gap > 0 ? { paddingRight: gap } : undefined}
        >
          {children}&nbsp;
          {separator ? (
            <>
              <span style={gap > 0 ? { margin: `0 ${gap / 2}px` } : undefined}>{separator}</span>
              &nbsp;
            </>
          ) : null}
        </span>
      ))}
    </>
  );
}

function VelocityText({
  children,
  baseVelocity,
  scrollContainerRef,
  className = '',
  damping,
  stiffness,
  numCopies,
  velocityMapping = DEFAULT_VELOCITY_MAPPING,
  parallaxClassName,
  scrollerClassName,
  parallaxStyle,
  scrollerStyle,
  separator,
  pauseOnHover,
  hoveredRef,
  inViewRef,
  fadeEdges,
  skewWithVelocity,
  scaleWithVelocity,
  outline,
  gap,
  fontSize,
  fontWeight,
  color,
  draggable,
}: VelocityTextProps) {
  const baseX = useMotionValue(0);
  const skewX = useMotionValue(0);
  const scaleY = useMotionValue(1);
  const scrollOptions = scrollContainerRef ? { container: scrollContainerRef } : {};
  const { scrollY } = useScroll(scrollOptions);
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping, stiffness });
  const velocityFactor = useTransform(
    smoothVelocity,
    velocityMapping.input,
    velocityMapping.output,
    { clamp: false },
  );
  const reduceMotion = useReducedMotion();

  const copyRef = useRef<HTMLSpanElement>(null);
  const copyWidth = useElementWidth(copyRef);
  const x = useTransform(baseX, v => (copyWidth === 0 ? '0px' : `${wrap(-copyWidth, 0, v)}px`));

  const directionFactor = useRef<number>(1);
  const pace = useRef<number>(1);
  const { drag, fling, handlers } = useVelocityDrag(draggable, baseX);

  useAnimationFrame((_t, delta) => {
    if (reduceMotion || !inViewRef.current) return;
    stepVelocityPhysics({
      delta,
      baseVelocity,
      pauseOnHover,
      hoveredRef,
      skewWithVelocity,
      scaleWithVelocity,
      directionFactor,
      pace,
      fling,
      drag,
      baseX,
      skewX,
      scaleY,
      velocityFactor,
      smoothVelocity,
    });
  });

  const typeStyle = buildVelocityTypeStyle({ fontSize, fontWeight, color, outline });
  const containerStyle = buildParallaxContainerStyle(fadeEdges, draggable, parallaxStyle);

  return (
    <div
      className={`${parallaxClassName} relative w-full overflow-hidden`}
      style={containerStyle}
      {...handlers}
    >
      <m.div
        className={`${scrollerClassName} flex w-max items-center whitespace-nowrap text-center font-sans text-4xl font-bold tracking-[-0.02em] drop-shadow md:text-[5rem] md:leading-[5rem]`}
        style={{ x, skewX, scaleY, ...typeStyle, ...scrollerStyle }}
      >
        <VelocityCopyTrack
          numCopies={numCopies}
          copyRef={copyRef}
          className={className}
          gap={gap}
          separator={separator}
        >
          {children}
        </VelocityCopyTrack>
      </m.div>
    </div>
  );
}

export const ScrollVelocity: React.FC<ScrollVelocityProps> = ({
  scrollContainerRef,
  texts = DEFAULT_TEXTS,
  velocity = 100,
  className = '',
  damping = 50,
  stiffness = 400,
  numCopies = 6,
  velocityMapping = DEFAULT_VELOCITY_MAPPING,
  parallaxClassName = 'parallax',
  scrollerClassName = 'scroller',
  parallaxStyle,
  scrollerStyle,
  separator = '',
  pauseOnHover = false,
  fadeEdges = false,
  skewWithVelocity = 0,
  scaleWithVelocity = 0,
  outlineAlternate = false,
  gap = 0,
  fontSize,
  fontWeight,
  color,
  draggable = false,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const hoveredRef = useRef(false);
  const inViewRef = useRef(true);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          inViewRef.current = entry.isIntersecting && entry.intersectionRatio >= 0.1;
        }
      },
      { threshold: [0, 0.1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const textEntries = useMemo(() => {
    const seen = new Map<string, number>();
    return texts.map((text) => {
      const base =
        typeof text === 'string' || typeof text === 'number'
          ? String(text)
          : 'velocity-row';
      const occurrence = seen.get(base) ?? 0;
      seen.set(base, occurrence + 1);
      return {
        key: occurrence === 0 ? base : `${base}#${occurrence}`,
        text,
      };
    });
  }, [texts]);

  return (
    <section
      ref={sectionRef}
      className="relative left-1/2 flex w-screen -translate-x-1/2 flex-col items-center justify-center overflow-hidden"
      style={{
        minHeight: '100svh',
        ...(fadeEdges ? FADE_MASK_STYLE : {}),
      }}
      onPointerEnter={() => {
        hoveredRef.current = true;
      }}
      onPointerLeave={() => {
        hoveredRef.current = false;
      }}
    >
      {textEntries.map((entry, index) => (
        <VelocityText
          key={entry.key}
          className={className}
          baseVelocity={index % 2 !== 0 ? -velocity : velocity}
          scrollContainerRef={scrollContainerRef}
          damping={damping}
          stiffness={stiffness}
          numCopies={numCopies}
          velocityMapping={velocityMapping}
          parallaxClassName={parallaxClassName}
          scrollerClassName={scrollerClassName}
          parallaxStyle={parallaxStyle}
          scrollerStyle={scrollerStyle}
          separator={separator}
          pauseOnHover={pauseOnHover}
          hoveredRef={hoveredRef}
          inViewRef={inViewRef}
          fadeEdges={fadeEdges}
          skewWithVelocity={skewWithVelocity}
          scaleWithVelocity={scaleWithVelocity}
          outline={outlineAlternate && index % 2 !== 0}
          gap={gap}
          fontSize={fontSize}
          fontWeight={fontWeight}
          color={color}
          draggable={draggable}
        >
          {entry.text}
        </VelocityText>
      ))}
    </section>
  );
};

export default ScrollVelocity;
