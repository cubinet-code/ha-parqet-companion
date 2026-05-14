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

interface PortfolioRoute {
  entryId: string;
  portfolioId: string;
  _portfolios?: Array<{ entryId: string; portfolioId: string }>;
}

/**
 * Build a WS message for parqet/get_performance.
 *
 * - Single portfolio: { entry_id, portfolio_id }
 * - Aggregated under one account: { entry_id, portfolio_ids: [...] }
 *   (multi-account aggregation falls back to the first account; see #6.)
 */
export function buildPerformanceMsg(
  portfolio: PortfolioRoute,
  interval: string,
): Record<string, unknown> {
  const msg: Record<string, unknown> = {
    type: 'parqet/get_performance',
    interval,
  };
  if (portfolio._portfolios && portfolio._portfolios.length > 0) {
    // Aggregated path: take the first entry_id and group portfolio_ids by it
    // (v2 normally has one entry_id per account, so the typical case is one
    // entry_id covering N portfolio_ids).
    const firstEntryId = portfolio._portfolios[0]!.entryId;
    msg.entry_id = firstEntryId;
    msg.portfolio_ids = portfolio._portfolios
      .filter((p) => p.entryId === firstEntryId)
      .map((p) => p.portfolioId);
  } else {
    msg.entry_id = portfolio.entryId;
    msg.portfolio_id = portfolio.portfolioId;
  }
  return msg;
}

/**
 * Return the list of (entry_id, portfolio_id) routes for a portfolio
 * (single or aggregated).
 */
export function getPortfolioRoutes(
  portfolio: PortfolioRoute,
): Array<{ entryId: string; portfolioId: string }> {
  return (
    portfolio._portfolios
    ?? [{ entryId: portfolio.entryId, portfolioId: portfolio.portfolioId }]
  );
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
