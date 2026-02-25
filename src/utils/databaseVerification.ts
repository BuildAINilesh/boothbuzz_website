import { supabase } from '../supabase';

export interface DatabaseVerificationResult {
  success: boolean;
  missingTables: string[];
  missingColumns: Record<string, string[]>;
  errors: string[];
  recommendations: string[];
}

export const verifyDatabaseSchema = async (): Promise<DatabaseVerificationResult> => {
  const result: DatabaseVerificationResult = {
    success: true,
    missingTables: [],
    missingColumns: {},
    errors: [],
    recommendations: []
  };

  try {
    console.log('🔍 Starting database schema verification...');

    // Required tables
    const requiredTables = ['exhibitors', 'events', 'venues', 'vendors', 'users', 'event_registrations'];

    // Required columns for each table
    const requiredColumns = {
      exhibitors: [
        'id', 'company_name', 'contact_person', 'email', 'phone', 'category',
        'status', 'payment_status', 'registration_date', 'created_at', 'updated_at'
      ],
      events: [
        'id', 'title', 'description', 'event_date', 'event_time', 'venue_name',
        'city', 'status', 'attendees', 'max_capacity', 'plan_type', 'event_image_url', 'created_at', 'updated_at'
      ],
      venues: [
        'id', 'name', 'location', 'contact_person', 'email', 'phone', 'capacity',
        'facilities', 'active_events', 'total_revenue', 'status', 'joined_date', 'created_at', 'updated_at'
      ],
      vendors: [
        'id', 'name', 'category', 'city', 'contact_person', 'email', 'phone',
        'rating', 'completed_jobs', 'status', 'price_range', 'created_at', 'updated_at'
      ],
      users: [
        'id', 'email', 'name', 'role', 'city', 'phone', 'status', 'created_at', 'updated_at'
      ],
      event_registrations: [
        'id', 'event_id', 'exhibitor_id', 'booth_size', 'special_requirements',
        'payment_method', 'registration_date', 'status', 'created_at', 'updated_at'
      ]
    };

    // Check each table
    for (const table of requiredTables) {
      try {
        console.log(`Checking table: ${table}`);
        
        // Try to select one record to check if table exists
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          if (error.code === '42P01') { // Table doesn't exist
            result.missingTables.push(table);
            result.success = false;
            console.error(`❌ Table '${table}' does not exist`);
          } else {
            result.errors.push(`Error checking table ${table}: ${error.message}`);
            console.error(`Error checking table ${table}:`, error);
          }
          continue;
        }

        console.log(`✅ Table '${table}' exists`);

        // Check columns if table exists
        if (data && data.length > 0) {
          const existingColumns = Object.keys(data[0]);
          const requiredCols = requiredColumns[table as keyof typeof requiredColumns] || [];
          const missingCols = requiredCols.filter(col => !existingColumns.includes(col));

          if (missingCols.length > 0) {
            result.missingColumns[table] = missingCols;
            result.success = false;
            console.error(`❌ Missing columns in '${table}':`, missingCols);
          } else {
            console.log(`✅ All required columns present in '${table}'`);
          }
        } else {
          // Table exists but is empty, check structure by trying to insert a test record
          console.log(`Table '${table}' is empty, checking structure...`);
          
          // This is a simplified check - in production you might want to use information_schema
          const testRecord = getTestRecord(table);
          if (testRecord) {
            const { error: insertError } = await supabase
              .from(table)
              .insert([testRecord]);
            
            if (insertError) {
              result.errors.push(`Error testing table structure for ${table}: ${insertError.message}`);
              console.error(`Error testing table structure for ${table}:`, insertError);
            } else {
              // Clean up test record
              await supabase.from(table).delete().eq('id', testRecord.id);
            }
          }
        }

      } catch (err: any) {
        result.errors.push(`Unexpected error checking table ${table}: ${err.message}`);
        console.error(`Unexpected error checking table ${table}:`, err);
      }
    }

    // Generate recommendations
    if (result.missingTables.length > 0) {
      result.recommendations.push('Create missing tables using the SQL provided in SUPABASE_SETUP.md');
    }

    if (Object.keys(result.missingColumns).length > 0) {
      result.recommendations.push('Add missing columns to existing tables');
    }

    if (result.errors.length > 0) {
      result.recommendations.push('Check RLS policies and permissions');
    }

    console.log('🔍 Database verification completed');
    console.log('Result:', result);

    return result;

  } catch (error: any) {
    result.success = false;
    result.errors.push(`Verification failed: ${error.message}`);
    console.error('Database verification failed:', error);
    return result;
  }
};

const getTestRecord = (table: string) => {
  const testRecords: Record<string, any> = {
    exhibitors: {
      id: 'test-id-' + Date.now(),
      company_name: 'Test Company',
      contact_person: 'Test Person',
      email: 'test@example.com',
      phone: '1234567890',
      category: 'Test',
      status: 'registered',
      payment_status: 'pending',
      registration_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
         events: {
       id: 'test-id-' + Date.now(),
       title: 'Test Event',
       description: 'Test Description',
       event_date: '2024-12-31',
       event_time: '10:00:00',
       venue_name: 'Test Venue',
       city: 'Test City',
       status: 'draft',
       attendees: 0,
       max_capacity: 100,
       plan_type: 'Plan A',
       event_image_url: 'https://example.com/test-image.jpg',
       created_at: new Date().toISOString(),
       updated_at: new Date().toISOString()
     },
    venues: {
      id: 'test-id-' + Date.now(),
      name: 'Test Venue',
      location: 'Test Location',
      contact_person: 'Test Person',
      email: 'test@example.com',
      phone: '1234567890',
      capacity: 100,
      facilities: [],
      active_events: 0,
      total_revenue: 0,
      status: 'active',
      joined_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    vendors: {
      id: 'test-id-' + Date.now(),
      name: 'Test Vendor',
      category: 'catering',
      city: 'Test City',
      contact_person: 'Test Person',
      email: 'test@example.com',
      phone: '1234567890',
      rating: 5,
      completed_jobs: 0,
      status: 'active',
      price_range: 'Test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    users: {
      id: 'test-id-' + Date.now(),
      email: 'test@example.com',
      name: 'Test User',
      role: 'exhibitor',
      city: 'Test City',
      phone: '1234567890',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  };

  return testRecords[table];
};

// Export a simple verification function for components
export const verifyConnection = async () => {
  try {
    const { data, error } = await supabase.from('exhibitors').select('count').limit(1);
    if (error) {
      console.error('Connection verification failed:', error);
      return false;
    }
    console.log('✅ Connection verification successful');
    return true;
  } catch (err) {
    console.error('Connection verification failed:', err);
    return false;
  }
}; 