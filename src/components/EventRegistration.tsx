import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Mail, Phone, Building, MapPin, Calendar, Clock, Users, Tag } from 'lucide-react';
import { supabase } from '../supabase';
import { AuthModal } from './AuthModal';
import type { Event } from '../types';

const DEFAULT_EVENT_IMAGE = 'https://images.pexels.com/photos/1099816/pexels-photo-1099816.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop';
const DEV_OTP = '123456';

interface EventRegistrationProps {
  event: Event & { image?: string | null; featured?: boolean };
  isOpen: boolean;
  onClose: () => void;
}

interface Exhibitor {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  category: string;
  status: string;
}

export const EventRegistration: React.FC<EventRegistrationProps> = ({
  event,
  isOpen,
  onClose
}) => {
  const normalizeTenDigitPhone = (raw: string) => raw.replace(/\D/g, '').slice(-10);
  const [currentStep, setCurrentStep] = useState<'check' | 'auth' | 'register' | 'success'>('check');
  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchMethod, setSearchMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    boothSize: '',
    specialRequirements: '',
    paymentMethod: 'online',
    agreeToTerms: false
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('check');
      setExhibitor(null);
      setSearchEmail('');
      setSearchPhone('');
      setError('');
      setAuthError('');
      setRegistrationData({
        boothSize: '',
        specialRequirements: '',
        paymentMethod: 'online',
        agreeToTerms: false
      });
    }
  }, [isOpen]);

  // Test Supabase connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase.from('exhibitors').select('count').limit(1);
        if (error) {
          console.error('Supabase connection error:', error);
        } else {
          console.log('Supabase connection successful');
        }
      } catch (err) {
        console.error('Failed to connect to Supabase:', err);
      }
    };
    
    testConnection();
  }, []);

  const checkExhibitorRegistration = async () => {
    setLoading(true);
    setError('');
    
    try {
      const searchValue =
        searchMethod === 'email' ? searchEmail.trim() : normalizeTenDigitPhone(searchPhone);
      const searchField = searchMethod === 'email' ? 'email' : 'phone';
      if (searchMethod === 'phone' && searchValue.length !== 10) {
        throw new Error('Whatsapp Mobile Number must be exactly 10 digits.');
      }
      
      console.log(`Checking exhibitor registration for ${searchField}: ${searchValue}`);
      
      const { data, error } = await supabase
        .from('exhibitors')
        .select('*')
        .eq(searchField, searchValue)
        .single();

      if (error) {
        console.error('Exhibitor check error:', error);
        if (error.code === 'PGRST116') {
          // No exhibitor found
          setError('No exhibitor found with this information. Please sign up first.');
          setCurrentStep('auth');
        } else {
          throw error;
        }
      } else {
        console.log('Exhibitor found:', data);
        setExhibitor(data);
        setCurrentStep('register');
      }
    } catch (err: any) {
      console.error('Error checking exhibitor:', err);
      setError(err.message || 'Failed to check exhibitor registration');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (phone: string, otp: string) => {
    setLoading(true);
    setAuthError('');
    
    try {
      const cleanPhone = normalizeTenDigitPhone(phone);
      console.log('Attempting OTP login for phone:', cleanPhone);
      if (otp !== DEV_OTP) throw new Error('Invalid OTP. Use 123456 for development.');
      if (cleanPhone.length !== 10) throw new Error('Whatsapp Mobile Number must be exactly 10 digits.');

      const { data: exhibitorData, error: exhibitorError } = await supabase
        .from('exhibitors')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();
      if (exhibitorError) throw exhibitorError;

      if (!exhibitorData) {
        setAuthError('No exhibitor account found for this Whatsapp Mobile Number. Please sign up first.');
        return;
      }

      console.log('Exhibitor data found:', exhibitorData);
      setExhibitor(exhibitorData);
      setShowAuthModal(false);
      setCurrentStep('register');
    } catch (err: any) {
      console.error('Login failed:', err);
      setAuthError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (email: string, _password: string, name: string, phone: string) => {
    setLoading(true);
    setAuthError('');
    
    try {
      const cleanPhone = normalizeTenDigitPhone(phone);
      console.log('Attempting exhibitor signup with phone:', cleanPhone);
      if (cleanPhone.length !== 10) throw new Error('Whatsapp Mobile Number must be exactly 10 digits.');

      // Create or link exhibitor record
      const { data: existing } = await supabase
        .from('exhibitors')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (existing?.id) {
        const { error: updateErr } = await supabase
          .from('exhibitors')
          .update({ contact_person: name, company_name: name, email: email || null })
          .eq('id', existing.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: exhibitorError } = await supabase.from('exhibitors').insert([
          {
            company_name: name,
            contact_person: name,
            email: email || null,
            phone: cleanPhone,
            status: 'registered',
            payment_status: 'pending',
            registration_date: new Date().toISOString(),
          }
        ]);
        if (exhibitorError) throw exhibitorError;
      }

      console.log('Exhibitor record created successfully');

      // Auto-login in dev mode with static OTP.
      await handleLogin(cleanPhone, DEV_OTP);

      setShowAuthModal(false);
    } catch (err: any) {
      console.error('Signup failed:', err);
      setAuthError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEventRegistration = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Processing event registration for event:', event.id);
      console.log('Exhibitor data:', exhibitor);
      console.log('Registration data:', registrationData);

      const registrationPayload = {
        event_id: event.id,
        exhibitor_id: exhibitor?.id,
        booth_size: registrationData.boothSize,
        special_requirements: registrationData.specialRequirements,
        payment_method: registrationData.paymentMethod,
        registration_date: new Date().toISOString(),
        status: 'pending'
      };

      console.log('Registration payload:', registrationPayload);

      // Insert into event_registrations table
      const { error: registrationError } = await supabase
        .from('event_registrations')
        .insert([registrationPayload]);

      if (registrationError) {
        console.error('Registration insert error:', registrationError);
        throw registrationError;
      }
      
      console.log('Event registration completed successfully');
      setCurrentStep('success');
    } catch (err: any) {
      console.error('Event registration failed:', err);
      setError(err.message || 'Failed to register for event');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const eventImage = event.image || DEFAULT_EVENT_IMAGE;
  const eventDate = event.date ? (typeof event.date === 'string' && event.date.includes('T') ? new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : event.date) : '—';
  const statusLabel = event.status ? String(event.status).charAt(0).toUpperCase() + String(event.status).slice(1) : '—';

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden border border-slate-200 shadow-2xl flex flex-col">
          {/* Hero image */}
          <div className="relative h-44 sm:h-52 flex-shrink-0 overflow-hidden bg-slate-200">
            <img
              src={eventImage}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_EVENT_IMAGE; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight drop-shadow-sm">{event.title}</h2>
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
            {/* Event details */}
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Event details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/80">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Date</p>
                    <p className="text-slate-900 font-medium">{eventDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/80">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Time</p>
                    <p className="text-slate-900 font-medium">{event.time || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/80">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Venue</p>
                    <p className="text-slate-900 font-medium">{event.venue || '—'}</p>
                  </div>
                </div>
                {event.city && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/80">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">City</p>
                      <p className="text-slate-900 font-medium">{event.city}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/80">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Capacity</p>
                    <p className="text-slate-900 font-medium">{event.attendees ?? 0} / {event.maxCapacity ?? '—'} attendees</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/80">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Status</p>
                    <p className="text-slate-900 font-medium">{statusLabel}</p>
                  </div>
                </div>
              </div>
              {event.description && (
                <div className="mt-4 p-4 rounded-xl bg-white border border-slate-200/80">
                  <p className="text-sm text-slate-600 leading-relaxed">{event.description}</p>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6">

            {/* Step 1: Check Exhibitor Registration */}
            {currentStep === 'check' && (
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Check Exhibitor Registration</h3>
                <p className="text-slate-600 mb-6">
                  Please provide your email or Whatsapp Mobile Number to check if you're already registered as an exhibitor.
                </p>

                <div className="mb-4">
                  <div className="flex space-x-4 mb-4">
                    <button
                      onClick={() => setSearchMethod('email')}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        searchMethod === 'email'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Search by Email
                    </button>
                    <button
                      onClick={() => setSearchMethod('phone')}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        searchMethod === 'phone'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Search by Whatsapp Mobile Number
                    </button>
                  </div>

                  <div className="relative">
                    {searchMethod === 'email' ? (
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    ) : (
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    )}
                    <input
                      type={searchMethod === 'email' ? 'email' : 'tel'}
                      value={searchMethod === 'email' ? searchEmail : searchPhone}
                      onChange={(e) => {
                        if (searchMethod === 'email') {
                          setSearchEmail(e.target.value);
                        } else {
                          setSearchPhone(normalizeTenDigitPhone(e.target.value));
                        }
                      }}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                      inputMode={searchMethod === 'phone' ? 'numeric' : undefined}
                      maxLength={searchMethod === 'phone' ? 10 : undefined}
                      pattern={searchMethod === 'phone' ? '[0-9]{10}' : undefined}
                      placeholder={searchMethod === 'phone' ? 'Enter 10-digit Whatsapp mobile number' : 'Enter your email'}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={checkExhibitorRegistration}
                    disabled={loading || (!searchEmail && !searchPhone)}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Checking...' : 'Next'}
                  </button>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                  >
                    New Exhibitor
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Event Registration Form */}
            {currentStep === 'register' && exhibitor && (
              <div>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-700 font-medium">Exhibitor Found!</span>
                  </div>
                  <div className="mt-2 text-sm text-green-600">
                    <p><strong>Company:</strong> {exhibitor.company_name}</p>
                    <p><strong>Contact:</strong> {exhibitor.contact_person}</p>
                    <p><strong>Email:</strong> {exhibitor.email}</p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-slate-900 mb-4">Event Registration Details</h3>
                
                <form onSubmit={(e) => { e.preventDefault(); handleEventRegistration(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Booth Size *
                    </label>
                    <select
                      value={registrationData.boothSize}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, boothSize: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                    >
                      <option value="">Select booth size</option>
                      <option value="6x6 ft">6x6 ft</option>
                      <option value="8x8 ft">8x8 ft</option>
                      <option value="10x10 ft">10x10 ft</option>
                      <option value="12x12 ft">12x12 ft</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Special Requirements
                    </label>
                    <textarea
                      value={registrationData.specialRequirements}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                      placeholder="Any special requirements or requests"
                    />
                  </div>

                  {/* <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Payment Method *
                    </label>
                    <select
                      value={registrationData.paymentMethod}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                    >
                      <option value="online">Online Payment</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div> */}

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      checked={registrationData.agreeToTerms}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                      required
                      className="mt-1 h-4 w-4 text-slate-600 focus:ring-slate-300 border-slate-300 rounded"
                    />
                    <label htmlFor="agreeToTerms" className="text-sm text-slate-700">
                      I agree to the event terms and conditions and confirm my registration for this event.
                    </label>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('check')}
                      className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !registrationData.agreeToTerms}
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Registering...' : 'I am Interested'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Success */}
            {currentStep === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h3>
                <p className="text-slate-600 mb-6">
                  You have successfully registered for {event.title}. We'll send you a confirmation email with further details.
                </p>
                <button
                  onClick={onClose}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onSignup={handleSignup}
        loading={loading}
        error={authError}
      />
    </>
  );
}; 