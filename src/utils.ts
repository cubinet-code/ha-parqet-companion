/**
 * Format a currency value with the given symbol.
 */
export function fmtCurrency(v: number | null | undefined, symbol = '€'): string {
  if (v == null) return '—';
  return `${symbol}${v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a value that is already a percentage (e.g. API returns 12.61 for 12.61%).
 */
export function fmtPct(v: number | null | undefined): string {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

/**
 * Return a CSS class based on whether a value is positive, negative, or zero.
 */
export function valueClass(v: number | null | undefined): string {
  if (v == null) return '';
  return v > 0 ? 'positive' : v < 0 ? 'negative' : '';
}

/**
 * Format a date string to a localized short date.
 */
export function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}
