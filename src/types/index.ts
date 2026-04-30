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
  /** Total stalls from events.no_of_stalls (legacy fallback: stall_slots_total). */
  stallSlotsTotal?: number | null;
  /** Structured stall options if available (size + price + count rows from events table). */
  stallOptions?: Array<{ size?: string | null; price: number; count?: number | null }> | null;
  /** Minimum stall price across options or scalar fields. */
  stallPriceMin?: number | null;
  /** Maximum stall price across options or scalar fields. */
  stallPriceMax?: number | null;
  /** Non-cancelled exhibitor registrations for this event (computed in useEvents). */
  registeredExhibitorCount?: number;
  planType?: 'Plan A' | 'Plan B' | 'Plan C' | 'Custom' | null; // plan_type from DB
  vendors: string[]; // vendor_ids from DB
  organizationId?: string | null;
  organizerName?: string | null;
  organizerAdminName?: string | null;
  venueId?: string | null; // venue_id from DB
  createdBy?: string | null; // created_by from DB
  totalRevenue: number; // total_revenue from DB
  /** Resolved cover image from any known column (see pickRawEventImage). */
  image?: string | null;
  /** Cover image resolved only from event_image_url (preferred for listings when set). */
  eventImageUrl?: string | null;
  /** Layout / floor-plan images (from layout_image_url + layout_image_urls), all resolved to public URLs. */
  layoutImageUrls?: string[] | null;
  sponsorName?: string | null; // sponsor_name from DB
  sponsorLogoUrl?: string | null; // sponsor_logo_url from DB
  sponsorRole?: string | null; // role from event_sponsors table
  organizerEmail?: string | null;
  organizerPhone?: string | null;
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

/** event_registrations row joined with exhibitor for public event detail. */
export interface EventRegistrationWithExhibitor {
  id: string;
  boothSize: string | null;
  status: string;
  registrationDate: string;
  exhibitor: {
    companyName: string;
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    category?: string | null;
    city?: string | null;
    booth?: string | null;
  };
}

export interface MyEventRegistration {
  id: string;
  boothSize?: string | null;
  specialRequirements?: string | null;
  paymentMethod: string;
  registrationDate: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  event: {
    id: string;
    title: string;
    date: string;
    time: string;
    venue: string;
    city?: string | null;
    eventImageUrl?: string | null;
  };
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
  /** Primary showcase image for portfolio cards (DB: portfolio_image_url) */
  portfolioImageUrl?: string | null;
  productImagesUrls?: string[] | null; // product_images_urls from DB
  /** Extra uploaded photos for detail gallery (DB: image_urls) */
  imageUrls?: string[] | null;
  companyProfileUrl?: string | null; // company_profile_url from DB
  gstCertificateUrl?: string | null; // gst_certificate_url from DB
  panCardUrl?: string | null; // pan_card_url from DB
  productCatalogUrl?: string | null; // product_catalog_url from DB
  userId?: string | null; // user_id from DB (auth.users link)
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