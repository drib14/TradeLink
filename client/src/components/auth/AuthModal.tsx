import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { Campus, College } from '../../types';
import {
  X,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff
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
  const { login, register, forgotPassword, resetPassword } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login inputs
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCampus, setRegCampus] = useState<Campus>('UC Main');
  const [regCollege, setRegCollege] = useState<College>('CCS');
  const [regYearLevel, setRegYearLevel] = useState('2nd Year College');

  // Forgot/Reset inputs
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

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
    if (!loginIdentifier.trim()) {
      showToast('Input Required', 'Please enter your Student ID or ID Number.', 'warning');
      return;
    }
    if (!loginPassword) {
      showToast('Password Required', 'Please enter your password.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(loginIdentifier, loginPassword);
      if (res.success) {
        showToast('Welcome Back', res.message, 'success');
        onClose();
      } else {
        showToast('Login Failed', res.message, 'error');
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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      showToast('Email Required', 'Please enter your registered student email address.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await forgotPassword(forgotEmail);
      if (res.success) {
        showToast('Request Submitted', res.message, 'success');
        setForgotSubmitted(true);
        setForgotMessage(res.message);
      } else {
        showToast('Request Failed', res.message, 'error');
      }
    } catch (err: any) {
      showToast('Error', err?.message || 'Password reset request failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim() || !newPassword.trim()) {
      showToast('Missing Details', 'Please enter the code and your new password.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await resetPassword(forgotEmail, resetCode, newPassword);
      if (res.success) {
        showToast('Password Updated', res.message, 'success');
        setMode('login');
        setLoginPassword('');
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
          maxWidth: mode === 'register' ? '680px' : '480px',
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
        {/* Top Header Banner with UC Colors */}
        <div
          style={{
            background: 'linear-gradient(135deg, #002B7F 0%, #0A1931 100%)',
            padding: '1.25rem 1.5rem',
            position: 'relative',
            color: '#FFFFFF',
            flexShrink: 0
          }}
        >
          {/* Subtle gold accent light */}
          <div
            style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 199, 44, 0.25) 0%, rgba(255, 199, 44, 0) 70%)',
              pointerEvents: 'none'
            }}
          />

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
              {mode === 'login' && 'University Sign In'}
              {mode === 'register' && 'Create Student Account'}
              {mode === 'forgot' && 'Reset Account Password'}
              {mode === 'reset' && 'Enter Verification Code'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.75)', margin: '0.2rem 0 0 0' }}>
              {mode === 'login' && 'Buy, sell, and swap safely across all 8 UC campuses'}
              {mode === 'register' && 'Join the exclusive University of Cebu student trade network'}
              {mode === 'forgot' && 'Enter your registered email to receive a recovery code'}
              {mode === 'reset' && 'Set a new secure password for your student account'}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Identifier Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  ID Number
                </label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="ID Number"
                  className="clean-input"
                  style={{ fontWeight: 500 }}
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
                    Student ID Number *
                  </label>
                  <input
                    type="text"
                    value={regStudentId}
                    onChange={(e) => setRegStudentId(e.target.value.replace(/\D/g, ''))}
                    placeholder="ID Number"
                    className="clean-input"
                    maxLength={15}
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

          {/* 3. FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {forgotSubmitted ? (
                <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#DEF7EC',
                    color: '#03543F',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem auto',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}>
                    ✓
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    Request Submitted to Administration
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {forgotMessage || 'Your password reset request is now awaiting campus administration review. Once approved, your verification code will be sent to your registered email.'}
                  </p>
                  <div style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    textAlign: 'left',
                    marginBottom: '1rem',
                    lineHeight: 1.45
                  }}>
                    🛡️ <strong>What happens next?</strong> Campus moderators verify student identity for account safety. Once approved, check your inbox (or Spam) for an email from <code>uc.tradelink@gmail.com</code> containing your verification code.
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      setForgotSubmitted(false);
                      setMode('reset');
                    }}
                    style={{
                      padding: '0.75rem 1.25rem',
                      width: '100%',
                      borderRadius: '8px',
                      fontWeight: 700,
                      marginBottom: '0.75rem'
                    }}
                  >
                    Enter Verification Code & Set New Password →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotSubmitted(false);
                      setMode('login');
                    }}
                    style={{
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  <div style={{
                    backgroundColor: 'rgba(0, 43, 127, 0.05)',
                    border: '1px solid rgba(0, 43, 127, 0.12)',
                    borderRadius: '10px',
                    padding: '0.75rem 0.9rem',
                    fontSize: '0.8rem',
                    color: 'var(--uc-blue)',
                    lineHeight: 1.45
                  }}>
                    🛡️ <strong>Campus Security Verification:</strong> Enter your registered student email. TradeLink will search your account and send a confirmation request to campus administrators. Upon approval, your reset code will be delivered to your inbox.
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      Registered Student Email Address
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
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                    style={{ padding: '0.75rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '8px', fontWeight: 600 }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="spin-animation" />
                        <span>Checking Account & Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Request for Admin Approval</span>
                    )}
                  </button>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'center', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      style={{ color: 'var(--uc-blue)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Already have an approved code? Enter Code Here →
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      style={{ color: 'var(--text-muted)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 4. RESET PASSWORD */}
          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Verification Code
                </label>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Code"
                  className="clean-input"
                  maxLength={4}
                  style={{ textAlign: 'center', fontSize: '1.3rem', letterSpacing: '0.3em', fontWeight: 800, color: 'var(--uc-blue)' }}
                  required
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    className="clean-input"
                    style={{ paddingRight: '2.5rem' }}
                    required
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
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
                style={{ padding: '0.75rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spin-animation" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Save New Password</span>
                )}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{ color: 'var(--uc-blue)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
