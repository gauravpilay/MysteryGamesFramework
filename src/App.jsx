import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Player from './pages/Player';
import UserManagement from './pages/UserManagement';
import Leaderboard from './pages/Leaderboard';
import { AuthProvider, useAuth } from './lib/auth';
import { ConfigProvider, useConfig } from './lib/config';
import { ShieldAlert, LogOut } from 'lucide-react';

const PrivateRoute = ({ children }) => {
  const { user, logout, loading: authLoading } = useAuth();
  const { loading: configLoading } = useConfig();
  const hasLoadedOnce = React.useRef(false);

  if (!authLoading && !configLoading) {
    hasLoadedOnce.current = true;
  }

  const showLoader = (authLoading || configLoading) && !hasLoadedOnce.current;

  if (showLoader) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-indigo-500 font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-xs uppercase tracking-[0.3em] animate-pulse">Synchronizing Intelligence...</p>
        </div>
      </div>
    );
  }

  if (user && user.status === 'deactivated') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-red-500 font-sans p-6">
        <div className="max-w-md w-full bg-zinc-900/50 border border-red-500/30 p-8 rounded-2xl backdrop-blur-xl text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Personnel Access Revoked</h1>
          <p className="text-zinc-400 mb-8">
            Your investigator credentials have been deactivated. Please contact the Chief Administrator if you believe this is an error.
          </p>
          <button
            onClick={async () => {
              await logout();
              window.location.href = '/login';
            }}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 rounded-xl text-red-500 font-bold transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out & Return
          </button>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

import { LicenseProvider } from './lib/licensing';

function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <LicenseProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <PrivateRoute>
                    <Leaderboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/editor/:projectId"
                element={
                  <PrivateRoute>
                    <Editor />
                  </PrivateRoute>
                }
              />
              <Route
                path="/play/:projectId"
                element={
                  <PrivateRoute>
                    <Player />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <PrivateRoute>
                    <UserManagement />
                  </PrivateRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </LicenseProvider>
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;
