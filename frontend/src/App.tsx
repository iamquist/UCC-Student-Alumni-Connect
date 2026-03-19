import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from '@/components/layout/AppLayout';
import LandingPage from '@/pages/LandingPage';
import FeedPage from '@/pages/FeedPage';
import ProfilePage from '@/pages/ProfilePage';
import NetworkPage from '@/pages/NetworkPage';
import JobsPage from '@/pages/JobsPage';
import ChatPage from '@/pages/ChatPage';
import EventsPage from '@/pages/EventsPage';
import NotificationsPage from '@/pages/NotificationsPage';
import AdminPage from '@/pages/AdminPage';
import SettingsPage from '@/pages/SettingsPage';
import { LoginPage, RegisterPage } from '@/pages/AuthPages';
import { useAuthStore } from '@/store/authStore';

function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { authApi } = await import('@/services/api');
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      const toast = (await import('react-hot-toast')).default;
      toast.error('Could not send reset email');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9"><path d="M16 2L4 8v6c0 8 5.5 14.5 12 16 6.5-1.5 12-8 12-16V8L16 2z" stroke="#e8457a" strokeWidth="2" fill="#fff0f5"/><circle cx="16" cy="16" r="4" fill="#e8457a" opacity="0.6"/></svg>
          <span className="text-xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}><span className="text-gray-900">Uni</span><span className="text-brand-pink">Alum</span></span>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-8 border border-gray-100">
          {!sent ? (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Reset Password</h1>
              <p className="text-sm text-gray-400 mb-6">We'll send a reset link to your email</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Email Address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="you@example.com"/>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20,6 9,17 4,12"/></svg>
              </div>
              <h2 className="font-bold text-gray-900 mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Check your email</h2>
              <p className="text-sm text-gray-500">We sent a password reset link to <strong>{email}</strong></p>
            </div>
          )}
          <div className="mt-6 text-center">
            <a href="/login" className="text-xs text-brand-pink hover:underline">← Back to sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Guard: redirect authenticated users from auth pages to feed
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/feed" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
          success: { iconTheme: { primary: '#e8457a', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public landing */}
        <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />

        {/* Auth routes */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />

        {/* Protected app routes */}
        <Route element={<AppLayout />}>
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
