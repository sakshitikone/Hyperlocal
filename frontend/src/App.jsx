// src/App.jsx — Root component with routing, providers, and layout shell
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider }         from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import ProtectedRoute from './components/ProtectedRoute';
import Sidebar        from './components/Sidebar';

import AuthPage       from './pages/AuthPage';
import Dashboard      from './pages/Dashboard';
import RequestFeed    from './pages/RequestFeed';
import CreateRequest  from './pages/CreateRequest';
import RequestDetail  from './pages/RequestDetail';
import ChatPage       from './pages/ChatPage';
import ProfilePage    from './pages/ProfilePage';

/* ── Authenticated shell with sidebar ──────────────── */
const AppShell = () => (
  <div className="app-shell">
    <Sidebar />
    <main className="main-content">
      <Outlet />
    </main>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          {/* Global toast container */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background:  '#161e1a',
                color:       '#e8f0eb',
                border:      '1px solid #1f2e27',
                fontFamily:  'DM Sans, sans-serif',
                fontSize:    '14px',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#0a0f0d' } },
              error:   { iconTheme: { primary: '#f87171', secondary: '#0a0f0d' } },
            }}
          />

          <Routes>
            {/* ── Public routes ────────────────── */}
            <Route path="/login"    element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />

            {/* ── Protected routes (inside shell) ─ */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"      element={<Dashboard />}     />
              <Route path="/feed"           element={<RequestFeed />}   />
              <Route path="/create-request" element={<CreateRequest />} />
              <Route path="/requests/:id"   element={<RequestDetail />} />
              <Route path="/chat"           element={<ChatPage />}      />
              <Route path="/profile"        element={<ProfilePage />}   />
              <Route path="/users/:id"      element={<ProfilePage />}   />
            </Route>

            {/* ── Catch-all ────────────────────── */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
