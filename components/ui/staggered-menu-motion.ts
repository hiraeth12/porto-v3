'use client';

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import { gsap } from 'gsap';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function resetClosedMenuElements(panel: HTMLDivElement, reduced: boolean): void {
  const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
  if (itemEls.length) {
    gsap.set(itemEls, reduced ? { yPercent: 0, rotate: 0, opacity: 0 } : { yPercent: 140, rotate: 10, opacity: 1 });
  }

  const numberEls = Array.from(
    panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item')
  ) as HTMLElement[];
  if (numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 });

  const socialTitle = panel.querySelector('.sm-socials-title') as HTMLElement | null;
  const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link')) as HTMLElement[];
  if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
  if (socialLinks.length) {
    gsap.set(socialLinks, reduced ? { y: 0, opacity: 0 } : { y: 25, opacity: 0 });
  }
}

function populatePanelItemsTimeline(
  tl: gsap.core.Timeline,
  panel: HTMLDivElement,
  panelInsertTime: number,
  reduced: boolean
): void {
  const panelDuration = reduced ? 0.2 : 0.48;
  const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
  const numberEls = Array.from(
    panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item')
  ) as HTMLElement[];
  const socialTitle = panel.querySelector('.sm-socials-title') as HTMLElement | null;
  const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link')) as HTMLElement[];

  if (itemEls.length) {
    gsap.set(itemEls, reduced ? { yPercent: 0, rotate: 0, opacity: 0 } : { yPercent: 140, rotate: 8, opacity: 1 });
    const itemsStart = panelInsertTime + panelDuration * 0.12;
    tl.to(
      itemEls,
      reduced
        ? { opacity: 1, duration: 0.2, ease: 'power2.out', stagger: { each: 0.03, from: 'start' } }
        : { yPercent: 0, rotate: 0, opacity: 1, duration: 0.56, ease: 'power4.out', stagger: { each: 0.055, from: 'start' } },
      itemsStart
    );
    if (numberEls.length) {
      gsap.set(numberEls, { '--sm-num-opacity': 0 });
      tl.to(
        numberEls,
        { duration: reduced ? 0.2 : 0.45, ease: 'power2.out', '--sm-num-opacity': 1, stagger: { each: 0.055, from: 'start' } },
        itemsStart + 0.06
      );
    }
  }

  if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
  if (socialLinks.length) {
    gsap.set(socialLinks, reduced ? { y: 0, opacity: 0 } : { y: 18, opacity: 0 });
  }

  const socialsStart = panelInsertTime + panelDuration * 0.32;
  if (socialTitle) tl.to(socialTitle, { opacity: 1, duration: reduced ? 0.18 : 0.36, ease: 'power2.out' }, socialsStart);
  if (socialLinks.length) {
    tl.to(
      socialLinks,
      {
        y: 0,
        opacity: 1,
        duration: reduced ? 0.2 : 0.38,
        ease: 'power3.out',
        stagger: { each: reduced ? 0.025 : 0.05, from: 'start' },
        onComplete: () => {
          gsap.set(socialLinks, { clearProps: 'opacity' });
        },
      },
      socialsStart + 0.03
    );
  }
}

function createOpenTimeline(
  panel: HTMLDivElement,
  layers: HTMLElement[],
  position: 'left' | 'right',
  reduced: boolean
): gsap.core.Timeline {
  const offscreen = position === 'left' ? -100 : 100;
  const tl = gsap.timeline({ paused: true });

  if (reduced) {
    gsap.set(layers, { xPercent: 0, opacity: 0 });
    tl.fromTo(
      panel,
      { xPercent: 0, opacity: 0 },
      { xPercent: 0, opacity: 1, duration: 0.2, ease: 'power2.out' },
      0
    );
    populatePanelItemsTimeline(tl, panel, 0, true);
    return tl;
  }

  layers.forEach((el, i) => {
    tl.fromTo(
      el,
      { xPercent: offscreen, opacity: 1 },
      { xPercent: 0, opacity: 1, duration: 0.4, ease: 'power4.out' },
      i * 0.05
    );
  });

  const lastTime = layers.length ? (layers.length - 1) * 0.05 : 0;
  const panelInsertTime = lastTime + (layers.length ? 0.06 : 0);

  tl.fromTo(
    panel,
    { xPercent: offscreen, opacity: 1 },
    { xPercent: 0, opacity: 1, duration: 0.48, ease: 'power4.out' },
    panelInsertTime
  );

  populatePanelItemsTimeline(tl, panel, panelInsertTime, false);
  return tl;
}

export function useStaggeredMenuMotion(params: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  position: 'left' | 'right';
  menuButtonColor: string;
  openMenuButtonColor: string;
  changeMenuColorOnOpen: boolean;
  closeOnClickAway: boolean;
  externalToggleRef?: RefObject<HTMLButtonElement | null>;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  onCloseComplete?: () => void;
}) {
  const {
    open,
    setOpen,
    position,
    menuButtonColor,
    openMenuButtonColor,
    changeMenuColorOnOpen,
    closeOnClickAway,
    externalToggleRef,
    onMenuOpen,
    onMenuClose,
    onCloseComplete,
  } = params;

  const panelRef = useRef<HTMLDivElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);
  const plusHRef = useRef<HTMLSpanElement | null>(null);
  const plusVRef = useRef<HTMLSpanElement | null>(null);
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const textInnerRef = useRef<HTMLSpanElement | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);

  const openRef = useRef(open);
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);
  const itemEntranceTweenRef = useRef<gsap.core.Tween | null>(null);
  const busyRef = useRef(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;

      if (!panel) return;

      const preLayers = preContainer
        ? (Array.from(preContainer.querySelectorAll('.sm-prelayer')) as HTMLElement[])
        : [];
      preLayerElsRef.current = preLayers;

      const offscreen = position === 'left' ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
      if (preContainer) gsap.set(preContainer, { xPercent: 0, opacity: 1 });

      if (plusH) gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
      if (plusV) gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
      if (icon) gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
      if (textInner) gsap.set(textInner, { yPercent: 0 });

      if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });
    return () => ctx.revert();
  }, [menuButtonColor, position]);

  const playOpen = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    busyRef.current = true;
    openTlRef.current?.kill();
    closeTweenRef.current?.kill();
    closeTweenRef.current = null;
    itemEntranceTweenRef.current?.kill();

    const reduced = prefersReducedMotion();
    const tl = createOpenTimeline(panel, preLayerElsRef.current, position, reduced);
    openTlRef.current = tl;
    tl.eventCallback('onComplete', () => {
      busyRef.current = false;
    });
    tl.play(0);
  }, [position]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    itemEntranceTweenRef.current?.kill();

    const panel = panelRef.current;
    if (!panel) return;

    closeTweenRef.current?.kill();
    const reduced = prefersReducedMotion();
    const offscreen = position === 'left' ? -100 : 100;
    closeTweenRef.current = gsap.to([...preLayerElsRef.current, panel], {
      xPercent: reduced ? 0 : offscreen,
      opacity: reduced ? 0 : 1,
      duration: reduced ? 0.18 : 0.32,
      ease: reduced ? 'power2.out' : 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        if (reduced) {
          gsap.set([...preLayerElsRef.current, panel], { xPercent: offscreen, opacity: 1 });
        }
        resetClosedMenuElements(panel, reduced);
        busyRef.current = false;
        onCloseComplete?.();
      },
    });
  }, [onCloseComplete, position]);

  const animateToggleChrome = useCallback(
    (opening: boolean) => {
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      if (plusH && plusV) {
        gsap.to(plusH, {
          rotate: opening ? 45 : 0,
          duration: opening ? 0.8 : 0.35,
          ease: opening ? 'power4.out' : 'power3.inOut',
          overwrite: true,
        });
        gsap.to(plusV, {
          rotate: opening ? 135 : 90,
          duration: opening ? 0.8 : 0.35,
          ease: opening ? 'power4.out' : 'power3.inOut',
          overwrite: true,
        });
      }

      const btn = toggleBtnRef.current;
      if (btn) {
        colorTweenRef.current?.kill();
        if (changeMenuColorOnOpen) {
          colorTweenRef.current = gsap.to(btn, {
            color: opening ? openMenuButtonColor : menuButtonColor,
            delay: 0.18,
            duration: 0.3,
            ease: 'power2.out',
          });
        } else {
          gsap.set(btn, { color: menuButtonColor });
        }
      }

      const inner = textInnerRef.current;
      if (inner) {
        textCycleAnimRef.current?.kill();
        textCycleAnimRef.current = gsap.to(inner, {
          yPercent: opening ? -50 : 0,
          duration: opening ? 0.55 : 0.35,
          ease: opening ? 'power4.out' : 'power3.inOut',
          overwrite: 'auto',
        });
      }
    },
    [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor]
  );

  // Sync external controlled `open` transitions with GSAP timelines
  useEffect(() => {
    if (openRef.current === open) return;
    openRef.current = open;
    if (open) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }
    animateToggleChrome(open);
  }, [animateToggleChrome, onMenuClose, onMenuOpen, open, playClose, playOpen]);

  useEffect(() => {
    const btn = toggleBtnRef.current;
    if (!btn) return;
    const targetColor = changeMenuColorOnOpen && openRef.current ? openMenuButtonColor : menuButtonColor;
    gsap.set(btn, { color: targetColor });
  }, [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor]);

  const closeMenu = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    onMenuClose?.();
    playClose();
    animateToggleChrome(false);
  }, [animateToggleChrome, onMenuClose, playClose, setOpen]);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);
    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }
    animateToggleChrome(target);
  }, [animateToggleChrome, onMenuClose, onMenuOpen, playClose, playOpen, setOpen]);

  const onDismissEvent = useEffectEvent(closeMenu);

  useEffect(() => {
    if (!closeOnClickAway || !open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (toggleBtnRef.current?.contains(target)) return;
      if (externalToggleRef?.current?.contains(target)) return;
      onDismissEvent();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeOnClickAway, externalToggleRef, open]);

  useEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    root.classList.add('sm-scroll-locked');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismissEvent();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      root.classList.remove('sm-scroll-locked');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return {
    panelRef,
    preLayersRef,
    plusHRef,
    plusVRef,
    iconRef,
    textInnerRef,
    toggleBtnRef,
    toggleMenu,
    closeMenu,
  };
}
