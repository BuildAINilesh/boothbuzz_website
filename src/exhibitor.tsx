import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Users, MapPinIcon, Star, Search as SearchIcon, LayoutGrid, List } from 'lucide-react';
import { useExhibitors } from './hooks/useSupabaseData';
import React, { useEffect, useState } from 'react';
import { Building, User as UserIcon, MapPin as MapPinIcon2, Package, CheckCircle, Upload, FileText, Image, X } from 'lucide-react';
import { supabase } from './supabase';
import { AdSlot } from './components/AdSlot';
import type { Exhibitor as ExhibitorRecord } from './types';

interface FormErrors {
  [key: string]: string;
}

interface CategoryOption {
  id: string;
  label: string;
}

interface SubcategoryOption {
  id: string;
  label: string;
  categoryId?: string | null;
}


export const Exhibitor: React.FC = () => {

    const { exhibitors, loading: exhibitorsLoading, refetch } = useExhibitors();

    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    /** Selected row id from `event_categories` (UUID string). */
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
    const [subcategoryOptions, setSubcategoryOptions] = useState<SubcategoryOption[]>([]);
    const [loadingCategoryOptions, setLoadingCategoryOptions] = useState(true);
    const [companyDescription, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    
    // File upload states
    const [companyProfile, setCompanyProfile] = useState<File | null>(null);
    const [gstCertificate, setGstCertificate] = useState<File | null>(null);
    const [panCard, setPanCard] = useState<File | null>(null);
    const [productCatalog, setProductCatalog] = useState<File | null>(null);
    const [companyLogo, setCompanyLogo] = useState<File | null>(null);
    const [productImages, setProductImages] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedExhibitor, setSelectedExhibitor] = useState<ExhibitorRecord | null>(null);
    const [showFileModal, setShowFileModal] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllExhibitorsView, setShowAllExhibitorsView] = useState(false);

    useEffect(() => {
        const loadCategoryOptions = async () => {
            setLoadingCategoryOptions(true);
            setErrorMsg('');
            try {
                // Schema: event_categories (id, slug, name, sort_order, …)
                const { data: categoryRows, error: categoryError } = await supabase
                    .from('event_categories')
                    .select('id, slug, name, sort_order')
                    .order('sort_order', { ascending: true })
                    .order('name', { ascending: true });

                if (categoryError) throw categoryError;

                const categories: CategoryOption[] = (categoryRows ?? [])
                    .map((row: { id?: string; name?: string | null; slug?: string | null }) => {
                        const trimmedLabel = (row.name ?? '').trim();
                        if (!trimmedLabel || row.id == null) return null;
                        return { id: String(row.id), label: trimmedLabel };
                    })
                    .filter(Boolean) as CategoryOption[];
                setCategoryOptions(categories);

                // Schema: event_subcategories (id, event_category_id, name, sort_order, …)
                const { data: subcategoryRows, error: subcategoryError } = await supabase
                    .from('event_subcategories')
                    .select('id, event_category_id, name, sort_order')
                    .order('sort_order', { ascending: true })
                    .order('name', { ascending: true });

                if (subcategoryError) throw subcategoryError;

                const subcategories: SubcategoryOption[] = (subcategoryRows ?? [])
                    .map(
                        (row: {
                            id?: string;
                            event_category_id?: string | null;
                            name?: string | null;
                        }) => {
                            const trimmedLabel = (row.name ?? '').trim();
                            if (!trimmedLabel || row.id == null) return null;
                            const catId =
                                row.event_category_id != null ? String(row.event_category_id).trim() : null;
                            return {
                                id: String(row.id),
                                label: trimmedLabel,
                                categoryId: catId,
                            };
                        }
                    )
                    .filter(Boolean) as SubcategoryOption[];
                setSubcategoryOptions(subcategories);

                if (categories.length === 0) {
                    setErrorMsg('No categories found in event_categories. Add rows in Supabase.');
                }
            } catch (err) {
                console.error('Failed to load categories/subcategories:', err);
                const msg = err instanceof Error ? err.message : 'Unknown error';
                setErrorMsg(`Failed to load categories from DB: ${msg}`);
            } finally {
                setLoadingCategoryOptions(false);
            }
        };

        loadCategoryOptions();
    }, []);

    const selectedCategoryLabel =
        categoryOptions.find((o) => o.id === selectedCategoryId)?.label ?? '';

    const visibleSubcategories = selectedCategoryId
        ? subcategoryOptions.filter((sub) => sub.categoryId === selectedCategoryId)
        : [];

    const toggleSubCategory = (subLabel: string) => {
        setSelectedSubCategories((prev) =>
            prev.includes(subLabel) ? prev.filter((x) => x !== subLabel) : [...prev, subLabel]
        );
    };

    // File upload functions
    const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
        console.log(`Attempting to upload to bucket: ${bucket}, path: ${path}`);
        
        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) {
                console.error(`Upload error for bucket ${bucket}:`, error);
                if (error.message?.includes('bucket') || error.message?.includes('not found')) {
                    throw new Error(`Storage bucket '${bucket}' does not exist. Please create it in your Supabase dashboard.`);
                }
                if (error.message?.includes('permission') || error.message?.includes('policy')) {
                    throw new Error(`Permission denied. Please check storage policies for bucket '${bucket}'.`);
                }
                throw error;
            }
            
            console.log(`Upload successful to ${bucket}/${path}`);
            
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(path);
            
            return publicUrl;
        } catch (err: any) {
            console.error('Upload failed:', err);
            throw err;
        }
    };

    const uploadMultipleFiles = async (files: File[], bucket: string, basePath: string): Promise<string[]> => {
        const uploadPromises = files.map((file, index) => {
            const fileName = `${Date.now()}-${index}-${file.name}`;
            const path = `${basePath}/${fileName}`;
            return uploadFile(file, bucket, path);
        });
        
        return Promise.all(uploadPromises);
    };

    const loading = exhibitorsLoading;
    const totalExhibitors = exhibitors?.length || 0; // Protect against undefined exhibitors
    if (loading) {
        return <div>Loading...</div>; // Show loading indicator while fetching data
    }

    // Insert exhibitor into Supabase
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccessMsg('');
        setErrorMsg('');
        try {
            setUploadProgress(0);
            
            // Upload files first
            const uploadedFiles: any = {};
            
            if (companyProfile) {
                setUploadProgress(10);
                uploadedFiles.company_profile_url = await uploadFile(
                    companyProfile, 
                    'exhibitor-documents', 
                    `company-profiles/${Date.now()}-${companyProfile.name}`
                );
            }
            
            if (gstCertificate) {
                setUploadProgress(30);
                uploadedFiles.gst_certificate_url = await uploadFile(
                    gstCertificate, 
                    'exhibitor-documents', 
                    `gst-certificates/${Date.now()}-${gstCertificate.name}`
                );
            }
            
            if (panCard) {
                setUploadProgress(50);
                uploadedFiles.pan_card_url = await uploadFile(
                    panCard, 
                    'exhibitor-documents', 
                    `pan-cards/${Date.now()}-${panCard.name}`
                );
            }
            
            if (productCatalog) {
                setUploadProgress(70);
                uploadedFiles.product_catalog_url = await uploadFile(
                    productCatalog, 
                    'exhibitor-documents', 
                    `product-catalogs/${Date.now()}-${productCatalog.name}`
                );
            }
            
            if (companyLogo) {
                setUploadProgress(80);
                uploadedFiles.company_logo_url = await uploadFile(
                    companyLogo, 
                    'exhibitor-images', 
                    `company-logos/${Date.now()}-${companyLogo.name}`
                );
            }
            
            if (productImages.length > 0) {
                setUploadProgress(90);
                uploadedFiles.product_images_urls = await uploadMultipleFiles(
                    productImages, 
                    'exhibitor-images', 
                    `product-images/${Date.now()}`
                );
            }
            
            setUploadProgress(95);
            
            const baseInsertData = {
                company_name: `${firstName} ${lastName}`.trim(),
                contact_person: `${firstName} ${lastName}`.trim(),
                email,
                phone,
                category: selectedCategoryLabel,
                company_description: companyDescription || null,
                ...uploadedFiles
            };
            const insertData = {
                ...baseInsertData,
                sub_category: selectedSubCategories,
            };
            
            // Validate required fields
            if (!insertData.company_name || !insertData.email || !insertData.phone || !selectedCategoryId || !insertData.category) {
                throw new Error('Missing required fields');
            }
            
            // Log the exact data being sent
            console.log('Insert data type check:', {
                company_name: typeof insertData.company_name,
                contact_person: typeof insertData.contact_person,
                email: typeof insertData.email,
                phone: typeof insertData.phone,
                category: typeof insertData.category,
                company_description: typeof insertData.company_description
            });
            
            console.log('Inserting exhibitor data:', insertData);
            
            console.log('Attempting to insert into table: exhibitors');
            console.log('Table name:', 'exhibitors');
            console.log('Insert data keys:', Object.keys(insertData));
            console.log('Insert data values:', Object.values(insertData));
            
            // Test table structure first
            console.log('Testing table access...');
            const { data: testData, error: testError } = await supabase
                .from('exhibitors')
                .select('*')
                .limit(1);
            
            if (testError) {
                console.error('Table structure test failed:', testError);
                throw new Error(`Table structure test failed: ${testError.message}`);
            }
            
            console.log('Table structure test successful, columns:', testData.length > 0 ? Object.keys(testData[0]) : 'No data');
            
            // Check if status field exists and what its current value is
            if (testData.length > 0) {
                const sampleRecord = testData[0];
                console.log('Sample record status field:', sampleRecord.status);
                console.log('Sample record payment_status field:', sampleRecord.payment_status);
            }
            
            // Try to insert with explicit status to see what the constraint allows
            const testInsertData = {
                ...insertData,
                status: 'registered'
            };
            
            console.log('Testing insert with explicit status:', testInsertData);
            
            const { error } = await supabase.from('exhibitors').insert([testInsertData]);
            if (error) {
                console.error('Supabase insert error:', error);
                console.error('Error details:', error.details);
                console.error('Error hint:', error.hint);
                throw error;
            }
            setSuccessMsg('Registration submitted successfully!');
            setFirstName('');
            setLastName('');
            setEmail('');
            setPhone('');
            setSelectedCategoryId('');
            setSelectedSubCategories([]);
            setDescription('');
            
            // Clear file uploads
            setCompanyProfile(null);
            setGstCertificate(null);
            setPanCard(null);
            setProductCatalog(null);
            setCompanyLogo(null);
            setProductImages([]);
            setUploadProgress(0);
            
            refetch();
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to register.');
        } finally {
            setSubmitting(false);
        }
    };

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredExhibitors = (exhibitors || []).filter((ex) => {
        if (!normalizedQuery) return true;
        const haystack = [
            ex.companyName,
            ex.category,
            ex.contactPerson,
            ex.city,
            ex.companyDescription,
            ex.status,
            ex.booth,
            ...(ex.subCategories || []),
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        return haystack.includes(normalizedQuery);
    });
    const mainSectionExhibitors = viewMode === 'grid' ? filteredExhibitors.slice(0, 6) : filteredExhibitors;

    // --- Advanced Exhibitor Registration (Admin) - COMMENTED OUT ---
    /*
    const adminSteps = [
      { number: 1, title: 'Company Info', icon: Building },
      { number: 2, title: 'Contact Details', icon: UserIcon },
      { number: 3, title: 'Business & Location', icon: MapPinIcon2 },
      { number: 4, title: 'Exhibition Details', icon: Package },
      { number: 5, title: 'Review & Submit', icon: CheckCircle }
    ];

    const initialFormData = {
      companyName: '',
      companyDescription: '',
      establishedYear: '',
      companySize: '',
      website: '',
      contactPerson: '',
      designation: '',
      email: '',
      phone: '',
      alternateEmail: '',
      alternatePhone: '',
      category: '',
      subCategory: '',
      businessType: '',
      gstNumber: '',
      panNumber: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      country: '',
      boothPreference: '',
      boothSize: '',
      specialRequirements: '',
      previousExhibitions: '',
      expectedVisitors: '',
      products: [],
      services: [],
      targetAudience: '',
      registrationFee: 0,
      paymentMethod: '',
      billingAddress: '',
      socialMediaLinks: {
        linkedin: '',
        facebook: '',
        twitter: '',
        instagram: ''
      },
      documents: {
        companyProfile: null,
        gstCertificate: null,
        panCard: null,
        productCatalog: null
      },
              status: 'registered' as const,
      paymentStatus: 'pending' as const,
      sendConfirmationEmail: true,
      allowMarketingEmails: true
    };

    const Stepper = ({ steps, currentStep }: { steps: any[]; currentStep: number }) => (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep >= step.number 
                ? 'bg-purple-600 border-purple-600 text-white' 
                : 'border-gray-300 text-gray-500'
            }`}>
              {currentStep > step.number ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
            </div>
            <div className="ml-3">
              <div className={`text-sm font-medium ${
                currentStep >= step.number ? 'text-purple-600' : 'text-gray-500'
              }`}>
                {step.title}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-4 ${
                currentStep > step.number ? 'bg-purple-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    );

    const Section = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {description && <p className="text-gray-600 mb-4">{description}</p>}
        {children}
      </div>
    );

    const Field = ({ label, value, onChange, error, required, type = 'text', placeholder, helper, ...props }: any) => (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={4}
            {...props}
          />
        ) : type === 'select' ? (
          <select
            value={value}
            onChange={onChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            {...props}
          >
            <option value="">Select {label}</option>
            {props.children}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            {...props}
          />
        )}
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        {helper && <p className="text-gray-500 text-sm mt-1">{helper}</p>}
      </div>
    );

    const AdvancedExhibitorRegistration: React.FC = () => {
      const [currentStep, setCurrentStep] = useState(1);
      const [formData, setFormData] = useState<any>(initialFormData);
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [submitSuccess, setSubmitSuccess] = useState(false);
      const [errors, setErrors] = useState<FormErrors>({});
      const [submitError, setSubmitError] = useState('');
      const [newProduct, setNewProduct] = useState('');
      const [newService, setNewService] = useState('');

      const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
          setFormData((prev: any) => ({
            ...prev,
            [name]: (e.target as HTMLInputElement).checked
          }));
        } else {
          setFormData((prev: any) => ({
            ...prev,
            [name]: value
          }));
        }
      };

      const validateStep = (step: number) => {
        const newErrors: FormErrors = {};
        
        switch (step) {
          case 1:
            if (!formData.companyName) newErrors.companyName = 'Company name is required';
            if (!formData.contactPerson) newErrors.contactPerson = 'Contact person is required';
            if (!formData.email) newErrors.email = 'Email is required';
            else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
            if (!formData.phone) newErrors.phone = 'Phone is required';
            break;
          case 2:
            if (!formData.category) newErrors.category = 'Category is required';
            if (!formData.address) newErrors.address = 'Address is required';
            if (!formData.city) newErrors.city = 'City is required';
            if (!formData.state) newErrors.state = 'State is required';
            break;
          case 3:
            if (!formData.boothPreference) newErrors.boothPreference = 'Booth preference is required';
            if (!formData.boothSize) newErrors.boothSize = 'Booth size is required';
            break;
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      };

      const isStepValid = () => {
        switch (currentStep) {
          case 1:
            return formData.companyName && formData.contactPerson && formData.email && formData.phone;
          case 2:
            return formData.category && formData.address && formData.city && formData.state;
          case 3:
            return formData.boothPreference && formData.boothSize;
          default:
            return true;
        }
      };

      const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateStep(currentStep)) {
          setCurrentStep(prev => Math.min(prev + 1, 5));
        }
      };

      const handleBack = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentStep(prev => Math.max(prev - 1, 1));
      };

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep(currentStep)) return;
        
        setIsSubmitting(true);
        setSubmitError('');
        
        try {
          const { supabase } = await import('./supabase');
          const { error } = await supabase.from('exhibitors').insert([
            {
              company_name: formData.companyName,
              contact_person: formData.contactPerson,
              designation: formData.designation,
              email: formData.email,
              phone: formData.phone,
              alternate_email: formData.alternateEmail,
              alternate_phone: formData.alternatePhone,
              category: formData.category,
              company_description: formData.companyDescription,
              website: formData.website,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              pincode: formData.pincode,
              country: formData.country,
              gst_number: formData.gstNumber,
              booth: formData.boothSize,
              status: formData.status,
              payment_status: formData.paymentStatus,
              registration_date: new Date().toISOString(),
            }
          ]);
          
          if (error) throw error;
          setSubmitSuccess(true);
          refetch();
        } catch (err: any) {
          setSubmitError(err.message || 'Failed to submit registration');
        } finally {
          setIsSubmitting(false);
        }
      };

      if (submitSuccess) {
        return (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h3>
            <p className="text-gray-600 mb-6">Your exhibitor registration has been submitted successfully.</p>
            <button
              onClick={() => {
                setSubmitSuccess(false);
                setFormData(initialFormData);
                setCurrentStep(1);
              }}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Register Another
            </button>
          </div>
        );
      }

      return (
        <div className="mt-20 p-6 bg-gray-100 rounded-xl">
          <Stepper steps={adminSteps} currentStep={currentStep} />
          
          <form onSubmit={currentStep === 5 ? handleSubmit : handleNext}>
            {currentStep === 1 && (
              <Section title="Company Information" description="Basic details about your company">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Company Name"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    error={errors.companyName}
                    required
                    placeholder="Enter company name"
                  />
                  <Field
                    label="Contact Person"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    error={errors.contactPerson}
                    required
                    placeholder="Full name of contact person"
                  />
                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                    placeholder="contact@company.com"
                  />
                  <Field
                    label="Phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    required
                    placeholder="+91 98765 43210"
                  />
                  <Field
                    label="Company Description"
                    name="companyDescription"
                    type="textarea"
                    value={formData.companyDescription}
                    onChange={handleChange}
                    placeholder="Brief description of your company"
                  />
                  <Field
                    label="Website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://www.company.com"
                  />
                  </div>
              </Section>
            )}

            {currentStep === 2 && (
              <Section title="Business & Location Details" description="Information about your business and location">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Category"
                    name="category"
                    type="select"
                    value={formData.category}
                    onChange={handleChange}
                    error={errors.category}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Home & Garden">Home & Garden</option>
                    <option value="Sports & Fitness">Sports & Fitness</option>
                    <option value="Travel & Tourism">Travel & Tourism</option>
                    <option value="Finance & Banking">Finance & Banking</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Services">Services</option>
                    <option value="Others">Others</option>
                  </Field>
                  <Field
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    error={errors.address}
                    required
                    placeholder="Complete address"
                  />
                  <Field
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    error={errors.city}
                    required
                    placeholder="City"
                  />
                  <Field
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    error={errors.state}
                    required
                    placeholder="State"
                  />
                  <Field
                    label="Pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Pincode"
                  />
                  <Field
                    label="Country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Country"
                  />
                  </div>
              </Section>
            )}

            {currentStep === 3 && (
              <Section title="Exhibition Details" description="Specific requirements for the exhibition">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Booth Preference"
                    name="boothPreference"
                    type="select"
                    value={formData.boothPreference}
                    onChange={handleChange}
                    error={errors.boothPreference}
                    required
                  >
                    <option value="">Select Preference</option>
                    <option value="Indoor">Indoor</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="Corner">Corner</option>
                    <option value="Center">Center</option>
                    <option value="Near Entrance">Near Entrance</option>
                    <option value="Near Food Court">Near Food Court</option>
                  </Field>
                  <Field
                    label="Booth Size"
                    name="boothSize"
                    type="select"
                    value={formData.boothSize}
                    onChange={handleChange}
                    error={errors.boothSize}
                    required
                  >
                    <option value="">Select Size</option>
                    <option value="6x6 ft">6x6 ft</option>
                    <option value="8x8 ft">8x8 ft</option>
                    <option value="10x10 ft">10x10 ft</option>
                    <option value="12x12 ft">12x12 ft</option>
                    <option value="Custom">Custom</option>
                  </Field>
                  <Field
                    label="Special Requirements"
                    name="specialRequirements"
                    type="textarea"
                    value={formData.specialRequirements}
                    onChange={handleChange}
                    placeholder="Any special requirements or requests"
                  />
                </div>
              </Section>
            )}

            {currentStep === 4 && (
              <Section title="Additional Information" description="Optional additional details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="GST Number"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    placeholder="GST Number (optional)"
                  />
                  <Field
                    label="PAN Number"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    placeholder="PAN Number (optional)"
                  />
                  <Field
                    label="Alternate Email"
                    name="alternateEmail"
                    type="email"
                    value={formData.alternateEmail}
                    onChange={handleChange}
                    placeholder="Alternate email address"
                  />
                  <Field
                    label="Alternate Phone"
                    name="alternatePhone"
                    type="tel"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                    placeholder="Alternate phone number"
                  />
                  </div>
              </Section>
            )}

            {currentStep === 5 && (
              <Section title="Review & Submit" description="Please review your information before submitting">
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Registration Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><strong>Company:</strong> {formData.companyName}</div>
                    <div><strong>Contact:</strong> {formData.contactPerson}</div>
                    <div><strong>Email:</strong> {formData.email}</div>
                    <div><strong>Phone:</strong> {formData.phone}</div>
                    <div><strong>Category:</strong> {formData.category}</div>
                    <div><strong>City:</strong> {formData.city}</div>
                    <div><strong>Booth Size:</strong> {formData.boothSize}</div>
                    <div><strong>Booth Preference:</strong> {formData.boothPreference}</div>
                  </div>
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {submitError}
                  </div>
                )}
              </Section>
            )}

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-slate-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              
              <button
                type="submit"
                disabled={!isStepValid() || isSubmitting}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : currentStep === 5 ? 'Submit Registration' : 'Next'}
              </button>
                </div>
          </form>
              </div>
      );
    };
    */

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Our exhibitors</h2>
                <p className="text-slate-600 mb-8">Browse registered exhibitors and their details.</p>
                <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mb-8">
                    <AdSlot slotId="exhibitors_above" className="w-full" />
                </div>
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:max-w-lg">
                        <SearchIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, category, business type, city..."
                            className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                        />
                    </div>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 self-start">
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                viewMode === 'grid'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Grid
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                viewMode === 'list'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <List className="h-4 w-4" />
                            List
                        </button>
                    </div>
                </div>
                {filteredExhibitors.length > 0 ? (
                    <>
                    <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                        {mainSectionExhibitors.map((ex) => {
                            const previewImage = ex.companyLogoUrl || ex.productImagesUrls?.[0] || null;
                            return (
                            <button
                                key={ex.id}
                                type="button"
                                onClick={() => {
                                    setSelectedExhibitor(ex);
                                    setShowFileModal(true);
                                }}
                                className={`text-left bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/50 border border-indigo-100 rounded-2xl overflow-hidden hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 transition-all ${
                                    viewMode === 'list' ? 'w-full flex flex-col md:flex-row' : ''
                                }`}
                            >
                                <div className={`relative bg-slate-100 ${viewMode === 'list' ? 'h-48 md:h-auto md:w-64 md:shrink-0' : 'h-40 w-full'}`}>
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt={`${ex.companyName} showcase`}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 flex items-center justify-center">
                                            <div className="text-center px-4">
                                                <Image className="h-7 w-7 text-indigo-700 mx-auto mb-2" />
                                                <p className="text-xs text-indigo-800 font-medium">Portfolio image not uploaded yet</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                                    {ex.category && (
                                        <span className="absolute top-3 left-3 text-[11px] bg-white/90 text-indigo-700 px-2.5 py-1 rounded-full font-medium border border-indigo-100">
                                            {ex.category}
                                        </span>
                                    )}
                                    <span className="absolute top-3 right-3 text-[11px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold capitalize">
                                        {ex.status}
                                    </span>
                                </div>
                                <div className={`p-5 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className="font-semibold text-slate-900 line-clamp-2">{ex.companyName}</h3>
                                </div>
                                {Array.isArray(ex.subCategories) && ex.subCategories.length > 0 && (
                                    <p className="text-xs text-slate-600 mb-1">Sub Categories: {ex.subCategories.join(', ')}</p>
                                )}
                                {ex.city && <p className="text-sm text-slate-600 flex items-center gap-1.5"><MapPinIcon2 className="h-3.5 w-3.5 text-indigo-500" />{ex.city}</p>}
                                {ex.contactPerson && <p className="text-sm text-slate-600 mt-1">Contact: {ex.contactPerson}</p>}
                                {ex.email && <p className="text-sm text-slate-500 truncate" title={ex.email}>{ex.email}</p>}
                                {ex.booth && <p className="text-sm text-slate-700 font-medium mt-1">Booth: {ex.booth}</p>}
                                <div className="mt-3 flex items-center justify-between">
                                    <p className="text-xs text-indigo-700 font-semibold">View full profile</p>
                                    <span className="text-xs text-slate-500">
                                        {(ex.productImagesUrls?.length || 0) + (ex.companyLogoUrl ? 1 : 0)} image(s)
                                    </span>
                                </div>
                                </div>
                            </button>
                            );
                        })}
                    </div>
                    {viewMode === 'grid' && filteredExhibitors.length > 6 && (
                        <div className="mt-6 text-center">
                            <button
                                type="button"
                                onClick={() => setShowAllExhibitorsView(true)}
                                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                            >
                                View All Exhibitors ({filteredExhibitors.length})
                            </button>
                        </div>
                    )}
                    </>
                ) : (
                    <p className="text-gray-500">
                        {searchQuery.trim() ? 'No exhibitors match your search.' : 'No exhibitors registered yet.'}
                    </p>
                )}
            </div>

            <div className="mb-12">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Become an exhibitor</h2>
                <p className="text-slate-600">Join our community and showcase your products at local exhibitions.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-xl border border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-900 mb-6">Register as exhibitor</h3>
                    
                    {successMsg && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                            {successMsg}
                        </div>
                    )}
                    
                    {errorMsg && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                                    placeholder="Enter first name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                                    placeholder="Enter last name"
                                />
                            </div>
                </div>
                
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                                placeholder="Enter email address"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                                placeholder="Enter phone number"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                            <select
                                value={selectedCategoryId}
                                onChange={(e) => {
                                    setSelectedCategoryId(e.target.value);
                                    setSelectedSubCategories([]);
                                }}
                                required
                                disabled={loadingCategoryOptions}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                            >
                                <option value="">Select category</option>
                                {categoryOptions.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                        {opt.label}
                                    </option>
                                ))}
                </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sub Categories</label>
                            <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-300 p-3 space-y-2">
                                {loadingCategoryOptions ? (
                                    <p className="text-sm text-slate-500">Loading sub categories...</p>
                                ) : !selectedCategoryId ? (
                                    <p className="text-sm text-slate-500">Select a category to see sub categories.</p>
                                ) : visibleSubcategories.length === 0 ? (
                                    <p className="text-sm text-slate-500">No sub categories available for selected category.</p>
                                ) : (
                                    visibleSubcategories.map((sub) => (
                                        <label key={sub.id} className="flex items-center gap-2 text-sm text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={selectedSubCategories.includes(sub.label)}
                                                onChange={() => toggleSubCategory(sub.label)}
                                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span>{sub.label}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                            {!!selectedSubCategories.length && (
                                <p className="text-xs text-slate-500 mt-2">
                                    Selected: {selectedSubCategories.join(', ')}
                                </p>
                            )}
                        </div>
                
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
                <textarea
                                value={companyDescription}
                                onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                                placeholder="Brief description of your company/products"
                            />
                        </div>

                        {/* Commented by Nilesh : Document Upload Section }
                        <div className="border-t pt-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Documents & Images</h4>
                            
                            {/* Company Profile }
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FileText className="inline h-4 w-4 mr-1" />
                                    Company Profile (PDF)
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => setCompanyProfile(e.target.files?.[0] || null)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                                />
                            </div>

                            {/* GST Certificate }
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FileText className="inline h-4 w-4 mr-1" />
                                    GST Certificate (PDF/Image)
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setGstCertificate(e.target.files?.[0] || null)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                                />
                            </div>

                            {/* PAN Card }
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FileText className="inline h-4 w-4 mr-1" />
                                    PAN Card (PDF/Image)
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setPanCard(e.target.files?.[0] || null)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                                />
                            </div>

                            {/* Product Catalog }
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FileText className="inline h-4 w-4 mr-1" />
                                    Product Catalog (PDF)
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => setProductCatalog(e.target.files?.[0] || null)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                                />
                            </div>

                            {/* Company Logo }
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Image className="inline h-4 w-4 mr-1" />
                                    Company Logo (Image)
                                </label>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.gif"
                                    onChange={(e) => setCompanyLogo(e.target.files?.[0] || null)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                                />
                            </div>

                            {/* Product Images }
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Image className="inline h-4 w-4 mr-1" />
                                    Product Images (Multiple)
                                </label>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.gif"
                                    multiple
                                    onChange={(e) => setProductImages(Array.from(e.target.files || []))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                                />
                                {productImages.length > 0 && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        Selected {productImages.length} image(s)
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Upload Progress }
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Uploading files...</span>
                                    <span className="text-sm text-gray-500">{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                */}
                <button
                  type="submit"
                            disabled={submitting}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                            {submitting ? 'Submitting...' : 'Submit Registration'}
                </button>
              </form>
            </div>

                {/* Information Section */}
                <div className="space-y-8">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Why exhibit with us</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Building className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="font-medium text-slate-900">Community reach</h4>
                                    <p className="text-slate-600 text-sm">Connect with local communities and potential customers.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Users className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="font-medium text-slate-900">Targeted audience</h4>
                                    <p className="text-slate-600 text-sm">Reach specific demographics in residential societies.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Star className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="font-medium text-slate-900">Quality events</h4>
                                    <p className="text-slate-600 text-sm">Well-organized exhibitions with professional support.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Exhibitor statistics</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-semibold text-indigo-600">{totalExhibitors}</div>
                                <div className="text-slate-600 text-sm">Registered exhibitors</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-semibold text-indigo-600">50+</div>
                                <div className="text-slate-600 text-sm">Events hosted</div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Exhibitors (preview) */}
                    {exhibitors && exhibitors.length > 0 && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Exhibitors</h3>
                            <div className="space-y-4">
                                {exhibitors.slice(0, 3).map((ex) => (
                                    <div key={ex.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-gray-900">{ex.companyName}</h4>
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                {ex.status}
                                            </span>
                                        </div>
                                        {ex.category && <p className="text-sm text-gray-600 mb-2">{ex.category}</p>}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedExhibitor(ex);
                                                setShowFileModal(true);
                                            }}
                                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                        >
                                            View details
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">What's included</h3>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Booth space with basic setup</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Event marketing and promotion</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Customer support during event</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Post-event analytics and feedback</span>
                            </li>
                        </ul>
                    </div>
            </div>
          </div>

            {/* Advanced Registration - COMMENTED OUT */}
            {/* <AdvancedExhibitorRegistration /> */}

            {/* File Viewing Modal */}
            {showFileModal && selectedExhibitor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Details for {selectedExhibitor.companyName}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowFileModal(false);
                                    setSelectedExhibitor(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Contact info */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">Company & Contact</h3>
                                    <p><span className="text-gray-600">Company:</span> {selectedExhibitor.companyName}</p>
                                    {selectedExhibitor.contactPerson && <p><span className="text-gray-600">Contact:</span> {selectedExhibitor.contactPerson}</p>}
                                    {selectedExhibitor.designation && <p><span className="text-gray-600">Designation:</span> {selectedExhibitor.designation}</p>}
                                    {selectedExhibitor.email && <p><span className="text-gray-600">Email:</span> {selectedExhibitor.email}</p>}
                                    {selectedExhibitor.alternateEmail && <p><span className="text-gray-600">Alternate Email:</span> {selectedExhibitor.alternateEmail}</p>}
                                    {selectedExhibitor.phone && <p><span className="text-gray-600">Phone:</span> {selectedExhibitor.phone}</p>}
                                    {selectedExhibitor.alternatePhone && <p><span className="text-gray-600">Alternate Phone:</span> {selectedExhibitor.alternatePhone}</p>}
                                    {selectedExhibitor.category && <p><span className="text-gray-600">Category:</span> {selectedExhibitor.category}</p>}
                                    {Array.isArray(selectedExhibitor.subCategories) && selectedExhibitor.subCategories.length > 0 && (
                                        <p><span className="text-gray-600">Sub Categories:</span> {selectedExhibitor.subCategories.join(', ')}</p>
                                    )}
                                    {selectedExhibitor.city && <p><span className="text-gray-600">City:</span> {selectedExhibitor.city}</p>}
                                    {selectedExhibitor.state && <p><span className="text-gray-600">State:</span> {selectedExhibitor.state}</p>}
                                    {selectedExhibitor.country && <p><span className="text-gray-600">Country:</span> {selectedExhibitor.country}</p>}
                                    {selectedExhibitor.pincode && <p><span className="text-gray-600">Pincode:</span> {selectedExhibitor.pincode}</p>}
                                    {selectedExhibitor.address && <p><span className="text-gray-600">Address:</span> {selectedExhibitor.address}</p>}
                                    {selectedExhibitor.booth && <p><span className="text-gray-600">Booth:</span> {selectedExhibitor.booth}</p>}
                                    <p><span className="text-gray-600">Status:</span> {selectedExhibitor.status}</p>
                                    <p><span className="text-gray-600">Payment:</span> {selectedExhibitor.paymentStatus}</p>
                                    {selectedExhibitor.website && (
                                        <p>
                                            <span className="text-gray-600">Website:</span>{' '}
                                            <a
                                                href={selectedExhibitor.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-purple-600 hover:text-purple-700"
                                            >
                                                {selectedExhibitor.website}
                                            </a>
                                        </p>
                                    )}
                                </div>
                                {/* Company Logo (if available from DB in future) */}
                                {selectedExhibitor.companyLogoUrl && (
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-gray-900 mb-3">Company Logo</h3>
                                        <img 
                                            src={selectedExhibitor.companyLogoUrl}
                                            alt="Company Logo"
                                            className="w-full h-48 object-cover rounded-lg"
                                        />
                                        <a 
                                            href={selectedExhibitor.companyLogoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block mt-2 text-purple-600 hover:text-purple-700 text-sm"
                                        >
                                            View Full Size
                                        </a>
                                    </div>
                                )}

                                {/* Product Images */}
                                {selectedExhibitor.productImagesUrls && selectedExhibitor.productImagesUrls.length > 0 && (
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-gray-900 mb-3">Product Images</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {selectedExhibitor.productImagesUrls.map((url, index) => (
                                                <div key={index} className="relative">
                                                    <img 
                                                        src={url} 
                                                        alt={`Product ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded"
                                                    />
                                                    <a 
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all rounded flex items-center justify-center"
                                                    >
                                                        <span className="text-white opacity-0 hover:opacity-100 text-xs">View</span>
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Documents */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">Documents</h3>
                                    <div className="space-y-2">
                                        {selectedExhibitor.companyProfileUrl && (
                                            <a 
                                                href={selectedExhibitor.companyProfileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
                                            >
                                                <FileText className="h-4 w-4" />
                                                <span>Company Profile</span>
                                            </a>
                                        )}
                                        {selectedExhibitor.gstCertificateUrl && (
                                            <a 
                                                href={selectedExhibitor.gstCertificateUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
                                            >
                                                <FileText className="h-4 w-4" />
                                                <span>GST Certificate</span>
                                            </a>
                                        )}
                                        {selectedExhibitor.panCardUrl && (
                                            <a 
                                                href={selectedExhibitor.panCardUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
                                            >
                                                <FileText className="h-4 w-4" />
                                                <span>PAN Card</span>
                                            </a>
                                        )}
                                        {selectedExhibitor.productCatalogUrl && (
                                            <a 
                                                href={selectedExhibitor.productCatalogUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
                                            >
                                                <FileText className="h-4 w-4" />
                                                <span>Product Catalog</span>
                                            </a>
                                        )}
                                        {!selectedExhibitor.companyProfileUrl &&
                                            !selectedExhibitor.gstCertificateUrl &&
                                            !selectedExhibitor.panCardUrl &&
                                            !selectedExhibitor.productCatalogUrl && (
                                                <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                                            )}
                                    </div>
                                </div>
                                {selectedExhibitor.companyDescription && (
                                    <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
                                        <h3 className="font-semibold text-gray-900 mb-3">About the company</h3>
                                        <p className="text-sm text-gray-700 whitespace-pre-line">{selectedExhibitor.companyDescription}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showAllExhibitorsView && (
                <div className="fixed inset-0 bg-black/60 z-50 p-4 md:p-6">
                    <div className="bg-white rounded-2xl w-full h-full overflow-hidden flex flex-col">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">All Exhibitors</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Showing {filteredExhibitors.length} exhibitors
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAllExhibitorsView(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Close all exhibitors view"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                                {filteredExhibitors.map((ex) => {
                                    const previewImage = ex.companyLogoUrl || ex.productImagesUrls?.[0] || null;
                                    return (
                                        <button
                                            key={`all-${ex.id}`}
                                            type="button"
                                            onClick={() => {
                                                setSelectedExhibitor(ex);
                                                setShowFileModal(true);
                                            }}
                                            className={`text-left bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/50 border border-indigo-100 rounded-2xl overflow-hidden hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 transition-all ${
                                                viewMode === 'list' ? 'w-full flex flex-col md:flex-row' : ''
                                            }`}
                                        >
                                            <div className={`relative bg-slate-100 ${viewMode === 'list' ? 'h-48 md:h-auto md:w-64 md:shrink-0' : 'h-40 w-full'}`}>
                                                {previewImage ? (
                                                    <img
                                                        src={previewImage}
                                                        alt={`${ex.companyName} showcase`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 flex items-center justify-center">
                                                        <div className="text-center px-4">
                                                            <Image className="h-7 w-7 text-indigo-700 mx-auto mb-2" />
                                                            <p className="text-xs text-indigo-800 font-medium">Portfolio image not uploaded yet</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                                                {ex.category && (
                                                    <span className="absolute top-3 left-3 text-[11px] bg-white/90 text-indigo-700 px-2.5 py-1 rounded-full font-medium border border-indigo-100">
                                                        {ex.category}
                                                    </span>
                                                )}
                                                <span className="absolute top-3 right-3 text-[11px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold capitalize">
                                                    {ex.status}
                                                </span>
                                            </div>
                                            <div className={`p-5 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h3 className="font-semibold text-slate-900 line-clamp-2">{ex.companyName}</h3>
                                                </div>
                                                {Array.isArray(ex.subCategories) && ex.subCategories.length > 0 && (
                                                    <p className="text-xs text-slate-600 mb-1">Sub Categories: {ex.subCategories.join(', ')}</p>
                                                )}
                                                {ex.city && <p className="text-sm text-slate-600 flex items-center gap-1.5"><MapPinIcon2 className="h-3.5 w-3.5 text-indigo-500" />{ex.city}</p>}
                                                {ex.contactPerson && <p className="text-sm text-slate-600 mt-1">Contact: {ex.contactPerson}</p>}
                                                {ex.email && <p className="text-sm text-slate-500 truncate" title={ex.email}>{ex.email}</p>}
                                                {ex.booth && <p className="text-sm text-slate-700 font-medium mt-1">Booth: {ex.booth}</p>}
                                                <div className="mt-3 flex items-center justify-between">
                                                    <p className="text-xs text-indigo-700 font-semibold">View full profile</p>
                                                    <span className="text-xs text-slate-500">
                                                        {(ex.productImagesUrls?.length || 0) + (ex.companyLogoUrl ? 1 : 0)} image(s)
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};