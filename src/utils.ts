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
 * Build a WS message for parqet/get_performance, handling both single and
 * aggregated portfolios.
 */
export function buildPerformanceMsg(
  portfolio: { entryId: string; _entryIds?: string[] },
  interval: string,
): Record<string, unknown> {
  const msg: Record<string, unknown> = { type: 'parqet/get_performance', interval };
  if (portfolio._entryIds) {
    msg.entry_ids = portfolio._entryIds;
  } else {
    msg.entry_id = portfolio.entryId;
  }
  return msg;
}

/**
 * Return the list of entry IDs for a portfolio (single or aggregated).
 */
export function getEntryIds(portfolio: { entryId: string; _entryIds?: string[] }): string[] {
  return portfolio._entryIds ?? [portfolio.entryId];
}

/**
 * Check if a WS error is a rate-limit response.
 */
export function isRateLimitError(err: unknown): boolean {
  return !!err && typeof err === 'object' && 'code' in err
    && (err as { code: string }).code === 'rate_limited';
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
