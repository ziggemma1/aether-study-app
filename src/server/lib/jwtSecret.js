// Single source of truth for the JWT signing/verification secret.
// Fails closed in production instead of silently falling back to a guessable
// string — every server entrypoint (Express API, socket.ts, render-server.js)
// must resolve the secret through here so they can never drift out of sync.
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  const isVercel = !!process.env.VERCEL;
  const isProduction = process.env.NODE_ENV === 'production' || isVercel;

  if (!isProduction) {
    console.warn('⚠️ WARNING: JWT_SECRET environment variable is not set. Using a temporary fallback secret for development.');
    return 'dev_temporary_secret_key_12345';
  }

  console.error('❌ CRITICAL ERROR: JWT_SECRET environment variable is not set! Process exiting to prevent insecure authentication in production.');
  process.exit(1);
}
