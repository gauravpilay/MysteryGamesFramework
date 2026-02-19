import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Player from './pages/Player';
import UserManagement from './pages/UserManagement';
import Leaderboard from './pages/Leaderboard';
import FeedbackReports from './pages/FeedbackReports';
import { AuthProvider, useAuth } from './lib/auth';
import { ConfigProvider, useConfig } from './lib/config';
import { LicenseProvider, useLicense } from './lib/licensing';
import { ShieldAlert, LogOut } from 'lucide-react';

const PrivateRoute = ({ children }) => {
  const { user, logout, loading: authLoading } = useAuth();
  const { loading: configLoading } = useConfig();
  const { loading: licenseLoading } = useLicense();
  const [hasResolved, setHasResolved] = React.useState(false);

  const isLoading = authLoading || configLoading || licenseLoading;

  React.useEffect(() => {
    if (!isLoading) {
      setHasResolved(true);
    }
  }, [isLoading]);

  // Show loader during initial synchronization
  if (isLoading && !hasResolved) {
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
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white p-6 font-sans">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <div className="absolute inset-0 perspective-grid"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-md w-full p-12 text-center space-y-8 bg-zinc-950/50 backdrop-blur-xl border border-white/5 rounded-[40px] shadow-2xl">
          <div className="flex justify-center">
            <div className="p-5 bg-amber-500/10 rounded-3xl border border-amber-500/20 shadow-inner">
              <ShieldAlert className="w-12 h-12 text-amber-500" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">
              Account Under Review
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">
              Welcome, <span className="text-white font-bold">{user.displayName || user.email}</span>! Your credentials have been received and are currently being reviewed by our team.
              <br /><br />
              Your account will be <span className="text-indigo-400 font-bold">activated shortly</span>. You will receive an email notification once your security clearance is granted.
            </p>
          </div>
          <div className="pt-4 space-y-4">
            <button
              onClick={async () => {
                await logout();
                window.location.href = '/login';
              }}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-14 font-black uppercase tracking-widest text-xs rounded-2xl border border-white/5 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <LogOut className="w-4 h-4" />
              Sign Out & Return
            </button>
          </div>
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
              <Route
                path="/admin/feedback"
                element={
                  <PrivateRoute>
                    <FeedbackReports />
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
