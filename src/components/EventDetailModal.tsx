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
  const [descExpanded, setDescExpanded] = useState(false);
  const [selectedLayoutIndex, setSelectedLayoutIndex] = useState(0);
  const [registrations, setRegistrations] = useState<EventRegistrationWithExhibitor[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTab('overview');
      setDescExpanded(false);
      setSelectedLayoutIndex(0);
    }
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

  const layoutUrlCount = (event.layoutImageUrls?.filter(Boolean) ?? []).length;
  useEffect(() => {
    if (!isOpen) return;
    if (tab === 'layout' && layoutUrlCount > 0) {
      setSelectedLayoutIndex((i) => Math.min(Math.max(i, 0), layoutUrlCount - 1));
    }
  }, [tab, isOpen, layoutUrlCount]);

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

  const aboutText =
    event.description?.trim() ||
    'Join us for this BoothBuzz community exhibition. More details will be shared closer to the date.';
  const showAboutToggle = aboutText.length > 220;

  const eventStatusLabel = (event.status ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

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
      <div className="bg-background text-on-surface font-body rounded-3xl max-w-6xl w-full max-h-[95vh] min-h-0 overflow-hidden border border-outline-variant/15 shadow-[0_32px_64px_rgba(11,28,48,0.12)] flex flex-col my-4">
        <header className="shrink-0 relative border-b border-outline-variant/15 bg-surface-container-lowest/80 px-4 py-3 md:px-5 md:py-4 pr-14 md:pr-16">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-surface-container-high text-on-surface hover:bg-surface-container transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-6">
            <div className="min-w-0 flex-1">
              {event.featured && (
                <span className="text-primary text-[10px] font-bold uppercase tracking-wide mb-1 inline-block">
                  Featured
                </span>
              )}
              <h2
                id="event-detail-title"
                className="text-on-surface text-xl sm:text-2xl md:text-3xl font-headline font-extrabold tracking-tight leading-tight"
              >
                {event.title}
              </h2>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] sm:text-xs text-on-surface-variant">
                <span className="inline-flex items-center gap-1 min-w-0">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">{eventDate}</span>
                </span>
                <span className="inline-flex items-center gap-1 min-w-0">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">{event.time ?? '—'}</span>
                </span>
                <span className="inline-flex items-start gap-1 min-w-0 max-w-full sm:max-w-[70%]">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                  <span className="leading-snug">
                    {event.venue}
                    {event.city ? `, ${event.city}` : ''}
                  </span>
                </span>
              </div>
            </div>
            <div className="shrink-0 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-2 text-center md:text-right">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wide">Capacity</p>
              <p className="text-2xl font-headline font-extrabold text-on-surface leading-tight">
                {event.maxCapacity > 0 ? event.maxCapacity.toLocaleString() : '—'}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          <aside
            className="shrink-0 flex flex-row lg:flex-col gap-2 p-3 border-b lg:border-b-0 lg:border-r border-outline-variant/15 bg-surface-container-low/25 overflow-x-auto lg:overflow-y-auto lg:w-[min(34vw,300px)] xl:w-[320px] max-h-[min(200px,32vh)] lg:max-h-[calc(95vh-10rem)]"
            aria-label="Event images"
          >
            <div className="relative w-[min(42%,200px)] shrink-0 lg:w-full aspect-[4/5] max-h-[min(32vh,280px)] lg:max-h-[min(48vh,400px)] rounded-xl overflow-hidden bg-surface-container-low shadow-editorial ring-1 ring-outline-variant/10">
              <img
                src={coverImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_EVENT_IMAGE;
                }}
              />
            </div>
            {hasLayout && (
              <div className="flex flex-row lg:flex-col gap-2 min-w-0 flex-1 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
                <p className="hidden lg:block text-[10px] font-bold text-outline uppercase tracking-wide px-0.5">
                  Floor plans
                </p>
                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto min-w-0 flex-1 pb-1 lg:pb-0">
                  {layoutImages.map((url, i) => {
                    const selected = tab === 'layout' && selectedLayoutIndex === i;
                    return (
                      <button
                        key={`${url}-${i}`}
                        type="button"
                        onClick={() => {
                          setSelectedLayoutIndex(i);
                          setTab('layout');
                        }}
                        className={[
                          'relative shrink-0 w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] lg:w-full lg:aspect-square lg:max-h-24 rounded-lg overflow-hidden ring-2 transition-shadow bg-surface-container',
                          selected
                            ? 'ring-primary shadow-md'
                            : 'ring-transparent hover:ring-outline-variant/40',
                        ].join(' ')}
                        aria-label={`Layout thumbnail ${i + 1}`}
                        aria-pressed={selected}
                      >
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.opacity = '0.35';
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
            <div
              className="shrink-0 px-3 md:px-5 py-2 border-b border-outline-variant/10 bg-surface-container-lowest/90"
              aria-label="Event summary"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-2 text-[11px] sm:text-xs">
                <div className="flex items-start gap-1.5 min-w-0">
                  <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-bold text-outline uppercase tracking-wide text-[10px]">Plan</p>
                    <p className="font-semibold text-on-surface truncate">{event.planType ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5 min-w-0">
                  <Info className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-bold text-outline uppercase tracking-wide text-[10px]">Status</p>
                    <p className="font-semibold text-on-surface truncate">{eventStatusLabel || '—'}</p>
                  </div>
                </div>
                {hasLayout && (
                  <div className="flex items-start gap-1.5 min-w-0">
                    <Images className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-bold text-outline uppercase tracking-wide text-[10px]">Layouts</p>
                      <p className="font-semibold text-on-surface">{layoutImages.length} image(s)</p>
                    </div>
                  </div>
                )}
                {hasSponsor && sponsorName && (
                  <div className="flex items-start gap-1.5 min-w-0 col-span-2 xl:col-span-1">
                    <Award className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-bold text-outline uppercase tracking-wide text-[10px]">{sponsorRoleLabel}</p>
                      <p className="font-semibold text-on-surface line-clamp-2">{sponsorName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 px-3 md:px-5 pt-2 pb-2 border-b border-outline-variant/10 bg-surface-container-low/50">
              <div
                className="grid grid-cols-3 gap-1 rounded-2xl p-1 bg-surface-container-high/80 border border-outline-variant/25 shadow-inner"
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
                        'group relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 min-w-0 py-2 px-1 sm:px-2 rounded-xl text-center font-headline font-semibold text-xs transition-all duration-200',
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

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {tab === 'overview' && (
            <div
              id="event-detail-panel-overview"
              role="tabpanel"
              aria-labelledby="event-detail-tab-overview"
              className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5 p-4 md:p-5"
            >
              <div className="xl:col-span-2 space-y-4 min-w-0">
                <div className="rounded-2xl bg-surface-container-low/80 p-4 ghost-border border border-outline-variant/10">
                  <h3 className="text-sm font-headline font-bold text-on-surface mb-2 tracking-tight">About</h3>
                  <p
                    id="event-detail-description"
                    className={`text-on-surface-variant text-sm leading-relaxed ${descExpanded ? '' : 'line-clamp-[12]'}`}
                  >
                    {aboutText}
                  </p>
                  {showAboutToggle && (
                    <button
                      type="button"
                      className="mt-2 text-sm font-semibold text-primary hover:underline"
                      aria-expanded={descExpanded}
                      aria-controls="event-detail-description"
                      onClick={() => setDescExpanded((v) => !v)}
                    >
                      {descExpanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>

                {hasSponsor && (
                  <div className="rounded-2xl bg-primary-fixed/30 p-3 ghost-border border border-outline-variant/10">
                    <h3 className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-primary" />
                      {sponsorRoleLabel}
                    </h3>
                    <div className="flex items-center gap-2 min-w-0">
                      {showSponsorLogo && (
                        <img
                          src={sponsorLogo}
                          alt=""
                          className="h-9 w-auto max-w-[100px] object-contain shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      {sponsorName && (
                        <span className="font-semibold text-on-surface font-headline text-sm truncate">{sponsorName}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="xl:col-span-1 space-y-4 min-w-0">
                <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-editorial ghost-border">
                  <h3 className="text-sm font-headline font-bold text-on-surface mb-3">Organizer</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-primary-container flex items-center justify-center text-on-primary font-black text-base font-headline shrink-0">
                      BB
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-on-surface font-headline text-sm leading-tight">BoothBuzz</h4>
                      <p className="text-xs text-primary font-medium">Verified organizer</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-3 border-t border-outline-variant/15">
                    <a
                      href="mailto:info@boothbuzz.in"
                      className="w-full py-2.5 rounded-lg border border-outline-variant/25 text-on-surface text-sm font-semibold hover:bg-surface-container-low transition-all flex items-center justify-center gap-2"
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
                      className="w-full py-2.5 rounded-lg bg-secondary-fixed text-on-secondary-fixed text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <Info className="h-4 w-4" />
                      View all events
                    </button>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-editorial ghost-border">
                  <h4 className="font-bold font-headline text-on-surface text-sm">Location</h4>
                  <p className="text-xs text-on-surface-variant mt-1 mb-2 leading-snug">
                    {event.venue}
                    {event.city ? `, ${event.city}` : ''}
                  </p>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs font-bold inline-flex items-center gap-1 hover:gap-1.5 transition-all"
                  >
                    Get directions <ArrowRight className="h-3.5 w-3.5" />
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
              className="p-4 md:p-5 flex flex-col min-h-0"
            >
              {hasLayout ? (
                <>
                  <p className="text-xs text-on-surface-variant mb-3 leading-snug">
                    Selected plan uses the thumbnails on the left. Open full resolution in a new tab.
                  </p>
                  <div className="rounded-xl overflow-hidden bg-surface-container-low ghost-border border border-outline-variant/15 flex-1 min-h-[200px] max-h-[min(52vh,480px)] flex flex-col">
                    <div className="relative flex-1 min-h-[180px] bg-surface-container">
                      <img
                        src={layoutImages[selectedLayoutIndex]}
                        alt={`Layout ${selectedLayoutIndex + 1}`}
                        className="absolute inset-0 w-full h-full object-contain object-center p-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.opacity = '0.3';
                        }}
                      />
                    </div>
                    <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-t border-outline-variant/10 bg-surface-container-lowest/80">
                      <span className="text-xs font-semibold text-on-surface font-headline">
                        Layout {selectedLayoutIndex + 1} of {layoutImages.length}
                      </span>
                      <a
                        href={layoutImages[selectedLayoutIndex]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-primary inline-flex items-center gap-1 hover:gap-1.5 transition-all"
                      >
                        Open full size <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
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
              className="p-4 md:p-6"
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
                <>
                  <div className="hidden sm:block overflow-x-auto rounded-xl border border-outline-variant/15">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container-low/80 text-[10px] font-bold uppercase tracking-wide text-outline">
                        <tr>
                          <th className="px-3 py-2 font-headline">Company</th>
                          <th className="px-3 py-2 font-headline w-24">Booth</th>
                          <th className="px-3 py-2 font-headline w-28">Status</th>
                          <th className="px-3 py-2 font-headline w-32">City</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {registrations.map((row) => (
                          <tr key={row.id} className="bg-surface-container-lowest/50 hover:bg-surface-container-low/40">
                            <td className="px-3 py-2 font-semibold text-on-surface font-headline max-w-[200px]">
                              <span className="line-clamp-2">{row.exhibitor.companyName}</span>
                            </td>
                            <td className="px-3 py-2 text-on-surface-variant whitespace-nowrap">
                              {row.boothSize?.trim() || row.exhibitor.booth?.trim() || '—'}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-block text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                                  row.status === 'confirmed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : row.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-on-surface-variant truncate max-w-[140px]">
                              {row.exhibitor.city ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ul className="sm:hidden space-y-2" aria-label="Exhibitor registrations">
                    {registrations.map((row) => (
                      <li
                        key={row.id}
                        className="rounded-xl bg-surface-container-lowest ghost-border border border-outline-variant/15 p-3 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-headline font-bold text-on-surface text-sm leading-tight min-w-0">
                            {row.exhibitor.companyName}
                          </p>
                          <span
                            className={`shrink-0 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              row.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {row.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-on-surface-variant">
                          <span className="inline-flex items-center gap-1">
                            <Package className="h-3 w-3 text-primary shrink-0" />
                            {row.boothSize?.trim() || row.exhibitor.booth?.trim() || '—'}
                          </span>
                          {row.exhibitor.city && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {row.exhibitor.city}
                            </span>
                          )}
                        </div>
                        {(row.exhibitor.email || row.exhibitor.phone) && (
                          <p className="text-[10px] text-on-surface-variant truncate">
                            {row.exhibitor.email}
                            {row.exhibitor.email && row.exhibitor.phone ? ' · ' : ''}
                            {row.exhibitor.phone}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

            </div>

          </div>

        </div>

        <div className="sticky bottom-0 z-10 shrink-0 px-4 md:px-6 pb-4 pt-3 flex flex-wrap gap-2 border-t border-outline-variant/20 bg-surface-container-low/95 backdrop-blur-md shadow-[0_-8px_24px_rgba(11,28,48,0.08)]">
          <button
            type="button"
            onClick={handleRegister}
            className="px-6 py-2.5 text-sm font-bold text-on-primary bg-primary rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            Register for this event <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-on-surface bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
