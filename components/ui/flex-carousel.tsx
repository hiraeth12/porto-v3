'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  BEND_PRESETS,
  DEFAULT_ITEMS,
  mountFlexCarousel,
  type Callbacks,
  type CarouselEngine,
  type FlexCarouselItem,
  type FlexCarouselProps,
  type PresetValues,
  type Settings,
} from './flex-carousel-engine';

export type { FlexCarouselItem, FlexCarouselProps };

const STYLE = `
@keyframes flex-carousel-title { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes flex-carousel-reveal { from { opacity: 0; } to { opacity: 1; } }
`;

const DIGIT_POOL = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function Digits({ value }: { value: number }) {
  const digits = useMemo(() => {
    const raw = String(value).padStart(2, '0').split('');
    return raw.map((digit, pos) => ({ digit, key: `place-${raw.length - pos}` }));
  }, [value]);

  return (
    <span className="inline-flex">
      {digits.map((entry) => (
        <span key={entry.key} className="inline-block h-[1em] overflow-hidden">
          <span
            className="flex flex-col transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ transform: `translateY(${-Number(entry.digit) * 10}%)` }}
          >
            {DIGIT_POOL.map((n) => (
              <span key={n} className="h-[1em]">
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

const FlexCarousel = ({
  items = DEFAULT_ITEMS,
  preset = 'liquid',
  intro = 'rise',
  cardHeight = 0.5,
  gap = 12,
  radius = 0,
  fit = 'natural',
  lensWidth,
  lensHeight,
  tilt,
  roundness,
  bend,
  reach,
  curl,
  dispersion,
  liquid,
  followCursor,
  squeeze = 0.2,
  focusOnClick = true,
  autoplay = false,
  interval = 4,
  captions = true,
  captureWheel = true,
  onChange,
  onSelect,
  className = '',
  style,
}: FlexCarouselProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<Settings | null>(null);
  const itemsRef = useRef<FlexCarouselItem[]>(items);
  const engineRef = useRef<CarouselEngine | null>(null);
  const callbacksRef = useRef<Callbacks>({ onChange, onSelect });
  const [active, setActive] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);

  const base = BEND_PRESETS[preset] || BEND_PRESETS.liquid;
  const pick = <K extends keyof PresetValues>(value: PresetValues[K] | undefined, key: K): PresetValues[K] =>
    value === undefined || value === null ? base[key] : value;

  const list = items && items.length ? items : DEFAULT_ITEMS;
  const itemsKey = list.map((item) => item.src).join('|');

  useEffect(() => {
    itemsRef.current = list;
    callbacksRef.current = { onChange, onSelect };
    settingsRef.current = {
      intro,
      cardHeight,
      gap,
      radius,
      fit,
      lensWidth: pick(lensWidth, 'lensWidth'),
      lensHeight: pick(lensHeight, 'lensHeight'),
      tilt: pick(tilt, 'tilt'),
      roundness: pick(roundness, 'roundness'),
      bend: pick(bend, 'bend'),
      reach: pick(reach, 'reach'),
      curl: pick(curl, 'curl'),
      dispersion: pick(dispersion, 'dispersion'),
      liquid: pick(liquid, 'liquid'),
      followCursor: pick(followCursor, 'followCursor'),
      squeeze,
      focusOnClick,
      autoplay,
      interval,
      captureWheel,
    };
    engineRef.current?.wake();
  });

  useEffect(() => {
    engineRef.current?.setItems(itemsRef.current);
  }, [itemsKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const engine = mountFlexCarousel({
      container,
      settingsRef,
      itemsRef,
      callbacksRef,
      onActiveChange: setActive,
      onRevealedChange: setRevealed,
      onFocusOpenChange: setFocusOpen,
    });
    engineRef.current = engine;
    return () => {
      engineRef.current = null;
      engine?.dispose();
    };
  }, []);

  const current = list[active] || list[0];
  const label = current ? current.title || current.alt || `Image ${active + 1}` : '';

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full cursor-grab touch-pan-y select-none overflow-hidden overscroll-contain outline-none [-webkit-tap-highlight-color:transparent] focus-visible:shadow-[inset_0_0_0_2px_rgba(128,128,140,0.55)] data-[hover=open]:cursor-zoom-in data-[hover=close]:cursor-zoom-out data-[dragging]:cursor-grabbing ${className}`.trim()}
      style={{ ...style, '--flex-carousel-half': `${Math.min(Math.max(cardHeight, 0.05), 1) * 50}%` } as CSSProperties}
      role="region"
      aria-roledescription="carousel"
      aria-label="Image carousel"
      tabIndex={0}
    >
      <style>{STYLE}</style>
      {captions && current && revealed ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-[calc(50%_+_var(--flex-carousel-half)_*_var(--flex-carousel-lift,1)_+_22px)] flex flex-col items-center gap-1.5 px-4 text-center animate-[flex-carousel-reveal_900ms_ease_both] motion-reduce:animate-none"
          aria-hidden="true"
        >
          <span
            key={active}
            className="flex max-w-full flex-col items-center text-[15px] font-medium leading-[1.35] animate-[flex-carousel-title_520ms_cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none"
          >
            {current.title || current.alt}
            {current.subtitle ? <span className="font-normal opacity-60">{current.subtitle}</span> : null}
          </span>
          <span
            className="inline-flex items-center gap-[3px] text-[12px] leading-none tabular-nums opacity-50 transition-opacity duration-[400ms] data-[hidden]:opacity-0"
            data-hidden={focusOpen ? '' : undefined}
          >
            <Digits value={active + 1} />
            <span className="opacity-60">/</span>
            <span>{String(list.length).padStart(2, '0')}</span>
          </span>
        </div>
      ) : null}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`${label}, ${active + 1} of ${list.length}`}
      </div>
    </div>
  );
};

export default FlexCarousel;
