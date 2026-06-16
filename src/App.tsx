/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import posthog from 'posthog-js';
import { AppProvider, useAppContext } from './context/AppContext';
import AnalyticsTracker from './components/AnalyticsTracker';
import AppLayout from './components/AppLayout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Messages from './pages/Messages';
import CalendarPage from './pages/CalendarPage';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Notifications from './pages/Notifications';
import Achievements from './pages/Achievements';
import Reports from './pages/Reports';
import SubscriptionManagement from './pages/SubscriptionManagement';
import MaterialDetail from './pages/MaterialDetail';
import ReadingPlanGenerator from './pages/ReadingPlanGenerator';
import UploadMaterial from './pages/UploadMaterial';
import CurriculumLibrary from './pages/CurriculumLibrary';
import QuizInterface from './pages/QuizInterface';
import DetailedNotes from './pages/DetailedNotes';
import FindFriends from './pages/FindFriends';
import Flashcards from './pages/Flashcards';
import Shop from './pages/Shop';
import Leaderboard from './pages/Leaderboard';
import LiveRooms from './pages/LiveRooms';
import Explore from './pages/Explore';

import { startKeepAlive } from './lib/keep-alive';
import SharedMaterialView from './pages/SharedMaterialView';
import { AchievementNotification } from './components/AchievementNotification';

function ProtectedRoute() {
  const { user, isLoading } = useAppContext();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground animate-pulse font-medium">Synchronizing study session...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  
  return <Outlet />;
}

let posthogInitialized = false;

export default function App() {
  useEffect(() => {
    // Start keep-alive heartbeat in production
    const cleanup = startKeepAlive();
    
    if (!posthogInitialized && import.meta.env.VITE_POSTHOG_KEY) {
      try {
        posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
          api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
          person_profiles: 'identified_only',
          capture_pageview: false, // Manual pageview tracking to prevent rate limits
          autocapture: false,      // Disable autocapture to prevent circular refs
          persistence: 'localStorage+cookie',
          enable_recording_console_log: false, // Avoid console serialization issues
          capture_performance: false,
        });
        posthogInitialized = true;
      } catch (e) {
        console.warn('PostHog initialization failed:', e);
      }
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <Router>
      <AppProvider>
        <AnalyticsTracker />
        <AchievementNotification />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/share/:token" element={<SharedMaterialView />} />

          {/* Protected Routes (Wrapped in AppLayout and ProtectedRoute) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/library" element={<Library />} />
              <Route path="/library/:id" element={<MaterialDetail />} />
              <Route path="/materials/:id/notes" element={<DetailedNotes />} />
              <Route path="/flashcards/:id" element={<Flashcards />} />
              <Route path="/upload" element={<UploadMaterial />} />
              <Route path="/curriculum" element={<CurriculumLibrary />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/rooms" element={<LiveRooms />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/plans" element={<ReadingPlanGenerator />} />
              <Route path="/quiz/:id" element={<QuizInterface />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/community" element={<FindFriends />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/subscription" element={<SubscriptionManagement />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AppProvider>
      </Router>
  );
}
