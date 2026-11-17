/** `auto` follows the OS. `light` and `dark` set `<html data-theme>`, which tokens.css reads on screen only. */
export type Theme = 'auto' | 'light' | 'dark';

export const themes: readonly Theme[] = ['auto', 'light', 'dark'];

/** index.html's inline script reads the same key, to set the theme before the first paint. */
export const themeStorageKey = 'pg-theme';

const isForced = (value: unknown): value is 'light' | 'dark' =>
  value === 'light' || value === 'dark';

export function currentTheme(): Theme {
  const { theme } = document.documentElement.dataset;
  return isForced(theme) ? theme : 'auto';
}

export function storedTheme(): Theme {
  try {
    const theme = localStorage.getItem(themeStorageKey);
    return isForced(theme) ? theme : 'auto';
  } catch {
    // Storage blocked: the theme lasts until the page is left.
    return 'auto';
  }
}

/** Applies `theme` to the document. The meta tag sets the canvas until tokens.css has loaded. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (isForced(theme)) {
    root.dataset.theme = theme;
  } else {
    delete root.dataset.theme;
  }
  document
    .querySelector('meta[name="color-scheme"]')
    ?.setAttribute('content', isForced(theme) ? theme : 'light dark');
}

/** Applies `theme` and keeps it for the next visits. */
export function setTheme(theme: Theme) {
  applyTheme(theme);
  try {
    if (isForced(theme)) {
      localStorage.setItem(themeStorageKey, theme);
    } else {
      localStorage.removeItem(themeStorageKey);
    }
  } catch {
    // Storage blocked: applied, not kept.
  }
}

/**
 * Calls `callback` whenever the colour scheme the page resolves to may have changed: the OS setting, the
 * `data-theme` override, and print, which is always light. Returns the function that stops it.
 */
export function observeColorScheme(callback: () => void) {
  const queries = [
    matchMedia('(prefers-color-scheme: dark)'),
    matchMedia('print'),
  ];
  for (const query of queries) {
    query.addEventListener('change', callback);
  }
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => {
    for (const query of queries) {
      query.removeEventListener('change', callback);
    }
    observer.disconnect();
  };
}
