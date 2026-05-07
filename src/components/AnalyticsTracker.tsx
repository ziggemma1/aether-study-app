import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import posthog from 'posthog-js';

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Only capture if PostHog has been initialized
    if (typeof posthog !== 'undefined' && (posthog as any).__loaded) {
      posthog.capture('$pageview');
    }
  }, [location]);

  return null;
}
