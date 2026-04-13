import { Clock, MapPin, Search as SearchIcon, ArrowRight } from 'lucide-react';
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

export type UiEventRow = Omit<Event, 'image'> & {
  image: string;
  featured: boolean;
  cardImageCandidates: string[];
};

export const Events: React.FC = () => {
  const { events, loading: eventsLoading } = useEvents('upcoming');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-10"
              aria-label="Upcoming events"
            >
              {filteredEvents.map((event) => (
                <article
                  key={event.id}
                  className="flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden shadow-editorial hover:shadow-editorial-md transition-all ghost-border border border-outline-variant/10 h-full"
                >
                  <div className="relative aspect-[4/3] bg-surface-container-low shrink-0 overflow-hidden group">
                    <img
                      src={event.image}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => advanceEventCardImage(e, event.cardImageCandidates)}
                    />
                    {event.featured && (
                      <span className="absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-full bg-primary text-on-primary">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1 min-h-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary-fixed px-2 py-1 rounded font-headline truncate">
                        {event.planType || 'Event'}
                      </span>
                      <span className="text-xs font-medium text-secondary shrink-0">{event.date}</span>
                    </div>
                    <h3 className="font-bold text-on-surface font-headline text-lg leading-snug mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    {event.sponsorName?.trim() && (
                      <p className="text-xs text-on-surface-variant mb-2">
                        {formatSponsorRoleLabel(event.sponsorRole)}: {event.sponsorName}
                      </p>
                    )}
                    <p className="text-sm text-on-surface-variant line-clamp-2 mb-4 flex-1">
                      {event.description ?? 'Details coming soon.'}
                    </p>
                    <div className="space-y-1.5 text-sm text-on-surface-variant mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-primary" />
                        {event.time}
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                        <span className="line-clamp-2">
                          {event.venue}
                          {event.city ? `, ${event.city}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => openDetail(event)}
                        className="w-full py-2.5 text-sm font-semibold text-primary border border-outline-variant/25 rounded-xl hover:bg-surface-container-low transition-colors inline-flex items-center justify-center gap-2"
                      >
                        View details <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => registerEvent(event)}
                        className="w-full py-2.5 text-sm font-semibold text-on-primary bg-primary rounded-xl hover:opacity-90 transition-opacity"
                      >
                        Register
                      </button>
                    </div>
                  </div>
                </article>
              ))}
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
    </>
  );
};
