import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { verifyDatabaseSchema, DatabaseVerificationResult } from '../utils/databaseVerification';

export const SupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [errorMessage, setErrorMessage] = useState('');
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [verificationResult, setVerificationResult] = useState<DatabaseVerificationResult | null>(null);

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    setConnectionStatus('testing');
    setErrorMessage('');
    setTestResults({});
    setVerificationResult(null);

    try {
      console.log('🔍 Testing Supabase connection...');
      
      // Test 1: Check environment variables
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        throw new Error('Missing Supabase environment variables. Please check your .env file.');
      }

      setTestResults((prev: Record<string, string>) => ({ ...prev, envVars: '✅ Environment variables found' }));

      // Test 2: Test basic connection
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error(`Auth connection failed: ${sessionError.message}`);
      }

      setTestResults((prev: Record<string, string>) => ({ ...prev, auth: '✅ Auth connection successful' }));

      // Test 3: Test database connection
      const { data: exhibitorData, error: exhibitorError } = await supabase
        .from('exhibitors')
        .select('count')
        .limit(1);

      if (exhibitorError) {
        throw new Error(`Database connection failed: ${exhibitorError.message}`);
      }

      setTestResults((prev: Record<string, string>) => ({ ...prev, database: '✅ Database connection successful' }));

      // Test 4: Comprehensive database schema verification
      console.log('🔍 Running comprehensive database verification...');
      const verification = await verifyDatabaseSchema();
      setVerificationResult(verification);

      if (verification.success) {
        setTestResults((prev: Record<string, string>) => ({ ...prev, schema: '✅ Database schema verified' }));
        setConnectionStatus('connected');
        console.log('✅ Supabase connection test completed successfully');
      } else {
        // Show specific issues
        if (verification.missingTables.length > 0) {
          setTestResults((prev: Record<string, string>) => ({ 
            ...prev, 
            schema: `❌ Missing tables: ${verification.missingTables.join(', ')}` 
          }));
        }
        
        if (Object.keys(verification.missingColumns).length > 0) {
          const missingCols = Object.entries(verification.missingColumns)
            .map(([table, cols]) => `${table}: ${cols.join(', ')}`)
            .join('; ');
          setTestResults((prev: Record<string, string>) => ({ 
            ...prev, 
            columns: `❌ Missing columns: ${missingCols}` 
          }));
        }

        if (verification.errors.length > 0) {
          setTestResults((prev: Record<string, string>) => ({ 
            ...prev, 
            errors: `❌ Errors: ${verification.errors.slice(0, 2).join('; ')}` 
          }));
        }

        setConnectionStatus('error');
        setErrorMessage('Database schema issues detected. Check console for details.');
      }

    } catch (error: any) {
      console.error('❌ Supabase connection test failed:', error);
      setConnectionStatus('error');
      setErrorMessage(error.message);
    }
  };

  if (connectionStatus === 'testing') {
    return (
      <div className="fixed top-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-700">Testing Supabase connection...</span>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'error') {
    return (
      <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
        <div className="flex items-start space-x-2">
          <div className="text-red-500 mt-0.5">❌</div>
          <div>
            <h3 className="font-semibold text-red-700">Supabase Connection Failed</h3>
            <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
            
            {verificationResult && (
              <div className="mt-2 text-xs text-red-600">
                {verificationResult.recommendations.map((rec, index) => (
                  <div key={index}>• {rec}</div>
                ))}
              </div>
            )}
            
            <button
              onClick={testSupabaseConnection}
              className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 max-w-sm">
      <div className="flex items-start space-x-2">
        <div className="text-green-500 mt-0.5">✅</div>
        <div>
          <h3 className="font-semibold text-green-700">Supabase Connected</h3>
          <div className="text-green-600 text-sm mt-1 space-y-1">
            {Object.entries(testResults).map(([key, value]) => (
              <div key={key} className="text-xs">{value as string}</div>
            ))}
          </div>
          
          {verificationResult && verificationResult.success && (
            <div className="mt-2 text-xs text-green-600">
              <div>• All required tables exist</div>
              <div>• All required columns present</div>
              <div>• RLS policies configured</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 