'use client';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { CSSProperties, ElementType } from 'react';
import { gsap } from 'gsap';

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const clamp = (v: number, a: number, b: number): number =>
  v < a ? a : v > b ? b : v;

export const SPOT_MASK = `radial-gradient(circle var(--mh-spot-r, 160px) at var(--mh-spot-x, 50%) var(--mh-spot-y, 50%), ${Array.from(
  { length: 9 },
  (_, i) => {
    const t = i / 8;
    const u = clamp((t - 0.1) / 0.9, 0, 1);
    return `rgba(0, 0, 0, ${(u * u * u * (u * (u * 6 - 15) + 10)).toFixed(3)}) ${(t * 100).toFixed(1)}%`;
  }
).join(', ')})`;

export type Reveal = 'rise' | 'scale' | 'blur' | 'wipe' | 'fade' | 'none';
export type Trigger = 'view' | 'mount' | 'hover';

export interface MaskedHeadingProps {
  text?: string;
  tag?: ElementType;
  mediaType?: 'image' | 'video';
  src?: string;
  poster?: string;
  fillScale?: number;
  parallax?: number;
  drift?: number;
  hoverZoom?: number;
  brightness?: number;
  saturation?: number;
  grayscale?: boolean;
  tint?: string;
  spotlight?: boolean;
  spotlightRadius?: number;
  outline?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
  reveal?: Reveal;
  duration?: number;
  stagger?: number;
  trigger?: Trigger;
  align?: 'left' | 'center' | 'right';
  weight?: number;
  tracking?: number;
  lineHeight?: number;
  textScale?: number;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}

export interface MaskedHeadingSettings {
  fillScale: number;
  parallax: number;
  drift: number;
  hoverZoom: number;
  brightness: number;
  saturation: number;
  grayscale: boolean;
  textScale: number;
  spotlight: boolean;
}

export interface GlyphDescriptor {
  char: string;
  w: number;
  key: string;
}

export interface WordDescriptor {
  word: string;
  key: string;
}

interface GlyphBox {
  x: number;
  y: number;
  w: number;
  cx: number;
  cy: number;
  lc: number;
}

interface GlyphState {
  x: number;
  y: number;
  s: number;
}

interface OffsetState {
  x: number;
  y: number;
  tx: number;
  ty: number;
  zoom: number;
  px: number;
  py: number;
  sx: number;
  sy: number;
  lit: boolean;
}

function paintGlyphElements(
  glyphEls: (SVGTextElement | null)[],
  boxes: GlyphBox[],
  states: GlyphState[]
): void {
  for (let i = 0; i < glyphEls.length; i += 1) {
    const glyph = glyphEls[i];
    if (!glyph) continue;
    const box = boxes[i];
    const st = states[i];
    if (!box || !st || (st.x === 0 && st.y === 0 && st.s === 1)) {
      if (glyph.hasAttribute('transform')) glyph.removeAttribute('transform');
      continue;
    }
    const s = Math.max(st.s, 0.0001);
    const tx = box.cx * (1 - s) + st.x * (box.cx - box.lc);
    const ty = box.cy * (1 - s) + st.y;
    glyph.setAttribute(
      'transform',
      `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})`
    );
  }
}

function computeLineCenters(boxes: GlyphBox[]): void {
  const lines = new Map<number, { left: number; right: number }>();
  for (const box of boxes) {
    if (!box) continue;
    const line = lines.get(box.y) ?? { left: Infinity, right: -Infinity };
    line.left = Math.min(line.left, box.x);
    line.right = Math.max(line.right, box.x + box.w);
    lines.set(box.y, line);
  }
  for (const box of boxes) {
    if (!box) continue;
    const line = lines.get(box.y);
    if (line) box.lc = (line.left + line.right) / 2;
  }
}

function measureGlyphBoxes(
  root: HTMLElement,
  fontPx: number,
  wordEls: (HTMLSpanElement | null)[],
  baseEls: (HTMLElement | null)[]
): GlyphBox[] {
  const rootRect = root.getBoundingClientRect();
  const ratio = root.offsetWidth ? rootRect.width / root.offsetWidth || 1 : 1;
  const range = document.createRange();
  const boxes: GlyphBox[] = [];
  let index = 0;

  for (let w = 0; w < wordEls.length; w += 1) {
    const box = wordEls[w];
    const base = baseEls[w];
    const node = box?.firstChild as Text | null | undefined;
    if (!box || !base || !node || node.nodeType !== 3) {
      index += Array.from(box?.textContent ?? '').length;
      continue;
    }
    const boxRect = box.getBoundingClientRect();
    const baseline = base.offsetTop;
    let offset = 0;
    for (const char of Array.from(node.data)) {
      range.setStart(node, offset);
      range.setEnd(node, offset + char.length);
      offset += char.length;
      const r = range.getBoundingClientRect();
      const x = box.offsetLeft + (r.left - boxRect.left) / ratio;
      const width = r.width / ratio;
      boxes[index] = {
        x,
        y: baseline,
        w: width,
        cx: x + width / 2,
        cy: baseline - fontPx * 0.36,
        lc: 0,
      };
      index += 1;
    }
  }

  computeLineCenters(boxes);
  return boxes;
}

function applySvgTypography(
  boxes: GlyphBox[],
  cs: CSSStyleDeclaration,
  glyphEls: (SVGTextElement | null)[],
  lineEls: (SVGTextElement | null)[]
): void {
  const writeFont = (el: SVGTextElement) => {
    el.style.fontFamily = cs.fontFamily;
    el.style.fontSize = cs.fontSize;
    el.style.fontWeight = cs.fontWeight;
    el.style.fontStyle = cs.fontStyle;
    el.style.letterSpacing = cs.letterSpacing;
  };

  for (let i = 0; i < boxes.length; i += 1) {
    const box = boxes[i];
    if (!box) continue;
    for (const el of [glyphEls[i], lineEls[i]]) {
      if (!el) continue;
      el.setAttribute('x', box.x.toFixed(2));
      el.setAttribute('y', `${box.y}`);
      writeFont(el);
    }
  }
}

function updateMediaLayerStyles(
  root: HTMLElement,
  media: HTMLElement,
  clip: HTMLElement | null,
  s: MaskedHeadingSettings,
  off: OffsetState,
  paint: { transform: string; filter: string; spot: string }
): void {
  const scale = s.fillScale * (1 + Math.max(0, off.zoom));
  const maxX = Math.max(0, ((scale - 1) / 2) * root.clientWidth);
  const maxY = Math.max(0, ((scale - 1) / 2) * root.clientHeight);
  const tx = clamp(off.x, -maxX, maxX).toFixed(2);
  const ty = clamp(off.y, -maxY, maxY).toFixed(2);
  const transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale.toFixed(4)})`;
  const filter = `brightness(${s.brightness}) saturate(${s.saturation})${s.grayscale ? ' grayscale(1)' : ''}`;

  if (paint.transform !== transform) {
    paint.transform = transform;
    media.style.transform = transform;
  }
  if (paint.filter !== filter) {
    paint.filter = filter;
    media.style.filter = filter;
  }

  if (clip && s.spotlight) {
    const spot = `${off.sx.toFixed(1)}px ${off.sy.toFixed(1)}px`;
    if (paint.spot !== spot) {
      paint.spot = spot;
      clip.style.setProperty('--mh-spot-x', `${off.sx.toFixed(1)}px`);
      clip.style.setProperty('--mh-spot-y', `${off.sy.toFixed(1)}px`);
    }
  }
}

function stepSpotlightOffset(
  root: HTMLElement,
  off: OffsetState,
  still: boolean,
  hovering: boolean,
  clock: number,
  dt: number
): void {
  const w = root.clientWidth;
  const h = root.clientHeight;
  let gx = w / 2;
  let gy = h / 2;

  if (hovering) {
    gx = off.px;
    gy = off.py;
  } else if (!still) {
    gx = w * (0.5 + 0.36 * Math.sin(clock * 0.37));
    gy = h * (0.5 + 0.22 * Math.sin(clock * 0.61 + 0.9));
  }

  if (!off.lit || still) {
    off.sx = gx;
    off.sy = gy;
    off.lit = true;
    return;
  }

  const follow = 1 - Math.exp(-dt / (hovering ? 0.12 : 0.6));
  off.sx += (gx - off.sx) * follow;
  off.sy += (gy - off.sy) * follow;
}

function applyRestRevealState(
  reveal: Reveal,
  size: number,
  states: GlyphState[],
  layer: HTMLElement
): void {
  if (reveal === 'rise') {
    states.forEach((st) => {
      st.y = size * 1.15;
    });
    return;
  }
  if (reveal === 'scale') {
    states.forEach((st) => {
      st.y = size * 0.1;
      st.s = 0;
    });
    return;
  }
  if (reveal === 'blur') {
    states.forEach((st) => {
      st.x = 0.22;
    });
    gsap.set(layer, { opacity: 0 });
    layer.style.filter = `blur(${(size * 0.3).toFixed(2)}px)`;
    return;
  }
  if (reveal === 'wipe') {
    layer.style.clipPath = 'inset(0% 100% 0% 0%)';
    return;
  }
  if (reveal === 'fade') {
    gsap.set(layer, { opacity: 0, scale: 1.08 });
  }
}

function createRevealTween(params: {
  reveal: Reveal;
  size: number;
  duration: number;
  stagger: number;
  glyphs: GlyphDescriptor[];
  states: GlyphState[];
  layer: HTMLElement;
  settle: () => void;
  clearLayer: () => void;
  renderGlyphs: () => void;
}): gsap.core.Animation {
  const { reveal, size, duration, stagger, glyphs, states, layer, settle, clearLayer, renderGlyphs } = params;

  if (reveal === 'rise') {
    clearLayer();
    const tween = gsap.fromTo(
      states,
      { x: 0, y: size * 1.15, s: 1 },
      { y: 0, duration, stagger: (i) => glyphs[i].w * stagger, ease: 'power4.out', overwrite: 'auto', onUpdate: renderGlyphs }
    );
    renderGlyphs();
    return tween;
  }

  if (reveal === 'scale') {
    clearLayer();
    const tween = gsap.fromTo(
      states,
      { x: 0, y: size * 0.1, s: 0 },
      { y: 0, s: 1, duration, stagger: (i) => i * stagger * 0.35, ease: 'expo.out', overwrite: 'auto', onUpdate: renderGlyphs }
    );
    renderGlyphs();
    return tween;
  }

  if (reveal === 'blur') {
    const focus = { blur: size * 0.3, opacity: 0 };
    gsap.set(layer, { scale: 1, opacity: 0 });
    layer.style.clipPath = '';
    layer.style.filter = `blur(${focus.blur.toFixed(2)}px)`;
    const timeline = gsap.timeline({ onUpdate: renderGlyphs });
    timeline.fromTo(states, { x: 0.22, y: 0, s: 1 }, { x: 0, duration: duration * 1.2, ease: 'expo.out' }, 0);
    timeline.to(
      focus,
      {
        blur: 0,
        opacity: 1,
        duration: duration * 1.2,
        ease: 'power2.out',
        onUpdate: () => {
          layer.style.filter = focus.blur > 0.05 ? `blur(${focus.blur.toFixed(2)}px)` : '';
          layer.style.opacity = focus.opacity.toFixed(3);
        },
      },
      0
    );
    renderGlyphs();
    return timeline;
  }

  if (reveal === 'wipe') {
    settle();
    layer.style.clipPath = 'inset(0% 100% 0% 0%)';
    const state = { p: 100 };
    return gsap.to(state, {
      p: 0,
      duration,
      ease: 'power3.inOut',
      overwrite: 'auto',
      onUpdate: () => {
        layer.style.clipPath = `inset(0% ${state.p}% 0% 0%)`;
      },
    });
  }

  settle();
  return gsap.fromTo(
    layer,
    { opacity: 0, scale: 1.08 },
    { opacity: 1, scale: 1, duration, ease: 'power3.out', overwrite: 'auto' }
  );
}

export function useMaskedHeadingEngine(params: {
  settings: MaskedHeadingSettings;
  words: WordDescriptor[];
  glyphs: GlyphDescriptor[];
  layoutDepsKey: string;
  reveal: Reveal;
  trigger: Trigger;
  duration: number;
  stagger: number;
  mediaType: 'image' | 'video';
  src: string;
}) {
  const { settings, words, glyphs, layoutDepsKey, reveal, trigger, duration, stagger, mediaType, src } = params;

  const rootRef = useRef<HTMLElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const revealRef = useRef<HTMLSpanElement | null>(null);
  const clipRef = useRef<HTMLSpanElement | null>(null);
  const mediaRef = useRef<HTMLSpanElement | null>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const baseRefs = useRef<(HTMLElement | null)[]>([]);
  const glyphRefs = useRef<(SVGTextElement | null)[]>([]);
  const lineRefs = useRef<(SVGTextElement | null)[]>([]);

  const boxesRef = useRef<GlyphBox[]>([]);
  const statesRef = useRef<GlyphState[]>([]);
  const tweenRef = useRef<gsap.core.Animation | null>(null);
  const offsetRef = useRef<OffsetState>({
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    zoom: 0,
    px: 0,
    py: 0,
    sx: 0,
    sy: 0,
    lit: false,
  });
  const paintRef = useRef({ transform: '', filter: '', spot: '' });
  const wakeRef = useRef<() => void>(() => {});
  const settingsRef = useRef<MaskedHeadingSettings>(settings);

  useIsomorphicLayoutEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const place = useCallback(() => {
    const root = rootRef.current;
    const media = mediaRef.current;
    if (!root || !media) return;
    updateMediaLayerStyles(root, media, clipRef.current, settingsRef.current, offsetRef.current, paintRef.current);
  }, []);

  const renderGlyphs = useCallback(() => {
    paintGlyphElements(glyphRefs.current, boxesRef.current, statesRef.current);
  }, []);

  const sync = useCallback(() => {
    const root = rootRef.current;
    const measure = measureRef.current;
    if (!root || !measure) return;

    root.style.fontSize = `${clamp(root.clientWidth * settingsRef.current.textScale, 20, 200).toFixed(1)}px`;
    const cs = window.getComputedStyle(measure);
    const boxes = measureGlyphBoxes(root, parseFloat(cs.fontSize) || 48, wordRefs.current, baseRefs.current);
    boxesRef.current = boxes;
    applySvgTypography(boxes, cs, glyphRefs.current, lineRefs.current);
    renderGlyphs();
    place();
  }, [place, renderGlyphs]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    let alive = true;
    const ro = new ResizeObserver(() => sync());
    ro.observe(root);
    document.fonts?.ready?.then(() => alive && sync()).catch(() => {});

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const off = offsetRef.current;
    let raf = 0;
    let last = 0;
    let clock = 0;
    let visible = true;
    let hovering = false;

    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const s = settingsRef.current;
      const still = Boolean(motionQuery?.matches);

      if (still) {
        off.x = 0;
        off.y = 0;
        off.zoom = 0;
      } else {
        clock += dt;
        const ease = 1 - Math.exp(-dt / 0.18);
        off.x += (off.tx + Math.sin(clock * 0.21) * s.drift - off.x) * ease;
        off.y += (off.ty + Math.cos(clock * 0.17) * s.drift * 0.6 - off.y) * ease;
        off.zoom += ((hovering ? s.hoverZoom : 0) - off.zoom) * (1 - Math.exp(-dt / 0.35));
      }

      if (s.spotlight) {
        stepSpotlightOffset(root, off, still, hovering, clock, dt);
      } else {
        off.lit = false;
      }

      place();
      if (visible && !still && alive) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || !alive) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    wakeRef.current = wake;

    const onMove = (e: PointerEvent) => {
      const s = settingsRef.current;
      const r = root.getBoundingClientRect();
      off.tx = clamp(((e.clientX - r.left) / (r.width || 1)) * 2 - 1, -1, 1) * -Math.max(0, s.parallax);
      off.ty = clamp(((e.clientY - r.top) / (r.height || 1)) * 2 - 1, -1, 1) * -Math.max(0, s.parallax);
      off.px = ((e.clientX - r.left) / (r.width || 1)) * root.clientWidth;
      off.py = ((e.clientY - r.top) / (r.height || 1)) * root.clientHeight;
      if (s.spotlight) wake();
    };

    const onEnter = (e: PointerEvent) => {
      hovering = e.pointerType !== 'touch';
      onMove(e);
      wake();
    };

    const onLeave = () => {
      hovering = false;
      off.tx = 0;
      off.ty = 0;
      wake();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    io.observe(root);

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointerleave', onLeave);
    wake();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      wakeRef.current = () => {};
      ro.disconnect();
      io.disconnect();
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, [place, sync]);

  useEffect(() => {
    wakeRef.current();
  });

  useEffect(() => {
    const video = mediaRef.current?.querySelector('video');
    if (video && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) video.pause();
  }, [mediaType, src]);

  useIsomorphicLayoutEffect(() => {
    sync();
  }, [sync, words, layoutDepsKey]);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const layer = revealRef.current;
    if (!root || !layer) return undefined;

    const states: GlyphState[] = glyphs.map(() => ({ x: 0, y: 0, s: 1 }));
    statesRef.current = states;
    if (!states.length) return undefined;

    const clearLayer = () => {
      gsap.set(layer, { opacity: 1, scale: 1 });
      layer.style.clipPath = '';
      layer.style.filter = '';
    };

    const settle = () => {
      states.forEach((st) => {
        st.x = 0;
        st.y = 0;
        st.s = 1;
      });
      renderGlyphs();
      clearLayer();
    };

    if (reveal === 'none' || window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      settle();
      return undefined;
    }

    const play = () => {
      tweenRef.current?.kill();
      const size = parseFloat(window.getComputedStyle(root).fontSize) || 48;
      tweenRef.current = createRevealTween({ reveal, size, duration, stagger, glyphs, states, layer, settle, clearLayer, renderGlyphs });
    };

    if (trigger === 'hover') {
      settle();
      root.addEventListener('pointerenter', play);
      return () => {
        root.removeEventListener('pointerenter', play);
        tweenRef.current?.kill();
      };
    }

    if (trigger === 'view') {
      settle();
      applyRestRevealState(reveal, parseFloat(window.getComputedStyle(root).fontSize) || 48, states, layer);
      renderGlyphs();
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            play();
            io.disconnect();
          }
        },
        { threshold: 0.25 }
      );
      io.observe(root);
      return () => {
        io.disconnect();
        tweenRef.current?.kill();
      };
    }

    play();
    return () => tweenRef.current?.kill();
  }, [duration, glyphs, renderGlyphs, reveal, stagger, trigger]);

  return {
    rootRef,
    measureRef,
    revealRef,
    clipRef,
    mediaRef,
    wordRefs,
    baseRefs,
    glyphRefs,
    lineRefs,
  };
}
