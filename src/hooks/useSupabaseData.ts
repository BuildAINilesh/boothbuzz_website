import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { User, Event, Venue, Vendor, Exhibitor, Testimonial, WebsiteAd, MyEventRegistration } from '../types';

/** Trim, strip BOM, strip wrapping quotes (common DB/CSV paste). */
function scrubEventImageCell(v: unknown): string | null {
  if (v == null) return null;
  let s = String(v).replace(/^\uFEFF/, '').trim();
  if (!s) return null;
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s || null;
}

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
    const s = scrubEventImageCell(row[k]);
    if (s) return s;
  }
  return null;
}

const supabaseProjectBase =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL
    ? String(import.meta.env.VITE_SUPABASE_URL).replace(/\/$/, '')
    : '';

/** Fix `https:/host` / `http:/host` (missing slash) from bad exports or DB paste. */
function fixMalformedHttpProtocol(s: string): string {
  return s
    .replace(/^https:\/(?!\/)/i, 'https://')
    .replace(/^http:\/(?!\/)/i, 'http://');
}

/**
 * DB sometimes stores a JSON array string, e.g. `["https://..."]` or broken `["https:/...`.
 * Extract a single URL string; never pass that whole value to Storage as an object key.
 */
function unwrapJsonArrayImageString(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.startsWith('[')) return trimmed;
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      const first = parsed.find((x) => typeof x === 'string' && String(x).trim());
      if (first != null) return String(first).trim();
    }
  } catch {
    // Invalid JSON — pull first http(s) segment
    const m = trimmed.match(/https?:\/[^"'\]\s,}]+/i);
    if (m) return m[0].trim();
  }
  return trimmed;
}

/**
 * Full URL for <img src>; handles http(s) values and Supabase Storage paths.
 * Paths may be `bucket/object/key` or a single key under default public bucket.
 */
function resolveEventImageForDisplay(raw: string | null): string | null {
  if (!raw) return null;
  let s = raw.trim();
  if (!s) return null;
  s = scrubEventImageCell(s) ?? s;
  if (!s) return null;

  s = unwrapJsonArrayImageString(s);
  s = fixMalformedHttpProtocol(s);

  if (/^https?:\/\//i.test(s) || s.startsWith('data:')) return s;
  if (s.startsWith('//')) return `https:${s}`;

  if (supabaseProjectBase) {
    if (s.startsWith('/storage/v1')) {
      return `${supabaseProjectBase}${s}`;
    }
    if (s.startsWith('storage/v1/')) {
      return `${supabaseProjectBase}/${s}`;
    }
  }

  const slash = s.indexOf('/');
  if (slash > 0 && !s.includes('://')) {
    const maybeBucket = s.slice(0, slash);
    const objectPath = s.slice(slash + 1);
    if (/^[a-z0-9_-]+$/i.test(maybeBucket) && objectPath.length > 0) {
      return supabase.storage.from(maybeBucket).getPublicUrl(objectPath).data.publicUrl;
    }
  }

  // Looks like a URL fragment but not a valid storage path — do not call Storage (avoids InvalidKey 400).
  if (/https?:/i.test(s)) {
    const fixed = fixMalformedHttpProtocol(s);
    if (/^https?:\/\//i.test(fixed)) return fixed;
    return null;
  }

  return supabase.storage.from('exhibitor-images').getPublicUrl(s).data.publicUrl;
}

function mapEventImageFromRow(row: Record<string, unknown>): string | null {
  return resolveEventImageForDisplay(pickRawEventImage(row));
}

/** Cover from events.event_image_url only (full URL for img src). */
function mapEventImageUrlColumn(row: Record<string, unknown>): string | null {
  for (const key of ['event_image_url', 'eventImageUrl'] as const) {
    const scrubbed = scrubEventImageCell(row[key]);
    if (scrubbed) {
      const resolved = resolveEventImageForDisplay(scrubbed);
      if (resolved) return resolved;
    }
  }
  return null;
}

/** Merge layout_image_url + layout_image_urls, resolve storage paths, dedupe. */
function mapEventLayoutImagesFromRow(row: Record<string, unknown>): string[] | null {
  const fromArray = normalizeExhibitorUrlArray(row.layout_image_urls) ?? [];
  const single = row.layout_image_url;
  const fromSingle: string[] = [];
  if (single != null && String(single).trim()) {
    const s = String(single).trim();
    if (s.startsWith('[')) {
      const parsed = normalizeExhibitorUrlArray(s);
      if (parsed) fromSingle.push(...parsed);
    } else {
      fromSingle.push(s);
    }
  }
  const merged = [...fromSingle, ...fromArray];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of merged) {
    const url = resolveEventImageForDisplay(String(raw).trim());
    if (url && !seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out.length ? out : null;
}

/** Parse text[], json array, or single URL string for exhibitor image list columns. */
function normalizeExhibitorUrlArray(raw: unknown): string[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const cleaned = raw.map((v) => String(v).trim()).filter(Boolean);
    return cleaned.length ? cleaned : null;
  }
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return null;
    if (t.startsWith('[')) {
      try {
        const parsed = JSON.parse(t);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.map((v) => String(v).trim()).filter(Boolean);
          return cleaned.length ? cleaned : null;
        }
      } catch {
        return [t];
      }
    }
    return [t];
  }
  return null;
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

type StallOption = { size?: string | null; price: number; count?: number | null };

function parseNumericLike(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[^0-9.]/g, '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseStallOptionsFromRow(row: Record<string, unknown>): StallOption[] | null {
  const candidates = [
    row.in_site_stalls,
    row.stall_options,
    row.stall_details,
    row.stall_pricing,
    row.stall_prices,
    row.booth_prices,
    row.size_price,
  ];

  const fromArrayLike = (input: unknown): StallOption[] => {
    if (!Array.isArray(input)) return [];
    const out: StallOption[] = [];
    for (const item of input) {
      if (item == null) continue;
      if (typeof item === 'number' || typeof item === 'string') {
        const p = parseNumericLike(item);
        if (p != null && p > 0) out.push({ price: p });
        continue;
      }
      if (typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const price = parseNumericLike(
          obj.price ?? obj.amount ?? obj.rate ?? obj.stall_price ?? obj.booth_price
        );
        if (price == null || price <= 0) continue;
        const sizeRaw = obj.stallSize ?? obj.size ?? obj.stall_size ?? obj.booth_size ?? obj.label ?? null;
        const size = sizeRaw == null ? null : String(sizeRaw).trim() || null;
        const countRaw =
          obj.count ?? obj.slots ?? obj.quantity ?? obj.qty ?? obj.number_of_stalls ?? obj.stall_count ?? null;
        const countNum = parseNumericLike(countRaw);
        const count = countNum != null && countNum > 0 ? Math.round(countNum) : null;
        out.push({ size, price, count });
      }
    }
    return out;
  };

  const aggregateByStallSize = (rows: StallOption[]): StallOption[] => {
    if (!rows.length) return [];
    const bySize = new Map<string, StallOption & { _maxPrice?: number }>();
    for (const row of rows) {
      const key = (row.size?.trim() || 'Unspecified').toLowerCase();
      const current = bySize.get(key);
      if (!current) {
        bySize.set(key, {
          size: row.size?.trim() || 'Unspecified',
          price: row.price,
          _maxPrice: row.price,
          count: row.count ?? 1,
        });
      } else {
        current.count = (current.count ?? 0) + (row.count ?? 1);
        // Keep minimum as base display price when same size has varying prices.
        if (row.price < current.price) current.price = row.price;
        current._maxPrice = Math.max(current._maxPrice ?? current.price, row.price);
      }
    }
    return Array.from(bySize.values()).map(({ _maxPrice, ...rest }) => rest);
  };

  for (const c of candidates) {
    if (c == null) continue;
    if (Array.isArray(c)) {
      const parsed = fromArrayLike(c);
      if (parsed.length) return aggregateByStallSize(parsed);
      continue;
    }
    if (typeof c === 'string') {
      const t = c.trim();
      if (!t) continue;
      if (t.startsWith('[') || t.startsWith('{')) {
        try {
          const parsedJson = JSON.parse(t);
          const parsed = Array.isArray(parsedJson) ? fromArrayLike(parsedJson) : fromArrayLike([parsedJson]);
          if (parsed.length) return aggregateByStallSize(parsed);
        } catch {
          // continue to scalar fallback
        }
      }
      // CSV-like "S:2000,M:3000" fallback
      const parts = t.split(',').map((x) => x.trim()).filter(Boolean);
      const csvOut: StallOption[] = [];
      for (const p of parts) {
        const [left, right] = p.includes(':') ? p.split(':') : p.split('-');
        if (right != null) {
          const price = parseNumericLike(right);
          if (price != null && price > 0) csvOut.push({ size: left?.trim() || null, price });
        } else {
          const price = parseNumericLike(left);
          if (price != null && price > 0) csvOut.push({ price });
        }
      }
      if (csvOut.length) return csvOut;
    }
  }

  // Scalar fallback fields
  const scalarPrices = [
    row.stall_price_min,
    row.stall_price_max,
    row.stall_price,
    row.booth_price_min,
    row.booth_price_max,
    row.booth_price,
    row.price_per_stall,
  ]
    .map(parseNumericLike)
    .filter((n): n is number => n != null && n > 0);

  if (!scalarPrices.length) return null;
  const min = Math.min(...scalarPrices);
  const max = Math.max(...scalarPrices);
  return min === max ? [{ price: min }] : [{ price: min }, { price: max }];
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

      const organizerByEventId = new Map<
        string,
        { orgName: string | null; adminName: string | null; adminEmail: string | null; adminPhone: string | null }
      >();
      const eventIdsForOrganizer = Array.from(
        new Set(
          (eventRows ?? [])
            .map((r: any) => r.id)
            .filter((id: unknown) => id != null && String(id).trim() !== '')
            .map((id: unknown) => String(id).trim())
        )
      );
      if (eventIdsForOrganizer.length > 0) {
        const { data: organizerRows, error: organizerErr } = await supabase
          .from('event_organizer_public')
          .select('event_id, org_name, admin_name, admin_email, admin_phone')
          .in('event_id', eventIdsForOrganizer);
        if (!organizerErr && organizerRows) {
          for (const r of organizerRows as any[]) {
            const eventId = r.event_id ? String(r.event_id).trim() : '';
            if (!eventId) continue;
            organizerByEventId.set(eventId, {
              orgName: r.org_name ? String(r.org_name).trim() : null,
              adminName: r.admin_name ? String(r.admin_name).trim() : null,
              adminEmail: r.admin_email ? String(r.admin_email).trim() : null,
              adminPhone: r.admin_phone ? String(r.admin_phone).trim() : null,
            });
          }
        }
      }

      const mapped: Event[] = (eventRows ?? []).map((row: any) => {
        const joinedSponsor = sponsorByEventId.get(normKey(row.id));
        const organizationId = row.organization_id ? String(row.organization_id).trim() : null;
        const organizer = organizerByEventId.get(String(row.id));
        const stallOptions = parseStallOptionsFromRow(row);
        const stallPrices = (stallOptions ?? []).map((o) => o.price).filter((n) => Number.isFinite(n) && n > 0);
        const stallPriceMin = stallPrices.length ? Math.min(...stallPrices) : null;
        const stallPriceMax = stallPrices.length ? Math.max(...stallPrices) : null;
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
          stallSlotsTotal: (() => {
            // Source of truth for stalls is events.no_of_stalls.
            // Fallbacks: derived from in_site_stalls counts, then legacy stall_slots_total.
            const fromOptions =
              (stallOptions ?? []).reduce((sum, o) => sum + (o.count && o.count > 0 ? o.count : 0), 0) || null;
            const v = row.no_of_stalls ?? fromOptions ?? row.stall_slots_total;
            if (v == null || v === '') return null;
            const n = Number(v);
            return Number.isFinite(n) && n > 0 ? n : null;
          })(),
          stallOptions: stallOptions ?? null,
          stallPriceMin,
          stallPriceMax,
          registeredExhibitorCount: 0,
          planType: row.plan_type ?? null,
          vendors: (row.vendor_ids ?? []).map((id: string) => String(id)),
          organizationId,
          organizerName: organizer?.orgName ?? row.organizer_name ?? null,
          organizerAdminName: organizer?.adminName ?? null,
          venueId: row.venue_id ?? null,
          createdBy: row.created_by ?? null,
          totalRevenue: Number(row.total_revenue ?? 0),
          image: mapEventImageFromRow(row),
          eventImageUrl: mapEventImageUrlColumn(row),
          layoutImageUrls: mapEventLayoutImagesFromRow(row),
          sponsorName: joinedSponsor?.name ?? row.sponsor_name ?? null,
          sponsorLogoUrl: joinedSponsor?.logo ?? row.sponsor_logo_url ?? null,
          sponsorRole: joinedSponsor?.role ?? null,
          organizerEmail:
            organizer?.adminEmail ?? row.organizer_email ?? row.contact_email ?? row.email ?? null,
          organizerPhone:
            organizer?.adminPhone ?? row.organizer_phone ?? row.contact_phone ?? row.phone ?? null,
          created_at: row.created_at ?? '',
          updated_at: row.updated_at ?? '',
        };
      });

      const ids = mapped.map((e) => e.id).filter(Boolean);
      const regCounts = new Map<string, number>();
      if (ids.length > 0) {
        const { data: regRows, error: regCountError } = await supabase
          .from('event_registrations')
          .select('event_id, status')
          .in('event_id', ids);
        if (!regCountError && regRows) {
          for (const r of regRows as { event_id: string; status?: string | null }[]) {
            if ((r.status ?? '').toLowerCase() === 'cancelled') continue;
            regCounts.set(r.event_id, (regCounts.get(r.event_id) ?? 0) + 1);
          }
        }
      }

      const mappedWithCounts = mapped.map((e) => ({
        ...e,
        registeredExhibitorCount: regCounts.get(e.id) ?? 0,
      }));

      setEvents(mappedWithCounts);
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
    portfolioImageUrl:
      exhibitor.portfolio_image_url != null && String(exhibitor.portfolio_image_url).trim()
        ? String(exhibitor.portfolio_image_url).trim()
        : null,
    productImagesUrls: Array.isArray(exhibitor.product_images_urls)
      ? exhibitor.product_images_urls.map((item: unknown) => String(item).trim()).filter(Boolean)
      : null,
    imageUrls: normalizeExhibitorUrlArray(exhibitor.image_urls),
    companyProfileUrl: exhibitor.company_profile_url ?? null,
    gstCertificateUrl: exhibitor.gst_certificate_url ?? null,
    panCardUrl: exhibitor.pan_card_url ?? null,
    productCatalogUrl: exhibitor.product_catalog_url ?? null,
    userId: exhibitor.user_id ?? null,
    registrationDate: exhibitor.registration_date,
    status: exhibitor.status,
    paymentStatus: exhibitor.payment_status,
    created_at: exhibitor.created_at,
    updated_at: exhibitor.updated_at
  }));

  return { exhibitors, loading, error, refetch };
};

export const useMyExhibitorProfile = (userId?: string | null) => {
  const [profile, setProfile] = useState<Exhibitor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error: qErr } = await supabase
        .from('exhibitors')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (qErr) throw qErr;
      const mapped: Exhibitor = {
        id: data.id,
        companyName: data.company_name,
        contactPerson: data.contact_person,
        designation: data.designation,
        companyDescription: data.company_description,
        website: data.website,
        alternateEmail: data.alternate_email,
        alternatePhone: data.alternate_phone,
        address: data.address,
        country: data.country,
        state: data.state,
        pincode: data.pincode,
        gstNumber: data.gst_number,
        email: data.email,
        phone: data.phone,
        category: data.category,
        subCategories: normalizeSubCategories(data.sub_category),
        city: data.city,
        booth: data.booth,
        companyLogoUrl: data.company_logo_url ?? null,
        portfolioImageUrl: data.portfolio_image_url ?? null,
        productImagesUrls: normalizeExhibitorUrlArray(data.product_images_urls),
        imageUrls: normalizeExhibitorUrlArray(data.image_urls),
        companyProfileUrl: data.company_profile_url ?? null,
        gstCertificateUrl: data.gst_certificate_url ?? null,
        panCardUrl: data.pan_card_url ?? null,
        productCatalogUrl: data.product_catalog_url ?? null,
        userId: data.user_id ?? null,
        registrationDate: data.registration_date,
        status: data.status,
        paymentStatus: data.payment_status,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      setProfile(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  return { profile, loading, error, refetch: fetchProfile };
};

export const useMyRegistrations = (exhibitorId?: string | null) => {
  const [registrations, setRegistrations] = useState<MyEventRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    if (!exhibitorId) {
      setRegistrations([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error: qErr } = await supabase
        .from('event_registrations')
        .select(`
          id,
          booth_size,
          special_requirements,
          payment_method,
          registration_date,
          status,
          events (
            id,
            title,
            event_date,
            event_time,
            venue_name,
            city,
            event_image_url
          )
        `)
        .eq('exhibitor_id', exhibitorId)
        .order('registration_date', { ascending: false });
      if (qErr) throw qErr;

      const mapped: MyEventRegistration[] = (data ?? []).map((row: any) => ({
        id: row.id,
        boothSize: row.booth_size ?? null,
        specialRequirements: row.special_requirements ?? null,
        paymentMethod: row.payment_method ?? 'online',
        registrationDate: row.registration_date ?? '',
        status: row.status ?? 'pending',
        event: {
          id: row.events?.id ?? '',
          title: row.events?.title ?? 'Event',
          date: row.events?.event_date ?? '',
          time: row.events?.event_time ?? '',
          venue: row.events?.venue_name ?? '',
          city: row.events?.city ?? null,
          eventImageUrl: resolveEventImageForDisplay(row.events?.event_image_url ?? null),
        },
      }));
      setRegistrations(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load registrations');
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [exhibitorId]);

  return { registrations, loading, error, refetch: fetchRegistrations };
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