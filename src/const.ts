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

// All sensor keys as defined in sensor.py SENSOR_DESCRIPTIONS.
// These are the unique_id suffixes and sensors dict keys — never translated.
export const PARQET_SENSOR_KEYS = [
  'total_value', 'xirr', 'ttwror', 'unrealized_gain', 'realized_gain',
  'dividends', 'fees', 'taxes', 'valuation_start', 'unrealized_gain_net',
  'unrealized_return_gross', 'unrealized_return_net', 'realized_gain_net',
  'realized_return_gross', 'realized_return_net', 'dividends_net',
  'dividends_taxes', 'dividends_fees', 'holdings_count', 'net_allocation',
  'positive_allocation', 'negative_allocation',
] as const;

export type ParqetSensorKey = (typeof PARQET_SENSOR_KEYS)[number];

/** Extract the sensor key from a unique_id like "{portfolio_id}_{key}". */
export function sensorKeyFromUniqueId(uniqueId: string): ParqetSensorKey | null {
  for (const key of PARQET_SENSOR_KEYS) {
    if (uniqueId.endsWith('_' + key)) return key;
  }
  return null;
}
