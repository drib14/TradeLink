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
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Form State
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [campus, setCampus] = useState<Campus>('UC Main');
  const [college, setCollege] = useState<College>('College of Computer Studies');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setStudentId('');
    setEmail('');
    setPassword('');
    setCampus('UC Main');
    setCollege('College of Computer Studies');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    resetForm();
    closeAuthModal();
  };

  const handleLoginSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const res = await login(email, password);
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

          {/* Tab Switcher */}
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
            {tab === 'login' ? (
              /* LOGIN FORM */
              <View style={styles.formBody}>
                <Text style={styles.fieldLabel}>UC Student Email</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="student.id@uc.edu.ph"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

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
                <Text style={styles.fieldLabel}>Full Student Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Juan Dela Cruz"
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
                    placeholder="e.g. 2024-12345"
                    placeholderTextColor="#94A3B8"
                    value={studentId}
                    onChangeText={setStudentId}
                  />
                </View>

                <Text style={styles.fieldLabel}>UC Email Address</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="juan.delacruz@uc.edu.ph"
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

                <Text style={styles.fieldLabel}>Create Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="At least 6 characters"
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
