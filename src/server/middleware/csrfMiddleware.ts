import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');

// Double-submit cookie check. The auth cookie is httpOnly and (in production)
// sameSite:'none', so it's attached automatically by the browser even on a
// forged cross-site request — that's what makes CSRF possible in the first
// place. The CSRF cookie is deliberately NOT httpOnly: legitimate same-origin
// JS can read it and echo it back in a header, but a cross-site attacker's
// page has no way to read the victim's cookie value to do the same, so a
// forged request's header will never match.
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (SAFE_METHODS.has(req.method)) return next();

  // A request authenticated via an explicit Authorization header can't be
  // forged cross-site — the attacker's page has no way to obtain the
  // victim's bearer token — so only cookie-authenticated requests need the
  // CSRF check.
  if (req.headers.authorization) return next();

  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: 'CSRF token missing or invalid' });
  }
  next();
};
