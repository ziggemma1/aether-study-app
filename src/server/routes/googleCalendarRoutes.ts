import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';
import { getJwtSecret } from '../lib/jwtSecret.js';

const router = express.Router();

const OAUTH_STATE_PURPOSE = 'google_calendar_oauth';

// The state param round-trips through Google, so an attacker can complete
// their own consent flow and hand back any state value they like. Signing it
// (and checking the purpose + issuing user) means a forged state can no
// longer point the callback at an arbitrary victim account.
const signOAuthState = (userId: string) =>
  jwt.sign({ userId, purpose: OAUTH_STATE_PURPOSE }, getJwtSecret(), { expiresIn: '10m' });

const verifyOAuthState = (state: string): string => {
  const decoded = jwt.verify(state, getJwtSecret()) as { userId: string; purpose: string };
  if (decoded.purpose !== OAUTH_STATE_PURPOSE || !decoded.userId) {
    throw new Error('Invalid state purpose');
  }
  return decoded.userId;
};

const getOAuthClient = () => {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/google/callback'
  );
};

// Initiate OAuth flow
router.post('/auth', protect, async (req: any, res) => {
  try {
    const state = signOAuthState(req.userId.toString());

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.warn("Mocking Google Calendar Sync because GOOGLE_CLIENT_ID is missing.");
      return res.json({ url: '/api/calendar/google/callback?code=mock_code&state=' + state });
    }

    const oAuth2Client = getOAuthClient();
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      prompt: 'consent',
      state, // Signed, short-lived, bound to the initiating user
    });

    res.json({ url: authorizeUrl });
  } catch (error: any) {
    console.error('Google Calendar Auth Error:', error);
    res.status(500).json({ message: 'Failed to initiate Google Calendar authentication' });
  }
});

// OAuth Callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).send('Missing code or state');
    }

    let userId: string;
    try {
      userId = verifyOAuthState(state.toString());
    } catch (err) {
      console.warn('Google Calendar callback rejected: invalid or expired state');
      return res.status(400).send('Invalid or expired state parameter');
    }

    let tokens;
    if (!process.env.GOOGLE_CLIENT_ID || code === 'mock_code') {
      tokens = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expiry_date: Date.now() + 3600000,
      };
    } else {
      const oAuth2Client = getOAuthClient();
      const tokenResponse = await oAuth2Client.getToken(code as string);
      tokens = tokenResponse.tokens;
    }
    
    // Save tokens to user
    const user = await User.findById(userId);
    if (user) {
      // Create googleCalendar if it doesn't exist logically
      // For now we can just save it or throw if not in schema.
      // Assuming we can use mixed or update user directly
      await User.findByIdAndUpdate(userId, {
        $set: {
          'googleCalendar.accessToken': tokens.access_token,
          'googleCalendar.refreshToken': tokens.refresh_token,
          'googleCalendar.expiryDate': tokens.expiry_date,
          'googleCalendar.synced': true
        }
      }, { strict: false });
    }
    
    // Redirect back to app
    res.redirect('/calendar?sync=success');
  } catch (error: any) {
    console.error('Callback Error:', error);
    res.redirect('/calendar?sync=error');
  }
});

// Fetch Events from Google Calendar
router.get('/events', protect, async (req: any, res) => {
  try {
    const user = await User.findById(req.userId);
    const gCal = (user as any)?.googleCalendar;
    
    if (!gCal || !gCal.accessToken) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }

    if (gCal.accessToken === 'mock_access_token') {
      return res.json([
        { id: '1', summary: 'Mock Event', start: { dateTime: new Date().toISOString() }, end: { dateTime: new Date(Date.now() + 3600000).toISOString() } }
      ]);
    }

    const oAuth2Client = getOAuthClient();
    oAuth2Client.setCredentials({
      access_token: gCal.accessToken,
      refresh_token: gCal.refreshToken,
      expiry_date: gCal.expiryDate
    });

    // Check if token is expired and refresh if necessary
    oAuth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        await User.findByIdAndUpdate(req.userId, {
          $set: {
            'googleCalendar.accessToken': tokens.access_token,
            'googleCalendar.refreshToken': tokens.refresh_token,
            'googleCalendar.expiryDate': tokens.expiry_date,
          }
        }, { strict: false });
      }
    });

    const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      headers: { Authorization: `Bearer ${gCal.accessToken}` },
      params: {
        timeMin: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
      }
    });

    res.json(response.data.items);
  } catch (error: any) {
    console.error('Google Calendar Events Error:', error);
    res.status(500).json({ message: 'Failed to fetch Google Calendar events' });
  }
});

// Sync Study Sessions to Google Calendar
router.post('/sync', protect, async (req: any, res) => {
  try {
    const user = await User.findById(req.userId);
    const gCal = (user as any)?.googleCalendar;
    
    if (!gCal || !gCal.accessToken) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }
    
    const { sessions } = req.body;
    if (!sessions || !Array.isArray(sessions)) {
      return res.status(400).json({ message: 'Invalid sessions data' });
    }

    if (gCal.accessToken === 'mock_access_token') {
      return res.json({ message: 'Sync complete (mocked)', syncedCount: sessions.length });
    }

    const oAuth2Client = getOAuthClient();
    oAuth2Client.setCredentials({
      access_token: gCal.accessToken,
      refresh_token: gCal.refreshToken,
      expiry_date: gCal.expiryDate
    });

    // Simple Sync logic - just insert (in real app we'd track IDs)
    const syncedIds = [];
    for (const session of sessions) {
      try {
        const response = await axios.post('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          summary: session.title || 'Study Session',
          description: session.description || 'Aether Study Session',
          start: { dateTime: new Date(session.startTime).toISOString() },
          end: { dateTime: new Date(session.endTime).toISOString() }
        }, {
          headers: { Authorization: `Bearer ${gCal.accessToken}` }
        });
        syncedIds.push(response.data.id);
      } catch (err) {
        console.error('Error syncing individual session:', err);
      }
    }

    res.json({ message: 'Sync complete', syncedCount: syncedIds.length });
  } catch (error: any) {
    console.error('Google Calendar Sync Error:', error);
    res.status(500).json({ message: 'Failed to sync with Google Calendar' });
  }
});

export default router;
