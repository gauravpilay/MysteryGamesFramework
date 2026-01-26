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

const PrivateRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
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

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
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
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;
