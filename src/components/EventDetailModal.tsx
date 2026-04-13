import React, { useCallback, useEffect, useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  ArrowRight,
  Mail,
  Info,
  LayoutGrid,
  Images,
  UserCircle,
  Package,
} from 'lucide-react';
import type { Event, EventRegistrationWithExhibitor } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';

const DEFAULT_EVENT_IMAGE =
  'https://images.pexels.com/photos/1099816/pexels-photo-1099816.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop';

export interface EventDetailModalProps {
  event: Event & { image?: string | null; featured?: boolean };
  isOpen: boolean;
  onClose: () => void;
  onRegister: (event: Event & { image?: string | null; featured?: boolean }) => void;
}

type DetailTab = 'overview' | 'layout' | 'exhibitors';

function mapRegistrationRows(data: unknown): EventRegistrationWithExhibitor[] {
  if (!Array.isArray(data)) return [];
  return data.map((r: Record<string, unknown>) => {
    const exRaw = r.exhibitors;
    const ex = (Array.isArray(exRaw) ? exRaw[0] : exRaw) as Record<string, unknown> | null | undefined;
    return {
      id: String(r.id ?? ''),
      boothSize: r.booth_size != null ? String(r.booth_size) : null,
      status: String(r.status ?? 'pending'),
      registrationDate: String(r.registration_date ?? ''),
      exhibitor: {
        companyName: String(ex?.company_name ?? '—'),
        contactPerson: ex?.contact_person != null ? String(ex.contact_person) : null,
        email: ex?.email != null ? String(ex.email) : null,
        phone: ex?.phone != null ? String(ex.phone) : null,
        category: ex?.category != null ? String(ex.category) : null,
        city: ex?.city != null ? String(ex.city) : null,
        booth: ex?.booth != null ? String(ex.booth) : null,
      },
    };
  });
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onRegister,
}) => {
  const [tab, setTab] = useState<DetailTab>('overview');
  const [registrations, setRegistrations] = useState<EventRegistrationWithExhibitor[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setTab('overview');
  }, [isOpen, event.id]);

  const loadRegistrations = useCallback(async () => {
    if (!isSupabaseConfigured() || !event.id) {
      setRegError('Unable to load registrations.');
      setRegistrations([]);
      return;
    }
    setRegLoading(true);
    setRegError(null);
    const { data, error } = await supabase
      .from('event_registrations')
      .select(
        `
        id,
        booth_size,
        status,
        registration_date,
        exhibitors (
          company_name,
          contact_person,
          email,
          phone,
          category,
          city,
          booth
        )
      `
      )
      .eq('event_id', event.id)
      .order('registration_date', { ascending: false });

    if (error) {
      setRegError(error.message);
      setRegistrations([]);
    } else {
      setRegistrations(mapRegistrationRows(data));
    }
    setRegLoading(false);
  }, [event.id]);

  useEffect(() => {
    if (!isOpen || !event.id) {
      setRegistrations([]);
      setRegError(null);
      return;
    }
    loadRegistrations();
  }, [isOpen, event.id, loadRegistrations]);

  if (!isOpen) return null;

  const coverImage =
    (event.eventImageUrl && event.eventImageUrl.trim()) ||
    (event.image && event.image.trim()) ||
    DEFAULT_EVENT_IMAGE;

  const layoutImages = event.layoutImageUrls?.filter(Boolean) ?? [];
  const hasLayout = layoutImages.length > 0;

  const sponsorName = event.sponsorName?.trim() ?? '';
  const sponsorLogo = event.sponsorLogoUrl?.trim() ?? '';
  const hasSponsor = Boolean(sponsorName || sponsorLogo);
  const normalizeSponsorRole = (role?: string | null) => {
    const normalized = (role ?? '').toLowerCase().trim();
    if (normalized === 'title' || normalized === 'title sponsor') return 'Title Sponsor';
    if (normalized === 'co-sponsor' || normalized === 'co sponsor' || normalized === 'co_sponsor')
      return 'Co-Sponsor';
    return 'Sponsor';
  };
  const sponsorRoleLabel = normalizeSponsorRole(event.sponsorRole);
  const showSponsorLogo = Boolean(sponsorLogo);
  const eventDate =
    event.date && typeof event.date === 'string' && event.date.includes('T')
      ? new Date(event.date).toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : event.date ?? '—';

  const footfallLabel =
    event.maxCapacity > 0 ? `${event.maxCapacity.toLocaleString()}+ capacity` : 'Open capacity';

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleRegister = () => {
    onClose();
    onRegister(event);
  };

  const mapsUrl = event.city
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue} ${event.city}`)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`;

  const tabs: { id: DetailTab; label: string; shortLabel: string; icon: React.ReactNode; disabled?: boolean }[] = [
    { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: <LayoutGrid className="h-4 w-4 shrink-0" /> },
    {
      id: 'layout',
      label: `Layout${hasLayout ? ` (${layoutImages.length})` : ''}`,
      shortLabel: 'Layout',
      icon: <Images className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'exhibitors',
      label: `Exhibitors${registrations.length ? ` (${registrations.length})` : ''}`,
      shortLabel: 'Exhibitors',
      icon: <Users className="h-4 w-4 shrink-0" />,
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-on-surface/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-detail-title"
    >
      <div className="bg-background text-on-surface font-body rounded-3xl max-w-5xl w-full max-h-[95vh] min-h-0 overflow-hidden border border-outline-variant/15 shadow-[0_32px_64px_rgba(11,28,48,0.12)] flex flex-col my-4">
        <div className="relative h-56 sm:h-72 md:h-80 shrink-0 overflow-hidden">
          <img
            src={coverImage}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_EVENT_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-on-background/85 via-on-background/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-2xl">
              {event.featured && (
                <span className="bg-primary/30 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3 inline-block">
                  Featured exhibition
                </span>
              )}
              <h2
                id="event-detail-title"
                className="text-white text-3xl sm:text-4xl md:text-5xl font-headline font-extrabold tracking-tight leading-tight"
              >
                {event.title}
              </h2>
              <div className="flex flex-wrap gap-4 mt-3 text-white/90 text-sm">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {eventDate}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {event.venue}
                  {event.city ? `, ${event.city}` : ''}
                </span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl border border-white/10 text-center min-w-[160px]">
              <span className="text-white/70 text-xs uppercase tracking-widest block mb-1">Capacity</span>
              <span className="text-white text-3xl font-headline font-extrabold">
                {event.maxCapacity > 0 ? event.maxCapacity.toLocaleString() : '—'}
              </span>
              <span className="text-primary-fixed-dim text-xs mt-1 block">{footfallLabel}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-on-surface/40 text-white hover:bg-on-surface/60 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 px-4 md:px-8 pt-4 pb-3 border-b border-outline-variant/15 bg-surface-container-low/60">
          <div
            className="grid grid-cols-3 gap-1 sm:gap-0 rounded-2xl p-1 sm:p-1 bg-surface-container-high/80 border border-outline-variant/25 shadow-inner"
            role="tablist"
            aria-label="Event detail sections"
          >
            {tabs.map(({ id, label, shortLabel, icon, disabled }) => {
              const selected = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`event-detail-panel-${id}`}
                  id={`event-detail-tab-${id}`}
                  disabled={disabled}
                  onClick={() => !disabled && setTab(id)}
                  className={[
                    'group relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 min-w-0 py-2.5 px-1 sm:px-3 rounded-xl text-center font-headline font-semibold text-xs sm:text-sm transition-all duration-200',
                    selected
                      ? 'bg-surface-container-lowest text-primary shadow-md ring-1 ring-outline-variant/20 z-10'
                      : disabled
                        ? 'text-outline-variant/60 cursor-not-allowed opacity-60'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/70',
                  ].join(' ')}
                >
                  <span
                    className={
                      selected ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'
                    }
                  >
                    {icon}
                  </span>
                  <span className="truncate max-w-full leading-tight sm:hidden">{shortLabel}</span>
                  <span className="truncate max-w-full leading-tight hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {tab === 'overview' && (
            <div
              id="event-detail-panel-overview"
              role="tabpanel"
              aria-labelledby="event-detail-tab-overview"
              className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 p-6 md:p-8"
            >
              <div className="md:col-span-8 space-y-8">
                <div className="bg-surface-container-low p-6 md:p-8 rounded-3xl relative overflow-hidden ghost-border">
                  <h3 className="text-2xl font-headline font-extrabold text-on-surface mb-4 tracking-tight">
                    About this event
                  </h3>
                  <p className="text-on-surface-variant text-base leading-relaxed">
                    {event.description?.trim() ||
                      'Join us for this BoothBuzz community exhibition. More details will be shared closer to the date.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-lowest ghost-border">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-outline uppercase tracking-wide">Date</p>
                      <p className="text-on-surface font-semibold font-headline">{eventDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-lowest ghost-border">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-outline uppercase tracking-wide">Time</p>
                      <p className="text-on-surface font-semibold font-headline">{event.time ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-lowest ghost-border sm:col-span-2">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-outline uppercase tracking-wide">Venue</p>
                      <p className="text-on-surface font-semibold font-headline">
                        {event.venue}
                        {event.city ? `, ${event.city}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-lowest ghost-border">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-outline uppercase tracking-wide">Attendees</p>
                      <p className="text-on-surface font-semibold font-headline">
                        {event.attendees ?? 0} / {event.maxCapacity ?? 0}
                      </p>
                    </div>
                  </div>
                </div>

                {hasSponsor && (
                  <div className="pt-2">
                    <h3 className="text-sm font-bold text-outline uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      {sponsorRoleLabel}
                    </h3>
                    <div className="flex items-center gap-3 p-5 rounded-2xl bg-primary-fixed/40 ghost-border">
                      {showSponsorLogo && (
                        <img
                          src={sponsorLogo}
                          alt=""
                          className="h-12 w-auto object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      {sponsorName && <span className="font-semibold text-on-surface font-headline">{sponsorName}</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-4 space-y-6">
                <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-editorial ghost-border">
                  <h3 className="text-lg font-headline font-bold text-on-surface mb-5">Organizer</h3>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center text-on-primary font-black text-xl font-headline">
                      BB
                    </div>
                    <div>
                      <h4 className="font-extrabold text-on-surface font-headline leading-tight">BoothBuzz</h4>
                      <p className="text-sm text-primary font-medium">Verified organizer</p>
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-outline-variant/15">
                    <a
                      href="mailto:info@boothbuzz.in"
                      className="w-full py-3 rounded-xl border border-outline-variant/25 text-on-surface font-semibold hover:bg-surface-container-low transition-all flex items-center justify-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Contact organizer
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full py-3 rounded-xl bg-secondary-fixed text-on-secondary-fixed font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <Info className="h-4 w-4" />
                      View all events
                    </button>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-editorial ghost-border">
                  <div className="aspect-video rounded-2xl overflow-hidden mb-3 bg-surface-container-low">
                    <img
                      src={coverImage}
                      alt=""
                      className="w-full h-full object-cover opacity-90"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_EVENT_IMAGE;
                      }}
                    />
                  </div>
                  <h4 className="font-bold font-headline text-on-surface">Location</h4>
                  <p className="text-sm text-on-surface-variant mt-1 mb-3">
                    {event.venue}
                    {event.city ? `, ${event.city}` : ''}
                  </p>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm font-bold inline-flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Get directions <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {tab === 'layout' && (
            <div
              id="event-detail-panel-layout"
              role="tabpanel"
              aria-labelledby="event-detail-tab-layout"
              className="p-6 md:p-8"
            >
              {hasLayout ? (
                <>
                  <p className="text-sm text-on-surface-variant mb-4 max-w-2xl">
                    Floor plans and layout references from the organizer (from{' '}
                    <code className="text-xs bg-surface-container-low px-1 rounded">layout_image_url</code> /{' '}
                    <code className="text-xs bg-surface-container-low px-1 rounded">layout_image_urls</code>).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {layoutImages.map((url, i) => (
                      <a
                        key={`${url}-${i}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block rounded-2xl overflow-hidden bg-surface-container-low ghost-border border border-outline-variant/15 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-[4/3] overflow-hidden">
                          <img
                            src={url}
                            alt={`Layout ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.opacity = '0.3';
                            }}
                          />
                        </div>
                        <div className="px-3 py-2 flex items-center justify-between text-xs font-semibold text-primary">
                          <span>Image {i + 1}</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">Open full size →</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 px-4 rounded-2xl bg-surface-container-low/50 ghost-border border border-dashed border-outline-variant/25">
                  <Images className="h-12 w-12 text-outline-variant mx-auto mb-3 opacity-60" />
                  <p className="text-on-surface font-headline font-semibold">No layout images yet</p>
                  <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
                    Layout photos can be added in the database on <strong>events.layout_image_url</strong> or{' '}
                    <strong>events.layout_image_urls</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === 'exhibitors' && (
            <div
              id="event-detail-panel-exhibitors"
              role="tabpanel"
              aria-labelledby="event-detail-tab-exhibitors"
              className="p-6 md:p-8"
            >
              {regLoading ? (
                <p className="text-sm text-on-surface-variant text-center py-12">Loading exhibitors…</p>
              ) : regError ? (
                <p className="text-sm text-red-600 text-center py-8">{regError}</p>
              ) : registrations.length === 0 ? (
                <div className="text-center py-14 px-4 rounded-2xl bg-surface-container-low/40 border border-dashed border-outline-variant/20">
                  <UserCircle className="h-12 w-12 text-outline-variant mx-auto mb-3 opacity-50" />
                  <p className="font-headline font-semibold text-on-surface">No registrations yet</p>
                  <p className="text-sm text-on-surface-variant mt-2 max-w-sm mx-auto">
                    Exhibitors who register for this event will appear here with booth details.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {registrations.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-2xl bg-surface-container-lowest ghost-border border border-outline-variant/15 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-headline font-bold text-on-surface text-lg leading-tight">
                          {row.exhibitor.companyName}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-on-surface-variant">
                          {row.exhibitor.contactPerson && (
                            <span className="inline-flex items-center gap-1">
                              <UserCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
                              {row.exhibitor.contactPerson}
                            </span>
                          )}
                          {row.exhibitor.category && <span>{row.exhibitor.category}</span>}
                          {row.exhibitor.city && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              {row.exhibitor.city}
                            </span>
                          )}
                        </div>
                        {(row.exhibitor.email || row.exhibitor.phone) && (
                          <p className="mt-2 text-xs text-on-surface-variant truncate">
                            {row.exhibitor.email}
                            {row.exhibitor.email && row.exhibitor.phone ? ' · ' : ''}
                            {row.exhibitor.phone}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-row sm:flex-col gap-2 sm:items-end shrink-0">
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${
                            row.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {row.status}
                        </span>
                        <div className="flex items-start gap-2 rounded-xl bg-primary-fixed/30 px-3 py-2 text-sm">
                          <Package className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-outline uppercase tracking-wide">Booth</p>
                            <p className="font-semibold text-on-surface font-headline">
                              {row.boothSize?.trim() || row.exhibitor.booth?.trim() || '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          </div>

          <div className="shrink-0 px-6 md:px-8 pb-6 pt-4 flex flex-wrap gap-3 border-t border-outline-variant/15 bg-surface-container-low/40">
            <button
              type="button"
              onClick={handleRegister}
              className="px-8 py-3.5 text-sm font-bold text-on-primary bg-primary rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              Register for this event <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 text-sm font-semibold text-on-surface bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
