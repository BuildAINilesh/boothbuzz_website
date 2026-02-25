import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { User, Event, Venue, Vendor, Exhibitor } from '../types';

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

/** Events from Supabase (same DB as Exhibitors). */
export const useEvents = () => {
  const { data, loading, error, refetch } = useSupabaseData<any>('events', '*', [],
    { order: { column: 'event_date', ascending: false } });

  const events: Event[] = data.map((row: any) => ({
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
    image: row.event_image_url ?? null,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }));

  return { events, loading, error, refetch };
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
    email: exhibitor.email,
    phone: exhibitor.phone,
    category: exhibitor.category,
    city: exhibitor.city,
    booth: exhibitor.booth,
    registrationDate: exhibitor.registration_date,
    status: exhibitor.status,
    paymentStatus: exhibitor.payment_status,
    created_at: exhibitor.created_at,
    updated_at: exhibitor.updated_at
  }));

  return { exhibitors, loading, error, refetch };
};