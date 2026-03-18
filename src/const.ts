export const DOMAIN = 'parqet';

export const INTERVALS = [
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
  { value: 'mtd', label: 'MTD' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: 'ytd', label: 'YTD' },
  { value: '3y', label: '3Y' },
  { value: '5y', label: '5Y' },
  { value: '10y', label: '10Y' },
  { value: 'max', label: 'Max' },
] as const;

export type IntervalValue = (typeof INTERVALS)[number]['value'];

export const PARQET_BRAND_COLOR = '#009991';
