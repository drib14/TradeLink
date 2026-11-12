import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { Campus } from '../../types';
import {
  X,
  Check,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  Mail,
  Lock,
  RefreshCw
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { DepartmentDropdown } from '../common/DepartmentDropdown';
import { CampusDropdown } from '../common/CampusDropdown';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
  onRegisterSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onRegisterSuccess
}) => {
  const { login, register, forgotPassword, verifyResetCode, resetPassword } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'verify_code' | 'reset'>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login inputs
  const [loginStudentId, setLoginStudentId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCampus, setRegCampus] = useState<Campus>('UC Main');
  const [regDepartment, setRegDepartment] = useState('');

  // Password Recovery inputs (Forgot -> Verify Code -> Reset)
  const [forgotEmail, setForgotEmail] = useState('');
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [verifiedCode, setVerifiedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isRecoveryFlow = mode === 'forgot' || mode === 'verify_code' || mode === 'reset';

  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const handleClose = React.useCallback(() => {
    if (isSubmitting) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setShouldRender(false);
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
      onClose();
    }, 200);
  }, [isSubmitting, onClose]);

  // Reset states when modal is opened
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      setMode(initialMode);
      setCodeDigits(['', '', '', '', '', '']);
      setVerifiedCode('');
      setNewPassword('');
      setConfirmPassword('');
      setResendCountdown(0);
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else if (shouldRender && !isClosing) {
      handleClose();
    }
  }, [isOpen, initialMode]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    if (shouldRender) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shouldRender, handleClose]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Auto-focus on first empty code box when entering verify_code mode
  useEffect(() => {
    if (mode === 'verify_code') {
      const firstEmptyIndex = codeDigits.findIndex((d) => !d);
      const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
      setTimeout(() => {
        digitInputRefs.current[targetIndex]?.focus();
      }, 80);
    }
  }, [mode]);

  if (!shouldRender) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = loginStudentId.trim().replace(/\D/g, '');
    if (!cleanId) {
      showToast('Input Required', 'Please enter your Student ID Number.', 'warning');
      return;
    }
    if (cleanId.length < 6) {
      showToast('Invalid ID', 'Student ID must be at least 6 digits.', 'warning');
      return;
    }
    if (!loginPassword) {
      showToast('Password Required', 'Please enter your password.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(cleanId, loginPassword);
      if (res.success) {
        showToast('Welcome Back', res.message, 'success');
        onClose();
      } else {
        const isCredentialError =
          res.message.toLowerCase().includes('invalid') ||
          res.message.toLowerCase().includes('credential') ||
          res.message.toLowerCase().includes('not found');
        const displayMsg = isCredentialError
          ? 'Invalid Student ID or password. If you have not registered yet, click "Create Student Account" below.'
          : res.message;
        showToast('Login Failed', displayMsg, 'error');
      }
    } catch (err: any) {
      showToast('Login Failed', err?.message || 'Could not sign in. Please check your student ID and password, then try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regStudentId.trim() || !regEmail.trim() || !regPassword.trim()) {
      showToast('Missing Fields', 'Please complete all required fields.', 'warning');
      return;
    }

    const cleanDigits = regStudentId.replace(/\D/g, '');
    if (cleanDigits.length < 6) {
      showToast('Invalid ID', 'Student ID must be at least 6 numbers.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        name: regName,
        studentId: cleanDigits,
        email: regEmail,
        password: regPassword,
        campus: regCampus,
        department: regDepartment.trim() || undefined
      });

      if (res.success) {
        showToast('Account Created', res.message, 'success');
        if (onRegisterSuccess) {
          onRegisterSuccess();
        } else {
          onClose();
        }
      } else {
        showToast('Registration Error', res.message, 'error');
      }
    } catch (err: any) {
      showToast('Registration Error', err?.message || 'Could not create account. Please check your details and try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (!digitsOnly) {
      const updated = [...codeDigits];
      updated[index] = '';
      setCodeDigits(updated);
      return;
    }

    if (digitsOnly.length > 1) {
      const updated = [...codeDigits];
      const chars = digitsOnly.slice(0, 6).split('');
      chars.forEach((char, i) => {
        if (index + i < 6) {
          updated[index + i] = char;
        }
      });
      setCodeDigits(updated);
      const nextIdx = Math.min(index + chars.length, 5);
      digitInputRefs.current[nextIdx]?.focus();
      return;
    }

    const updated = [...codeDigits];
    updated[index] = digitsOnly.charAt(digitsOnly.length - 1);
    setCodeDigits(updated);

    if (index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!codeDigits[index] && index > 0) {
        const updated = [...codeDigits];
        updated[index - 1] = '';
        setCodeDigits(updated);
        digitInputRefs.current[index - 1]?.focus();
      } else {
        const updated = [...codeDigits];
        updated[index] = '';
        setCodeDigits(updated);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      digitInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = ['', '', '', '', '', ''];
    pasted.split('').forEach((char, i) => {
      if (i < 6) updated[i] = char;
    });
    setCodeDigits(updated);

    const targetIdx = Math.min(pasted.length, 5);
    digitInputRefs.current[targetIdx]?.focus();
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      showToast('Email Required', 'Please enter your registered student email address.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await forgotPassword(forgotEmail.trim());
      if (res.success) {
        showToast('Code Sent', 'A 6-digit verification code has been dispatched to your email.', 'success');
        setCodeDigits(['', '', '', '', '', '']);
        setResendCountdown(60);
        setMode('verify_code');
      } else {
        showToast('Request Failed', res.message, 'error');
      }
    } catch (err: any) {
      showToast('Error', err?.message || 'Password reset request failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCodeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullCode = codeDigits.join('');
    if (fullCode.length !== 6) {
      showToast('Incomplete Code', 'Please enter all 6 digits of the verification code.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await verifyResetCode(forgotEmail.trim(), fullCode);
      if (res.success) {
        showToast('Code Verified', 'Please enter your new password.', 'success');
        setVerifiedCode(fullCode);
        setMode('reset');
      } else {
        showToast('Verification Failed', res.message, 'error');
      }
    } catch (err: any) {
      showToast('Error', err?.message || 'Verification failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0 || isResending) return;
    setIsResending(true);
    try {
      const res = await forgotPassword(forgotEmail.trim());
      if (res.success) {
        showToast('Code Resent', 'A new 6-digit code has been sent to your email.', 'success');
        setResendCountdown(60);
        setCodeDigits(['', '', '', '', '', '']);
        digitInputRefs.current[0]?.focus();
      } else {
        showToast('Error', res.message, 'error');
      }
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to resend code.', 'error');
    } finally {
      setIsResending(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      showToast('Password Required', 'Please enter your new password.', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password Too Short', 'Password must be at least 6 characters.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Mismatch', 'Passwords do not match.', 'warning');
      return;
    }
    const codeToUse = verifiedCode || codeDigits.join('');
    if (codeToUse.length !== 6) {
      showToast('Missing Code', 'Verification code is invalid or missing. Please try again.', 'warning');
      setMode('verify_code');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPassword(forgotEmail.trim(), codeToUse, newPassword);
      if (res.success) {
        showToast('Password Updated', 'Your password has been changed successfully. You can now sign in.', 'success');
        setMode('login');
        setLoginPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setCodeDigits(['', '', '', '', '', '']);
        setVerifiedCode('');
      } else {
        showToast('Reset Failed', res.message, 'error');
      }
    } catch (err: any) {
      showToast('Error', err?.message || 'Reset failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`modal-backdrop-custom ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      style={{ zIndex: 1050 }}
    >
      <div
        className="modal-card-custom"
        style={{
          maxWidth: mode === 'register' ? '680px' : isRecoveryFlow ? '440px' : '480px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.98)',
          boxShadow: '0 25px 60px -15px rgba(0, 43, 127, 0.28), 0 0 0 1px rgba(0, 43, 127, 0.08)',
          backdropFilter: 'blur(24px)',
          overflow: 'hidden',
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header: Sleek Nav for Password Recovery (No Banner) vs Branded Banner for Login/Register */}
        {isRecoveryFlow ? (
          <div
            style={{
              padding: '1.1rem 1.25rem 0.25rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (mode === 'verify_code') setMode('forgot');
                else if (mode === 'reset') setMode('verify_code');
                else setMode('login');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.35rem 0.6rem',
                borderRadius: '8px',
                transition: 'all 0.15s ease'
              }}
              className="btn-ghost"
              aria-label="Go back"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="modal-close-btn"
              aria-label="Close modal"
              title="Close dialog (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#002B7F',
              padding: '1.25rem 1.5rem',
              position: 'relative',
              color: '#FFFFFF',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Logo size="sm" showSubtitle={false} isDark={true} />
              <button
                onClick={handleClose}
                className="modal-close-btn"
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)'
                }}
                aria-label="Close dialog (Esc)"
                title="Close dialog (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255, 199, 44, 0.18)', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800, color: '#FFC72C', marginBottom: '0.35rem' }}>
                <ShieldCheck size={12} />
                <span>Official UC Student Portal</span>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-display)' }}>
                {mode === 'login' && 'Student Sign In'}
                {mode === 'register' && 'Create Student Account'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.75)', margin: '0.2rem 0 0 0' }}>
                {mode === 'login' && 'Enter your Student ID number and password to sign in'}
                {mode === 'register' && 'Join the exclusive University of Cebu student trade network'}
              </p>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Student ID Number Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Student ID Number
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={loginStudentId}
                  onChange={(e) => setLoginStudentId(e.target.value.replace(/\D/g, ''))}
                  placeholder="Student ID Number (e.g. 1234567)"
                  className="clean-input"
                  style={{ fontWeight: 500 }}
                  maxLength={20}
                  required
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>

              {/* Password Input */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    style={{ fontSize: '0.75rem', color: 'var(--uc-blue)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Password"
                    className="clean-input"
                    style={{ paddingRight: '2.5rem' }}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.2rem'
                    }}
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
                style={{
                  padding: '0.75rem',
                  width: '100%',
                  marginTop: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  borderRadius: '8px'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spin-animation" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>

              {/* Bottom Register Switcher */}
              <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                New to TradeLink?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  style={{ color: 'var(--uc-blue)', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Create Student Account
                </button>
              </div>
            </form>
          )}

          {/* 2. REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Full Name"
                    className="clean-input"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    Student ID Number
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={regStudentId}
                    onChange={(e) => setRegStudentId(e.target.value.replace(/\D/g, ''))}
                    placeholder="ID Number"
                    className="clean-input"
                    maxLength={20}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    Personal Email Address
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Email Address"
                    className="clean-input"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Password"
                      className="clean-input"
                      style={{ paddingRight: '2.5rem' }}
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword((prev) => !prev)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.2rem'
                      }}
                      title={showRegPassword ? 'Hide password' : 'Show password'}
                      aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Campus and Department */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', position: 'relative', zIndex: 30 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                    UC Campus
                  </label>
                  <CampusDropdown
                    value={regCampus}
                    onChange={(camp: any) => setRegCampus(camp)}
                    disabled={isSubmitting}
                  />
                </div>

                <div style={{ position: 'relative', zIndex: 40 }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                    Department / College / Strand
                  </label>
                  <DepartmentDropdown
                    value={regDepartment}
                    onChange={setRegDepartment}
                    disabled={isSubmitting}
                    direction="auto"
                    placeholder="Select College, JHS, or SHS"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
                style={{
                  padding: '0.85rem 1.5rem',
                  width: '100%',
                  minHeight: '48px',
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  borderRadius: '12px',
                  backgroundColor: 'var(--uc-blue)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(0, 43, 127, 0.25)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="spin-animation" />
                    <span>Creating Student Account...</span>
                  </>
                ) : (
                  <span>Complete Student Registration</span>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', backgroundColor: 'var(--bg-subtle)', padding: '0.75rem 1rem', borderRadius: '10px', marginTop: '0.35rem', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Already have a student account?</span>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{ color: 'var(--uc-blue)', fontWeight: 800, fontSize: '0.82rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Sign In here
                </button>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD (STEP 1: EMAIL REQUEST - NO BANNER) */}
          {mode === 'forgot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 43, 127, 0.08)',
                    color: 'var(--uc-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem auto'
                  }}
                >
                  <KeyRound size={26} />
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
                  Forgot Password
                </h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Enter your registered student email address to receive a 6-digit verification code.
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    Registered Student Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. student@uc.edu.ph"
                    className="clean-input"
                    required
                    autoFocus
                    disabled={isSubmitting}
                    style={{ width: '100%', fontSize: '0.9rem' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting || !forgotEmail.trim()}
                  style={{
                    padding: '0.85rem',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.92rem'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="spin-animation" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                </button>

                <div style={{ textAlign: 'center', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    style={{ color: 'var(--text-muted)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Remember your password? <span style={{ color: 'var(--uc-blue)', fontWeight: 700 }}>Sign In</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4. VERIFY DIGIT CODE (STEP 2: 6 MULTI-BOX DIGIT CODE MODAL) */}
          {mode === 'verify_code' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 43, 127, 0.08)',
                    color: 'var(--uc-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem auto'
                  }}
                >
                  <Mail size={26} />
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
                  Enter Verification Code
                </h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  We sent a 6-digit code to <strong style={{ color: 'var(--text-primary)' }}>{forgotEmail}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--uc-blue)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '0.35rem',
                    textDecoration: 'underline'
                  }}
                >
                  Wrong email? Change
                </button>
              </div>

              <form onSubmit={handleVerifyCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* 6 Individual Digit Boxes */}
                <div>
                  <label style={{ display: 'block', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                    6-Digit Security Code
                  </label>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    {codeDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          digitInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={idx === 0 ? 6 : 1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                        onPaste={handleDigitPaste}
                        className={`digit-box ${digit ? 'filled' : ''}`}
                        disabled={isSubmitting}
                        aria-label={`Digit ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Resend Code Section */}
                <div style={{ textAlign: 'center', fontSize: '0.82rem' }}>
                  {resendCountdown > 0 ? (
                    <span style={{ color: 'var(--text-muted)' }}>
                      Resend code in <strong style={{ color: 'var(--text-primary)' }}>{resendCountdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isResending}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--uc-blue)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <RefreshCw size={13} className={isResending ? 'spin-animation' : ''} />
                      <span>Didn't receive code? Resend</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting || codeDigits.join('').length !== 6}
                  style={{
                    padding: '0.85rem',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.92rem'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="spin-animation" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <span>Verify Code →</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* 5. RESET PASSWORD (STEP 3: SET NEW PASSWORD - SEPARATED MODAL) */}
          {mode === 'reset' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 43, 127, 0.08)',
                    color: 'var(--uc-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem auto'
                  }}
                >
                  <Lock size={26} />
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
                  Create New Password
                </h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Set a new secure password for your student account.
                </p>
              </div>

              <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="clean-input"
                      style={{ paddingRight: '2.5rem', width: '100%', fontSize: '0.9rem' }}
                      required
                      autoFocus
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.2rem'
                      }}
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {newPassword && newPassword.length < 6 && (
                    <p style={{ color: '#DC2626', fontSize: '0.74rem', marginTop: '0.25rem', marginBottom: 0 }}>
                      Password must be at least 6 characters long.
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="clean-input"
                      style={{ paddingRight: '2.5rem', width: '100%', fontSize: '0.9rem' }}
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.2rem'
                      }}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p style={{ color: '#DC2626', fontSize: '0.74rem', marginTop: '0.25rem', marginBottom: 0 }}>
                      Passwords do not match.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                  style={{
                    padding: '0.85rem',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.92rem'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="spin-animation" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Save New Password</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
