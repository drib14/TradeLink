import React, { useState } from 'react';
import { ToastProvider, useToast } from './components/common/Toast';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminProvider } from './context/AdminContext';
import { AdminDashboard } from './pages/AdminDashboard';
import { ShieldAlert, LogIn, KeyRound, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

const AdminAuthGate: React.FC = () => {
  const { login, forgotPassword, resetPassword, isLoading } = useAdminAuth();
  const { showToast } = useToast();

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await login(emailInput.trim(), passwordInput);
      if (res.success) {
        showToast('Authorized', 'Welcome to the UC Administration Portal.', 'success');
      } else {
        showToast('Login Failed', res.message, 'error');
      }
    } catch {
      showToast('Error', 'Unable to connect to administration server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    try {
      const res = await forgotPassword(forgotEmail.trim());
      if (res.success) {
        showToast('Code Dispatched', 'A 4-digit reset code has been sent directly to your administrator email.', 'success');
        setForgotStep('reset');
      } else {
        showToast('Failed', res.message, 'error');
      }
    } catch {
      showToast('Error', 'Failed to request reset code.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCompletePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    try {
      const res = await resetPassword(forgotEmail.trim(), resetCode.trim(), newPassword);
      if (res.success) {
        showToast('Password Reset', 'Your administrator password has been updated. Please sign in.', 'success');
        setIsForgotOpen(false);
        setForgotStep('request');
        setPasswordInput(newPassword);
      } else {
        showToast('Reset Failed', res.message, 'error');
      }
    } catch {
      showToast('Error', 'Failed to reset password.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050B17', color: '#FFFFFF' }}>
        <Loader2 size={36} className="spin-animation" color="#FFC72C" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A1128', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 25px 60px -15px rgba(0, 43, 127, 0.4), 0 0 0 1px rgba(0, 43, 127, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        {/* Header Badge & Brand */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              backgroundColor: '#002B7F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFC72C',
              boxShadow: '0 8px 20px rgba(0, 43, 127, 0.25)'
            }}
          >
            <ShieldAlert size={32} />
          </div>

          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#002B7F', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', backgroundColor: 'rgba(0, 43, 127, 0.08)', padding: '0.2rem 0.65rem', borderRadius: '6px' }}>
              Restricted Campus Portal
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A', marginTop: '0.45rem', margin: '0.45rem 0 0 0' }}>
              University of Cebu Admin
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
              Sign in with your official administrator email to access KYC queues, student moderation, and campus safety desks.
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
              Administrator Email
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter administrator email"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="clean-input"
              required
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155' }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(emailInput);
                  setForgotStep('request');
                  setIsForgotOpen(true);
                }}
                style={{ fontSize: '0.74rem', color: '#002B7F', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter administrator password"
              autoComplete="new-password"
              className="clean-input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{
              padding: '0.85rem',
              width: '100%',
              fontWeight: 800,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              borderRadius: '12px',
              boxShadow: '0 4px 14px rgba(0, 43, 127, 0.25)'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin-animation" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Sign In to Admin Portal</span>
              </>
            )}
          </button>
        </form>

        {/* Switch to Student Portal */}
        <div style={{ textAlign: 'center', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' }}>
          <a
            href="http://localhost:5173"
            style={{
              fontSize: '0.82rem',
              color: '#64748B',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Student Marketplace</span>
          </a>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 24, 76, 0.75)', backdropFilter: 'blur(8px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setIsForgotOpen(false)}
        >
          <div
            style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '2rem', maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#002B7F', fontWeight: 900, fontSize: '1.15rem' }}>
              <KeyRound size={22} color="#FFC72C" />
              <span>Admin Password Recovery</span>
            </div>

            {forgotStep === 'request' ? (
              <form onSubmit={handleRequestResetCode} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                  Enter your registered administrator email address. A 4-digit verification code will be sent directly to your inbox.
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    Administrator Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter administrator email"
                    autoComplete="off"
                    className="clean-input"
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, backgroundColor: '#F1F5F9', border: 'none', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="btn-primary"
                    style={{ flex: 1.5, padding: '0.75rem', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 800 }}
                  >
                    {isResetting ? 'Sending...' : 'Send Reset Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCompletePasswordReset} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                  Enter the 4-digit code sent to <strong>{forgotEmail}</strong> and your new password.
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    4-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 1234"
                    autoComplete="off"
                    className="clean-input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    className="clean-input"
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setForgotStep('request')}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, backgroundColor: '#F1F5F9', border: 'none', cursor: 'pointer' }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="btn-primary"
                    style={{ flex: 1.5, padding: '0.75rem', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 800 }}
                  >
                    {isResetting ? 'Updating...' : 'Set New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminAppContent: React.FC = () => {
  const { isAdminAuthenticated } = useAdminAuth();

  if (!isAdminAuthenticated) {
    return <AdminAuthGate />;
  }

  return (
    <AdminProvider>
      <AdminDashboard onNavigate={(view) => {
        if (view === 'home') {
          window.location.href = 'http://localhost:5173';
        }
      }} />
    </AdminProvider>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AdminAuthProvider>
        <AdminAppContent />
      </AdminAuthProvider>
    </ToastProvider>
  );
};

export default App;
