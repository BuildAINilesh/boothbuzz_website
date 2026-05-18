import { Calendar, Clock, MapPin, Search as SearchIcon, ArrowRight, Store, X } from 'lucide-react';
import { useEvents } from './hooks/useSupabaseData';
import React, { useMemo, useState } from 'react';
import { EventRegistration } from './components/EventRegistration';
import { EventDetailModal } from './components/EventDetailModal';
import { AdSlot } from './components/AdSlot';
import type { Event } from './types';

const defaultImage =
  'https://images.pexels.com/photos/1099816/pexels-photo-1099816.jpeg?auto=compress&cs=tinysrgb&w=800&fit=crop';

const CATEGORY_CHIPS = ['All Events', 'Fashion', 'Jewellery', 'Tech', 'Art'] as const;

/** Prefer event_image_url (eventImageUrl), then any other mapped image column; dedupe; append generic fallback last for onError chain. */
function buildEventCardImageCandidates(ev: Event, fallback: string): string[] {
  const out: string[] = [];
  const add = (u?: string | null) => {
    const t = typeof u === 'string' ? u.trim() : '';
    if (t && !out.includes(t)) out.push(t);
  };
  add(ev.eventImageUrl);
  add(ev.image);
  if (out.length === 0) return [fallback];
  add(fallback);
  return out;
}

function advanceEventCardImage(e: React.SyntheticEvent<HTMLImageElement>, candidates: string[]) {
  const img = e.currentTarget;
  const i = Number.parseInt(img.dataset.candIdx ?? '0', 10);
  const next = candidates[i + 1];
  if (next) {
    img.dataset.candIdx = String(i + 1);
    img.src = next;
  }
}

function formatCardDate(date: string | undefined): string {
  if (!date) return '—';
  if (typeof date === 'string' && date.includes('T')) {
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return date.slice(0, 10);
    }
  }
  return date.length > 12 ? date.slice(0, 12) : date;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);

function EventStallPrice({ min, max }: { min?: number | null; max?: number | null }) {
  if (min == null || min <= 0) return null;
  const hasRange = max != null && max > min;
  return (
    <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low/70 px-2.5 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-outline">Stall price</p>
      <p className="text-sm font-headline font-extrabold text-on-surface">
        {formatCurrency(min)} {hasRange ? 'onwards' : ''}
      </p>
    </div>
  );
}

export type UiEventRow = Omit<Event, 'image'> & {
  image: string;
  featured: boolean;
  cardImageCandidates: string[];
};

function EventStallBookingBlock({
  booked,
  stallSlotsTotal,
}: {
  booked: number;
  stallSlotsTotal?: number | null;
}) {
  const totalFromStalls = stallSlotsTotal != null && stallSlotsTotal > 0 ? stallSlotsTotal : 0;
  const total = totalFromStalls;
  if (total > 0) {
    const pct = Math.min(100, Math.round((booked / total) * 100));
    const full = booked >= total;
    const open = Math.max(0, total - booked);
    return (
      <div
        className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary-fixed/35 via-surface-container-lowest to-surface-container-low/70 p-3 shadow-sm"
        aria-label={`Stalls booked ${booked} of ${total}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-outline">
              <Store className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
              Stall occupancy
            </p>
            <p className="text-sm font-headline font-extrabold text-on-surface mt-0.5">
              {booked} out of {total} stalls booked
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
              full ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-primary-fixed text-on-primary-fixed'
            }`}
          >
            {pct}%
          </span>
        </div>
        <div className="h-2 mt-2 rounded-full bg-surface-container-high/90 overflow-hidden ring-1 ring-inset ring-outline-variant/10">
          <div
            className={`h-full rounded-full transition-all ${full ? 'bg-tertiary' : 'bg-primary'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-on-surface-variant mt-2 leading-tight">
          {full ? 'All stall slots filled' : `${open} slot${open === 1 ? '' : 's'} still open`}
        </p>
      </div>
    );
  }
  if (booked > 0) {
    return (
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-3">
        <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-outline">
          <Store className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
          Stall occupancy
        </p>
        <p className="text-sm font-headline font-extrabold text-on-surface mt-0.5">
          {booked} stalls booked
        </p>
      </div>
    );
  }
  return null;
}

export const Events: React.FC = () => {
  const { events, loading: eventsLoading } = useEvents('upcoming');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageTitle, setPreviewImageTitle] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [categoryChip, setCategoryChip] = useState<string>('All Events');
  const [dateFilter, setDateFilter] = useState('');

  const mappedEvents = useMemo<UiEventRow[]>(
    () =>
      events.map((event) => {
        const cardImageCandidates = buildEventCardImageCandidates(event, defaultImage);
        return {
          ...event,
          featured: event.planType === 'Plan A',
          image: cardImageCandidates[0],
          cardImageCandidates,
        };
      }),
    [events]
  );

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const e of mappedEvents) {
      const c = e.city?.trim();
      if (c) set.add(c);
    }
    return ['', ...Array.from(set).sort()];
  }, [mappedEvents]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredEvents = mappedEvents.filter((event) => {
    if (cityFilter && (event.city ?? '').trim() !== cityFilter) return false;
    if (dateFilter && event.date) {
      const d = String(event.date).slice(0, 10);
      if (d && d !== dateFilter) return false;
    }
    if (categoryChip !== 'All Events') {
      const key = categoryChip.toLowerCase();
      const blob = `${event.title ?? ''} ${event.description ?? ''}`.toLowerCase();
      const needle = key === 'jewellery' ? 'jewel' : key;
      if (!blob.includes(needle)) return false;
    }
    if (!normalizedQuery) return true;
    const haystack = [
      event.title,
      event.description,
      event.venue,
      event.city,
      event.sponsorName,
      event.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const registerEvent = (event: any) => {
    setSelectedEvent(event);
    setShowRegistration(true);
  };

  const closeRegistration = () => {
    setShowRegistration(false);
    setSelectedEvent(null);
  };

  const openDetail = (event: any) => {
    setSelectedEventForDetail(event);
    setShowDetailModal(true);
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedEventForDetail(null);
  };

  const registerFromDetail = (event: any) => {
    setShowDetailModal(false);
    setSelectedEventForDetail(null);
    setSelectedEvent(event);
    setShowRegistration(true);
  };

  const openImagePreview = (imageUrl: string, title: string) => {
    setPreviewImage(imageUrl);
    setPreviewImageTitle(title);
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
    setPreviewImageTitle('');
  };

  const formatSponsorRoleLabel = (role?: string | null) => {
    const normalized = (role ?? '').toLowerCase().trim();
    if (normalized === 'title' || normalized === 'title sponsor') return 'Title Sponsor';
    if (normalized === 'co-sponsor' || normalized === 'co sponsor' || normalized === 'co_sponsor')
      return 'Co-Sponsor';
    return 'Sponsor';
  };

  if (eventsLoading && !mappedEvents.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <div className="h-64 flex items-center justify-center text-on-surface-variant text-sm font-body">
          Loading events…
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-background text-on-surface font-body pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Hero — Stitch Upcoming Events */}
          <section className="mb-12 md:mb-16">
            <div className="max-w-2xl">
              <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block font-headline">
                BoothBuzz events
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-headline tracking-tight text-on-background leading-[1.05] mb-6">
                The future of <span className="text-primary-container">exhibitions.</span>
              </h2>
              <p className="text-lg text-secondary leading-relaxed max-w-lg">
                Discover upcoming community exhibitions, fairs, and showcases — curated for exhibitors and visitors.
              </p>
            </div>
          </section>
        </div>

        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mb-8">
          <AdSlot slotId="events_above" className="w-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Filters bar */}
          <section className="mb-10 bg-surface-container-low rounded-2xl p-5 md:p-6 flex flex-wrap items-end gap-6 shadow-editorial ghost-border">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-bold text-outline uppercase mb-2 ml-1 font-label tracking-wide">
                City
              </label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full bg-surface-container-lowest border-none rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary/20 font-medium appearance-none cursor-pointer"
              >
                {cities.map((c) => (
                  <option key={c || 'all'} value={c}>
                    {c || 'All cities'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-[2] min-w-[260px]">
              <label className="block text-xs font-bold text-outline uppercase mb-2 ml-1 font-label tracking-wide">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setCategoryChip(chip)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all font-headline ${
                      categoryChip === chip
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-lowest text-secondary hover:bg-primary-fixed hover:text-primary'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-bold text-outline uppercase mb-2 ml-1 font-label tracking-wide">
                Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-surface-container-lowest border-none rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary/20 font-medium"
              />
            </div>
          </section>

          <div className="mb-6">
            <div className="relative w-full max-w-xl">
              <SearchIcon className="h-4 w-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by name, venue, sponsor..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-container-low ghost-border text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
            <p className="text-sm text-on-surface-variant mt-2">
              {searchQuery.trim() || cityFilter || dateFilter || categoryChip !== 'All Events'
                ? `${filteredEvents.length} result(s)`
                : `${mappedEvents.length} upcoming event(s)`}
            </p>
          </div>

          {filteredEvents.length === 0 ? (
            <p className="text-on-surface-variant py-12 text-center">No events match your filters.</p>
          ) : (
            <section
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10"
              aria-label="Upcoming events"
            >
              {filteredEvents.map((event) => {
                const booked = event.registeredExhibitorCount ?? 0;
                return (
                  <article
                    key={event.id}
                    className="flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden shadow-editorial hover:shadow-editorial-md transition-all ghost-border border border-outline-variant/10 h-full min-h-0"
                  >
                    <button
                      type="button"
                      onClick={() => openImagePreview(event.image, event.title || 'Event image')}
                      className="relative aspect-[21/9] shrink-0 bg-surface-container-low overflow-hidden group cursor-zoom-in text-left"
                      aria-label={`Preview image for ${event.title || 'event'}`}
                    >
                      <img
                        src={event.image}
                        alt=""
                        className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => advanceEventCardImage(e, event.cardImageCandidates)}
                      />
                      <span className="absolute bottom-2 right-2 rounded-md bg-on-surface/70 px-2 py-1 text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        View
                      </span>
                      {event.featured && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-on-primary">
                          Featured
                        </span>
                      )}
                    </button>
                    <div className="p-3 sm:p-4 flex flex-col flex-1 min-h-0 min-w-0">
                      <h3 className="font-bold text-on-surface font-headline text-base leading-snug mb-1 line-clamp-2">
                        {event.title}
                      </h3>
                      {event.description?.trim() ? (
                        <p className="text-xs text-on-surface-variant leading-snug line-clamp-3 mb-2">
                          {event.description.trim()}
                        </p>
                      ) : (
                        <p className="text-xs text-on-surface-variant line-clamp-3 mb-2">Details coming soon.</p>
                      )}
                      {event.sponsorName?.trim() && (
                        <p className="text-[10px] text-on-surface-variant mb-1 line-clamp-1">
                          {formatSponsorRoleLabel(event.sponsorRole)}: {event.sponsorName}
                        </p>
                      )}
                      <div className="space-y-2 mb-2 border-t border-outline-variant/10 pt-2 mt-auto text-[10px] text-on-surface-variant">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="inline-flex items-center gap-1" title="Date">
                            <Calendar className="h-3 w-3 shrink-0 text-primary" />
                            {formatCardDate(event.date)}
                          </span>
                          <span className="inline-flex items-center gap-1" title="Time">
                            <Clock className="h-3 w-3 shrink-0 text-primary" />
                            {event.time || '—'}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5 text-on-surface" title="Location">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" aria-hidden />
                          <div className="min-w-0 leading-snug">
                            <span className="block font-medium text-on-surface text-[11px]">{event.venue}</span>
                            {event.city?.trim() ? (
                              <span className="block text-on-surface-variant mt-0.5">{event.city.trim()}</span>
                            ) : null}
                          </div>
                        </div>
                        <EventStallBookingBlock
                          booked={booked}
                          stallSlotsTotal={event.stallSlotsTotal}
                        />
                        <EventStallPrice min={event.stallPriceMin} max={event.stallPriceMax} />
                      </div>
                      <div className="flex flex-col gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => openDetail(event)}
                          className="w-full py-2 text-xs font-semibold text-primary border border-outline-variant/25 rounded-lg hover:bg-surface-container-low transition-colors inline-flex items-center justify-center gap-1.5"
                        >
                          View details <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => registerEvent(event)}
                          className="w-full py-2 text-xs font-semibold text-on-primary bg-primary rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Register
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </div>

      {selectedEventForDetail && showDetailModal && (
        <EventDetailModal
          event={selectedEventForDetail}
          isOpen={showDetailModal}
          onClose={closeDetail}
          onRegister={registerFromDetail}
        />
      )}
      {selectedEvent && showRegistration && (
        <EventRegistration event={selectedEvent} isOpen={showRegistration} onClose={closeRegistration} />
      )}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-on-surface/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeImagePreview}
          role="dialog"
          aria-modal="true"
          aria-label="Event image preview"
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeImagePreview}
              className="absolute top-3 right-3 z-10 rounded-full p-2 bg-on-surface/70 text-white hover:bg-on-surface/85 transition-colors"
              aria-label="Close image preview"
            >
              <X className="h-5 w-5" />
            </button>
            {previewImageTitle ? (
              <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-on-surface/90 to-transparent px-4 py-3 text-sm font-semibold text-white">
                {previewImageTitle}
              </div>
            ) : null}
            <img
              src={previewImage}
              alt={previewImageTitle || 'Event preview'}
              className="w-full h-full max-h-[90vh] object-contain bg-surface-container"
            />
          </div>
        </div>
      )}
    </>
  );
};
