import { createClient } from '@supabase/supabase-js';

// Check for localStorage overrides first (useful for manual setup or debugging)
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('SUPABASE_URL_OVERRIDE') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('SUPABASE_ANON_KEY_OVERRIDE') : null;

const supabaseUrl = storedUrl || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = storedKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (typeof window !== 'undefined') {
  console.log('Supabase URL:', supabaseUrl?.substring(0, 20) + '...');
  console.log('Using Overrides:', !!(storedUrl || storedKey));
}

const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseUrl.startsWith('https://')
);

// Create a dummy client if not configured to prevent background network requests
const dummyClient = new Proxy({} as any, {
  get: (target, prop) => {
    if (prop === 'auth') {
      return new Proxy({} as any, {
        get: (t, p) => {
          if (p === 'onAuthStateChange') {
            return () => ({ data: { subscription: { unsubscribe: () => {} } } });
          }
          return () => Promise.reject(new Error('Supabase is not configured. Please check your settings.'));
        }
      });
    }
    if (prop === 'from') {
      return () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.reject(new Error('Supabase is not configured.')),
            order: () => Promise.reject(new Error('Supabase is not configured.')),
          }),
          order: () => Promise.reject(new Error('Supabase is not configured.')),
        }),
        insert: () => Promise.reject(new Error('Supabase is not configured.')),
        update: () => Promise.reject(new Error('Supabase is not configured.')),
        delete: () => Promise.reject(new Error('Supabase is not configured.')),
      });
    }
    return () => Promise.reject(new Error('Supabase is not configured.'));
  }
});

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials missing or invalid. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables in the Settings menu.');
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : dummyClient;

export const testConnection = async () => {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase is not configured.' };
  
  try {
    console.log('Testing API connection to:', supabaseUrl);
    // Testing the auth service is the most direct way to check the API connection
    const fetchPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('API Connection timed out. The Supabase server is not responding.')), 10000)
    );

    const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
    console.log('API Connection test result:', result);
    
    if (result.error) throw result.error;
    return { success: true };
  } catch (err: any) {
    console.error('Supabase API connection test failed:', err);
    return { success: false, error: err.message };
  }
};

export const getPublicConfig = () => ({
  url: supabaseUrl ? `${supabaseUrl.substring(0, 12)}...` : 'Not set',
  hasKey: !!supabaseAnonKey,
  keyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 8)}...` : 'Not set'
});

export const clearSupabaseOverrides = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('SUPABASE_URL_OVERRIDE');
    localStorage.removeItem('SUPABASE_ANON_KEY_OVERRIDE');
    window.location.reload();
  }
};

export { isSupabaseConfigured };
