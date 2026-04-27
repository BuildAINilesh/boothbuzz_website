import React, { useMemo, useState } from 'react';
import { Calendar, Clock, LayoutGrid, LogOut, MapPin, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { supabase } from '../supabase';
import { useEvents, useMyExhibitorProfile, useMyRegistrations } from '../hooks/useSupabaseData';

type PortalTab = 'profile' | 'registrations' | 'events';

const DEFAULT_EVENT_IMAGE =
  'https://images.pexels.com/photos/1099816/pexels-photo-1099816.jpeg?auto=compress&cs=tinysrgb&w=800&fit=crop';
const DEV_OTP = '123456';
const DEV_EXHIBITOR_PHONE_KEY = 'boothbuzz_exhibitor_phone';

export const ExhibitorPortal: React.FC = () => {
  const { user, signOut } = useAuth();
  const [devPhoneSession, setDevPhoneSession] = useState<string | null>(() =>
    localStorage.getItem(DEV_EXHIBITOR_PHONE_KEY)
  );
  const [devProfile, setDevProfile] = useState<any | null>(null);
  const [devProfileLoading, setDevProfileLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [tab, setTab] = useState<PortalTab>('profile');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveErr, setSaveErr] = useState('');
  const [registerLoadingId, setRegisterLoadingId] = useState<string | null>(null);

  const { profile, loading: profileLoading, refetch: refetchProfile } = useMyExhibitorProfile(user?.id ?? null);
  const effectiveProfile = user ? profile : devProfile;
  const { registrations, loading: regLoading, refetch: refetchRegs } = useMyRegistrations(effectiveProfile?.id ?? null);
  const { events, loading: eventsLoading } = useEvents('upcoming');

  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    category: '',
    city: '',
    website: '',
    companyDescription: '',
  });

  React.useEffect(() => {
    if (!effectiveProfile) return;
    setForm({
      companyName: effectiveProfile.companyName ?? '',
      contactPerson: effectiveProfile.contactPerson ?? '',
      email: effectiveProfile.email ?? '',
      phone: effectiveProfile.phone ?? '',
      category: effectiveProfile.category ?? '',
      city: effectiveProfile.city ?? '',
      website: effectiveProfile.website ?? '',
      companyDescription: effectiveProfile.companyDescription ?? '',
    });
  }, [effectiveProfile]);

  React.useEffect(() => {
    const fetchDevProfile = async () => {
      if (user || !devPhoneSession) {
        setDevProfile(null);
        return;
      }
      setDevProfileLoading(true);
      const { data } = await supabase
        .from('exhibitors')
        .select('*')
        .eq('phone', devPhoneSession)
        .maybeSingle();
      if (data) {
        setDevProfile({
          id: data.id,
          companyName: data.company_name,
          contactPerson: data.contact_person,
          email: data.email,
          phone: data.phone,
          category: data.category,
          city: data.city,
          website: data.website,
          companyDescription: data.company_description,
          status: data.status,
          paymentStatus: data.payment_status,
        });
      } else {
        setDevProfile(null);
      }
      setDevProfileLoading(false);
    };
    fetchDevProfile();
  }, [user, devPhoneSession]);

  React.useEffect(() => {
    const onSelectTab = (event: Event) => {
      const custom = event as CustomEvent<string>;
      if (custom.detail === 'profile') setTab('profile');
      if (custom.detail === 'registrations') setTab('registrations');
      if (custom.detail === 'events') setTab('events');
    };
    window.addEventListener('exhibitor-portal-select-tab', onSelectTab as EventListener);
    return () => window.removeEventListener('exhibitor-portal-select-tab', onSelectTab as EventListener);
  }, []);

  const registeredEventIds = useMemo(() => new Set(registrations.map((r) => r.event.id)), [registrations]);
  const openEvents = useMemo(
    () => events.filter((e) => !registeredEventIds.has(e.id)),
    [events, registeredEventIds]
  );

  const handleLogin = async (phone: string, otp: string) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      if (otp !== DEV_OTP) throw new Error('Invalid OTP. Use 123456 for development.');
      const cleanPhone = phone.trim();
      if (!cleanPhone) throw new Error('Phone number is required.');
      const { data: ex, error } = await supabase
        .from('exhibitors')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();
      if (error) throw error;
      if (!ex) throw new Error('No exhibitor found with this phone number.');
      localStorage.setItem(DEV_EXHIBITOR_PHONE_KEY, cleanPhone);
      setDevPhoneSession(cleanPhone);
      setDevProfile({
        id: ex.id,
        companyName: ex.company_name,
        contactPerson: ex.contact_person,
        email: ex.email,
        phone: ex.phone,
        category: ex.category,
        city: ex.city,
        website: ex.website,
        companyDescription: ex.company_description,
        status: ex.status,
        paymentStatus: ex.payment_status,
      });
      window.dispatchEvent(new Event('exhibitor-dev-auth-changed'));
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (email: string, _password: string, name: string, phone: string) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const { data: existing, error: existingErr } = await supabase
        .from('exhibitors')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();
      if (existingErr) throw existingErr;

      if (existing?.id) {
        const { error: updateErr } = await supabase.from('exhibitors').update({
          contact_person: name,
          company_name: name,
          email: email || null,
        }).eq('id', existing.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase.from('exhibitors').insert([
          {
            company_name: name,
            contact_person: name,
            email: email || null,
            phone,
            status: 'registered',
            payment_status: 'pending',
            registration_date: new Date().toISOString(),
          },
        ]);
        if (insertErr) throw insertErr;
      }
      await handleLogin(phone, DEV_OTP);
    } catch (err: any) {
      setAuthError(err.message || 'Signup failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!effectiveProfile?.id) return;
    setSaveLoading(true);
    setSaveErr('');
    setSaveMsg('');
    const { error } = await supabase
      .from('exhibitors')
      .update({
        company_name: form.companyName.trim(),
        contact_person: form.contactPerson.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        category: form.category.trim() || null,
        city: form.city.trim() || null,
        website: form.website.trim() || null,
        company_description: form.companyDescription.trim() || null,
      })
      .eq('id', effectiveProfile.id);
    if (error) {
      setSaveErr(error.message);
    } else {
      setSaveMsg('Profile updated');
      if (user) refetchProfile();
      else {
        setDevProfile((p: any) => (p ? { ...p, ...form } : p));
      }
    }
    setSaveLoading(false);
  };

  const registerEvent = async (eventId: string) => {
    if (!effectiveProfile?.id) return;
    setRegisterLoadingId(eventId);
    const { error } = await supabase.from('event_registrations').insert([
      {
        event_id: eventId,
        exhibitor_id: effectiveProfile.id,
        booth_size: '6x6 ft',
        payment_method: 'online',
        registration_date: new Date().toISOString(),
        status: 'pending',
      },
    ]);
    if (!error) {
      refetchRegs();
    }
    setRegisterLoadingId(null);
  };

  if (!user && !devPhoneSession) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-8 md:p-12 shadow-editorial">
          <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-on-surface mb-3">
            Exhibitor portal
          </h2>
          <p className="text-on-surface-variant max-w-2xl mb-6">
            Sign in to manage your profile, view your registrations, and register for upcoming events.
          </p>
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-on-primary font-semibold font-headline"
          >
            <User className="h-4 w-4" />
            Sign in with Phone + OTP
          </button>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          onSignup={handleSignup}
          loading={authLoading}
          error={authError}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest shadow-editorial overflow-hidden">
        <div className="px-6 md:px-8 py-5 border-b border-outline-variant/15 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface">Exhibitor Portal</h2>
            <p className="text-sm text-on-surface-variant mt-1">{user?.email || devPhoneSession}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (user) {
                await signOut();
              }
              localStorage.removeItem(DEV_EXHIBITOR_PHONE_KEY);
              setDevPhoneSession(null);
              setDevProfile(null);
              window.dispatchEvent(new Event('exhibitor-dev-auth-changed'));
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 px-4 py-2.5 text-sm font-semibold text-on-surface"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        <div className="px-6 md:px-8 pt-4">
          <div className="inline-flex rounded-xl border border-outline-variant/20 bg-surface-container-low p-1">
            {([
              ['profile', 'Profile'],
              ['registrations', 'My Registrations'],
              ['events', 'Register for Events'],
            ] as [PortalTab, string][]).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  tab === id ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8">
          {tab === 'profile' && (
            <div>
              {profileLoading || devProfileLoading ? (
                <p className="text-on-surface-variant">Loading profile...</p>
              ) : !effectiveProfile ? (
                <p className="text-red-600">No exhibitor profile found for this account.</p>
              ) : (
                <div className="space-y-4 max-w-3xl">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                        Company Name
                      </label>
                      <input value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5" placeholder="Company name" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                        Contact Person
                      </label>
                      <input value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5" placeholder="Contact person" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                        Email
                      </label>
                      <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5" placeholder="Email" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                        Phone
                      </label>
                      <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5" placeholder="Phone" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                        Category
                      </label>
                      <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5" placeholder="Category" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                        City
                      </label>
                      <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5" placeholder="City" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                      Website
                    </label>
                    <input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5" placeholder="Website" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                      Company Description
                    </label>
                    <textarea value={form.companyDescription} onChange={(e) => setForm((f) => ({ ...f, companyDescription: e.target.value }))} className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5 min-h-28" placeholder="Company description" />
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={saveProfile} disabled={saveLoading} className="rounded-xl bg-primary px-5 py-2.5 text-on-primary font-semibold disabled:opacity-60">
                      {saveLoading ? 'Saving...' : 'Save profile'}
                    </button>
                    {saveMsg && <span className="text-sm text-emerald-700">{saveMsg}</span>}
                    {saveErr && <span className="text-sm text-red-600">{saveErr}</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'registrations' && (
            <div>
              {regLoading ? (
                <p className="text-on-surface-variant">Loading registrations...</p>
              ) : registrations.length === 0 ? (
                <p className="text-on-surface-variant">No registrations yet.</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {registrations.map((r) => (
                    <article key={r.id} className="rounded-2xl border border-outline-variant/15 p-4 bg-surface-container-low/40">
                      <h3 className="font-headline font-bold text-on-surface">{r.event.title}</h3>
                      <div className="mt-2 space-y-1 text-sm text-on-surface-variant">
                        <p className="flex items-center gap-2"><Calendar className="h-4 w-4" />{r.event.date}</p>
                        <p className="flex items-center gap-2"><Clock className="h-4 w-4" />{r.event.time || '—'}</p>
                        <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{r.event.venue}{r.event.city ? `, ${r.event.city}` : ''}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase bg-primary-fixed text-on-primary-fixed-variant px-2 py-1 rounded">{r.status}</span>
                        <span className="text-sm text-on-surface">Booth: {r.boothSize || '—'}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'events' && (
            <div>
              {eventsLoading ? (
                <p className="text-on-surface-variant">Loading events...</p>
              ) : openEvents.length === 0 ? (
                <p className="text-on-surface-variant">You are registered for all upcoming events.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {openEvents.map((ev) => (
                    <article key={ev.id} className="rounded-2xl overflow-hidden border border-outline-variant/15 bg-surface-container-low/40">
                      <div className="aspect-[4/3] bg-surface-container-low">
                        <img src={ev.eventImageUrl || ev.image || DEFAULT_EVENT_IMAGE} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold font-headline text-on-surface">{ev.title}</h3>
                        <p className="text-xs text-on-surface-variant mt-1">{ev.date} {ev.time ? `· ${ev.time}` : ''}</p>
                        <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{ev.venue}{ev.city ? `, ${ev.city}` : ''}</p>
                        <button
                          type="button"
                          onClick={() => registerEvent(ev.id)}
                          disabled={registerLoadingId === ev.id}
                          className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
                        >
                          {registerLoadingId === ev.id ? 'Registering...' : 'Register'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
