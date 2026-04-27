import { useEffect, useState } from 'react';
import { Phone, Mail, MapPin, Menu, X, Calendar, Users, LayoutGrid, Megaphone } from 'lucide-react';
import { useUsers, useEvents, useVenues, useVendors, useExhibitors } from './hooks/useSupabaseData';
import Gallery from './gallery';
import { Events } from './events';
import { Exhibitor } from './exhibitor';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BannerCarousel } from './components/BannerCarousel';
import { AdSlot } from './components/AdSlot';
import { ExhibitorDashboard } from './components/ExhibitorDashboard';
import { ExhibitorPortal } from './components/ExhibitorPortal';
import { AuthModal } from './components/AuthModal';
import { supabase } from './supabase';
import logo from './assets/newlogo.png';

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { user } = useAuth();
  const [hasDevExhibitorSession, setHasDevExhibitorSession] = useState<boolean>(
    !!localStorage.getItem('boothbuzz_exhibitor_phone')
  );
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const exhibitorLoggedIn = !!user || hasDevExhibitorSession;
  const DEV_OTP = '123456';

  const NAV_LINKS = ['Home', 'About', 'Gallery', 'Events', 'Exhibitors', 'Contact'];

  // Keep nav in sync with dev phone+OTP session in portal.
  useEffect(() => {
    const sync = () => setHasDevExhibitorSession(!!localStorage.getItem('boothbuzz_exhibitor_phone'));
    window.addEventListener('storage', sync);
    window.addEventListener('exhibitor-dev-auth-changed', sync as EventListener);
    sync();
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('exhibitor-dev-auth-changed', sync as EventListener);
    };
  }, []);

  const { loading: usersLoading } = useUsers();
  const { loading: eventsLoading } = useEvents('visible');
  const { loading: venuesLoading } = useVenues();
  const { loading: vendorsLoading } = useVendors();
  const { loading: exhibitorsLoading } = useExhibitors();
  void usersLoading;
  void eventsLoading;
  void venuesLoading;
  void vendorsLoading;
  void exhibitorsLoading;

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const targetId = sectionId === 'gallery' ? 'event-archives' : sectionId;
    const element = document.getElementById(targetId);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const openExhibitorLoginModal = () => {
    setAuthError('');
    setShowAuthModal(true);
    setIsMenuOpen(false);
  };

  const handleExhibitorOtpLogin = async (phone: string, otp: string) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      if (otp !== DEV_OTP) throw new Error('Invalid OTP. Use 123456 for development.');
      const cleanPhone = phone.trim();
      if (!cleanPhone) throw new Error('Phone number is required.');
      const { data: ex, error } = await supabase
        .from('exhibitors')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();
      if (error) throw error;
      if (!ex) throw new Error('No exhibitor found with this phone number.');
      localStorage.setItem('boothbuzz_exhibitor_phone', cleanPhone);
      setHasDevExhibitorSession(true);
      window.dispatchEvent(new Event('exhibitor-dev-auth-changed'));
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleExhibitorOtpSignup = async (email: string, _password: string, name: string, phone: string) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const cleanPhone = phone.trim();
      if (!cleanPhone) throw new Error('Phone number is required.');
      const { data: existing, error: existingErr } = await supabase
        .from('exhibitors')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();
      if (existingErr) throw existingErr;

      if (existing?.id) {
        const { error: updateErr } = await supabase
          .from('exhibitors')
          .update({
            company_name: name,
            contact_person: name,
            email: email || null,
          })
          .eq('id', existing.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase.from('exhibitors').insert([
          {
            company_name: name,
            contact_person: name,
            email: email || null,
            phone: cleanPhone,
            status: 'registered',
            payment_status: 'pending',
            registration_date: new Date().toISOString(),
          },
        ]);
        if (insertErr) throw insertErr;
      }
      await handleExhibitorOtpLogin(cleanPhone, DEV_OTP);
    } catch (err: any) {
      setAuthError(err.message || 'Signup failed');
      setAuthLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background text-on-surface font-body">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/15 ghost-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 gap-4">
              <button
                type="button"
                onClick={() => scrollToSection('home')}
                className="flex items-center gap-2 shrink-0"
              >
                <img src={logo} alt="BoothBuzz" className="h-9 w-auto max-h-10 object-contain" />
              </button>
              <div className="hidden md:flex items-center gap-6 lg:gap-8">
                {NAV_LINKS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => scrollToSection(item.toLowerCase())}
                    className={`text-sm font-semibold font-headline transition-colors ${
                      activeSection === item.toLowerCase()
                        ? 'text-primary'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {exhibitorLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => scrollToSection('dashboard')}
                    className="hidden sm:inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold font-headline text-on-primary shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                  >
                    My Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={openExhibitorLoginModal}
                      className="hidden sm:inline-flex items-center rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm font-semibold font-headline text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                      Exhibitor Login
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToSection('exhibitor-registration')}
                      className="hidden sm:inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold font-headline text-on-primary shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                    >
                      New Exhibitor Registration
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 text-on-surface-variant"
                  aria-label="Toggle menu"
                >
                  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
          {isMenuOpen && (
            <div className="md:hidden border-t border-outline-variant/15 bg-surface-container-lowest px-4 py-3 space-y-1">
              {NAV_LINKS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className={`block w-full text-left py-2 text-sm font-medium font-headline ${
                    activeSection === item.toLowerCase()
                      ? 'text-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {item}
                </button>
              ))}
              {exhibitorLoggedIn ? (
                <button
                  type="button"
                  onClick={() => scrollToSection('dashboard')}
                  className="mt-2 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary"
                >
                  My Dashboard
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={openExhibitorLoginModal}
                    className="mt-2 w-full rounded-xl border border-outline-variant/25 py-2.5 text-sm font-semibold text-on-surface"
                  >
                    Exhibitor Login
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('exhibitor-registration')}
                    className="mt-2 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary"
                  >
                    New Exhibitor Registration
                  </button>
                </>
              )}
            </div>
          )}
        </nav>

        <main className="pt-16">
          <section id="home" className="pt-0">
            <BannerCarousel onScrollToSection={scrollToSection} />
            <div className="w-full border-y border-slate-200">
              <AdSlot slotId="top_strip" className="w-full" />
            </div>
          </section>

          <section id="about" className="py-28 bg-gradient-to-b from-indigo-50/60 to-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl">
                <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-[2.5rem]">
                  About BoothBuzz
                </h2>
                <div className="mt-6 h-1 w-16 rounded-full bg-indigo-500" aria-hidden />
                <p className="mt-8 text-lg text-slate-600 leading-relaxed">
                  BoothBuzz transforms everyday community spaces into vibrant exhibition destinations where local talent shines. From curated food festivals to art and craft showcases, we partner with societies, malls, and local venues to create engaging events that bring people together and celebrate creativity.
                </p>
                <p className="mt-5 text-lg text-slate-600 leading-relaxed">
                  We believe exhibitions should be more than stalls — they should be experiences that connect communities, support local entrepreneurs, and spark meaningful interactions.
                </p>
              </div>

              <div className="mt-20 rounded-2xl bg-white border border-slate-200/80 shadow-sm shadow-slate-200/50 overflow-hidden">
                <div className="p-8 sm:p-10 lg:p-12">
                  <h3 className="text-2xl font-semibold text-slate-900">What We Do</h3>
                  <p className="mt-4 text-slate-600 leading-relaxed max-w-2xl">
                    We provide end-to-end exhibition planning and execution — from concept to completion.
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-500 uppercase tracking-wider">Our services include:</p>
                  <ul className="mt-6 grid sm:grid-cols-2 gap-5">
                    {[
                      { icon: Calendar, label: 'Strategic event planning' },
                      { icon: Users, label: 'Vendor sourcing and coordination' },
                      { icon: LayoutGrid, label: 'On-ground event management' },
                      { icon: Megaphone, label: 'Marketing and audience promotion' },
                    ].map(({ icon: Icon, label }) => (
                      <li key={label} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/80 hover:bg-indigo-50/50 transition-colors">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-slate-700 font-medium pt-1.5">{label}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-8 text-slate-600 leading-relaxed border-l-4 border-indigo-200 pl-5">
                    We ensure every event is professionally managed, well-promoted, and designed to attract the right crowd.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="gallery" className="py-24 bg-violet-50/30">
            <Gallery />
          </section>

          <section id="events" className="py-24 bg-white">
            <Events />
          </section>

          {exhibitorLoggedIn && (
            <section id="dashboard" className="py-24 bg-surface-container-low/30 border-y border-outline-variant/10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <ExhibitorDashboard onScrollToEvents={() => scrollToSection('events')} />
              </div>
            </section>
          )}

          {exhibitorLoggedIn && (
            <section id="portal" className="py-24 bg-background border-y border-outline-variant/10">
              <ExhibitorPortal />
            </section>
          )}

          <section id="exhibitors" className="py-24 bg-indigo-50/30">
            <Exhibitor />
          </section>

          {/* Above Contact — full width */}
          <div className="w-full border-b border-slate-200">
            <AdSlot slotId="above_contact" className="w-full" />
          </div>

          <section id="contact" className="py-24 bg-slate-900 text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl mb-16">
                <h2 className="text-3xl font-semibold tracking-tight">Get in touch</h2>
                <p className="mt-4 text-slate-300">
                  Ready to host an exhibition? We’d love to hear from you.
                </p>
              </div>
              <div className="grid lg:grid-cols-2 gap-16">
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">Phone</div>
                      <a href="tel:+919922196059" className="text-slate-300 hover:text-white">+91 9922196059</a>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">Email</div>
                      <a href="mailto:info@boothbuzz.in" className="text-slate-300 hover:text-white">info@boothbuzz.in</a>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">Office</div>
                      <div className="text-slate-300">
                        4th Floor Varitech Building, Hinjewadi Phase 1, Pune 411057
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-8">
                  <h3 className="text-lg font-medium mb-6">Send a message</h3>
                  <form className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Name"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-slate-500"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-slate-500"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Subject"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-slate-500"
                    />
                    <textarea
                      placeholder="Message"
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-slate-500 resize-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-colors"
                    >
                      Send message
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </section>

          <footer className="border-t border-slate-200 bg-indigo-50/20 py-6">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="font-medium text-indigo-600">BoothBuzz</span>
              <span className="text-sm text-slate-500">© {new Date().getFullYear()} BoothBuzz. All rights reserved.</span>
            </div>
          </footer>
        </main>
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleExhibitorOtpLogin}
        onSignup={handleExhibitorOtpSignup}
        loading={authLoading}
        error={authError}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
