import React, { useState } from 'react';
import { useAuth, ADMIN_CREDENTIALS } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { Campus, College } from '../../types';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  ShieldCheck,
  Building2,
  KeyRound,
  CheckCircle2,
  Upload,
  Hash
} from 'lucide-react';
import { DragDropUpload } from '../common/DragDropUpload';
import { Logo } from '../common/Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const { login, register, forgotPassword, resetPassword, switchUser } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode);
  const [loginMethod, setLoginMethod] = useState<'id' | 'email'>('id');

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
  const [regYearLevel, setRegYearLevel] = useState('2nd Year');
  const [regIdPhoto, setRegIdPhoto] = useState<string>('');

  // Forgot/Reset inputs
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

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
      return [
        { value: 'Law', label: 'College of Law (Juris Doctor)' }
      ];
    }
    if (year.includes('Medicine')) {
      return [
        { value: 'Medicine', label: 'College of Medicine (MD)' }
      ];
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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      showToast('Input Required', loginMethod === 'id' ? 'Please enter your Student ID.' : 'Please enter your email.', 'warning');
      return;
    }
    const res = login(loginIdentifier, loginPassword);
    if (res.success) {
      showToast('Logged In', res.message, 'success');
      onClose();
    } else {
      showToast('Login Failed', res.message, 'error');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
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

    const res = register({
      name: regName,
      studentId: cleanDigits,
      email: regEmail,
      password: regPassword,
      campus: regCampus,
      college: regCollege,
      yearLevel: regYearLevel,
      idPhotoUrl: regIdPhoto || undefined
    });

    if (res.success) {
      showToast('Welcome!', res.message, 'success');
      onClose();
    } else {
      showToast('Error', res.message, 'error');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      showToast('Email Required', 'Please enter your email.', 'warning');
      return;
    }
    const res = forgotPassword(forgotEmail);
    if (res.success && res.resetCode) {
      setGeneratedCode(res.resetCode);
      setResetCode(res.resetCode);
      setMode('reset');
      showToast('Code Sent', `Code: ${res.resetCode}`, 'info');
    } else {
      showToast('Error', res.message, 'error');
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim() || !newPassword.trim()) {
      showToast('Missing Info', 'Please enter the code and new password.', 'warning');
      return;
    }
    const res = resetPassword(forgotEmail, resetCode, newPassword);
    if (res.success) {
      showToast('Password Reset', res.message, 'success');
      setMode('login');
      setLoginIdentifier(forgotEmail);
      setLoginPassword(newPassword);
    } else {
      showToast('Error', res.message, 'error');
    }
  };

  const handleQuickLogin = (userId: string, name: string) => {
    switchUser(userId);
    showToast('Logged In', `Switched to ${name}`, 'info');
    onClose();
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setRegIdPhoto(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 29, 89, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'clamp(12px, 2vw, 16px)',
          border: '1.5px solid #BCD1F7',
          width: '100%',
          maxWidth: mode === 'register' ? '600px' : '440px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0, 43, 127, 0.25)',
          padding: 'clamp(1.2rem, 3.5vw, 2rem)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <Logo size="sm" showSubtitle={false} />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#002B7F', marginTop: '0.65rem' }}>
              {mode === 'login' && 'Sign In'}
              {mode === 'register' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'reset' && 'Enter Code'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
              {mode === 'login' && 'Sign in to access your campus marketplace'}
              {mode === 'register' && 'Register with your student details'}
              {mode === 'forgot' && 'Enter your email to receive a reset code'}
              {mode === 'reset' && 'Set a new password for your account'}
            </p>
          </div>

          <button onClick={onClose} style={{ color: '#64748B', padding: '0.25rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* 1. LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Method switch: Student ID or Email */}
            <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('id');
                  setLoginIdentifier('');
                }}
                style={{
                  flex: 1,
                  padding: '0.4rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: loginMethod === 'id' ? 800 : 600,
                  backgroundColor: loginMethod === 'id' ? '#FFFFFF' : 'transparent',
                  color: loginMethod === 'id' ? '#002B7F' : '#64748B',
                  boxShadow: loginMethod === 'id' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Student ID
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('email');
                  setLoginIdentifier('');
                }}
                style={{
                  flex: 1,
                  padding: '0.4rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: loginMethod === 'email' ? 800 : 600,
                  backgroundColor: loginMethod === 'email' ? '#FFFFFF' : 'transparent',
                  color: loginMethod === 'email' ? '#002B7F' : '#64748B',
                  boxShadow: loginMethod === 'email' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Email
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                {loginMethod === 'id' ? 'Student ID' : 'Email'}
              </label>
              <div style={{ position: 'relative' }}>
                {loginMethod === 'id' ? (
                  <>
                    <Hash size={15} color="#64748B" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Student ID"
                      className="clean-input"
                      style={{ paddingLeft: '2.25rem' }}
                      maxLength={10}
                      required
                    />
                  </>
                ) : (
                  <>
                    <Mail size={15} color="#64748B" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="Email"
                      className="clean-input"
                      style={{ paddingLeft: '2.25rem' }}
                      required
                    />
                  </>
                )}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  style={{ fontSize: '0.75rem', color: '#002B7F', fontWeight: 700 }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#64748B" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  className="clean-input"
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '0.7rem', width: '100%', marginTop: '0.35rem' }}>
              Sign In
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748B', marginTop: '0.35rem' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                style={{ color: '#002B7F', fontWeight: 800 }}
              >
                Register
              </button>
            </div>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Full name"
                  className="clean-input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                  Student ID
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={regStudentId}
                  onChange={(e) => setRegStudentId(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Student ID"
                  className="clean-input"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Email"
                  className="clean-input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Password"
                  className="clean-input"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                  1. Campus
                </label>
                <select
                  value={regCampus}
                  onChange={(e: any) => setRegCampus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.5rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    backgroundColor: '#FFFFFF',
                    outline: 'none'
                  }}
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
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#002B7F', marginBottom: '0.3rem' }}>
                  2. Year / Grade Level *
                </label>
                <select
                  value={regYearLevel}
                  onChange={(e) => handleYearLevelChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.5rem',
                    borderRadius: '8px',
                    border: '1.5px solid #002B7F',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    backgroundColor: '#F8FAFC',
                    color: '#002B7F',
                    outline: 'none'
                  }}
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
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                  3. Department / Strand *
                </label>
                <select
                  value={regCollege}
                  onChange={(e: any) => setRegCollege(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.5rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    backgroundColor: '#FFFFFF',
                    outline: 'none'
                  }}
                >
                  {getDepartmentsForYearLevel(regYearLevel).map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional ID Upload (Drag & Drop) */}
            <DragDropUpload
              images={regIdPhoto ? [regIdPhoto] : []}
              onChange={(imgs) => setRegIdPhoto(imgs[0] || '')}
              maxFiles={1}
              label="Student ID Photo (Optional)"
              helperText="Drag & drop student ID or COR photo"
              isMultiple={false}
            />

            <button type="submit" className="btn-primary" style={{ padding: '0.7rem', width: '100%', marginTop: '0.35rem' }}>
              Create Account
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748B' }}>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{ color: '#002B7F', fontWeight: 800 }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#64748B" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Email"
                  className="clean-input"
                  style={{ paddingLeft: '2.25rem' }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '0.7rem', width: '100%' }}>
              Send Code
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748B' }}>
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{ color: '#002B7F', fontWeight: 700 }}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* 4. RESET PASSWORD */}
        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                4-Digit Code
              </label>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                className="clean-input"
                maxLength={4}
                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.25em', fontWeight: 800 }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#64748B" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="clean-input"
                  style={{ paddingLeft: '2.25rem' }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '0.7rem', width: '100%' }}>
              Save Password
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748B' }}>
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{ color: '#002B7F', fontWeight: 700 }}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
