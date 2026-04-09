import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { User, Event, Venue, Vendor, Exhibitor, Testimonial, WebsiteAd } from '../types';

/** First non-empty string from row (supports alternate DB column names). */
function pickRawEventImage(row: Record<string, unknown>): string | null {
  const keys = [
    'event_image_url',
    'event_image',
    'image_url',
    'cover_image',
    'image',
    'poster_url',
    'banner_url',
  ] as const;
  for (const k of keys) {
    const v = row[k];
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

/**
 * Full URL for <img src>; handles http(s) values and Supabase Storage paths.
 * Paths may be `bucket/object/key` or a single key under default public bucket.
 */
function resolveEventImageForDisplay(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s) || s.startsWith('//') || s.startsWith('data:')) return s;

  const slash = s.indexOf('/');
  if (slash > 0 && !s.includes('://')) {
    const maybeBucket = s.slice(0, slash);
    const objectPath = s.slice(slash + 1);
    if (/^[a-z0-9_-]+$/i.test(maybeBucket) && objectPath.length > 0) {
      return supabase.storage.from(maybeBucket).getPublicUrl(objectPath).data.publicUrl;
    }
  }

  return supabase.storage.from('exhibitor-images').getPublicUrl(s).data.publicUrl;
}

function mapEventImageFromRow(row: Record<string, unknown>): string | null {
  return resolveEventImageForDisplay(pickRawEventImage(row));
}

function normalizeSubCategories(raw: unknown): string[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const cleaned = raw.map((v) => String(v).trim()).filter(Boolean);
    return cleaned.length ? cleaned : null;
  }
  const text = String(raw).trim();
  if (!text) return null;
  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.map((v) => String(v).trim()).filter(Boolean);
        return cleaned.length ? cleaned : null;
      }
    } catch {
      // Fall through to comma-split parsing.
    }
  }
  const split = text
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  return split.length ? split : null;
}

// Generic hook for fetching data from Supabase
export function useSupabaseData<T>(
  table: string,
  select: string = '*',
  dependencies: any[] = [],
  options: { limit?: number; order?: { column: string; ascending?: boolean } } = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    // Check if Supabase is properly configured
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Please check your environment variables.');
      setLoading(false);
      console.error('❌ Supabase configuration missing. Please check your .env file.');
      return;
    }

    try {
      setLoading(true);
      
      // Start building the query
      let query = supabase
        .from(table)
        .select(select);
      
      // Add ordering if specified
      if (options.order) {
        query = query.order(
          options.order.column, 
          { ascending: options.order.ascending ?? false }
        );
      }
      
      // Add limit if specified
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      // Execute the query
      const { data: result, error } = await query;

      if (error) {
        console.error(`Error fetching ${table}:`, error);
        setError(`Failed to fetch ${table}: ${error.message}`);
      } else {
        console.log(`Fetched ${result?.length || 0} ${table} records`);
        setData(result as T[] || []);
        setError(null);
      }
    } catch (err) {
      console.error(`Unexpected error fetching ${table}:`, err);
      setError(err instanceof Error ? `Network error: ${err.message}` : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [...dependencies]);

  return { data, loading, error, refetch: () => fetchData() };
}

// Specific hooks for each entity
export const useUsers = () => {
  const { data, loading, error, refetch } = useSupabaseData<User>('users');
  return { users: data, loading, error, refetch };
};

/**
 * Public site: draft / cancelled never shown.
 * - `upcoming`: published + ongoing (Upcoming events + hero)
 * - `past`: completed only (Past events / gallery)
 * - `visible`: any showable status (e.g. app-wide loading gate)
 */
export type EventsDisplayFilter = 'upcoming' | 'past' | 'visible';

/** Events from Supabase (same DB as Exhibitors). */
export const useEvents = (displayFilter: EventsDisplayFilter = 'visible') => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Please check your environment variables.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('events').select('*');
      if (displayFilter === 'upcoming') {
        query = query.in('status', ['published', 'ongoing']);
      } else if (displayFilter === 'past') {
        query = query.eq('status', 'completed');
      } else {
        query = query.in('status', ['published', 'ongoing', 'completed']);
      }

      const orderAscending = displayFilter === 'upcoming';
      const { data: eventRows, error: eventError } = await query.order('event_date', {
        ascending: orderAscending,
      });

      if (eventError) throw eventError;

      const sponsorByEventId = new Map<string, { name: string | null; logo: string | null; role: string | null }>();

      const normKey = (v: unknown) => {
        if (v == null || v === '') return '';
        return String(v).trim().toLowerCase();
      };

      const rankRole = (role: string | null | undefined) => {
        const normalized = (role ?? '').toLowerCase().trim();
        if (normalized === 'title' || normalized === 'title sponsor') return 0;
        if (normalized === 'co-sponsor' || normalized === 'co sponsor' || normalized === 'co_sponsor') return 1;
        return 2;
      };

      const sponsorFkFromRow = (row: Record<string, unknown>) =>
        row.sponsor_id ?? row.sponsors_id ?? row.sponsor ?? null;

      const resolveSponsorDisplay = (s: Record<string, unknown>) => {
        const name =
          (s.company_name as string | null | undefined) ??
          (s.name as string | null | undefined) ??
          (s.sponsor_name as string | null | undefined) ??
          (s.title as string | null | undefined) ??
          null;
        const logo =
          (s.logo_url as string | null | undefined) ??
          (s.logo as string | null | undefined) ??
          (s.image_url as string | null | undefined) ??
          null;
        return { name: name?.trim() || null, logo: logo?.trim() || null };
      };

      // Load mappings from both table names (merge — avoids picking wrong table when one is empty).
      const eventSponsorRows: any[] = [];
      for (const table of ['event_sponsors', 'event_sponsorship'] as const) {
        const { data, error } = await supabase.from(table).select('event_id, sponsor_id, role');
        if (!error && data?.length) {
          eventSponsorRows.push(...data);
        }
      }

      if (eventSponsorRows.length > 0) {
        const sponsorIds = Array.from(
          new Set(
            eventSponsorRows
              .map((row: any) => sponsorFkFromRow(row))
              .filter((id: unknown) => id !== null && id !== undefined)
              .map((id: unknown) => normKey(id))
              .filter(Boolean)
          )
        );

        const sponsorById = new Map<string, { name: string | null; logo: string | null }>();

        if (sponsorIds.length > 0) {
          // Use * so we don't 400 if optional columns differ between environments.
          const { data: byIdRows, error: byIdError } = await supabase
            .from('sponsors')
            .select('*')
            .in('id', sponsorIds);

          if (!byIdError && byIdRows) {
            for (const s of byIdRows as any[]) {
              const k = normKey(s.id);
              if (!k) continue;
              const { name, logo } = resolveSponsorDisplay(s);
              sponsorById.set(k, { name, logo });
            }
          }

          // Any mapping FKs still missing? Try alternate key column on sponsors (if your schema uses it).
          const missing = sponsorIds.filter((id) => !sponsorById.has(id));
          if (missing.length > 0) {
            const { data: altRows, error: altError } = await supabase
              .from('sponsors')
              .select('*')
              .in('sponsor_id', missing);

            if (!altError && altRows) {
              for (const s of altRows as any[]) {
                const { name, logo } = resolveSponsorDisplay(s);
                const keyAlt = normKey(s.sponsor_id);
                if (keyAlt) sponsorById.set(keyAlt, { name, logo });
                const keyPk = normKey(s.id);
                if (keyPk) sponsorById.set(keyPk, { name, logo });
              }
            }
          }
        }

        const bestByEventId = new Map<string, any>();
        for (const row of eventSponsorRows as any[]) {
          const eventId = normKey(row.event_id);
          if (!eventId) continue;
          const current = bestByEventId.get(eventId);
          if (!current || rankRole(row.role) < rankRole(current.role)) {
            bestByEventId.set(eventId, row);
          }
        }

        for (const [eventId, row] of bestByEventId.entries()) {
          const sid = normKey(sponsorFkFromRow(row));
          const sponsor = sid ? sponsorById.get(sid) : undefined;
          sponsorByEventId.set(eventId, {
            name: sponsor?.name ?? null,
            logo: sponsor?.logo ?? null,
            role: (row.role as string | null) ?? null,
          });
        }
      }

      const mapped: Event[] = (eventRows ?? []).map((row: any) => {
        const joinedSponsor = sponsorByEventId.get(normKey(row.id));
        return {
          id: row.id,
          title: row.title ?? '',
          description: row.description ?? null,
          date: row.event_date ?? '',
          time: row.event_time ?? '',
          venue: row.venue_name ?? '',
          city: row.city ?? null,
          status: row.status ?? 'draft',
          attendees: row.attendees ?? 0,
          maxCapacity: row.max_capacity ?? 0,
          planType: row.plan_type ?? null,
          vendors: (row.vendor_ids ?? []).map((id: string) => String(id)),
          venueId: row.venue_id ?? null,
          createdBy: row.created_by ?? null,
          totalRevenue: Number(row.total_revenue ?? 0),
          image: mapEventImageFromRow(row),
          sponsorName: joinedSponsor?.name ?? row.sponsor_name ?? null,
          sponsorLogoUrl: joinedSponsor?.logo ?? row.sponsor_logo_url ?? null,
          sponsorRole: joinedSponsor?.role ?? null,
          created_at: row.created_at ?? '',
          updated_at: row.updated_at ?? '',
        };
      });

      setEvents(mapped);
    } catch (err) {
      console.error('Error fetching events with sponsors:', err);
      setError(err instanceof Error ? `Failed to fetch events: ${err.message}` : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [displayFilter]);

  return { events, loading, error, refetch: fetchEvents };
};

export const useVenues = () => {
  const { data, loading, error, refetch } = useSupabaseData<any>('venues', '*', [], 
    { order: { column: 'name', ascending: true } });
  
  // Transform data to match our Venue interface
  const venues: Venue[] = data.map((venue: any) => ({
    id: venue.id,
    name: venue.name,
    location: venue.location,
    contactPerson: venue.contact_person,
    email: venue.email,
    phone: venue.phone,
    memberCount: venue.capacity || 0,
    facilities: venue.facilities || [],
    activeEvents: venue.active_events || 0,
    totalRevenue: venue.total_revenue || 0,
    status: venue.status,
    joinedDate: venue.joined_date,
    created_at: venue.created_at,
    updated_at: venue.updated_at
  }));

  return { venues, loading, error, refetch };
};

export const useVendors = () => {
  const { data, loading, error, refetch } = useSupabaseData<any>('vendors', '*', [],
    { order: { column: 'name', ascending: true } });
  
  // Transform data to match our Vendor interface
  const vendors: Vendor[] = data.map((vendor: any) => ({
    id: vendor.id,
    name: vendor.name,
    category: vendor.category,
    city: vendor.city,
    contactPerson: vendor.contact_person,
    email: vendor.email,
    phone: vendor.phone,
    rating: vendor.rating,
    completedJobs: vendor.completed_jobs || 0,
    status: vendor.status,
    priceRange: vendor.price_range,
    created_at: vendor.created_at,
    updated_at: vendor.updated_at
  }));

  return { vendors, loading, error, refetch };
};

export const useExhibitors = () => {
  const { data, loading, error, refetch } = useSupabaseData<any>('exhibitors', '*', [],
    { order: { column: 'created_at', ascending: false } });
  
  // Transform data to match our Exhibitor interface
  const exhibitors: Exhibitor[] = data.map((exhibitor: any) => ({
    id: exhibitor.id,
    companyName: exhibitor.company_name,
    contactPerson: exhibitor.contact_person,
    designation: exhibitor.designation,
    companyDescription: exhibitor.company_description,
    website: exhibitor.website,
    alternateEmail: exhibitor.alternate_email,
    alternatePhone: exhibitor.alternate_phone,
    address: exhibitor.address,
    country: exhibitor.country,
    state: exhibitor.state,
    pincode: exhibitor.pincode,
    gstNumber: exhibitor.gst_number,
    email: exhibitor.email,
    phone: exhibitor.phone,
    category: exhibitor.category,
    subCategories: normalizeSubCategories(exhibitor.sub_category),
    city: exhibitor.city,
    booth: exhibitor.booth,
    companyLogoUrl: exhibitor.company_logo_url ?? null,
    productImagesUrls: Array.isArray(exhibitor.product_images_urls)
      ? exhibitor.product_images_urls.map((item: unknown) => String(item).trim()).filter(Boolean)
      : null,
    companyProfileUrl: exhibitor.company_profile_url ?? null,
    gstCertificateUrl: exhibitor.gst_certificate_url ?? null,
    panCardUrl: exhibitor.pan_card_url ?? null,
    productCatalogUrl: exhibitor.product_catalog_url ?? null,
    registrationDate: exhibitor.registration_date,
    status: exhibitor.status,
    paymentStatus: exhibitor.payment_status,
    created_at: exhibitor.created_at,
    updated_at: exhibitor.updated_at
  }));

  return { exhibitors, loading, error, refetch };
};

function mapTestimonialRow(row: any): Testimonial {
  const content = String(row.content ?? row.quote ?? '').trim();
  const authorName = String(row.author_name ?? row.author ?? '').trim();
  const authorTitleRaw = row.author_title ?? row.role ?? null;
  const authorTitle =
    authorTitleRaw == null || authorTitleRaw === '' ? null : String(authorTitleRaw).trim();
  return {
    id: row.id,
    content,
    authorName,
    authorTitle,
    imageUrl: row.image_url ?? null,
    avatarUrl: row.avatar_url ?? null,
    rating: Math.min(5, Math.max(1, Number(row.rating ?? 5))),
    sortOrder: Number(row.sort_order ?? 0),
    isPublished: row.is_published !== false,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  };
}

export const useTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestimonials = async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Please check your environment variables.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error: qErr } = await supabase
        .from('testimonials')
        .select('*')
        .order('sort_order', { ascending: true });

      if (qErr) throw qErr;

      const rows = (data ?? [])
        .filter((row: any) => row.is_published !== false)
        .map(mapTestimonialRow)
        .filter((t) => t.content && t.authorName);

      setTestimonials(rows);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch testimonials');
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  return { testimonials, loading, error, refetch: fetchTestimonials };
};

export const useWebsiteAds = (sectionKey: string) => {
  const [ads, setAds] = useState<WebsiteAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAds = async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Please check your environment variables.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: qErr } = await supabase
        .from('website_ads')
        .select('*')
        .eq('section_key', sectionKey)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (qErr) throw qErr;

      const mapped: WebsiteAd[] = (data ?? [])
        .map((row: any) => {
          const mediaUrl = String(row.media_url ?? '').trim();
          if (!mediaUrl) return null;
          const mediaType = String(row.media_type ?? 'image').toLowerCase() === 'video' ? 'video' : 'image';
          return {
            id: row.id,
            sectionKey: String(row.section_key ?? ''),
            title: row.title ?? null,
            mediaUrl,
            mediaType,
            thumbnailUrl: row.thumbnail_url ?? null,
            ctaText: row.cta_text ?? null,
            ctaUrl: row.cta_url ?? null,
            sortOrder: Number(row.sort_order ?? 0),
            isActive: row.is_active !== false,
            created_at: row.created_at ?? '',
            updated_at: row.updated_at ?? '',
          };
        })
        .filter(Boolean) as WebsiteAd[];

      setAds(mapped);
    } catch (err) {
      console.error('Error fetching website ads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch website ads');
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [sectionKey]);

  return { ads, loading, error, refetch: fetchAds };
};