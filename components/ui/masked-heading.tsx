'use client';

import React, { useId, useMemo } from 'react';
import type { CSSProperties } from 'react';
import {
  SPOT_MASK,
  useMaskedHeadingEngine,
  type GlyphDescriptor,
  type MaskedHeadingProps,
  type MaskedHeadingSettings,
  type WordDescriptor,
} from './masked-heading-engine';

export type { MaskedHeadingProps };

function MaskedHeadingMediaLayer({
  clipId,
  spotlightRadius,
  mediaType,
  src,
  poster,
  tint,
  spotlight,
  revealRef,
  clipRef,
  mediaRef,
}: {
  clipId: string;
  spotlightRadius: number;
  mediaType: 'image' | 'video';
  src: string;
  poster: string;
  tint: string;
  spotlight: boolean;
  revealRef: React.RefObject<HTMLSpanElement | null>;
  clipRef: React.RefObject<HTMLSpanElement | null>;
  mediaRef: React.RefObject<HTMLSpanElement | null>;
}) {
  return (
    <span ref={revealRef} className="absolute inset-0 block pointer-events-none">
      <span
        ref={clipRef}
        className="absolute inset-0 block"
        style={
          {
            clipPath: `url(#${clipId})`,
            ['--mh-spot-r' as string]: `${Math.max(1, spotlightRadius)}px`,
          } as CSSProperties
        }
      >
        <span
          ref={mediaRef}
          className="absolute inset-0 block [background:color-mix(in_srgb,currentColor_10%,transparent)] [will-change:transform,filter]"
        >
          {mediaType === 'video' ? (
            <video
              className="block w-full h-full object-cover select-none"
              src={src || undefined}
              poster={poster || undefined}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              className="block w-full h-full object-cover select-none"
              src={src || undefined}
              alt=""
              draggable={false}
            />
          )}
        </span>
        {tint ? (
          <span
            className="absolute inset-0 block mix-blend-color pointer-events-none"
            style={{ background: tint }}
          />
        ) : null}
        {spotlight ? (
          <>
            <span
              className="absolute inset-0 block pointer-events-none bg-[#808080] mix-blend-saturation"
              style={{ maskImage: SPOT_MASK, WebkitMaskImage: SPOT_MASK }}
            />
            <span
              className="absolute inset-0 block pointer-events-none bg-black opacity-55"
              style={{ maskImage: SPOT_MASK, WebkitMaskImage: SPOT_MASK }}
            />
          </>
        ) : null}
      </span>
    </span>
  );
}

const MaskedHeading: React.FC<MaskedHeadingProps> = ({
  text = 'Designed in the details',
  tag = 'h2',
  mediaType = 'image',
  src = '',
  poster = '',
  fillScale = 1.25,
  parallax = 26,
  drift = 18,
  hoverZoom = 0,
  brightness = 1,
  saturation = 1,
  grayscale = false,
  tint = '',
  spotlight = false,
  spotlightRadius = 160,
  outline = false,
  outlineColor = '',
  outlineWidth = 1,
  reveal = 'rise',
  duration = 1.1,
  stagger = 0.09,
  trigger = 'view',
  align = 'center',
  weight = 700,
  tracking = -0.03,
  lineHeight = 1.06,
  textScale = 0.115,
  className = '',
  style,
  ...rest
}: MaskedHeadingProps) => {
  const clipId = `mh-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const words = useMemo<WordDescriptor[]>(() => {
    const rawWords = String(text).split(/\s+/).filter(Boolean);
    return rawWords.map((word, wordPos) => ({ word, key: `${word}-${wordPos}` }));
  }, [text]);
  const glyphs = useMemo<GlyphDescriptor[]>(
    () =>
      words.flatMap((entry, w) =>
        Array.from(entry.word).map((char, c) => ({
          char,
          w,
          key: `${entry.key}-${c}-${char}`,
        }))
      ),
    [words]
  );

  const settings = useMemo<MaskedHeadingSettings>(
    () => ({
      fillScale,
      parallax,
      drift,
      hoverZoom,
      brightness,
      saturation,
      grayscale,
      textScale,
      spotlight,
    }),
    [brightness, drift, fillScale, grayscale, hoverZoom, parallax, saturation, spotlight, textScale]
  );

  const {
    rootRef,
    measureRef,
    revealRef,
    clipRef,
    mediaRef,
    wordRefs,
    baseRefs,
    glyphRefs,
    lineRefs,
  } = useMaskedHeadingEngine({
    settings,
    words,
    glyphs,
    layoutDepsKey: `${String(tag)}|${align}|${weight}|${tracking}|${lineHeight}|${textScale}|${String(outline)}`,
    reveal,
    trigger,
    duration,
    stagger,
    mediaType,
    src,
  });

  const Tag = tag;

  return (
    <Tag
      ref={rootRef}
      className={`relative w-full m-0 p-0 antialiased [text-wrap:balance] ${className}`.trim()}
      style={{
        textAlign: align,
        fontWeight: weight,
        letterSpacing: `${tracking}em`,
        lineHeight,
        ...style,
      }}
      {...rest}
    >
      <span ref={measureRef} className="text-transparent">
        {words.map((entry, i) => (
          <span
            key={entry.key}
            ref={(el: HTMLSpanElement | null) => {
              wordRefs.current[i] = el;
            }}
            className="inline-block whitespace-pre [&:not(:last-child)]:after:content-['_']"
          >
            {entry.word}
            <i
              ref={(el: HTMLElement | null) => {
                baseRefs.current[i] = el;
              }}
              className="inline-block w-0 h-0"
            />
          </span>
        ))}
      </span>

      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            {glyphs.map((glyph, i) => (
              <text
                key={glyph.key}
                ref={(el: SVGTextElement | null) => {
                  glyphRefs.current[i] = el;
                }}
              >
                {glyph.char}
              </text>
            ))}
          </clipPath>
        </defs>
      </svg>

      <MaskedHeadingMediaLayer
        clipId={clipId}
        spotlightRadius={spotlightRadius}
        mediaType={mediaType}
        src={src}
        poster={poster}
        tint={tint}
        spotlight={spotlight}
        revealRef={revealRef}
        clipRef={clipRef}
        mediaRef={mediaRef}
      />

      {outline ? (
        <svg
          className="absolute inset-0 w-full h-full overflow-visible pointer-events-none fill-none [stroke-linejoin:round]"
          aria-hidden="true"
          focusable="false"
          style={{ stroke: outlineColor || 'currentColor', strokeWidth: Math.max(0, outlineWidth) }}
        >
          {glyphs.map((glyph, i) => (
            <text
              key={glyph.key}
              ref={(el: SVGTextElement | null) => {
                lineRefs.current[i] = el;
              }}
            >
              {glyph.char}
            </text>
          ))}
        </svg>
      ) : null}
    </Tag>
  );
};

export default MaskedHeading;
