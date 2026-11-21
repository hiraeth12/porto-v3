"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { fanSlot } from "./glass-folder-art";

export interface FolderCardSwapItem {
  id: string;
  label: string;
  description?: string;
  itemCount?: number;
}

export interface FolderCardSwapHandle {
  next: () => void;
  prev: () => void;
  goToFolder: (index: number) => void;
}

export interface FolderCardSwapRenderContext {
  index: number;
  isFront: boolean;
  stackPosition: number;
}

export interface FolderCardSwapProps<T extends FolderCardSwapItem> {
  items: readonly T[];
  renderFolder: (item: T, context: FolderCardSwapRenderContext) => React.ReactNode;
  width?: number;
  height?: number;
  cardDistance?: number;
  verticalDistance?: number;
  depth?: number;
  skewAmount?: number;
  visibleCards?: number;
  autoplay?: boolean;
  delay?: number;
  pauseOnHover?: boolean;
  draggable?: boolean;
  speed?: number;
  bounce?: number;
  parallax?: number;
  hoverSpread?: number;
  dim?: number;
  activeFolderOpen?: boolean;
  onChange?: (frontIndex: number, item: T) => void;
  onEnterFront?: (frontIndex: number, item: T, triggerEl: HTMLElement | null) => void;
  className?: string;
}

type Axis = "x" | "y" | "z" | "r" | "p";
type Vec = { x: number; y: number };
type Pose = Record<Axis, number>;

interface Bounds {
  width: number;
  height: number;
  originX: number;
  originY: number;
}

interface BoundsInput {
  width: number;
  height: number;
  cardDistance: number;
  verticalDistance: number;
  depth: number;
  skewAmount: number;
  visible: number;
  hoverSpread: number;
  headroom: number;
}

interface Settings {
  width: number;
  height: number;
  dx: number;
  dy: number;
  dz: number;
  skew: number;
  visible: number;
  delay: number;
  autoplay: boolean;
  pauseOnHover: boolean;
  draggable: boolean;
  speed: number;
  bounce: number;
  parallax: number;
  hoverSpread: number;
  dim: number;
  activeFolderOpen: boolean;
  bounds: Bounds;
}

interface DeckCard extends Pose {
  el: HTMLDivElement | null;
  shade: HTMLSpanElement | null;
  index: number;
  pos: number;
  from: number;
  hold: number;
  nudge: number;
  phase: "rest" | "exit" | "enter" | "drag";
  dir: Vec;
  tilt: number;
  top: number;
  under: boolean;
  v: Pose;
}

interface DragState {
  id: number;
  index: number;
  startX: number;
  startY: number;
  active: boolean;
  samples: { x: number; y: number; t: number }[];
}

interface EngineState {
  order: number[];
  raf: number;
  last: number;
  timer: number;
  queue: number[];
  layers: number;
  scale: number;
  hovered: boolean;
  overCard: boolean;
  inView: boolean;
  drag: DragState | null;
  spread: number;
  spreadV: number;
  px: number;
  py: number;
  pvx: number;
  pvy: number;
  tx: number;
  ty: number;
  dragged: boolean;
  suppressClickUntil: number;
  autoplay: boolean;
  delay: number;
}

interface ShiftOptions {
  dir?: Vec;
  tilt?: number;
  velocity?: Vec;
}

interface SwapApi {
  next: () => void;
  prev: () => void;
  goToIndex: (cardIndex: number) => void;
  refresh: () => void;
}

const PERSPECTIVE = 900;
const TAU = Math.PI * 2;
const STEP = 1 / 240;
const PAD_X = 24;
const PAD_BOTTOM = 14;
const FAN_HEADROOM = 82;
const AXES: Axis[] = ["x", "y", "z", "r", "p"];
const DOWN: Vec = { x: 0, y: 1 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Uses `fanSlot(index, count)` from `glass-folder-art.ts` (-1 ... +1) to compute
 * normalized stack slot depth [0 ... visible - 1], keeping depth and offset math
 * consistent with GlassFolder's internal fan layout.
 */
function resolveFanSlotDepth(position: number, visible: number): number {
  if (visible <= 1) return 0;
  const clamped = clamp(position, 0, visible - 1);
  const lo = Math.floor(clamped);
  const hi = Math.min(visible - 1, lo + 1);
  const frac = clamped - lo;
  const depthLo = ((fanSlot(lo, visible) + 1) * 0.5) * (visible - 1);
  const depthHi = ((fanSlot(hi, visible) + 1) * 0.5) * (visible - 1);
  return depthLo + (depthHi - depthLo) * frac;
}

function computeStackBounds({
  width,
  height,
  cardDistance,
  verticalDistance,
  depth,
  skewAmount,
  visible,
  hoverSpread,
  headroom,
}: BoundsInput): Bounds {
  const slope = Math.tan((skewAmount * Math.PI) / 180);
  const spread = 1 + Math.max(0, hoverSpread);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < visible; i++) {
    const d = resolveFanSlotDepth(i, visible);
    const scale = PERSPECTIVE / (PERSPECTIVE + d * depth);
    for (const u of [-width / 2, width / 2]) {
      for (const v of [-height / 2, height / 2]) {
        const x = (d * cardDistance * spread + u) * scale;
        const y = (-d * verticalDistance * spread + v + u * slope) * scale;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return {
    width: Math.ceil(maxX - minX + PAD_X * 2),
    height: Math.ceil(maxY - minY + headroom + PAD_BOTTOM),
    originX: Math.round(PAD_X - minX),
    originY: Math.round(headroom - minY),
  };
}

function integratePose(
  card: DeckCard,
  target: Pose,
  omega: number,
  zeta: number,
  dt: number,
): void {
  const k = omega * omega;
  const d = 2 * zeta * omega;
  const steps = Math.max(1, Math.ceil(dt / STEP));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    for (const axis of AXES) {
      const velocity =
        card.v[axis] + (k * (target[axis] - card[axis]) - d * card.v[axis]) * h;
      card.v[axis] = velocity;
      card[axis] += velocity * h;
    }
  }
}

function integrateScalar(
  value: number,
  velocity: number,
  target: number,
  omega: number,
  zeta: number,
  dt: number,
): [number, number] {
  const k = omega * omega;
  const d = 2 * zeta * omega;
  const steps = Math.max(1, Math.ceil(dt / STEP));
  const h = dt / steps;
  let x = value;
  let v = velocity;
  for (let i = 0; i < steps; i++) {
    v += (k * (target - x) - d * v) * h;
    x += v * h;
  }
  return [x, v];
}

function isInteractiveFolderTarget(target: Element | null): boolean {
  if (!target) return false;
  return Boolean(
    target.closest(
      ".gf-sheet, .gf-key, .gf-menu, .gf-menu-item, .fcs-controls, .fcs-back-hit",
    ),
  );
}

function FolderCardSwapInner<T extends FolderCardSwapItem>(
  {
    items,
    renderFolder,
    width = 340,
    height = 326,
    cardDistance = 54,
    verticalDistance = 38,
    depth = 84,
    skewAmount = 3,
    visibleCards = 4,
    autoplay = false,
    delay = 4500,
    pauseOnHover = true,
    draggable = true,
    speed = 1,
    bounce = 0.35,
    parallax = 0.42,
    hoverSpread = 0,
    dim = 0.38,
    activeFolderOpen = false,
    onChange,
    onEnterFront,
    className = "",
  }: FolderCardSwapProps<T>,
  ref: React.ForwardedRef<FolderCardSwapHandle>,
) {
  const reduceMotionHook = useReducedMotion();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const slotRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const shadeRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const shellRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const apiRef = React.useRef<SwapApi | null>(null);
  const onChangeRef = React.useRef(onChange);
  const itemsRef = React.useRef(items);

  const count = items.length;
  const cardWidth = Math.max(200, Number(width) || 340);
  const cardHeight = Math.max(200, Number(height) || 326);
  // All 3 portfolio folders stay visible in the stack (up to 4 max if extended).
  const visible = clamp(Math.round(visibleCards), 1, Math.max(1, count));

  const [orderState, setOrderState] = React.useState<number[]>(() =>
    items.map((_, index) => index),
  );

  const bounds = React.useMemo(
    () =>
      computeStackBounds({
        width: cardWidth,
        height: cardHeight,
        cardDistance,
        verticalDistance,
        depth: Math.max(0, depth),
        skewAmount,
        visible,
        hoverSpread,
        headroom: FAN_HEADROOM,
      }),
    [
      cardWidth,
      cardHeight,
      cardDistance,
      verticalDistance,
      depth,
      skewAmount,
      visible,
      hoverSpread,
    ],
  );

  const settingsRef = React.useRef<Settings>({
    width: cardWidth,
    height: cardHeight,
    dx: cardDistance,
    dy: verticalDistance,
    dz: Math.max(0, depth),
    skew: skewAmount,
    visible,
    delay,
    autoplay,
    pauseOnHover,
    draggable,
    speed: clamp(speed, 0.1, 4),
    bounce: clamp(bounce, 0, 1),
    parallax: clamp(parallax, 0, 1),
    hoverSpread: Math.max(0, hoverSpread),
    dim: clamp(dim, 0, 1),
    activeFolderOpen,
    bounds,
  });

  React.useLayoutEffect(() => {
    onChangeRef.current = onChange;
    itemsRef.current = items;
    settingsRef.current = {
      width: cardWidth,
      height: cardHeight,
      dx: cardDistance,
      dy: verticalDistance,
      dz: Math.max(0, depth),
      skew: skewAmount,
      visible,
      delay,
      autoplay,
      pauseOnHover,
      draggable,
      speed: clamp(speed, 0.1, 4),
      bounce: clamp(bounce, 0, 1),
      parallax: clamp(parallax, 0, 1),
      hoverSpread: Math.max(0, hoverSpread),
      dim: clamp(dim, 0, 1),
      activeFolderOpen,
      bounds,
    };
    apiRef.current?.refresh();
  });

  // Keep non-front folder DOM subtrees inert so keyboard Tab and screen readers
  // only enter the active front folder's internal sheets and menu.
  React.useLayoutEffect(() => {
    const frontIdx = orderState[0] ?? 0;
    shellRefs.current.forEach((shell, idx) => {
      if (!shell) return;
      shell.toggleAttribute("inert", idx !== frontIdx);
    });
  }, [orderState]);

  React.useImperativeHandle(
    ref,
    () => ({
      next: () => apiRef.current?.next(),
      prev: () => apiRef.current?.prev(),
      goToFolder: (index: number) => apiRef.current?.goToIndex(index),
    }),
    [],
  );

  React.useLayoutEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage || !count) return undefined;

    const checkReduced = () =>
      Boolean(reduceMotionHook) ||
      (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

    const s0 = settingsRef.current;
    const deck = Array.from(
      { length: count },
      (_, index): DeckCard => ({
        el: slotRefs.current[index],
        shade: shadeRefs.current[index],
        index,
        pos: index,
        from: index,
        hold: 0,
        nudge: 0,
        phase: "rest",
        dir: { x: 0, y: 1 },
        tilt: 0,
        top: 0,
        under: false,
        x: 0,
        y: 0,
        z: 0,
        r: 0,
        p: index,
        v: { x: 0, y: 0, z: 0, r: 0, p: 0 },
      }),
    );

    const state: EngineState = {
      order: deck.map((card) => card.index),
      raf: 0,
      last: 0,
      timer: 0,
      queue: [],
      layers: 0,
      scale: 1,
      hovered: false,
      overCard: false,
      inView: true,
      drag: null,
      spread: 0,
      spreadV: 0,
      px: 0,
      py: 0,
      pvx: 0,
      pvy: 0,
      tx: 0,
      ty: 0,
      dragged: false,
      suppressClickUntil: 0,
      autoplay: s0.autoplay,
      delay: s0.delay,
    };

    const slot = (position: number, s: Settings): Pose => {
      const q = resolveFanSlotDepth(position, s.visible);
      const spread = 1 + state.spread;
      return {
        x: q * s.dx * spread,
        y: -q * s.dy * spread,
        z: -q * s.dz,
        r: 0,
        p: q,
      };
    };

    const clearance = (s: Settings, dir: Vec) =>
      (Math.abs(dir.x) * s.width + Math.abs(dir.y) * s.height) * 0.28 + 14;

    const targetOf = (card: DeckCard, s: Settings, time: number): Pose => {
      if (card.phase === "exit") {
        const base = slot(0, s);
        const reach = clearance(s, card.dir) * 1.22;
        return {
          x: base.x + card.dir.x * reach,
          y: base.y + card.dir.y * reach,
          z: base.z,
          r: card.tilt,
          p: 0.35,
        };
      }
      if (card.phase === "enter") {
        const base = slot(0, s);
        const reach = clearance(s, DOWN) * 1.22;
        return {
          x: base.x - 28,
          y: base.y + reach,
          z: base.z,
          r: -2.5,
          p: card.p,
        };
      }
      const position = (time < card.hold ? card.from : card.pos) + card.nudge;
      return slot(Math.max(0, position), s);
    };

    const layerOf = (card: DeckCard) => {
      if (card.top) return 1000 + card.top;
      if (card.under) return 1;
      return 10 + (count - card.pos) * 2;
    };

    const write = (card: DeckCard, s: Settings, reduce: boolean) => {
      const { el, shade } = card;
      if (!el) return;
      const depthRatio = clamp(card.p / Math.max(1, s.visible - 1), 0, 1);
      const cardSkew = reduce ? 0 : s.skew;
      const perspScale = PERSPECTIVE / Math.max(180, PERSPECTIVE - card.z);
      if (reduce) {
        const target = slot(card.pos, s);
        const targetScale = PERSPECTIVE / Math.max(180, PERSPECTIVE - target.z);
        el.style.transform = `translate3d(${target.x.toFixed(1)}px, ${target.y.toFixed(1)}px, 0px) scale(${targetScale.toFixed(4)})`;
        el.style.transition = "opacity 160ms ease, transform 160ms ease";
      } else {
        el.style.transform = `translate3d(${card.x.toFixed(2)}px, ${card.y.toFixed(2)}px, 0px) scale(${perspScale.toFixed(4)}) rotate(${card.r.toFixed(3)}deg) skewY(${cardSkew.toFixed(3)}deg)`;
        el.style.transition = "";
      }
      el.style.zIndex = String(layerOf(card));
      const fade = clamp(s.visible - card.p, 0, 1);
      el.style.opacity = fade < 1 ? fade.toFixed(3) : "";
      el.style.visibility = fade <= 0.001 ? "hidden" : "";
      if (shade) {
        shade.style.opacity = (s.dim * 0.58 * depthRatio).toFixed(3);
      }
      el.style.cursor =
        card.phase === "drag"
          ? "grabbing"
          : card.pos > 0
            ? "pointer"
            : s.draggable
              ? "grab"
              : "";
      if (card.pos === 0) el.setAttribute("data-front", "");
      else el.removeAttribute("data-front");
    };

    const writeStage = (s: Settings) => {
      stage.style.perspectiveOrigin = `${s.bounds.originX.toFixed(2)}px ${s.bounds.originY.toFixed(2)}px`;
    };

    const frame = (time: number) => {
      state.raf = 0;
      const s = settingsRef.current;
      const reduce = checkReduced();
      const dt = state.last ? Math.min(0.05, (time - state.last) / 1000) : 1 / 60;
      state.last = time;
      const spd = s.speed;
      const restOmega = TAU * 2.1 * spd;
      const restZeta = reduce ? 1 : 1 - 0.65 * s.bounce;
      const exitOmega = TAU * 3.1 * spd;
      let busy = false;

      const spreadTarget = state.hovered && !reduce ? s.hoverSpread : 0;
      [state.spread, state.spreadV] = integrateScalar(
        state.spread,
        state.spreadV,
        spreadTarget,
        TAU * 1.4,
        0.9,
        dt,
      );
      if (
        Math.abs(state.spread - spreadTarget) > 0.001 ||
        Math.abs(state.spreadV) > 0.001
      ) {
        busy = true;
      } else {
        state.spread = spreadTarget;
        state.spreadV = 0;
      }
      writeStage(s);

      for (const card of deck) {
        if (card.phase === "drag") {
          busy = true;
          write(card, s, reduce);
          continue;
        }
        if (reduce) {
          card.phase = "rest";
          card.top = 0;
          card.under = false;
          card.hold = 0;
          Object.assign(card, slot(card.pos, s));
          card.v = { x: 0, y: 0, z: 0, r: 0, p: 0 };
          write(card, s, true);
          continue;
        }
        const target = targetOf(card, s, time);
        const moving = card.phase === "exit" || card.phase === "enter";
        integratePose(
          card,
          target,
          moving ? exitOmega : restOmega,
          moving ? 1 : restZeta,
          dt,
        );
        if (card.phase === "exit") {
          const base = slot(0, s);
          const travelled = Math.hypot(card.x - base.x, card.y - base.y);
          if (travelled >= clearance(s, card.dir)) {
            card.phase = "rest";
            card.top = 0;
            card.hold = 0;
          }
        } else if (card.phase === "enter") {
          const base = slot(0, s);
          const travelled = Math.hypot(card.x - base.x, card.y - base.y);
          if (travelled >= clearance(s, DOWN)) {
            card.phase = "rest";
            card.under = false;
            card.hold = 0;
          }
        }
        if (card.hold > time || card.phase !== "rest") busy = true;
        for (const axis of AXES) {
          const limit = axis === "p" ? 0.002 : 0.04;
          if (
            Math.abs(target[axis] - card[axis]) > limit ||
            Math.abs(card.v[axis]) > limit
          ) {
            busy = true;
          } else if (card.phase === "rest" && time >= card.hold) {
            card[axis] = target[axis];
            card.v[axis] = 0;
          }
        }
        write(card, s, false);
      }

      if (busy) {
        state.raf = requestAnimationFrame(frame);
      } else {
        state.last = 0;
        for (const card of deck) {
          if (card.top && card.phase === "rest") card.top = 0;
        }
      }
    };

    const wake = () => {
      if (!state.raf) state.raf = requestAnimationFrame(frame);
    };

    const paused = () => {
      const s = settingsRef.current;
      return (
        !s.autoplay ||
        count < 2 ||
        s.activeFolderOpen ||
        (s.pauseOnHover && state.overCard) ||
        state.drag !== null ||
        !state.inView ||
        document.visibilityState === "hidden"
      );
    };

    const schedule = () => {
      window.clearTimeout(state.timer);
      state.timer = 0;
      if (paused()) return;
      state.timer = window.setTimeout(
        () => {
          state.timer = 0;
          shift(1);
        },
        Math.max(400, settingsRef.current.delay),
      );
    };

    const settleOrder = (time: number, stagger: number) => {
      state.order.forEach((index, position) => {
        const card = deck[index];
        if (card.pos === position) return;
        card.from = card.pos;
        card.pos = position;
        card.hold = time + Math.max(0, position) * stagger;
      });
    };

    const commitOrder = () => {
      const nextOrder = [...state.order];
      setOrderState(nextOrder);
      const frontIdx = nextOrder[0];
      const currentItems = itemsRef.current;
      if (frontIdx !== undefined && currentItems[frontIdx]) {
        onChangeRef.current?.(frontIdx, currentItems[frontIdx]);
      }
    };

    const shift = (direction: number, options: ShiftOptions = {}) => {
      if (count < 2) return;
      const s = settingsRef.current;
      const reduce = checkReduced();
      const time = performance.now();
      const stagger = 0.05 / s.speed;

      if (direction > 0) {
        const front = deck[state.order[0]];
        state.order = [...state.order.slice(1), front.index];
        settleOrder(time, reduce ? 0 : stagger * 1000);
        if (!reduce) {
          front.phase = "exit";
          front.dir = options.dir ?? { x: -0.36, y: 0.933 };
          front.tilt = options.tilt ?? -3.2;
          front.top = ++state.layers;
          front.under = false;
          front.nudge = 0;
          front.hold = 0;
          if (options.velocity) {
            front.v.x = options.velocity.x;
            front.v.y = options.velocity.y;
          }
        }
      } else {
        const back = deck[state.order[count - 1]];
        state.order = [back.index, ...state.order.slice(0, count - 1)];
        settleOrder(time, reduce ? 0 : stagger * 1000);
        if (!reduce) {
          back.phase = "enter";
          back.top = 0;
          back.under = true;
          back.nudge = 0;
          back.hold = 0;
        }
      }

      deck.forEach((card) => {
        if (card.phase === "rest") card.nudge = 0;
      });
      commitOrder();
      wake();
      schedule();
    };

    const goToPosition = (position: number) => {
      if (position <= 0) return;
      state.queue.forEach(window.clearTimeout);
      state.queue = [];
      if (checkReduced()) {
        for (let i = 0; i < position; i++) shift(1);
        return;
      }
      const gap = 110 / settingsRef.current.speed;
      for (let i = 0; i < position; i++) {
        state.queue.push(window.setTimeout(() => shift(1), i * gap));
      }
    };

    const goToIndex = (cardIndex: number) => {
      const pos = state.order.indexOf(cardIndex);
      if (pos > 0) goToPosition(pos);
    };

    const fit = () => {
      const s = settingsRef.current;
      const w = root.clientWidth;
      const scale = w > 0 ? Math.min(1, w / s.bounds.width) : 1;
      state.scale = scale > 0 ? scale : 1;
      stage.style.transform = `translate(-50%, -50%) scale(${state.scale.toFixed(4)})`;
    };

    const onMove = (event: PointerEvent) => {
      const s = settingsRef.current;
      if (event.pointerType !== "touch") {
        const wasHovered = state.hovered;
        state.hovered = true;
        const overCard = Boolean(
          (event.target as Element | null)?.closest?.("[data-swap-index]"),
        );
        if (overCard !== state.overCard) {
          state.overCard = overCard;
          schedule();
        }
        if (!wasHovered) wake();
      }

      const drag = state.drag;
      if (!drag || drag.id !== event.pointerId) return;
      if (event.pointerType === "mouse" && (event.buttons & 1) === 0) {
        state.drag = null;
        return;
      }
      const dx = (event.clientX - drag.startX) / state.scale;
      const dy = (event.clientY - drag.startY) / state.scale;
      if (!drag.active) {
        if (Math.hypot(dx, dy) < 6) return;
        drag.active = true;
        state.dragged = true;
        state.suppressClickUntil = performance.now() + 360;
        const card = deck[drag.index];
        card.phase = "drag";
        card.v = { x: 0, y: 0, z: 0, r: 0, p: 0 };
        root.setPointerCapture?.(event.pointerId);
      }
      const card = deck[drag.index];
      const base = slot(0, s);
      card.x = base.x + dx;
      card.y = base.y + dy;
      card.z = base.z;
      card.r = clamp(dx * 0.035, -9, 9);
      card.p = 0;
      const time = performance.now();
      drag.samples.push({ x: card.x, y: card.y, t: time });
      while (drag.samples.length > 2 && time - drag.samples[0].t > 90) {
        drag.samples.shift();
      }
      const progress = clamp(
        Math.hypot(dx, dy) / (Math.min(s.width, s.height) * 0.28),
        0,
        1,
      );
      const next = deck[state.order[1]];
      if (next && next.phase === "rest") next.nudge = -0.22 * progress;
      wake();
    };

    const onLeave = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (state.drag?.active) return;
      state.hovered = false;
      state.overCard = false;
      state.tx = 0;
      state.ty = 0;
      schedule();
      wake();
    };

    const onDown = (event: PointerEvent) => {
      const s = settingsRef.current;
      state.dragged = false;
      if (!s.draggable || event.button > 0 || count < 2) return;
      const targetEl = event.target as Element | null;
      // Never start a card-swap drag from a file card, "more" button, menu item, or deck control
      if (isInteractiveFolderTarget(targetEl)) return;
      const slotEl = targetEl?.closest?.("[data-swap-index]");
      if (!slotEl || !root.contains(slotEl)) return;
      const index = Number(slotEl.getAttribute("data-swap-index"));
      if (index !== state.order[0] || deck[index].phase !== "rest") return;
      state.drag = {
        id: event.pointerId,
        index,
        startX: event.clientX,
        startY: event.clientY,
        active: false,
        samples: [],
      };
      schedule();
    };

    const onUp = (event: PointerEvent) => {
      const drag = state.drag;
      if (!drag || drag.id !== event.pointerId) return;
      state.drag = null;
      if (!drag.active) {
        schedule();
        return;
      }
      state.suppressClickUntil = performance.now() + 320;
      root.releasePointerCapture?.(event.pointerId);
      const s = settingsRef.current;
      const card = deck[drag.index];
      const base = slot(0, s);
      const first = drag.samples[0];
      const lastSample = drag.samples[drag.samples.length - 1];
      const span =
        first && lastSample
          ? Math.max(0.016, (lastSample.t - first.t) / 1000)
          : 1;
      const velocity =
        first && lastSample && lastSample !== first
          ? {
              x: (lastSample.x - first.x) / span,
              y: (lastSample.y - first.y) / span,
            }
          : { x: 0, y: 0 };
      const offset = { x: card.x - base.x, y: card.y - base.y };
      const distance = Math.hypot(offset.x, offset.y);
      const fling = Math.hypot(velocity.x, velocity.y);
      const next = deck[state.order[1]];
      if (next) next.nudge = 0;

      if (
        event.type !== "pointercancel" &&
        (distance > Math.min(s.width, s.height) * 0.26 || fling > 650)
      ) {
        const aim = {
          x: offset.x + velocity.x * 0.12,
          y: offset.y + velocity.y * 0.12,
        };
        const length = Math.hypot(aim.x, aim.y) || 1;
        card.phase = "rest";
        shift(1, {
          dir: { x: aim.x / length, y: aim.y / length },
          tilt: card.r,
          velocity,
        });
      } else {
        card.phase = "rest";
        card.v.x = velocity.x;
        card.v.y = velocity.y;
        wake();
        schedule();
      }
    };

    const onClickCapture = (event: MouseEvent) => {
      if (
        state.dragged ||
        performance.now() < state.suppressClickUntil
      ) {
        state.dragged = false;
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const onClick = (event: MouseEvent) => {
      if (state.dragged || performance.now() < state.suppressClickUntil) {
        state.dragged = false;
        return;
      }
      const targetEl = event.target as Element | null;
      if (isInteractiveFolderTarget(targetEl)) return;
      // Clicking .gf-hit on the front folder toggles open/close of its files; do not swap.
      if (targetEl?.closest?.(".gf-hit")) return;

      const slotEl = targetEl?.closest?.("[data-swap-index]");
      if (!slotEl || !root.contains(slotEl)) return;
      const index = Number(slotEl.getAttribute("data-swap-index"));
      const position = state.order.indexOf(index);
      if (position > 0) {
        goToPosition(position);
      }
    };

    const onVisibility = () => schedule();

    apiRef.current = {
      next: () => shift(1),
      prev: () => shift(-1),
      goToIndex,
      refresh: () => {
        const s = settingsRef.current;
        const reduce = checkReduced();
        deck.forEach((card) => {
          card.el = slotRefs.current[card.index];
          card.shade = shadeRefs.current[card.index];
          write(card, s, reduce);
        });
        if (s.autoplay !== state.autoplay || s.delay !== state.delay) {
          state.autoplay = s.autoplay;
          state.delay = s.delay;
          schedule();
        }
        fit();
        wake();
      },
    };

    const reduceInit = checkReduced();
    deck.forEach((card) => {
      Object.assign(card, slot(card.pos, s0));
    });
    fit();
    writeStage(s0);
    deck.forEach((card) => write(card, s0, reduceInit));
    wake();

    const resizeObserver = new ResizeObserver(fit);
    resizeObserver.observe(root);
    const intersectionObserver = new IntersectionObserver((entries) => {
      state.inView = entries[entries.length - 1]?.isIntersecting ?? true;
      schedule();
    });
    intersectionObserver.observe(root);

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    root.addEventListener("click", onClickCapture, true);
    root.addEventListener("click", onClick);
    document.addEventListener("visibilitychange", onVisibility);
    schedule();

    return () => {
      cancelAnimationFrame(state.raf);
      window.clearTimeout(state.timer);
      state.queue.forEach(window.clearTimeout);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      root.removeEventListener("click", onClickCapture, true);
      root.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVisibility);
      apiRef.current = null;
    };
  }, [count, reduceMotionHook]);

  const frontIndex = orderState[0] ?? 0;
  const frontItem = items[frontIndex] ?? items[0];

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      // Allow internal menu arrow navigation when a folder's "more" menu has focus
      if ((event.target as Element | null)?.closest?.(".gf-menu")) return;
      event.preventDefault();
      apiRef.current?.next();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      if ((event.target as Element | null)?.closest?.(".gf-menu")) return;
      event.preventDefault();
      apiRef.current?.prev();
    } else if (event.key === "Enter" && event.target === event.currentTarget) {
      event.preventDefault();
      if (frontItem) {
        onEnterFront?.(frontIndex, frontItem, rootRef.current);
      }
    }
  };

  const rootStyle = {
    "--fcs-w": `${cardWidth}px`,
    "--fcs-h": `${cardHeight}px`,
    "--fcs-ox": `${bounds.originX}px`,
    "--fcs-oy": `${bounds.originY}px`,
    "--fcs-stage-w": `${bounds.width}px`,
    "--fcs-stage-h": `${bounds.height}px`,
    "--fcs-ratio": `${bounds.width} / ${bounds.height}`,
  } as React.CSSProperties;

  return (
    <m.div
      className={`fcs-wrapper ${className}`.trim()}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: reduceMotionHook ? 0.15 : 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div
        ref={rootRef}
        className="fcs-root"
        style={rootStyle}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Portfolio folders stack"
        onKeyDown={handleKeyDown}
      >
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {frontItem
            ? `${frontItem.label} folder at front, ${orderState.indexOf(frontIndex) + 1} of ${count}`
            : ""}
        </span>

        <div className="fcs-sizer" aria-hidden="true">
          <span className="fcs-sizer-box" />
        </div>

        <div ref={stageRef} className="fcs-stage">
          {items.map((item, index) => {
            const stackPosition = Math.max(0, orderState.indexOf(index));
            const isFront = stackPosition === 0;

            return (
              <div
                key={item.id}
                ref={(node) => {
                  slotRefs.current[index] = node;
                }}
                className="fcs-slot"
                data-swap-index={index}
                data-front={isFront ? "" : undefined}
                role="group"
                aria-label={item.label}
              >
                <m.div
                  className="fcs-slot-entrance"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: reduceMotionHook ? 0.15 : 0.55,
                    delay: reduceMotionHook ? 0 : index * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div
                    ref={(node) => {
                      shellRefs.current[index] = node;
                    }}
                    className="fcs-folder-shell"
                    data-active={isFront ? "true" : "false"}
                  >
                    {renderFolder(item, {
                      index,
                      isFront,
                      stackPosition,
                    })}
                  </div>

                  {!isFront ? (
                    <button
                      type="button"
                      className="fcs-back-hit"
                      aria-label={`Bring ${item.label} folder to front`}
                      onClick={(e) => {
                        e.stopPropagation();
                        apiRef.current?.goToIndex(index);
                      }}
                    />
                  ) : null}

                  <span
                    ref={(node) => {
                      shadeRefs.current[index] = node;
                    }}
                    className="fcs-shade"
                    aria-hidden="true"
                  />
                </m.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* <div className="fcs-controls" role="group" aria-label="Folder stack controls">
        <button
          type="button"
          className="fcs-nav-btn"
          aria-label="Previous folder"
          onClick={() => apiRef.current?.prev()}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <div className="fcs-pills" role="tablist" aria-label="Select active folder">
          {items.map((item, idx) => {
            const active = idx === frontIndex;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Show ${item.label} folder`}
                className={`fcs-pill${active ? " fcs-pill--active" : ""}`}
                onClick={() => {
                  if (!active) apiRef.current?.goToIndex(idx);
                }}
              >
                <span className="fcs-pill-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="fcs-nav-btn"
          aria-label="Next folder"
          onClick={() => apiRef.current?.next()}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div> */}
    </m.div>
  );
}

const FolderCardSwap = React.forwardRef(FolderCardSwapInner) as <
  T extends FolderCardSwapItem,
>(
  props: FolderCardSwapProps<T> & { ref?: React.ForwardedRef<FolderCardSwapHandle> },
) => React.ReactElement;

export default FolderCardSwap;
