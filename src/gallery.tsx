import React, { useMemo, useState } from 'react';
import { MapPin, Star, ChevronLeft, ChevronRight, Users, BadgeCheck } from 'lucide-react';
import { useEvents, useTestimonials } from './hooks/useSupabaseData';
import { AdSlot } from './components/AdSlot';
import type { Event } from './types';

const defaultImage =
  'https://images.pexels.com/photos/1099816/pexels-photo-1099816.jpeg?auto=compress&cs=tinysrgb&w=800&fit=crop';

const heroSideImage =
  'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=1000';

function eventCoverImage(e: Pick<Event, 'eventImageUrl' | 'image'> | null | undefined, fallback: string): string {
  if (!e) return fallback;
  const u = (e.eventImageUrl || e.image || '').trim();
  return u || fallback;
}

const ARCHIVE_FILTERS = ['All Events', 'Technology', 'Lifestyle'] as const;

const CATEGORIES: { label: string; bg: string; text: string }[] = [
  { label: 'Cooking', bg: 'bg-primary-fixed/40', text: 'text-primary' },
  { label: 'Art & Craft', bg: 'bg-surface-container-high', text: 'text-on-surface-variant' },
  { label: 'Fashion', bg: 'bg-secondary-fixed/50', text: 'text-secondary' },
  { label: 'Jewelry', bg: 'bg-tertiary-fixed/50', text: 'text-tertiary' },
  { label: 'Handmade', bg: 'bg-primary-fixed/30', text: 'text-on-primary-fixed-variant' },
  { label: 'Photography', bg: 'bg-surface-container', text: 'text-on-surface-variant' },
];

const FALLBACK_TESTIMONIALS: {
  id: string;
  quote: string;
  author: string;
  role: string;
  image: string;
  rating: number;
}[] = [
  {
    id: 'fb-1',
    quote:
      "BoothBuzz transformed our society's parking area into a vibrant marketplace. Flawless organization and overwhelming community response.",
    author: 'Priya Sharma',
    role: 'Society Secretary, Sunrise Apartments',
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    rating: 5,
  },
  {
    id: 'fb-2',
    quote:
      'As a home baker, this exhibition gave me the perfect platform. I received 50+ orders and made wonderful connections.',
    author: 'Meera Patel',
    role: 'Home Baker & Exhibitor',
    image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    rating: 5,
  },
  {
    id: 'fb-3',
    quote:
      'The art exhibition brought our community together like never before. Well-organized and incredibly supportive team.',
    author: 'Rajesh Kumar',
    role: 'Resident, Green Valley Society',
    image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    rating: 5,
  },
  {
    id: 'fb-4',
    quote:
      'Our jewelry exhibition was a huge success. We sold 80% of inventory and gained many new customers.',
    author: 'Anita Desai',
    role: 'Jewelry Designer, Sparkle Creations',
    image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    rating: 5,
  },
  {
    id: 'fb-5',
    quote:
      'The food festival was phenomenal. Our restaurant gained 100+ new regular customers from this single event.',
    author: 'Chef Vikram Singh',
    role: 'Owner, Spice Garden Restaurant',
    image: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    rating: 5,
  },
];

export const Gallery: React.FC<{ title?: string }> = () => {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [archiveFilter, setArchiveFilter] = useState<string>('All Events');
  const { events, loading, error } = useEvents('past');
  const { testimonials, loading: testimonialsLoading, error: testimonialsError } = useTestimonials();

  const testimonialRows =
    testimonials.length > 0
      ? testimonials.map((t) => ({
          id: t.id,
          quote: t.content,
          author: t.authorName,
          role: t.authorTitle ?? '',
          image: (t.avatarUrl || t.imageUrl || '').trim(),
          rating: t.rating,
        }))
      : !testimonialsLoading && (testimonialsError || testimonials.length === 0)
        ? FALLBACK_TESTIMONIALS
        : [];

  const filteredEvents = useMemo(() => {
    if (archiveFilter === 'All Events') return events;
    const key = archiveFilter.toLowerCase();
    return events.filter((e) => {
      const blob = `${e.title ?? ''} ${e.description ?? ''}`.toLowerCase();
      if (key === 'technology') return blob.includes('tech') || blob.includes('digital');
      if (key === 'lifestyle') return blob.includes('life') || blob.includes('fashion') || blob.includes('food');
      return true;
    });
  }, [events, archiveFilter]);

  const stats = useMemo(() => {
    const totalAttendees = events.reduce((sum, e) => sum + (Number(e.attendees) || 0), 0);
    return {
      count: events.length,
      attendees: totalAttendees,
      cities: new Set(events.map((e) => e.city).filter(Boolean)).size,
    };
  }, [events]);

  const scrollGallery = (dir: number) => {
    const el = document.getElementById('gallery-events-container');
    if (el) el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };
  const scrollTestimonials = (dir: number) => {
    const el = document.getElementById('testimonials-container');
    if (el) el.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  const spotlight = filteredEvents[0];
  const bentoRest = filteredEvents.slice(1, 3);
  const railRest = filteredEvents.slice(3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 text-on-surface font-body bg-transparent">
      {/* Hero — Stitch Past Events */}
      <section className="mb-16 md:mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-headline font-extrabold tracking-tight leading-[1.1] text-on-surface mb-6">
              The legacy of <span className="text-primary italic">momentum.</span>
            </h2>
            <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-xl">
              Highlights from community exhibitions — past showcases, footfall, and stories that defined each season.
            </p>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-editorial transform rotate-3 bg-surface-container-low">
              <img
                src={eventCoverImage(spotlight, heroSideImage)}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = heroSideImage;
                }}
              />
            </div>
            <div className="absolute -bottom-6 -left-4 md:-left-8 bg-surface-container-lowest p-6 rounded-2xl shadow-editorial max-w-[200px] ghost-border">
              <span className="text-3xl md:text-4xl font-headline font-extrabold text-primary">{stats.count}+</span>
              <p className="text-xs font-semibold text-secondary uppercase tracking-widest mt-2">Past events</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-surface-container-low py-12 md:py-16 mb-16 md:mb-24 rounded-2xl -mx-4 px-4 sm:mx-0 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <p className="text-xs font-bold text-outline-variant uppercase tracking-widest mb-2">Events hosted</p>
            <p className="text-3xl md:text-4xl font-headline font-extrabold text-on-surface">{stats.count}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-outline-variant uppercase tracking-widest mb-2">Total attendees</p>
            <p className="text-3xl md:text-4xl font-headline font-extrabold text-on-surface">
              {stats.attendees > 999 ? `${(stats.attendees / 1000).toFixed(1)}k` : stats.attendees}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-outline-variant uppercase tracking-widest mb-2">Cities</p>
            <p className="text-3xl md:text-4xl font-headline font-extrabold text-on-surface">{stats.cities || '—'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-outline-variant uppercase tracking-widest mb-2">Community</p>
            <p className="text-3xl md:text-4xl font-headline font-extrabold text-on-surface">100%</p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 mb-10">
        {CATEGORIES.map((cat) => (
          <span
            key={cat.label}
            className={`px-3 py-1.5 text-sm font-medium rounded-xl transition-opacity hover:opacity-90 ${cat.bg} ${cat.text}`}
          >
            {cat.label}
          </span>
        ))}
      </div>

      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mb-8">
        <AdSlot slotId="gallery_middle" className="w-full" />
      </div>

      {/* Archives + bento */}
      <section id="event-archives" className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h3 className="text-3xl md:text-4xl font-headline font-bold text-on-surface mb-3">Event archives</h3>
            <p className="text-on-surface-variant">Browse completed exhibitions from our community.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ARCHIVE_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setArchiveFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors font-headline ${
                  archiveFilter === f
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-on-surface-variant text-sm">Loading…</div>
        ) : error ? (
          <div className="py-16 text-center text-error text-sm">Error: {error}</div>
        ) : filteredEvents.length === 0 ? (
          <p className="text-on-surface-variant py-8">No past events match this filter.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 mb-10">
              {spotlight && (
                <button
                  type="button"
                  onClick={() => setSelectedEvent(spotlight)}
                  className="md:col-span-8 group relative overflow-hidden rounded-[2rem] bg-surface-container text-left shadow-editorial hover:shadow-editorial-md transition-all"
                >
                  <img
                    src={eventCoverImage(spotlight, defaultImage)}
                    alt=""
                    className="w-full h-[320px] md:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultImage;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full text-left">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded-lg flex items-center gap-1">
                        <BadgeCheck className="h-3.5 w-3.5" /> Past event
                      </span>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-lg flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {spotlight.attendees ?? 0} attendees
                      </span>
                    </div>
                    <h4 className="text-2xl md:text-4xl font-headline font-extrabold text-white mb-2">
                      {spotlight.title}
                    </h4>
                    <p className="text-white/75 text-sm md:text-base max-w-lg line-clamp-2">
                      {spotlight.venue}
                      {spotlight.city ? ` • ${spotlight.city}` : ''}
                    </p>
                  </div>
                </button>
              )}
              <div className="md:col-span-4 flex flex-col gap-6">
                {bentoRest.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedEvent(event)}
                    className="text-left rounded-2xl overflow-hidden bg-surface-container-lowest shadow-editorial hover:shadow-editorial-md transition-all ghost-border group"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={eventCoverImage(event, defaultImage)}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultImage;
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold font-headline text-on-surface">{event.title}</h4>
                      <p className="text-sm text-on-surface-variant flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {event.venue}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mb-4">
              <p className="text-sm text-on-surface-variant">Scroll for more</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => scrollGallery(-1)}
                  className="p-2 rounded-xl border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollGallery(1)}
                  className="p-2 rounded-xl border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  aria-label="Next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div
              id="gallery-events-container"
              className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              {railRest.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedEvent(event)}
                  className="flex-shrink-0 w-[280px] sm:w-[300px] text-left bg-surface-container-lowest rounded-2xl overflow-hidden shadow-editorial hover:shadow-editorial-md transition-all ghost-border"
                >
                  <div className="aspect-[4/3] bg-surface-container-low">
                    <img
                      src={eventCoverImage(event, defaultImage)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultImage;
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold font-headline text-on-surface">{event.title}</h4>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-on-surface-variant">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {event.venue}
                    </div>
                    {event.attendees != null && (
                      <p className="mt-1 text-sm text-on-surface-variant">{event.attendees} attendees</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="mt-20 md:mt-24">
        <h3 className="text-2xl font-headline font-bold text-on-surface mb-6">What clients say</h3>
        <div className="flex items-center justify-end gap-1 mb-4">
          <button
            type="button"
            onClick={() => scrollTestimonials(-1)}
            className="p-2 rounded-xl border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-low"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollTestimonials(1)}
            className="p-2 rounded-xl border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-low"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div id="testimonials-container" className="flex gap-5 overflow-x-auto scrollbar-hide pb-2">
          {testimonialsLoading && testimonialRows.length === 0 ? (
            <p className="text-sm text-on-surface-variant py-4">Loading testimonials…</p>
          ) : (
            testimonialRows.map((t) => (
              <div
                key={t.id}
                className="flex-shrink-0 w-[300px] rounded-2xl bg-surface-container-lowest p-6 shadow-editorial ghost-border"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  {t.image ? (
                    <img src={t.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-container-high" aria-hidden />
                  )}
                  <div>
                    <div className="font-medium text-on-surface text-sm font-headline">{t.author}</div>
                    <div className="text-xs text-on-surface-variant">{t.role}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl ghost-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-4">
              <h2 className="text-2xl font-headline font-bold text-on-surface pr-4">{selectedEvent.title}</h2>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="text-on-surface-variant hover:text-on-surface text-2xl leading-none shrink-0"
              >
                &times;
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-on-surface-variant text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {selectedEvent.venue}
              </span>
              <span>{selectedEvent.attendees} attendees</span>
            </div>
            <span className="inline-block mt-3 px-3 py-1 text-xs font-bold rounded-full bg-primary-fixed text-on-primary-fixed-variant">
              {selectedEvent.planType || 'Event'}
            </span>
            <p className="mt-4 text-on-surface-variant leading-relaxed">
              {selectedEvent.description || 'No description.'}
            </p>
            <div className="mt-6 rounded-2xl overflow-hidden">
              <img
                src={eventCoverImage(selectedEvent, defaultImage)}
                alt=""
                className="w-full h-52 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultImage;
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
