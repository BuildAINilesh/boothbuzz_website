import React from 'react';
import { getAdSlotConfig, type AdSlotConfig } from '../config/adSlots';
import { MockAdContent } from './MockAdContent';
import { useWebsiteAds } from '../hooks/useSupabaseData';

function slotIdToSectionKey(slotId: string): string {
  if (slotId === 'top_strip' || slotId === 'home_about') return 'home_banner';
  if (slotId === 'events_above' || slotId === 'events_infeed') return 'upcoming_events';
  if (slotId === 'gallery_middle') return 'past_events';
  if (slotId === 'exhibitors_above') return 'our_exhibitors';
  if (slotId === 'above_contact' || slotId === 'footer' || slotId === 'sticky') return 'bottom_ads';
  return slotId;
}

export interface AdSlotProps {
  slotId: string;
  format?: AdSlotConfig['format'];
  className?: string;
  children?: React.ReactNode;
  /** When true, render placeholder only (no children). Used for third-party script div injection. */
  placeholderOnly?: boolean;
}

/**
 * Reusable ad slot: renders a labelled container with optional children (house ad markup).
 * For third-party scripts (e.g. AdSense), pass placeholderOnly and inject the script's div via children or a wrapper.
 * Always shows a visible "Ad" or "Sponsored" label for accessibility and compliance.
 */
export const AdSlot: React.FC<AdSlotProps> = ({
  slotId,
  format,
  className = '',
  children,
  placeholderOnly = false,
}) => {
  const sectionKey = slotIdToSectionKey(slotId);
  const { ads } = useWebsiteAds(sectionKey);
  const config = getAdSlotConfig(slotId);
  if (!config) return null;

  const label = config.label ?? 'Ad';
  const width = config.width;
  const height = config.height;
  const formatClass = format ?? config.format;

  const isStickyBottom = formatClass === 'sticky-bottom';
  const isStickySide = formatClass === 'sticky-side';
  const isFooter = formatClass === 'footer';

  const containerClass = [
    'relative overflow-hidden',
    isStickyBottom && 'fixed bottom-0 left-0 right-0 z-40 md:flex hidden justify-center items-center py-2 bg-white/95 backdrop-blur shadow-[0_-2px_10px_rgba(0,0,0,0.08)] rounded-lg border border-slate-200',
    isStickySide && 'fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:block rounded-lg border border-slate-200 bg-white',
    isFooter && 'bg-transparent border-0',
    !isStickyBottom && !isStickySide && !isFooter && 'w-full min-h-[80px]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const labelClass = [
    'text-[10px] font-medium uppercase tracking-wider text-slate-400',
    isFooter ? 'mb-2' : 'absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded bg-white/90',
  ]
    .filter(Boolean)
    .join(' ');

  const defaultContent = <MockAdContent slotId={slotId} format={formatClass} />;
  const dbContent =
    ads.length > 0 ? (
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 sm:gap-4 snap-x snap-mandatory pb-1">
          {ads.map((ad) => (
            <article
              key={ad.id}
              className="snap-start shrink-0 w-[92%] sm:w-[460px] lg:w-[520px] rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative bg-slate-100">
                {ad.mediaType === 'video' ? (
                  <video
                    src={ad.mediaUrl}
                    poster={ad.thumbnailUrl ?? undefined}
                    className="w-full h-40 sm:h-48 object-cover"
                    controls
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={ad.mediaUrl}
                    alt={ad.title ?? 'Advertisement'}
                    className="w-full h-40 sm:h-48 object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              {(ad.title || ad.ctaText) && (
                <div className="p-3 sm:p-4">
                  {ad.title && <h4 className="font-semibold text-slate-900 text-sm sm:text-base">{ad.title}</h4>}
                  {ad.ctaText && (
                    ad.ctaUrl ? (
                      <a
                        href={ad.ctaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {ad.ctaText}
                      </a>
                    ) : (
                      <span className="mt-2 inline-block text-sm font-medium text-indigo-600">{ad.ctaText}</span>
                    )
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    ) : null;

  const slotContent = placeholderOnly ? (
    <div
      className="w-full bg-slate-200/80 flex items-center justify-center text-slate-400 text-xs"
      style={
        width && height && !isFooter
          ? { width: Math.min(width, 320), height: Math.min(height, 100), maxWidth: '100%' }
          : undefined
      }
      data-ad-slot-id={slotId}
      aria-label={`Advertisement ${slotId}`}
    >
      Ad slot
    </div>
  ) : (
    children ?? dbContent ?? defaultContent
  );

  return (
    <aside className={containerClass} role="complementary" aria-label={`${label} - ${slotId}`}>
      <span className={labelClass}>{label}</span>
      {slotContent}
    </aside>
  );
};
