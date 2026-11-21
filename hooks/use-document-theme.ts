"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type DocumentTheme = "light" | "dark";

const THEME_CHANGE_EVENT = "portfolio-theme-change";

function subscribeToDocumentTheme(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === "data-theme") {
        onStoreChange();
        break;
      }
    }
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => {
    observer.disconnect();
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

function getClientThemeSnapshot(): DocumentTheme {
  const html = document.documentElement;
  const body = document.body;
  return html.dataset.theme === "dark" || body.dataset.theme === "dark"
    ? "dark"
    : "light";
}

function getServerThemeSnapshot(): DocumentTheme {
  return "light";
}

export function useDocumentTheme(): {
  theme: DocumentTheme;
  toggleTheme: () => void;
} {
  const theme = useSyncExternalStore<DocumentTheme>(
    subscribeToDocumentTheme,
    getClientThemeSnapshot,
    getServerThemeSnapshot,
  );

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    delete html.dataset.loading;
    delete body.dataset.loading;
    html.style.overflow = "";
    body.style.overflow = "";
    if (!html.dataset.theme) {
      html.dataset.theme = getClientThemeSnapshot();
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: DocumentTheme =
      getClientThemeSnapshot() === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  return { theme, toggleTheme };
}
