import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider } from './context/GameContext';

// Screens
import { Home } from './screens/Home';
import { Onboarding } from './screens/Onboarding';
import { Reader } from './screens/Reader';
import { Library } from './screens/Library';
import { Social } from './screens/Social';
import { Profile } from './screens/Profile';
import { Settings } from './screens/Settings';
import { Milestone } from './screens/Milestone';
import { Recap } from './screens/Recap';
import { Coach } from './screens/Coach';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-bold">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

// Public Route Wrapper (Redirects to home if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-bold">
        Loading session...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/onboarding"
        element={
          <PublicRoute>
            <Onboarding />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reader"
        element={
          <ProtectedRoute>
            <Reader />
          </ProtectedRoute>
        }
      />
      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <Library />
          </ProtectedRoute>
        }
      />
      <Route
        path="/social"
        element={
          <ProtectedRoute>
            <Social />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coach"
        element={
          <ProtectedRoute>
            <Coach />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/milestone"
        element={
          <ProtectedRoute>
            <Milestone />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recap"
        element={
          <ProtectedRoute>
            <Recap />
          </ProtectedRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-orange-500 selection:text-white">
            <AppContent />
          </div>
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
