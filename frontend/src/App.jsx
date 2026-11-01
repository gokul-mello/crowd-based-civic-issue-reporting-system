import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { LoginPage } from './pages/auth/LoginPage';
import { AuthorityLoginPage } from './pages/auth/AuthorityLoginPage';
import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { ReportIssuePage } from './pages/citizen/ReportIssuePage';
import { ComplaintListingPage } from './pages/citizen/ComplaintListingPage';
import { ComplaintDetailsPage } from './pages/citizen/ComplaintDetailsPage';
import { ProfilePage } from './pages/citizen/ProfilePage';
import { AuthorityDashboard } from './pages/authority/AuthorityDashboard';
import { AuthorityComplaintsPage } from './pages/authority/AuthorityComplaintsPage';
import { AnalyticsPage } from './pages/authority/AnalyticsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/authority/login" element={<AuthorityLoginPage />} />
          <Route path="/complaints" element={<ComplaintListingPage />} />
          <Route path="/complaints/:id" element={<ComplaintDetailsPage />} />

          {/* Citizen Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <ReportIssuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['citizen', 'authority']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['citizen', 'authority']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Authority Protected Routes */}
          <Route
            path="/authority/dashboard"
            element={
              <ProtectedRoute allowedRoles={['authority']}>
                <AuthorityDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/authority/complaints"
            element={
              <ProtectedRoute allowedRoles={['authority']}>
                <AuthorityComplaintsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/authority/analytics"
            element={
              <ProtectedRoute allowedRoles={['authority']}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
