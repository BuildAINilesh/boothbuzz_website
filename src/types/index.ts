export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    city?: string | null;
    phone?: string | null;
    status: 'active' | 'inactive';
    created_at: string;
    last_login?: string | null;
    updated_at: string;
  }
  
  export type UserRole = 
    | 'super_admin'
    | 'admin'
    | 'support_tech'
    | 'sales_marketing'
    | 'legal'
    | 'logistics'
    | 'accounting'
    | 'vendor'
    | 'society'
    | 'exhibitor';
  
  export interface Event {
  id: string;
  title: string;
  description?: string | null;
  date: string; // event_date from DB
  time: string; // event_time from DB
  venue: string; // venue_name from DB
  city?: string | null;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  attendees: number;
  maxCapacity: number; // max_capacity from DB
  planType?: 'Plan A' | 'Plan B' | 'Plan C' | 'Custom' | null; // plan_type from DB
  vendors: string[]; // vendor_ids from DB
  venueId?: string | null; // venue_id from DB
  createdBy?: string | null; // created_by from DB
  totalRevenue: number; // total_revenue from DB
  image?: string | null; // event_image from DB
  sponsorName?: string | null; // sponsor_name from DB
  sponsorLogoUrl?: string | null; // sponsor_logo_url from DB
  sponsorRole?: string | null; // role from event_sponsors table
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  eventId: string; // event_id from DB
  exhibitorId: string; // exhibitor_id from DB
  boothSize?: string | null; // booth_size from DB
  specialRequirements?: string | null; // special_requirements from DB
  paymentMethod: string; // payment_method from DB
  registrationDate: string; // registration_date from DB
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
}
  
  export interface Venue {
    id: string;
    name: string;
    location?: string | null;
    contactPerson?: string | null; // contact_person from DB
    email?: string | null;
    phone?: string | null;
    memberCount: number; // capacity from DB
    facilities: string[];
    activeEvents: number; // active_events from DB
    totalRevenue: number; // total_revenue from DB
    status: 'active' | 'inactive' | 'pending';
    joinedDate?: string | null; // joined_date from DB
    created_at: string;
    updated_at: string;
  }
  
  export interface Vendor {
    id: string;
    name: string;
    category: 'sound_lights' | 'catering' | 'decoration' | 'security' | 'transportation' | 'housekeeping';
    city?: string | null;
    contactPerson?: string | null; // contact_person from DB
    email?: string | null;
    phone?: string | null;
    rating?: number | null;
    completedJobs: number; // completed_jobs from DB
    status: 'active' | 'inactive';
    priceRange?: string | null; // price_range from DB
    created_at: string;
    updated_at: string;
  }
  
  export interface Exhibitor {
    id: string;
    companyName: string; // company_name from DB
    contactPerson?: string | null; // contact_person from DB
    designation?: string | null; // designation from DB
    companyDescription?: string | null; // company_description from DB
    website?: string | null; // website from DB
    alternateEmail?: string | null; // alternate_email from DB
    alternatePhone?: string | null; // alternate_phone from DB
    address?: string | null; // address from DB
    country?: string | null; // country from DB
    state?: string | null; // state from DB
    pincode?: string | null; // pincode from DB
    gstNumber?: string | null; // gst_number from DB
    email?: string | null;
    phone?: string | null;
    category?: string | null;
  subCategories?: string[] | null; // sub_category from DB
    city?: string | null;
    booth?: string | null;
  companyLogoUrl?: string | null; // company_logo_url from DB
  productImagesUrls?: string[] | null; // product_images_urls from DB
  companyProfileUrl?: string | null; // company_profile_url from DB
  gstCertificateUrl?: string | null; // gst_certificate_url from DB
  panCardUrl?: string | null; // pan_card_url from DB
  productCatalogUrl?: string | null; // product_catalog_url from DB
    registrationDate?: string | null; // registration_date from DB
    status: 'registered' | 'confirmed' | 'checked_in' | 'cancelled';
    paymentStatus: 'pending' | 'paid' | 'refunded'; // payment_status from DB
    created_at: string;
    updated_at: string;
  }
  
  export interface Society {
    id: string;
    name: string;
    location: string;
    contactPerson: string;
    email: string;
    phone: string;
    memberCount: number;
    facilities: string[];
    activeEvents: number;
    totalRevenue: number;
    status: 'active' | 'inactive' | 'pending';
    joinedDate: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface DashboardStats {
    totalEvents: number;
    activeEvents: number;
    totalVenues: number;
    totalVendors: number;
    totalExhibitors: number;
    monthlyRevenue: number;
    revenueGrowth: number;
    userGrowth: number;
  }

  /** Gallery testimonials (`testimonials` table: content, author_name, author_title, …). */
  export interface Testimonial {
    id: string;
    content: string;
    authorName: string;
    authorTitle?: string | null;
    imageUrl?: string | null;
    avatarUrl?: string | null;
    rating: number;
    sortOrder: number;
    isPublished?: boolean;
    created_at: string;
    updated_at: string;
  }

  export interface WebsiteAd {
    id: string;
    sectionKey: string;
    title?: string | null;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    thumbnailUrl?: string | null;
    ctaText?: string | null;
    ctaUrl?: string | null;
    sortOrder: number;
    isActive: boolean;
    created_at: string;
    updated_at: string;
  }