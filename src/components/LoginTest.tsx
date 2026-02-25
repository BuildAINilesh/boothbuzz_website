import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';

export const LoginTest: React.FC = () => {
  const { user, signIn, signUp, signOut, loading } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword123');
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const testLogin = async () => {
    setIsTesting(true);
    setTestResult('Testing login...');
    
    try {
      console.log('🔐 Testing Supabase login with:', { email, password });
      
      // Test 1: Check if user exists
      const { data: existingUser, error: userError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (existingUser.user) {
        console.log('✅ Login successful:', existingUser.user.email);
        setTestResult('✅ Login successful! User authenticated.');
        
        // Sign out after test
        await supabase.auth.signOut();
        setTestResult('✅ Login test completed successfully! User can sign in and out.');
        return;
      }

      if (userError) {
        console.log('User does not exist, trying to create account...');
        
        // Test 2: Try to create account
        const { data: newUser, error: signupError } = await supabase.auth.signUp({
          email,
          password
        });

        if (signupError) {
          console.error('❌ Signup failed:', signupError);
          setTestResult(`❌ Signup failed: ${signupError.message}`);
          return;
        }

        if (newUser.user) {
          console.log('✅ Account created successfully:', newUser.user.email);
          setTestResult('✅ Account created successfully! Login system is working.');
          
          // Sign out after test
          await supabase.auth.signOut();
          setTestResult('✅ Login test completed! New account created and can sign out.');
          return;
        }
      }

    } catch (error: any) {
      console.error('❌ Login test failed:', error);
      setTestResult(`❌ Login test failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult('Testing connection...');
    
    try {
      console.log('🔍 Testing Supabase connection...');
      
      // Test basic connection
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Connection failed:', error);
        setTestResult(`❌ Connection failed: ${error.message}`);
        return;
      }

      console.log('✅ Connection successful');
      setTestResult('✅ Supabase connection is working!');

      // Test auth configuration
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError && authError.message.includes('JWT')) {
        console.log('✅ Auth is configured (no user logged in)');
        setTestResult('✅ Supabase connection and auth are working! No user is currently logged in.');
      } else if (authData.user) {
        console.log('✅ User is logged in:', authData.user.email);
        setTestResult('✅ User is logged in! Auth system is working.');
      } else {
        console.log('✅ Auth system is working');
        setTestResult('✅ Supabase connection and auth are working!');
      }

    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      setTestResult(`❌ Connection test failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-200 rounded-lg p-4 max-w-sm shadow-lg">
      <h3 className="font-semibold text-gray-900 mb-3">🔐 Login Test</h3>
      
      <div className="space-y-2 mb-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      <div className="space-y-2">
        <button
          onClick={testConnection}
          disabled={isTesting}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {isTesting ? 'Testing...' : 'Test Connection'}
        </button>
        
        <button
          onClick={testLogin}
          disabled={isTesting}
          className="w-full px-3 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 disabled:opacity-50"
        >
          {isTesting ? 'Testing...' : 'Test Login'}
        </button>
      </div>

      {testResult && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
          {testResult}
        </div>
      )}

      {user && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
          ✅ Currently logged in: {user.email}
        </div>
      )}
    </div>
  );
}; 