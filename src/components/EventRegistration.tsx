import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, User, Mail, Phone, Building, MapPin, Calendar, Clock } from 'lucide-react';
import { supabase } from '../supabase';
import { AuthModal } from './AuthModal';

interface EventRegistrationProps {
  event: any;
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
      const searchValue = searchMethod === 'email' ? searchEmail : searchPhone;
      const searchField = searchMethod === 'email' ? 'email' : 'phone';
      
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

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setAuthError('');
    
    try {
      console.log('Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      console.log('Login successful:', data);

      // Check if user is an exhibitor
      const { data: exhibitorData, error: exhibitorError } = await supabase
        .from('exhibitors')
        .select('*')
        .eq('email', email)
        .single();

      if (exhibitorError) {
        console.error('Exhibitor check error after login:', exhibitorError);
        setAuthError('This account is not registered as an exhibitor. Please sign up as an exhibitor first.');
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

  const handleSignup = async (email: string, password: string, name: string, phone: string) => {
    setLoading(true);
    setAuthError('');
    
    try {
      console.log('Attempting signup for:', email);
      
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) {
        console.error('Signup auth error:', authError);
        throw authError;
      }

      console.log('Auth signup successful:', authData);

      // Create exhibitor record
      const { error: exhibitorError } = await supabase.from('exhibitors').insert([
        {
          company_name: name,
          contact_person: name,
          email,
          phone,
          status: 'registered',
          payment_status: 'pending',
          registration_date: new Date().toISOString(),
        }
      ]);

      if (exhibitorError) {
        console.error('Exhibitor creation error:', exhibitorError);
        throw exhibitorError;
      }

      console.log('Exhibitor record created successfully');

      setExhibitor({
        id: authData.user?.id || '',
        company_name: name,
        contact_person: name,
        email,
        phone,
        category: '',
        status: 'registered'
      });

      setShowAuthModal(false);
      setCurrentStep('register');
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

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-xl">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-900">Event registration</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-200">
              <h3 className="font-semibold text-slate-900 mb-2">{event.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
                  {event.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                  {event.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-500 shrink-0" />
                  {event.location}
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-indigo-500 shrink-0" />
                  {event.type}
                </div>
              </div>
            </div>

            {/* Step 1: Check Exhibitor Registration */}
            {currentStep === 'check' && (
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Check Exhibitor Registration</h3>
                <p className="text-slate-600 mb-6">
                  Please provide your email or phone number to check if you're already registered as an exhibitor.
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
                      Search by Phone
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
                          setSearchPhone(e.target.value);
                        }
                      }}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                      placeholder={`Enter your ${searchMethod}`}
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