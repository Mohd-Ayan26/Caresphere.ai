// src/App.js — Main Application with all Routes
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProfile } from './store/slices/authSlice';
import { initSocket } from './services/socket';
import Layout from './components/layout/Layout';

// Auth pages
import LandingPage     from './pages/LandingPage';
import LoginPage       from './pages/auth/LoginPage';
import RegisterPage    from './pages/auth/RegisterPage';

// Core pages
import DashboardPage    from './pages/DashboardPage';
import MedicinePage     from './pages/MedicinePage';
import WellnessPage     from './pages/WellnessPage';
import NutritionPage    from './pages/NutritionPage';
import EmergencyPage    from './pages/EmergencyPage';
import HealthDiaryPage  from './pages/HealthDiaryPage';
import GamificationPage from './pages/GamificationPage';
import ChatPage         from './pages/ChatPage';
import ProfilePage      from './pages/ProfilePage';
import NotFoundPage     from './pages/NotFoundPage';

// New module pages
import AQIModule          from './pages/modules/AQIModule';

import WellnessSessionPage from './pages/modules/WellnessSessionPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector(s => s.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector(s => s.auth);
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

const Protected = ({ children }) => (
  <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>
);

export default function App() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(s => s.auth);
  const { darkMode, highContrast, largeFont } = useSelector(s => s.ui);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchProfile());
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (isAuthenticated && user?._id) initSocket(user._id);
  }, [isAuthenticated, user]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark',          darkMode);
    document.documentElement.classList.toggle('high-contrast', highContrast);
    document.documentElement.classList.toggle('large-font',    largeFont);
  }, [darkMode, highContrast, largeFont]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Routes>
        {/* Public */}
        <Route path="/"        element={<LandingPage />} />
        <Route path="/login"   element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register"element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Core modules */}
        <Route path="/dashboard"     element={<Protected><DashboardPage /></Protected>} />
        <Route path="/medicines"     element={<Protected><MedicinePage /></Protected>} />
        <Route path="/wellness"      element={<Protected><WellnessPage /></Protected>} />
        <Route path="/nutrition"     element={<Protected><NutritionPage /></Protected>} />
        <Route path="/emergency"     element={<Protected><EmergencyPage /></Protected>} />
        <Route path="/health-diary"  element={<Protected><HealthDiaryPage /></Protected>} />
        <Route path="/gamification"  element={<Protected><GamificationPage /></Protected>} />
        <Route path="/chat"          element={<Protected><ChatPage /></Protected>} />
        <Route path="/profile"       element={<Protected><ProfilePage /></Protected>} />

        {/* New modules */}
        <Route path="/aqi"              element={<Protected><AQIModule /></Protected>} />

        <Route path="/wellness-sessions" element={<Navigate to="/wellness" replace />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}
