/**
 * Ad slot configuration: placement IDs, formats, and dimensions.
 * Enable/disable slots or A/B test by toggling or swapping config.
 */

export type AdFormat = 'leaderboard' | 'rectangle' | 'native' | 'sticky-bottom' | 'sticky-side' | 'footer';

export interface AdSlotConfig {
  slotId: string;
  format: AdFormat;
  width: number;
  height: number;
  label?: string; // "Ad" or "Sponsored"
  enabled?: boolean;
}

export const AD_SLOTS: Record<string, AdSlotConfig> = {
  top_strip: {
    slotId: 'top_strip',
    format: 'leaderboard',
    width: 728,
    height: 90,
    label: 'Ad',
    enabled: true,
  },
  home_about: {
    slotId: 'home_about',
    format: 'leaderboard',
    width: 970,
    height: 90,
    label: 'Sponsored',
    enabled: true,
  },
  events_above: {
    slotId: 'events_above',
    format: 'leaderboard',
    width: 728,
    height: 90,
    label: 'Ad',
    enabled: true,
  },
  events_infeed: {
    slotId: 'events_infeed',
    format: 'native',
    width: 300,
    height: 250,
    label: 'Sponsored',
    enabled: true,
  },
  gallery_middle: {
    slotId: 'gallery_middle',
    format: 'rectangle',
    width: 336,
    height: 280,
    label: 'Ad',
    enabled: true,
  },
  exhibitors_above: {
    slotId: 'exhibitors_above',
    format: 'leaderboard',
    width: 728,
    height: 90,
    label: 'Sponsored',
    enabled: true,
  },
  above_contact: {
    slotId: 'above_contact',
    format: 'leaderboard',
    width: 970,
    height: 90,
    label: 'Ad',
    enabled: true,
  },
  footer: {
    slotId: 'footer',
    format: 'footer',
    width: 0,
    height: 0,
    label: 'Partners',
    enabled: true,
  },
  sticky: {
    slotId: 'sticky',
    format: 'sticky-bottom',
    width: 320,
    height: 50,
    label: 'Ad',
    enabled: true,
  },
};

export function getAdSlotConfig(slotId: string): AdSlotConfig | undefined {
  const config = AD_SLOTS[slotId];
  return config?.enabled !== false ? config : undefined;
}
