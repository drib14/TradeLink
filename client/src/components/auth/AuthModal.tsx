import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { Campus, College } from '../../types';
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
  const [regCollege, setRegCollege] = useState<College>('CCS');
  const [regYearLevel, setRegYearLevel] = useState('2nd Year College');

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

  // Reset states when modal is opened
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setCodeDigits(['', '', '', '', '', '']);
      setVerifiedCode('');
      setNewPassword('');
      setConfirmPassword('');
      setResendCountdown(0);
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, initialMode]);

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

  // Helper to filter department options dynamically by year level
  const getDepartmentsForYearLevel = (year: string): { value: College; label: string }[] => {
    if (year.includes('Grade 7') || year.includes('Grade 8') || year.includes('Grade 9') || year.includes('Grade 10') || year.includes('Junior High')) {
      return [
        { value: 'Junior High School', label: 'Junior High School General' },
        { value: 'Junior High (Grade 7-10)', label: 'Junior High (Grades 7–10 Academics)' }
      ];
    }
    if (year.includes('Grade 11') || year.includes('Grade 12') || year.includes('SHS') || year.includes('Senior High')) {
      return [
        { value: 'Senior High (STEM)', label: 'Senior High - STEM Strand' },
        { value: 'Senior High (ABM)', label: 'Senior High - ABM Strand' },
        { value: 'Senior High (HUMSS)', label: 'Senior High - HUMSS Strand' },
        { value: 'Senior High (TVL/GAS)', label: 'Senior High - TVL / GAS Strand' },
        { value: 'Senior High School', label: 'Senior High General' }
      ];
    }
    if (year.includes('Law')) {
      return [{ value: 'Law', label: 'College of Law (Juris Doctor)' }];
    }
    if (year.includes('Medicine')) {
      return [{ value: 'Medicine', label: 'College of Medicine (MD)' }];
    }
    return [
      { value: 'CCS', label: 'CCS (Computer Studies)' },
      { value: 'Engineering', label: 'College of Engineering' },
      { value: 'Nursing', label: 'College of Nursing' },
      { value: 'CBA', label: 'CBA (Business Administration)' },
      { value: 'Maritime', label: 'Maritime Education' },
      { value: 'Criminology', label: 'College of Criminology' },
      { value: 'Arts & Sciences', label: 'Arts & Sciences' },
      { value: 'Education', label: 'College of Education' },
      { value: 'Hospitality & Tourism', label: 'Hospitality & Tourism' },
      { value: 'General Student', label: 'General / Other Program' }
    ];
  };

  const handleYearLevelChange = (newYear: string) => {
    setRegYearLevel(newYear);
    const availableDepts = getDepartmentsForYearLevel(newYear);
    if (!availableDepts.some((d) => d.value === regCollege)) {
      setRegCollege(availableDepts[0].value);
    }
  };

  if (!isOpen) return null;

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
      showToast('Error', err?.message || 'Login encountered an issue.', 'error');
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
        college: regCollege,
        yearLevel: regYearLevel
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
      showToast('Error', err?.message || 'Registration failed.', 'error');
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
    <div className="modal-backdrop-custom" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-card-custom"
        style={{
          maxWidth: mode === 'register' ? '680px' : isRecoveryFlow ? '440px' : '480px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
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
              onClick={onClose}
              style={{
                color: 'var(--text-muted)',
                padding: '0.4rem',
                cursor: 'pointer',
                background: 'var(--bg-subtle)',
                border: 'none',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Close modal"
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
                onClick={onClose}
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  padding: '0.35rem',
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                aria-label="Close modal"
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
                    Full Legal Name *
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
                    Personal Email Address *
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
                    Password *
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

              {/* Academic Classification */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                    1. UC Campus *
                  </label>
                  <select
                    value={regCampus}
                    onChange={(e: any) => setRegCampus(e.target.value)}
                    className="clean-input"
                    disabled={isSubmitting}
                  >
                    <option value="UC Main">UC Main</option>
                    <option value="UC Banilad">UC Banilad</option>
                    <option value="UC LM">UC LM</option>
                    <option value="UC METC">UC METC</option>
                    <option value="UC PRI">UC PRI (JHS & SHS)</option>
                    <option value="UC Pardo-Talisay">UC Pardo-Talisay</option>
                    <option value="UC South Campus">UC South Campus</option>
                    <option value="UC Medical Center">UC Medical Center</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--uc-blue)', marginBottom: '0.3rem' }}>
                    2. Year / Grade Level *
                  </label>
                  <select
                    value={regYearLevel}
                    onChange={(e) => handleYearLevelChange(e.target.value)}
                    className="clean-input"
                    style={{ fontWeight: 700, color: 'var(--uc-blue)' }}
                    disabled={isSubmitting}
                  >
                    <optgroup label="Junior High School (JHS)">
                      <option value="Grade 7 (Junior High)">Grade 7 (Junior High)</option>
                      <option value="Grade 8 (Junior High)">Grade 8 (Junior High)</option>
                      <option value="Grade 9 (Junior High)">Grade 9 (Junior High)</option>
                      <option value="Grade 10 (Junior High)">Grade 10 (Junior High)</option>
                    </optgroup>
                    <optgroup label="Senior High School (SHS)">
                      <option value="Grade 11 (Senior High)">Grade 11 (Senior High)</option>
                      <option value="Grade 12 (Senior High)">Grade 12 (Senior High)</option>
                    </optgroup>
                    <optgroup label="College Undergraduate">
                      <option value="1st Year College">1st Year College</option>
                      <option value="2nd Year College">2nd Year College</option>
                      <option value="3rd Year College">3rd Year College</option>
                      <option value="4th Year College">4th Year College</option>
                      <option value="5th Year College (Eng/Arch)">5th Year (Engineering/Arch)</option>
                    </optgroup>
                    <optgroup label="Post-Graduate / Professional">
                      <option value="College of Law">College of Law (JD)</option>
                      <option value="College of Medicine">College of Medicine (MD)</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                    3. Department / Strand *
                  </label>
                  <select
                    value={regCollege}
                    onChange={(e: any) => setRegCollege(e.target.value)}
                    className="clean-input"
                    disabled={isSubmitting}
                  >
                    {getDepartmentsForYearLevel(regYearLevel).map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
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
