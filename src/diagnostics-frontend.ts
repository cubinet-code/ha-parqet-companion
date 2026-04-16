/**
 * Frontend diagnostics for Parqet card loading.
 *
 * This module captures loading state so that "Configuration error" issues
 * can be diagnosed via `window.__parqetDiag` in the browser console.
 * Import this FIRST in the card entry point.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

interface DiagEntry {
  registered: boolean;
  error?: string;
  timestamp: string;
}

interface ParqetDiag {
  version: string;
  loadedAt: string;
  moduleContext: boolean;
  customElementsAvailable: boolean;
  elements: Record<string, DiagEntry>;
  errors: string[];
}

const diag: ParqetDiag = {
  version: '__VERSION__', // replaced at build time or left as marker
  loadedAt: new Date().toISOString(),
  moduleContext: false,
  customElementsAvailable: typeof customElements !== 'undefined',
  elements: {},
  errors: [],
};

// Detect module context — import.meta is only available in ES modules.
try {
  diag.moduleContext = typeof (import.meta as any)?.url === 'string';
} catch {
  diag.moduleContext = false;
}

(window as any).__parqetDiag = diag;
console.info('[parqet-card] Script executing', {
  loadedAt: diag.loadedAt,
  moduleContext: diag.moduleContext,
  customElements: diag.customElementsAvailable,
});

/**
 * Register a custom element with diagnostic reporting.
 * Use this instead of bare `customElements.define()`.
 */
export function registerElement(name: string, constructor: CustomElementConstructor): void {
  try {
    if (customElements.get(name)) {
      diag.elements[name] = { registered: true, error: 'already-defined', timestamp: new Date().toISOString() };
      return;
    }
    customElements.define(name, constructor);
    diag.elements[name] = { registered: true, timestamp: new Date().toISOString() };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    diag.elements[name] = { registered: false, error: msg, timestamp: new Date().toISOString() };
    console.error(`[parqet-card] Failed to register <${name}>:`, msg);
  }
}

