// Single source of truth for which browser origins the API/socket servers
// trust. This app is previewed/deployed across several hosting providers at
// once (Google AI Studio's Cloud Run-backed preview, Vercel, Render, and
// local/webcontainer dev) rather than one fixed production domain — the same
// trust boundary is already encoded client-side in the OAuth popup origin
// check in src/pages/LoginPage.tsx. Keep both in sync.
const ALLOWED_ORIGIN_SUFFIXES = ['.run.app', '.vercel.app', '.onrender.com'];
const ALLOWED_ORIGIN_SUBSTRINGS = ['localhost', '127.0.0.1', 'webcontainer.io'];

export function isAllowedOrigin(origin) {
  // Requests with no Origin header (curl, server-to-server, native apps)
  // aren't subject to browser CORS enforcement in the first place.
  if (!origin) return true;
  return (
    ALLOWED_ORIGIN_SUFFIXES.some((suffix) => origin.endsWith(suffix)) ||
    ALLOWED_ORIGIN_SUBSTRINGS.some((sub) => origin.includes(sub))
  );
}
