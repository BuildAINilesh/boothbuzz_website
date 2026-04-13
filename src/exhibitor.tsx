import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Users, MapPinIcon, Star, Search as SearchIcon, LayoutGrid, List } from 'lucide-react';
import { useExhibitors } from './hooks/useSupabaseData';
import React, { useEffect, useState } from 'react';
import { Building, User as UserIcon, MapPin as MapPinIcon2, Package, CheckCircle, Upload, FileText, Image, X, ExternalLink, Mail, Phone } from 'lucide-react';
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

function exhibitorPreviewImage(ex: ExhibitorRecord): string | null {
    const p = ex.portfolioImageUrl?.trim();
    if (p) return p;
    if (ex.companyLogoUrl?.trim()) return ex.companyLogoUrl;
    const fromProduct = ex.productImagesUrls?.find((u) => String(u).trim());
    if (fromProduct) return String(fromProduct).trim();
    const fromGallery = ex.imageUrls?.find((u) => String(u).trim());
    return fromGallery ? String(fromGallery).trim() : null;
}

function exhibitorMediaCount(ex: ExhibitorRecord): number {
    const urls = new Set<string>();
    for (const u of [ex.portfolioImageUrl, ex.companyLogoUrl]) {
        const s = u?.trim();
        if (s) urls.add(s);
    }
    for (const u of ex.productImagesUrls ?? []) {
        const s = String(u).trim();
        if (s) urls.add(s);
    }
    for (const u of ex.imageUrls ?? []) {
        const s = String(u).trim();
        if (s) urls.add(s);
    }
    return urls.size;
}

/** Deduped gallery items for detail modal (order: portfolio, logo, products, uploads). */
function buildExhibitorGalleryItems(ex: ExhibitorRecord): { url: string; caption: string }[] {
    const seen = new Set<string>();
    const out: { url: string; caption: string }[] = [];
    const add = (url: string | null | undefined, caption: string) => {
        const u = url?.trim();
        if (!u || seen.has(u)) return;
        seen.add(u);
        out.push({ url: u, caption });
    };
    add(ex.portfolioImageUrl, 'Portfolio');
    add(ex.companyLogoUrl, 'Logo');
    for (const u of ex.productImagesUrls ?? []) add(String(u), 'Product');
    for (const u of ex.imageUrls ?? []) add(String(u), 'Upload');
    return out;
}

const ExhibitorDetailModal: React.FC<{
    ex: ExhibitorRecord;
    onClose: () => void;
}> = ({ ex, onClose }) => {
    const heroSrc = exhibitorPreviewImage(ex);
    const galleryItems = buildExhibitorGalleryItems(ex);
    const hasDocs = !!(
        ex.companyProfileUrl ||
        ex.gstCertificateUrl ||
        ex.panCardUrl ||
        ex.productCatalogUrl
    );

    const DetailLine: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => {
        if (children == null || children === '') return null;
        return (
            <div className="flex gap-2 py-1.5 border-b border-outline-variant/10 last:border-0 text-sm">
                <span className="text-on-surface-variant w-[7.5rem] shrink-0 text-xs font-semibold uppercase tracking-wide pt-0.5">
                    {label}
                </span>
                <div className="text-on-surface min-w-0 flex-1 leading-snug">{children}</div>
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 bg-black/55 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exhibitor-detail-title"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="bg-surface-container-lowest text-on-surface font-body w-full sm:max-w-5xl max-h-[100dvh] sm:max-h-[92vh] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-outline-variant/20"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative h-36 sm:h-40 shrink-0 bg-surface-container-low">
                    {heroSrc ? (
                        <img src={heroSrc} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/20 via-secondary-container/40 to-primary-fixed/30 flex items-center justify-center">
                            <Image className="h-12 w-12 text-primary/40" aria-hidden />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 flex items-end justify-between gap-3">
                        <div className="min-w-0">
                            <h2
                                id="exhibitor-detail-title"
                                className="text-lg sm:text-xl font-bold font-headline text-white drop-shadow-sm line-clamp-2"
                            >
                                {ex.companyName}
                            </h2>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {ex.category && (
                                    <span className="text-[10px] sm:text-xs font-semibold bg-white/95 text-primary px-2 py-0.5 rounded-md">
                                        {ex.category}
                                    </span>
                                )}
                                <span className="text-[10px] sm:text-xs font-semibold capitalize bg-emerald-500/90 text-white px-2 py-0.5 rounded-md">
                                    {ex.status}
                                </span>
                                <span className="text-[10px] sm:text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
                                    {ex.paymentStatus}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="shrink-0 p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md transition-colors"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain">
                    <div className="p-3 sm:p-4 space-y-3">
                        {(ex.city || ex.contactPerson || ex.email) && (
                            <div className="flex flex-wrap gap-2 text-xs text-on-surface-variant">
                                {ex.city && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface-container-low px-2 py-1 ghost-border">
                                        <MapPinIcon2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                        {ex.city}
                                        {ex.state ? `, ${ex.state}` : ''}
                                    </span>
                                )}
                                {ex.booth && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface-container-low px-2 py-1 ghost-border">
                                        <Package className="h-3.5 w-3.5 text-primary shrink-0" />
                                        Booth {ex.booth}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                            <div className="lg:col-span-5 space-y-3">
                                <div className="rounded-xl bg-surface-container-low/50 p-3 sm:p-3.5 ghost-border border border-outline-variant/15">
                                    <h3 className="text-xs font-bold font-headline text-primary uppercase tracking-wider mb-2">
                                        Contact
                                    </h3>
                                    <div className="divide-y divide-outline-variant/10">
                                        <DetailLine label="Person">{ex.contactPerson}</DetailLine>
                                        <DetailLine label="Role">{ex.designation}</DetailLine>
                                        {ex.email && (
                                            <div className="flex gap-2 py-1.5 text-sm items-start">
                                                <span className="text-on-surface-variant w-[7.5rem] shrink-0 text-xs font-semibold uppercase tracking-wide pt-0.5">
                                                    Email
                                                </span>
                                                <a
                                                    href={`mailto:${ex.email}`}
                                                    className="text-primary font-medium inline-flex items-center gap-1 min-w-0 break-all hover:underline"
                                                >
                                                    <Mail className="h-3.5 w-3.5 shrink-0" />
                                                    {ex.email}
                                                </a>
                                            </div>
                                        )}
                                        {ex.alternateEmail && (
                                            <DetailLine label="Alt. email">{ex.alternateEmail}</DetailLine>
                                        )}
                                        {ex.phone && (
                                            <div className="flex gap-2 py-1.5 text-sm items-start">
                                                <span className="text-on-surface-variant w-[7.5rem] shrink-0 text-xs font-semibold uppercase tracking-wide pt-0.5">
                                                    Phone
                                                </span>
                                                <a
                                                    href={`tel:${ex.phone}`}
                                                    className="text-primary font-medium inline-flex items-center gap-1 hover:underline"
                                                >
                                                    <Phone className="h-3.5 w-3.5 shrink-0" />
                                                    {ex.phone}
                                                </a>
                                            </div>
                                        )}
                                        <DetailLine label="Alt. phone">{ex.alternatePhone}</DetailLine>
                                        {Array.isArray(ex.subCategories) && ex.subCategories.length > 0 && (
                                            <DetailLine label="Sub-cats">{ex.subCategories.join(', ')}</DetailLine>
                                        )}
                                        <DetailLine label="Address">{ex.address}</DetailLine>
                                        <DetailLine label="Pincode">{ex.pincode}</DetailLine>
                                        <DetailLine label="Country">{ex.country}</DetailLine>
                                        {ex.website && (
                                            <div className="flex gap-2 py-1.5 text-sm items-start">
                                                <span className="text-on-surface-variant w-[7.5rem] shrink-0 text-xs font-semibold uppercase tracking-wide pt-0.5">
                                                    Web
                                                </span>
                                                <a
                                                    href={ex.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary font-medium inline-flex items-center gap-1 min-w-0 break-all hover:underline"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                                    <span className="truncate">{ex.website}</span>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl bg-surface-container-low/50 p-3 sm:p-3.5 ghost-border border border-outline-variant/15">
                                    <h3 className="text-xs font-bold font-headline text-primary uppercase tracking-wider mb-2">
                                        Documents
                                    </h3>
                                    {hasDocs ? (
                                        <div className="flex flex-col gap-1">
                                            {ex.companyProfileUrl && (
                                                <a
                                                    href={ex.companyProfileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-sm text-primary hover:bg-surface-container-low rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                                                >
                                                    <FileText className="h-4 w-4 shrink-0 opacity-70" />
                                                    Company profile
                                                </a>
                                            )}
                                            {ex.gstCertificateUrl && (
                                                <a
                                                    href={ex.gstCertificateUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-sm text-primary hover:bg-surface-container-low rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                                                >
                                                    <FileText className="h-4 w-4 shrink-0 opacity-70" />
                                                    GST certificate
                                                </a>
                                            )}
                                            {ex.panCardUrl && (
                                                <a
                                                    href={ex.panCardUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-sm text-primary hover:bg-surface-container-low rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                                                >
                                                    <FileText className="h-4 w-4 shrink-0 opacity-70" />
                                                    PAN card
                                                </a>
                                            )}
                                            {ex.productCatalogUrl && (
                                                <a
                                                    href={ex.productCatalogUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-sm text-primary hover:bg-surface-container-low rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                                                >
                                                    <FileText className="h-4 w-4 shrink-0 opacity-70" />
                                                    Product catalog
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-on-surface-variant">No documents uploaded.</p>
                                    )}
                                </div>
                            </div>

                            <div className="lg:col-span-7 space-y-3 min-w-0">
                                {ex.companyDescription && (
                                    <div className="rounded-xl bg-surface-container-low/50 p-3 sm:p-3.5 ghost-border border border-outline-variant/15">
                                        <h3 className="text-xs font-bold font-headline text-primary uppercase tracking-wider mb-2">
                                            About
                                        </h3>
                                        <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">
                                            {ex.companyDescription}
                                        </p>
                                    </div>
                                )}

                                {galleryItems.length > 0 && (
                                    <div className="rounded-xl bg-surface-container-low/50 p-3 sm:p-3.5 ghost-border border border-outline-variant/15">
                                        <h3 className="text-xs font-bold font-headline text-primary uppercase tracking-wider mb-2 flex items-center justify-between gap-2">
                                            <span>Gallery</span>
                                            <span className="text-on-surface-variant font-normal normal-case">
                                                {galleryItems.length} photo{galleryItems.length === 1 ? '' : 's'}
                                            </span>
                                        </h3>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                                            {galleryItems.map((item, index) => (
                                                <a
                                                    key={`${item.url}-${index}`}
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group relative aspect-square overflow-hidden rounded-lg bg-surface-container-low ring-1 ring-outline-variant/10 hover:ring-primary/30 transition-all"
                                                >
                                                    <img
                                                        src={item.url}
                                                        alt={item.caption}
                                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <span className="absolute bottom-0 inset-x-0 bg-black/55 text-[9px] sm:text-[10px] text-white/95 px-1 py-0.5 truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {item.caption}
                                                    </span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

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
        <>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-on-surface font-body">
            <div className="mb-16">
                <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight text-on-background mb-2">Our exhibitors</h2>
                <p className="text-on-surface-variant mb-8">Browse registered exhibitors and their details.</p>
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
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-surface-container-low ghost-border text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                    </div>
                    <div className="inline-flex rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-1 self-start ghost-border">
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold font-headline transition-colors ${
                                viewMode === 'grid'
                                    ? 'bg-primary text-on-primary'
                                    : 'text-on-surface-variant hover:bg-surface-container-low'
                            }`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Grid
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold font-headline transition-colors ${
                                viewMode === 'list'
                                    ? 'bg-primary text-on-primary'
                                    : 'text-on-surface-variant hover:bg-surface-container-low'
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
                            const previewImage = exhibitorPreviewImage(ex);
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
                                        {exhibitorMediaCount(ex)} image(s)
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
                                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold font-headline hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-12">
                <div className="lg:col-span-7">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-sm font-semibold font-headline mb-6">
                        Join the showcase
                    </span>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-headline leading-[1.1] tracking-tight text-on-surface mb-6">
                        Your brand, <br />
                        <span className="text-primary">under the spotlight.</span>
                    </h2>
                    <p className="text-lg md:text-xl text-on-surface-variant max-w-xl leading-relaxed">
                        BoothBuzz connects creators with community audiences. Register to get a booth at local exhibitions and grow your reach.
                    </p>

                    <div className="mt-8 lg:mt-10 space-y-5 max-w-xl lg:max-w-none">
                        <div className="bg-surface-container-lowest p-5 md:p-6 rounded-2xl border border-outline-variant/20 ghost-border shadow-sm">
                            <h3 className="text-base font-bold font-headline text-on-surface mb-4">Why exhibit with us</h3>
                            <div className="space-y-3.5">
                                <div className="flex items-start gap-3">
                                    <Building className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-on-surface text-sm">Community reach</h4>
                                        <p className="text-on-surface-variant text-sm leading-snug">Connect with local communities and potential customers.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Users className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-on-surface text-sm">Targeted audience</h4>
                                        <p className="text-on-surface-variant text-sm leading-snug">Reach specific demographics in residential societies.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Star className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-on-surface text-sm">Quality events</h4>
                                        <p className="text-on-surface-variant text-sm leading-snug">Well-organized exhibitions with professional support.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface-container-lowest p-5 md:p-6 rounded-2xl border border-outline-variant/20 ghost-border shadow-sm">
                            <h3 className="text-base font-bold font-headline text-on-surface mb-4">Exhibitor statistics</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-primary-fixed/40 border border-primary/10 px-3 py-4 text-center">
                                    <div className="text-2xl font-bold font-headline text-primary">{totalExhibitors}</div>
                                    <div className="text-on-surface-variant text-xs mt-1">Registered exhibitors</div>
                                </div>
                                <div className="rounded-xl bg-secondary-container/50 border border-outline-variant/15 px-3 py-4 text-center">
                                    <div className="text-2xl font-bold font-headline text-on-surface">50+</div>
                                    <div className="text-on-surface-variant text-xs mt-1">Events hosted</div>
                                </div>
                            </div>
                        </div>

                        {exhibitors && exhibitors.length > 0 && (
                            <div className="bg-surface-container-lowest p-5 md:p-6 rounded-2xl border border-outline-variant/20 ghost-border shadow-sm">
                                <h3 className="text-base font-bold font-headline text-on-surface mb-4">Recent exhibitors</h3>
                                <div className="space-y-3">
                                    {exhibitors.slice(0, 3).map((ex) => (
                                        <div
                                            key={ex.id}
                                            className="rounded-xl border border-outline-variant/20 bg-surface-container-low/30 px-3 py-3"
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <h4 className="font-semibold text-on-surface text-sm line-clamp-1">{ex.companyName}</h4>
                                                <span className="text-[10px] uppercase tracking-wide bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                                                    {ex.status}
                                                </span>
                                            </div>
                                            {ex.category && (
                                                <p className="text-xs text-on-surface-variant mb-2">{ex.category}</p>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedExhibitor(ex);
                                                    setShowFileModal(true);
                                                }}
                                                className="text-xs font-semibold text-primary hover:opacity-80"
                                            >
                                                View details
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div
                    id="exhibitor-registration"
                    className="lg:col-span-5 relative scroll-mt-24"
                >
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" aria-hidden />
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none" aria-hidden />
                    <div className="relative bg-surface-container-lowest p-8 md:p-10 rounded-[2rem] shadow-editorial ghost-border">
                    <h3 className="text-2xl font-bold font-headline text-on-surface mb-2">Exhibitor registration</h3>
                    <p className="text-on-surface-variant text-sm mb-8">Tell us about your brand to get started.</p>
                    
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
                            className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold font-headline text-base shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                            {submitting ? 'Submitting...' : 'Submit registration'}
                </button>
              </form>
                    </div>
                </div>
            </div>

                {/* What's included — full width under the two-column registration row */}
                <div className="mt-10 lg:mt-12 max-w-3xl">
                    <div className="bg-surface-container-lowest p-6 md:p-7 rounded-2xl border border-outline-variant/20 ghost-border shadow-sm">
                        <h3 className="text-lg font-bold font-headline text-on-surface mb-4">What&apos;s included</h3>
                        <ul className="space-y-2.5 text-on-surface-variant text-sm">
                            <li className="flex items-center gap-2.5">
                                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                                <span>Booth space with basic setup</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                                <span>Event marketing and promotion</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                                <span>Customer support during event</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                                <span>Post-event analytics and feedback</span>
                            </li>
                        </ul>
                    </div>
                </div>
        </div>

            {/* Advanced Registration - COMMENTED OUT */}
            {/* <AdvancedExhibitorRegistration /> */}

            {showFileModal && selectedExhibitor && (
                <ExhibitorDetailModal
                    ex={selectedExhibitor}
                    onClose={() => {
                        setShowFileModal(false);
                        setSelectedExhibitor(null);
                    }}
                />
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
                                    const previewImage = exhibitorPreviewImage(ex);
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
                                                        {exhibitorMediaCount(ex)} image(s)
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
        </>
    );
};