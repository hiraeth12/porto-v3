'use client';

import React, { useCallback, useMemo, useState, type SetStateAction } from 'react';
import { useStaggeredMenuMotion } from './staggered-menu-motion';

export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link: string;
  key?: string;
}

export interface StaggeredMenuSocialItem {
  label: string;
  link: string;
  key?: string;
}

export interface StaggeredMenuProps {
  position?: 'left' | 'right';
  colors?: string[];
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  showLogo?: boolean;
  renderHeader?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  externalToggleRef?: React.RefObject<HTMLButtonElement | null>;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  isFixed?: boolean;
  changeMenuColorOnOpen?: boolean;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  onCloseComplete?: () => void;
}

const DEFAULT_COLORS = ['#B497CF', '#5227FF'];
const EMPTY_MENU_ITEMS: StaggeredMenuItem[] = [];
const EMPTY_SOCIAL_ITEMS: StaggeredMenuSocialItem[] = [];
const TEXT_LINES = ['Menu', 'Close'];

const STAGGERED_MENU_CSS = `
.sm-scope .staggered-menu-wrapper { position: relative; width: 100%; height: 100%; z-index: 40; pointer-events: none; }
.sm-scope .staggered-menu-wrapper.fixed-wrapper { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 40; overflow: hidden; }
.sm-scope .staggered-menu-header { position: absolute; top: 0; left: 0; width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 2em; background: transparent; pointer-events: none; z-index: 20; }
.sm-scope .staggered-menu-header > * { pointer-events: auto; }
.sm-scope .sm-logo { display: flex; align-items: center; user-select: none; }
.sm-scope .sm-logo-img { display: block; height: 32px; width: auto; object-fit: contain; }
.sm-scope .sm-toggle { position: relative; display: inline-flex; align-items: center; gap: 0.3rem; background: transparent; border: none; cursor: pointer; color: #e9e9ef; font-weight: 500; line-height: 1; overflow: visible; }
.sm-scope .sm-toggle:focus-visible { outline: 2px solid #ffffffaa; outline-offset: 4px; border-radius: 4px; }
.sm-scope .sm-line:last-of-type { margin-top: 6px; }
.sm-scope .sm-toggle-textWrap { position: relative; margin-right: 0.5em; display: inline-block; height: 1em; overflow: hidden; white-space: nowrap; width: var(--sm-toggle-width, auto); min-width: var(--sm-toggle-width, auto); }
.sm-scope .sm-toggle-textInner { display: flex; flex-direction: column; line-height: 1; }
.sm-scope .sm-toggle-line { display: block; height: 1em; line-height: 1; }
.sm-scope .sm-icon { position: relative; width: 14px; height: 14px; flex: 0 0 14px; display: inline-flex; align-items: center; justify-content: center; }
.sm-scope .sm-panel-itemWrap { display: block !important; position: relative; overflow: hidden; line-height: 1; }
.sm-scope .sm-socials-item { display: inline-block !important; }
.sm-scope .sm-icon-line { position: absolute; left: 50%; top: 50%; width: 100%; height: 2px; background: currentColor; border-radius: 2px; transform: translate(-50%, -50%); }
.sm-scope .sm-line { display: none !important; }
.sm-scope .staggered-menu-panel { position: absolute; top: 0; right: 0; width: clamp(260px, 38vw, 420px); height: 100%; background: white; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; flex-direction: column; padding: clamp(4.5em, 8vh, 6em) 2em 2em 2em; overflow-y: auto; -webkit-overflow-scrolling: touch; z-index: 10; }
.sm-scope [data-position='left'] .staggered-menu-panel { right: auto; left: 0; }
.sm-scope .sm-prelayers { position: absolute; top: 0; right: 0; bottom: 0; width: clamp(260px, 38vw, 420px); pointer-events: none; z-index: 5; }
.sm-scope [data-position='left'] .sm-prelayers { right: auto; left: 0; }
.sm-scope .sm-prelayer { position: absolute; top: 0; right: 0; height: 100%; width: 100%; transform: translateX(0); }
.sm-scope .sm-panel-inner { flex: 1; display: flex; flex-direction: column; gap: 1.25rem; }
.sm-scope .sm-socials { margin-top: auto; padding-top: 2rem; display: flex; flex-direction: column; gap: 0.75rem; }
.sm-scope .sm-socials-title { margin: 0; font-size: 1rem; font-weight: 500; color: var(--sm-accent, #ff0000); }
.sm-scope .sm-socials-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: row; align-items: center; gap: 1rem; flex-wrap: wrap; }
.sm-scope .sm-socials-link { font-size: 1.2rem; font-weight: 500; color: #111; text-decoration: none; position: relative; padding: 2px 0; display: inline-block; transition: color 0.3s ease, opacity 0.3s ease; }
.sm-scope .sm-socials-list .sm-socials-link { opacity: 1; transition: opacity 0.3s ease; }
.sm-scope .sm-socials-list:hover .sm-socials-link:not(:hover) { opacity: 0.35; }
.sm-scope .sm-socials-list:focus-within .sm-socials-link:not(:focus-visible) { opacity: 0.35; }
.sm-scope .sm-socials-list .sm-socials-link:hover,
.sm-scope .sm-socials-list .sm-socials-link:focus-visible { opacity: 1; }
.sm-scope .sm-socials-link:focus-visible { outline: 2px solid var(--sm-accent, #ff0000); outline-offset: 3px; }
.sm-scope .sm-socials-link:hover { color: var(--sm-accent, #ff0000); }
.sm-scope .sm-panel-title { margin: 0; font-size: 1rem; font-weight: 600; color: #fff; text-transform: uppercase; }
.sm-scope .sm-panel-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.sm-scope .sm-panel-item { position: relative; color: #000; font-weight: 600; font-size: clamp(2.1rem, 8vw, 3.5rem); cursor: pointer; line-height: 1.05; letter-spacing: -2px; text-transform: uppercase; transition: background 0.25s, color 0.25s; display: inline-block; text-decoration: none; }
.sm-scope .sm-panel-itemLabel { display: inline-block; transform-origin: 50% 100%; }
.sm-scope .staggered-menu-wrapper[data-open] .sm-panel-itemLabel { will-change: transform; }
.sm-scope .sm-panel-item:hover { color: var(--sm-accent, #ff0000); }
.sm-scope .sm-panel-item:focus-visible { color: var(--sm-accent, #ff0000); outline: 2px solid var(--sm-accent, #ff0000); outline-offset: 6px; }
.sm-scope .sm-panel-list[data-numbering] { counter-reset: smItem; }
.sm-scope .sm-panel-list[data-numbering] .sm-panel-item { padding-right: 1.4em; }
.sm-scope .sm-panel-list[data-numbering] .sm-panel-item::after { counter-increment: smItem; content: counter(smItem, decimal-leading-zero); position: absolute; top: 0.1em; right: 3.2em; font-size: 18px; font-weight: 400; color: var(--sm-accent, #ff0000); letter-spacing: 0; pointer-events: none; user-select: none; opacity: var(--sm-num-opacity, 0); }
@media (max-width: 1024px) {
  .sm-scope .staggered-menu-panel { width: 100%; left: 0; right: 0; padding: clamp(4.5rem, 8vh, 6rem) clamp(1.5rem, 4vw, 2.5rem) 2rem clamp(1.5rem, 4vw, 2.5rem); }
  .sm-scope .sm-prelayers { width: 100%; }
  .sm-scope .staggered-menu-wrapper[data-open] .sm-logo-img { filter: invert(100%); }
}
@media (max-width: 640px) {
  .sm-scope .staggered-menu-panel { width: 100%; left: 0; right: 0; padding: clamp(4rem, 7vh, 5.5rem) 1.5rem max(2rem, env(safe-area-inset-bottom, 2rem)) 1.5rem; }
  .sm-scope .sm-prelayers { width: 100%; }
  .sm-scope .staggered-menu-wrapper[data-open] .sm-logo-img { filter: invert(100%); }
  .sm-scope .sm-panel-item { font-size: clamp(2rem, 9vw, 2.75rem); letter-spacing: -1.5px; }
  .sm-scope .sm-socials { padding-top: 1.25rem; padding-bottom: 2.75rem; }
  .sm-scope .sm-socials-link { font-size: 1.05rem; }
}
`;

function StaggeredMenuHeader({
  showLogo,
  logoUrl,
  menuButtonColor,
  open,
  toggleMenu,
  toggleBtnRef,
  textInnerRef,
  iconRef,
  plusHRef,
  plusVRef,
}: {
  showLogo: boolean;
  logoUrl: string;
  menuButtonColor: string;
  open: boolean;
  toggleMenu: () => void;
  toggleBtnRef: React.RefObject<HTMLButtonElement | null>;
  textInnerRef: React.RefObject<HTMLSpanElement | null>;
  iconRef: React.RefObject<HTMLSpanElement | null>;
  plusHRef: React.RefObject<HTMLSpanElement | null>;
  plusVRef: React.RefObject<HTMLSpanElement | null>;
}) {
  return (
    <header
      className="staggered-menu-header absolute top-0 left-0 w-full flex items-center justify-between p-[2em] bg-transparent pointer-events-none z-20"
      aria-label="Main navigation header"
    >
      {showLogo ? (
        <div className="sm-logo flex items-center select-none pointer-events-auto" aria-label="Logo">
          <img
            src={logoUrl || '/src/assets/logos/reactbits-gh-white.svg'}
            alt="Logo"
            className="sm-logo-img block h-8 w-auto object-contain"
            draggable={false}
            width={110}
            height={24}
          />
        </div>
      ) : null}

      <button
        ref={toggleBtnRef}
        className="sm-toggle relative inline-flex items-center gap-[0.3rem] bg-transparent border-0 cursor-pointer font-normal leading-none overflow-visible pointer-events-auto"
        style={{ color: menuButtonColor }}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="staggered-menu-panel"
        onClick={toggleMenu}
        type="button"
      >
        <span
          className="sm-toggle-textWrap relative inline-block h-[1em] overflow-hidden whitespace-nowrap w-[var(--sm-toggle-width,auto)] min-w-[var(--sm-toggle-width,auto)]"
          aria-hidden="true"
        >
          <span ref={textInnerRef} className="sm-toggle-textInner flex flex-col leading-none">
            {TEXT_LINES.map((line) => (
              <span className="sm-toggle-line block h-[1em] leading-none" key={line}>
                {line}
              </span>
            ))}
          </span>
        </span>

        <span
          ref={iconRef}
          className="sm-icon relative w-[14px] h-[14px] shrink-0 inline-flex items-center justify-center"
          aria-hidden="true"
        >
          <span
            ref={plusHRef}
            className="sm-icon-line absolute left-1/2 top-1/2 w-full h-[2px] bg-current rounded-[2px] -translate-x-1/2 -translate-y-1/2"
          />
          <span
            ref={plusVRef}
            className="sm-icon-line sm-icon-line-v absolute left-1/2 top-1/2 w-full h-[2px] bg-current rounded-[2px] -translate-x-1/2 -translate-y-1/2"
          />
        </span>
      </button>
    </header>
  );
}

function StaggeredMenuPanel({
  panelRef,
  open,
  displayItemNumbering,
  items,
  displaySocials,
  socialItems,
  closeMenu,
}: {
  panelRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  displayItemNumbering: boolean;
  items: StaggeredMenuItem[];
  displaySocials: boolean;
  socialItems: StaggeredMenuSocialItem[];
  closeMenu: () => void;
}) {
  const keyedItems = useMemo(() => {
    const counts = new Map<string, number>();
    return items.map((it) => {
      const base = it.key ?? `${it.link}::${it.label}`;
      const seen = counts.get(base) ?? 0;
      counts.set(base, seen + 1);
      return {
        ...it,
        resolvedKey: seen === 0 ? base : `${base}::${seen}`,
      };
    });
  }, [items]);

  const keyedSocials = useMemo(() => {
    const counts = new Map<string, number>();
    return socialItems.map((s) => {
      const base = s.key ?? `${s.link}::${s.label}`;
      const seen = counts.get(base) ?? 0;
      counts.set(base, seen + 1);
      return {
        ...s,
        resolvedKey: seen === 0 ? base : `${base}::${seen}`,
      };
    });
  }, [socialItems]);

  return (
    <aside
      id="staggered-menu-panel"
      ref={panelRef}
      className="staggered-menu-panel absolute top-0 right-0 h-full bg-white flex flex-col p-[6em_2em_2em_2em] overflow-y-auto z-10 backdrop-blur-[12px] pointer-events-auto"
      style={{ WebkitBackdropFilter: 'blur(12px)' }}
      aria-hidden={!open}
    >
      <div className="sm-panel-inner flex-1 flex flex-col gap-5">
        <ul
          className="sm-panel-list list-none m-0 p-0 flex flex-col gap-2"
          data-numbering={displayItemNumbering || undefined}
        >
          {keyedItems.length ? (
            keyedItems.map((it, idx) => (
              <li className="sm-panel-itemWrap relative overflow-hidden leading-none" key={it.resolvedKey}>
                <a
                  className="sm-panel-item relative text-black font-semibold text-[clamp(2.1rem,8vw,3.5rem)] cursor-pointer leading-[1.05] tracking-[-2px] uppercase transition-[background,color] duration-150 ease-linear inline-block no-underline"
                  href={it.link}
                  aria-label={it.ariaLabel}
                  data-index={idx + 1}
                  tabIndex={open ? 0 : -1}
                  onClick={closeMenu}
                >
                  <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%]">
                    {it.label}
                  </span>
                </a>
              </li>
            ))
          ) : (
            <li className="sm-panel-itemWrap relative overflow-hidden leading-none" aria-hidden="true">
              <span className="sm-panel-item relative text-black font-semibold text-[clamp(2.1rem,8vw,3.5rem)] cursor-pointer leading-[1.05] tracking-[-2px] uppercase transition-[background,color] duration-150 ease-linear inline-block no-underline">
                <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%]">
                  No items
                </span>
              </span>
            </li>
          )}
        </ul>

        {displaySocials && keyedSocials.length > 0 ? (
          <div className="sm-socials mt-auto pt-8 flex flex-col gap-3" aria-label="Social links">
            <h3 className="sm-socials-title m-0 text-base font-medium [color:var(--sm-accent,#ff0000)]">
              Socials
            </h3>
            <ul className="sm-socials-list list-none m-0 p-0 flex flex-row items-center gap-4 flex-wrap">
              {keyedSocials.map((s) => (
                <li key={s.resolvedKey} className="sm-socials-item">
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={open ? 0 : -1}
                    className="sm-socials-link text-[1.2rem] font-medium text-[#111] no-underline relative inline-block py-[2px] transition-[color,opacity] duration-300 ease-linear"
                    onClick={closeMenu}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = 'right',
  colors = DEFAULT_COLORS,
  items = EMPTY_MENU_ITEMS,
  socialItems = EMPTY_SOCIAL_ITEMS,
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logoUrl = '/src/assets/logos/reactbits-gh-white.svg',
  showLogo = true,
  renderHeader = true,
  open: controlledOpen,
  onOpenChange,
  externalToggleRef,
  menuButtonColor = '#fff',
  openMenuButtonColor = '#fff',
  changeMenuColorOnOpen = true,
  accentColor = '#5227FF',
  isFixed = false,
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose,
  onCloseComplete,
}: StaggeredMenuProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next: SetStateAction<boolean>) => {
      const resolved = typeof next === 'function' ? next(open) : next;
      if (controlledOpen === undefined) {
        setInternalOpen(resolved);
      }
      onOpenChange?.(resolved);
    },
    [controlledOpen, onOpenChange, open]
  );

  const {
    panelRef,
    preLayersRef,
    plusHRef,
    plusVRef,
    iconRef,
    textInnerRef,
    toggleBtnRef,
    toggleMenu,
    closeMenu,
  } = useStaggeredMenuMotion({
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
  });

  const layerColors = useMemo(() => {
    const raw = colors && colors.length ? colors.slice(0, 4) : ['#1e1e22', '#35353c'];
    const arr = [...raw];
    if (arr.length >= 3) {
      arr.splice(Math.floor(arr.length / 2), 1);
    }
    const counts = new Map<string, number>();
    return arr.map((color) => {
      const seen = counts.get(color) ?? 0;
      counts.set(color, seen + 1);
      return { color, key: seen === 0 ? color : `${color}-${seen}` };
    });
  }, [colors]);

  return (
    <div
      className={`sm-scope z-40 ${isFixed ? 'fixed top-0 left-0 w-screen h-screen overflow-hidden' : 'w-full h-full'}`}
    >
      <div
        className={
          (className ? className + ' ' : '') +
          `staggered-menu-wrapper${isFixed ? ' fixed-wrapper' : ''} pointer-events-none relative w-full h-full z-40`
        }
        style={accentColor ? ({ '--sm-accent': accentColor } as React.CSSProperties) : undefined}
        data-position={position}
        data-open={open || undefined}
      >
        <div
          ref={preLayersRef}
          className="sm-prelayers absolute top-0 right-0 bottom-0 pointer-events-none z-[5]"
          aria-hidden="true"
        >
          {layerColors.map((entry) => (
            <div
              key={entry.key}
              className="sm-prelayer absolute top-0 right-0 h-full w-full translate-x-0"
              style={{ background: entry.color }}
            />
          ))}
        </div>

        {renderHeader ? (
          <StaggeredMenuHeader
            showLogo={showLogo}
            logoUrl={logoUrl}
            menuButtonColor={menuButtonColor}
            open={open}
            toggleMenu={toggleMenu}
            toggleBtnRef={toggleBtnRef}
            textInnerRef={textInnerRef}
            iconRef={iconRef}
            plusHRef={plusHRef}
            plusVRef={plusVRef}
          />
        ) : null}

        <StaggeredMenuPanel
          panelRef={panelRef}
          open={open}
          displayItemNumbering={displayItemNumbering}
          items={items}
          displaySocials={displaySocials}
          socialItems={socialItems}
          closeMenu={closeMenu}
        />
      </div>

      <style>{STAGGERED_MENU_CSS}</style>
    </div>
  );
};

export default StaggeredMenu;
