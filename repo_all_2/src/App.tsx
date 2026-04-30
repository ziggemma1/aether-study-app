import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import UploadMaterial from './pages/UploadMaterial';
import MaterialDetail from './pages/MaterialDetail';
import QuizInterface from './pages/QuizInterface';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ReadingPlanGenerator from './pages/ReadingPlanGenerator';
import SubscriptionManagement from './pages/SubscriptionManagement';
import SkeletonDemoPage from './pages/SkeletonDemoPage';
import HeroDemoPage from './pages/HeroDemoPage';
import CurriculumLibrary from './pages/CurriculumLibrary';
import Messages from './pages/Messages';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Achievements from './pages/Achievements';
import CalendarPage from './pages/CalendarPage';
import AppLayout from './components/AppLayout';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/skeleton-demo" element={<SkeletonDemoPage />} />
          <Route path="/hero-demo" element={<HeroDemoPage />} />

          {/* Protected Routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/library" element={<Library />} />
            <Route path="/upload" element={<UploadMaterial />} />
            <Route path="/material/:id" element={<MaterialDetail />} />
            <Route path="/quiz/:id" element={<QuizInterface />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/subscription" element={<SubscriptionManagement />} />
            <Route path="/plans" element={<ReadingPlanGenerator />} />
            <Route path="/plans/create" element={<ReadingPlanGenerator />} />
            <Route path="/curriculum" element={<CurriculumLibrary />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/calendar" element={<CalendarPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
