/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
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

export default function App() {

  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Routes (Wrapped in AppLayout) */}
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}
