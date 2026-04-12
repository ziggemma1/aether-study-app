import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseUrl = rawUrl?.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')
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
      },
      global: {
        headers: { 'x-application-name': 'aether-study' },
      },
      db: {
        schema: 'public',
      }
    })
  : dummyClient;

/**
 * Helper to add a timeout to any promise
 */
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMsg: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    )
  ]);
};

export { isSupabaseConfigured };
