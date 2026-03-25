import React from 'react';
import { X, Calendar, Clock, MapPin, Users, Award } from 'lucide-react';
import type { Event } from '../types';

const DEFAULT_EVENT_IMAGE =
  'https://images.pexels.com/photos/1099816/pexels-photo-1099816.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop';

export interface EventDetailModalProps {
  event: Event & { image?: string | null; featured?: boolean };
  isOpen: boolean;
  onClose: () => void;
  onRegister: (event: Event & { image?: string | null; featured?: boolean }) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onRegister,
}) => {
  if (!isOpen) return null;

  const eventImage = event.image || DEFAULT_EVENT_IMAGE;
  const sponsorName = event.sponsorName?.trim() ?? '';
  const sponsorLogo = event.sponsorLogoUrl?.trim() ?? '';
  const hasSponsor = Boolean(sponsorName || sponsorLogo);
  const normalizeSponsorRole = (role?: string | null) => {
    const normalized = (role ?? '').toLowerCase().trim();
    if (normalized === 'title' || normalized === 'title sponsor') return 'Title Sponsor';
    if (normalized === 'co-sponsor' || normalized === 'co sponsor' || normalized === 'co_sponsor') return 'Co-Sponsor';
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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleRegister = () => {
    onClose();
    onRegister(event);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-detail-title"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden border border-slate-200 shadow-2xl flex flex-col">
        <div className="relative h-52 sm:h-64 flex-shrink-0 overflow-hidden bg-slate-200">
          <img
            src={eventImage}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_EVENT_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <h2 id="event-detail-title" className="text-2xl sm:text-3xl font-bold tracking-tight drop-shadow-sm">
              {event.title}
            </h2>
            {event.planType && (
              <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-white/20 backdrop-blur">
                {event.planType}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 sm:p-6 space-y-6">
            {event.description && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  About this event
                </h3>
                <p className="text-slate-700 leading-relaxed">{event.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Date</p>
                  <p className="text-slate-900 font-medium">{eventDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Time</p>
                  <p className="text-slate-900 font-medium">{event.time ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 sm:col-span-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Venue</p>
                  <p className="text-slate-900 font-medium">
                    {event.venue}
                    {event.city ? `, ${event.city}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Capacity</p>
                  <p className="text-slate-900 font-medium">
                    {event.attendees ?? 0} / {event.maxCapacity ?? 0} attendees
                  </p>
                </div>
              </div>
            </div>

            {hasSponsor && (
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  {sponsorRoleLabel}
                </h3>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50/80 border border-indigo-100">
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
                  {sponsorName && <span className="font-medium text-slate-900">{sponsorName}</span>}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleRegister}
                className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Register for this event
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
