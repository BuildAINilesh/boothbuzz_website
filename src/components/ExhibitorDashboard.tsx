import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileEdit,
  LayoutGrid,
  MapPin,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import { useExhibitors, useEvents, useMyExhibitorProfile } from '../hooks/useSupabaseData';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';

const defaultImg =
  'https://images.pexels.com/photos/1099816/pexels-photo-1099816.jpeg?auto=compress&cs=tinysrgb&w=800&fit=crop';
const DEV_EXHIBITOR_PHONE_KEY = 'boothbuzz_exhibitor_phone';

/**
 * Stitch "Dashboard" screen — public snapshot using real exhibitor/event data.
 */
export const ExhibitorDashboard: React.FC<{ onScrollToEvents?: () => void }> = ({
  onScrollToEvents,
}) => {
  const { user } = useAuth();
  const { exhibitors } = useExhibitors();
  const { events } = useEvents('upcoming');
  const { profile } = useMyExhibitorProfile(user?.id ?? null);
  const [devCompanyName, setDevCompanyName] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevExhibitor = async () => {
      if (user) {
        setDevCompanyName(null);
        return;
      }
      const phone = localStorage.getItem(DEV_EXHIBITOR_PHONE_KEY);
      if (!phone) {
        setDevCompanyName(null);
        return;
      }
      const { data } = await supabase
        .from('exhibitors')
        .select('company_name')
        .eq('phone', phone)
        .maybeSingle();
      setDevCompanyName(data?.company_name ?? null);
    };
    fetchDevExhibitor();
  }, [user]);

  const primaryName =
    profile?.companyName?.trim() ||
    devCompanyName?.trim() ||
    exhibitors[0]?.companyName ||
    'Your organization';
  const nextEvent = events[0];
  const approved = exhibitors.filter((e) => e.status === 'confirmed' || e.status === 'checked_in').length;
  const pending = exhibitors.filter((e) => e.status === 'registered').length;
  const draft = 0;
  const openPortalProfile = () => {
    window.dispatchEvent(new CustomEvent('exhibitor-portal-select-tab', { detail: 'profile' }));
    document.getElementById('portal')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-background text-on-surface font-body">
      <section className="mb-10 md:mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-primary font-bold tracking-widest text-xs uppercase mb-2 block">
              Welcome back
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-on-surface font-headline">
              {primaryName}
            </h2>
            <p className="text-on-surface-variant mt-2 text-base md:text-lg max-w-xl">
              Manage your showcase and browse upcoming exhibitions on BoothBuzz.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openPortalProfile}
              className="bg-surface-container-lowest text-primary px-5 py-3 rounded-xl font-semibold shadow-sm hover:bg-surface-container-low transition-all flex items-center gap-2 ghost-border"
            >
              <LayoutGrid className="h-5 w-5" />
              Edit profile
            </button>
            <button
              type="button"
              onClick={onScrollToEvents}
              className="bg-primary text-on-primary px-5 py-3 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2"
            >
              <PlusCircle className="h-5 w-5" />
              Browse events
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="md:col-span-2 bg-surface-container-lowest p-6 md:p-8 rounded-[2rem] shadow-editorial relative overflow-hidden ghost-border">
          <div className="relative z-10">
            <h3 className="text-xl font-bold font-headline text-on-surface mb-6">Next exhibition</h3>
            {nextEvent ? (
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center">
                <div className="w-full sm:w-1/3 rounded-2xl overflow-hidden aspect-video sm:aspect-square bg-surface-container-low">
                  <img
                    src={nextEvent.image || defaultImg}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultImg;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-xs font-bold">
                      {nextEvent.status}
                    </span>
                    {nextEvent.planType && (
                      <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-3 py-1 rounded-full text-xs font-bold">
                        {nextEvent.planType}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xl md:text-2xl font-bold text-on-surface font-headline mb-2">
                    {nextEvent.title}
                  </h4>
                  <p className="text-on-surface-variant flex items-center gap-2 mb-1 text-sm">
                    <Calendar className="h-4 w-4 shrink-0" />
                    {nextEvent.date}
                  </p>
                  <p className="text-on-surface-variant flex items-center gap-2 mb-4 text-sm">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {nextEvent.venue}
                    {nextEvent.city ? `, ${nextEvent.city}` : ''}
                  </p>
                  <button
                    type="button"
                    onClick={onScrollToEvents}
                    className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    View all events <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-on-surface-variant">No upcoming events listed yet. Check back soon.</p>
            )}
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" aria-hidden />
        </div>

        <div className="bg-surface-container-low p-6 md:p-8 rounded-[2rem] flex flex-col justify-between ghost-border">
          <h3 className="text-lg font-bold font-headline text-on-surface mb-4">Exhibitor snapshot</h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="font-medium text-on-surface">Confirmed / checked in</span>
              </div>
              <span className="text-2xl font-bold font-headline">{approved}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="font-medium text-on-surface">Registered</span>
              </div>
              <span className="text-2xl font-bold font-headline">{pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FileEdit className="h-5 w-5" />
                </div>
                <span className="font-medium text-on-surface">Drafts (local)</span>
              </div>
              <span className="text-2xl font-bold font-headline">{draft}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById('exhibitors')?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-8 w-full py-3 bg-white/80 border border-outline-variant/20 rounded-xl font-semibold hover:bg-surface-container-lowest transition-all"
          >
            View all exhibitors
          </button>
        </div>
      </div>
    </div>
  );
};
