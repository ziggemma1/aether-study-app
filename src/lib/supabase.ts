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

// Create a robust dummy client using a recursive Proxy if not configured
// This handles arbitrary chained method calls (like .from().select().limit()) 
// and returns a rejected promise when the result is awaited.
const createDummyClient = (message: string) => {
  const proxyHandler: ProxyHandler<any> = {
    get(_, prop) {
      // Handle the case where the result is awaited (it looks for a 'then' method)
      if (prop === 'then') {
        return (onFulfilled?: any, onRejected?: any) =>
          Promise.reject(new Error(message)).catch(onRejected);
      }

      // Handle common auth event patterns
      if (prop === 'onAuthStateChange') {
        return () => ({ data: { subscription: { unsubscribe: () => {} } } });
      }

      // For any other property access or method call, return a recursive proxy
      // We return a function that, when called, also returns the same proxy
      const dummyFunc = (..._args: any[]) => new Proxy(() => {}, proxyHandler);
      return new Proxy(dummyFunc, proxyHandler);
    }
  };
  return new Proxy({} as any, proxyHandler);
};

const dummyClient = createDummyClient('Supabase is not configured. Please check your settings in the menu.');

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
