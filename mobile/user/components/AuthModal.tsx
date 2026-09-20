import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Campus, College } from '../types';
import { TradeLinkLogo } from './TradeLinkLogo';
import { mobileAuthService } from '../services/auth.service';

const CAMPUSES: Campus[] = [
  'UC Main',
  'UC Banilad',
  'UC LM',
  'UC METC',
  'UC PRI',
  'UC South Campus',
  'UC Pardo-Talisay',
  'UC Medical Center',
];

const COLLEGES: College[] = [
  'College of Computer Studies',
  'College of Business & Accountancy',
  'College of Engineering',
  'College of Nursing & Allied Health',
  'Maritime Education & Training Center',
  'College of Law',
  'College of Criminology',
  'Senior High School (SHS)',
  'Junior High School (JHS)',
  'College of Arts & Sciences',
  'College of Education',
  'College of Hospitality Management',
  'College of Customs Administration',
];

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');

  // Form State
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [campus, setCampus] = useState<Campus>('UC Main');
  const [college, setCollege] = useState<College>('College of Computer Studies');

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'new_password'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setStudentId('');
    setLoginId('');
    setEmail('');
    setPassword('');
    setCampus('UC Main');
    setCollege('College of Computer Studies');
    setForgotStep('request');
    setForgotEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleRequestResetCode = async () => {
    if (!forgotEmail.trim()) {
      setErrorMessage('Please enter your registered student email address.');
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const res = await mobileAuthService.forgotPassword(forgotEmail.trim().toLowerCase());
      setLoading(false);
      setSuccessMessage(res.message || 'Verification code sent to your email.');
      if (res.resetCode) {
        setResetCode(res.resetCode);
      }
      setForgotStep('verify');
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to send reset code.');
    }
  };

  const handleVerifyResetCode = async () => {
    if (!resetCode.trim() || resetCode.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit code sent to your email.');
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const res = await mobileAuthService.verifyResetCode(forgotEmail.trim().toLowerCase(), resetCode.trim());
      setLoading(false);
      setSuccessMessage(res.message || 'Code verified. Enter your new password.');
      setForgotStep('new_password');
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.response?.data?.message || err.message || 'Invalid or expired code.');
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setErrorMessage('Password requires uppercase, lowercase, number, and special character.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const res = await mobileAuthService.resetPassword(forgotEmail.trim().toLowerCase(), resetCode.trim(), newPassword);
      setLoading(false);
      setSuccessMessage(res.message || 'Password reset successfully! Please log in.');
      setTimeout(() => {
        setTab('login');
        setForgotStep('request');
        setPassword('');
      }, 1000);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to reset password.');
    }
  };

  const handleClose = () => {
    resetForm();
    closeAuthModal();
  };

  const handleLoginSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const res = await login(loginId, password);
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Welcome back to TradeLink!');
      setTimeout(() => {
        handleClose();
      }, 500);
    } else {
      setErrorMessage(res.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleRegisterSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const res = await register({
      name,
      studentId,
      email,
      campus,
      college,
      password,
    });
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Student account created successfully!');
      setTimeout(() => {
        handleClose();
      }, 600);
    } else {
      setErrorMessage(res.error || 'Registration failed. Please check your details.');
    }
  };

  return (
    <Modal visible={isAuthModalOpen} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <TradeLinkLogo size={36} borderRadius={10} />
              <View>
                <Text style={styles.brandTitle}>TradeLink</Text>
                <Text style={styles.brandSubtitle}>UC Verified Student Access</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Tab Switcher / Recovery Header */}
          {tab === 'forgot' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setTab('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}
              >
                <Ionicons name="arrow-back" size={18} color="#002B7F" />
                <Text style={{ fontSize: 13, color: '#002B7F', fontWeight: '700' }}>Back to Log In</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#002B7F' }}>Password Recovery</Text>
            </View>
          ) : (
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, tab === 'login' && styles.tabButtonActive]}
                onPress={() => {
                  setTab('login');
                  setErrorMessage(null);
                }}
              >
                <Ionicons
                  name="log-in-outline"
                  size={16}
                  color={tab === 'login' ? '#002B7F' : '#64748B'}
                />
                <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Log In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, tab === 'register' && styles.tabButtonActive]}
                onPress={() => {
                  setTab('register');
                  setErrorMessage(null);
                }}
              >
                <Ionicons
                  name="person-add-outline"
                  size={16}
                  color={tab === 'register' ? '#002B7F' : '#64748B'}
                />
                <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Feedback Banners */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {successMessage && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {tab === 'forgot' ? (
              /* FORGOT PASSWORD FORM */
              <View style={styles.formBody}>
                {forgotStep === 'request' && (
                  <>
                    <Text style={{ fontSize: 13, color: '#475569', marginBottom: 12, lineHeight: 18 }}>
                      Enter your registered UC student email address to receive a secure 6-digit password reset code.
                    </Text>
                    <Text style={styles.fieldLabel}>Registered Email</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="yourname@gmail.com or @uc.edu.ph"
                        placeholderTextColor="#94A3B8"
                        value={forgotEmail}
                        onChangeText={setForgotEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={handleRequestResetCode}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.submitButtonText}>Send 6-Digit Code</Text>
                          <Ionicons name="mail" size={16} color="#FFFFFF" />
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {forgotStep === 'verify' && (
                  <>
                    <Text style={{ fontSize: 13, color: '#475569', marginBottom: 12, lineHeight: 18 }}>
                      We dispatched a 6-digit code to <Text style={{ fontWeight: '700', color: '#002B7F' }}>{forgotEmail}</Text>. Enter the code below:
                    </Text>
                    <Text style={styles.fieldLabel}>6-Digit Security Code</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="key-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.textInput, { letterSpacing: 4, fontWeight: '700', fontSize: 16 }]}
                        placeholder="123456"
                        placeholderTextColor="#94A3B8"
                        value={resetCode}
                        onChangeText={setResetCode}
                        maxLength={6}
                        keyboardType="number-pad"
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={handleVerifyResetCode}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.submitButtonText}>Verify Code</Text>
                          <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ marginTop: 12, alignSelf: 'center' }}
                      onPress={() => setForgotStep('request')}
                    >
                      <Text style={{ fontSize: 12, color: '#64748B' }}>Didn't receive? Change email</Text>
                    </TouchableOpacity>
                  </>
                )}

                {forgotStep === 'new_password' && (
                  <>
                    <Text style={{ fontSize: 13, color: '#475569', marginBottom: 12, lineHeight: 18 }}>
                      Create a strong new password with uppercase, lowercase, numbers, and special characters.
                    </Text>
                    <Text style={styles.fieldLabel}>New Password</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="New Password (min 8 chars)"
                        placeholderTextColor="#94A3B8"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                      />
                    </View>
                    <Text style={styles.fieldLabel}>Confirm New Password</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Re-enter New Password"
                        placeholderTextColor="#94A3B8"
                        value={confirmNewPassword}
                        onChangeText={setConfirmNewPassword}
                        secureTextEntry
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={handleResetPasswordSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.submitButtonText}>Update Password</Text>
                          <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : tab === 'login' ? (
              /* LOGIN FORM */
              <View style={styles.formBody}>
                <Text style={styles.fieldLabel}>ID Number</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="card-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="ID Number"
                    placeholderTextColor="#94A3B8"
                    value={loginId}
                    onChangeText={setLoginId}
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={{ alignSelf: 'flex-end', marginTop: 4, marginBottom: 12 }}
                  onPress={() => {
                    setTab('forgot');
                    setForgotStep('request');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#002B7F', fontWeight: '700' }}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleLoginSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Log In to TradeLink</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Quick Switch to Register */}
                <View style={styles.footerPrompt}>
                  <Text style={styles.promptText}>New UC student?</Text>
                  <TouchableOpacity onPress={() => setTab('register')}>
                    <Text style={styles.promptLink}>Create an account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* REGISTER FORM */
              <View style={styles.formBody}>
                <Text style={styles.fieldLabel}>Full Legal Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Full Name"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <Text style={styles.fieldLabel}>Student ID Number</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="card-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="ID Number"
                    placeholderTextColor="#94A3B8"
                    value={studentId}
                    onChangeText={setStudentId}
                  />
                </View>

                <Text style={styles.fieldLabel}>Personal Email Address</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Email Address"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <Text style={styles.fieldLabel}>Campus</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {CAMPUSES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.choiceChip, campus === c && styles.choiceChipActive]}
                      onPress={() => setCampus(c)}
                    >
                      <Text style={[styles.choiceChipText, campus === c && styles.choiceChipTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.fieldLabel}>College / Department</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {COLLEGES.map((col) => (
                    <TouchableOpacity
                      key={col}
                      style={[styles.choiceChip, college === col && styles.choiceChipActive]}
                      onPress={() => setCollege(col)}
                    >
                      <Text
                        style={[styles.choiceChipText, college === col && styles.choiceChipTextActive]}
                      >
                        {col}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleRegisterSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Create Verified Account</Text>
                      <Ionicons name="checkmark-circle" size={18} color="#FFC72C" />
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.footerPrompt}>
                  <Text style={styles.promptText}>Already registered?</Text>
                  <TouchableOpacity onPress={() => setTab('login')}>
                    <Text style={styles.promptLink}>Log in here</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 29, 89, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#002B7F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#002B7F',
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  closeButton: {
    padding: 6,
    borderRadius: 9999,
    backgroundColor: '#F1F5F9',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 8,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#002B7F',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 10,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 10,
    gap: 8,
  },
  successText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
    flex: 1,
  },
  formScroll: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  formBody: {
    paddingBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  chipScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  choiceChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  choiceChipActive: {
    backgroundColor: '#002B7F',
    borderColor: '#002B7F',
  },
  choiceChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  choiceChipTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#002B7F',
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 18,
    gap: 8,
    shadowColor: '#002B7F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footerPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 6,
  },
  promptText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  promptLink: {
    fontSize: 12,
    color: '#002B7F',
    fontWeight: '800',
  },
});
