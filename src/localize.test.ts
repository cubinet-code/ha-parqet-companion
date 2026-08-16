import { describe, expect, it } from 'vitest';

import {
  TRANSLATIONS,
  languageFromHass,
  localeForHass,
  t,
} from './localize';

describe('frontend localization', () => {
  it('uses German for Home Assistant German locales', () => {
    const hass = { locale: { language: 'de-DE' } };

    expect(languageFromHass(hass)).toBe('de');
    expect(localeForHass(hass)).toBe('de-DE');
    expect(t('views.holdings', hass)).toBe('Positionen');
    expect(t('performance.totalValue', hass)).toBe('Gesamtwert');
    expect(t('activities.transferIn', hass)).toBe('Übertrag Eingang');
    expect(t('snapshot.name', hass)).toBe('Parqet Tages-Snapshot');
  });

  it('falls back to English for unsupported locales', () => {
    const hass = { locale: { language: 'fr-FR' } };

    expect(languageFromHass(hass)).toBe('en');
    expect(localeForHass(hass)).toBe('en-US');
    expect(t('views.holdings', hass)).toBe('Holdings');
  });

  it('supports the legacy top-level Home Assistant language field', () => {
    expect(t('views.activities', { language: 'de' })).toBe('Aktivitäten');
  });

  it('keeps the English and German dictionaries in sync', () => {
    expect(Object.keys(TRANSLATIONS.de).sort()).toEqual(
      Object.keys(TRANSLATIONS.en).sort(),
    );
  });
});
