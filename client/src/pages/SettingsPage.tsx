import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { UserAvatar } from '../components/common/UserAvatar';
import { College } from '../types';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Trash2,
  AlertTriangle,
  Save,
  ToggleLeft,
  ToggleRight,
  LogOut
} from 'lucide-react';

interface SettingsPageProps {
  onNavigate: (view: string, param?: any) => void;
  onOpenAuth?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { currentUser, updateProfile, logout } = useAuth();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState<'account' | 'notifications' | 'privacy' | 'data'>('account');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Account settings
  const [nameInput, setNameInput] = useState(currentUser?.name || '');
  const [bioInput, setBioInput] = useState(currentUser?.bio || '');
  const [avatarInput, setAvatarInput] = useState(currentUser?.avatar || '');
  const [collegeInput, setCollegeInput] = useState<College>(currentUser?.college || 'CCS');
  const [yearLevelInput, setYearLevelInput] = useState(currentUser?.yearLevel || '2nd Year College');

  // Notification prefs
  const [notifSwaps, setNotifSwaps] = useState(true);
  const [notifMeetups, setNotifMeetups] = useState(true);
  const [notifPriceDrops, setNotifPriceDrops] = useState(true);
  const [notifWanted, setNotifWanted] = useState(true);
  const [notifSystem, setNotifSystem] = useState(true);

  // Privacy settings
  const [showCampus, setShowCampus] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [profilePublic, setProfilePublic] = useState(true);

  // Keep input fields synchronized whenever currentUser updates
  useEffect(() => {
    if (currentUser) {
      setNameInput(currentUser.name || '');
      setBioInput(currentUser.bio || '');
      setAvatarInput(currentUser.avatar || '');
      setCollegeInput(currentUser.college || 'CCS');
      setYearLevelInput(currentUser.yearLevel || '2nd Year College');
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="container page-enter" style={{ padding: '5rem 1.5rem', textAlign: 'center', maxWidth: '520px' }}>
        <div className="clean-card" style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', color: 'var(--uc-blue, #002B7F)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SettingsIcon size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)' }}>
              Sign In Required for Settings
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted, #64748B)', marginTop: '0.35rem', lineHeight: 1.5 }}>
              Please log in with your University of Cebu student account to access account settings, notification controls, and privacy preferences.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
            <button
              onClick={() => {
                if (onOpenAuth) onOpenAuth();
                else onNavigate('home');
              }}
              className="btn-gold"
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.88rem', fontWeight: 800 }}
            >
              Sign In to TradeLink
            </button>
            <button
              onClick={() => onNavigate('marketplace')}
              className="btn-secondary"
              style={{ padding: '0.75rem 1.25rem', fontSize: '0.88rem', fontWeight: 700 }}
            >
              Browse Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      updateProfile({
        name: nameInput.trim(),
        bio: bioInput.trim(),
        avatar: avatarInput.trim(),
        college: collegeInput,
        yearLevel: yearLevelInput
      });
      showToast('Settings Saved', 'Your student account details have been updated.', 'success');
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Logged Out', 'You have been logged out of your session.', 'info');
    onNavigate('home');
  };

  const sections = [
    { id: 'account' as const, label: 'Account Profile', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield },
    { id: 'data' as const, label: 'Session & Data', icon: Trash2 }
  ];

  const ToggleSwitch = ({ on, onToggle, label, description }: { on: boolean; onToggle: () => void; label: string; description?: string }) => (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: '1px solid var(--border-subtle, #E2E8F0)' }}
    >
      <div>
        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary, #0F172A)' }}>{label}</div>
        {description && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748B)', marginTop: '2px' }}>{description}</div>}
      </div>
      <button
        type="button"
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', color: on ? 'var(--accent-green, #10B981)' : 'var(--text-muted, #94A3B8)', cursor: 'pointer', background: 'none', border: 'none', padding: '4px' }}
        aria-label={`Toggle ${label}`}
      >
        {on ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
      </button>
    </div>
  );

  return (
    <div className="container page-enter" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-header-eyebrow">
            <SettingsIcon size={14} style={{ flexShrink: 0 }} /> Student Preferences
          </div>
          <h1 className="page-header-title" style={{ marginTop: '0.2rem' }}>
            Account Settings
          </h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* Sidebar Nav */}
        <div className="clean-card" style={{ padding: '0.75rem', height: 'fit-content' }}>
          {/* User Mini Summary */}
          {currentUser && (
            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle, #E2E8F0)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <UserAvatar src={currentUser.avatar} name={currentUser.name} size="md" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748B)' }}>
                  {currentUser.campus} • ID: {currentUser.studentId}
                </div>
              </div>
            </div>
          )}

          <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`sidebar-nav-item ${activeSection === s.id ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: activeSection === s.id ? 800 : 600,
                  backgroundColor: activeSection === s.id ? 'var(--uc-blue-subtle, #EBF1FC)' : 'transparent',
                  color: activeSection === s.id ? 'var(--uc-blue, #002B7F)' : 'var(--text-secondary, #475569)',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <s.icon size={16} />
                <span>{s.label}</span>
              </button>
            ))}
          </nav>

          <hr className="divider" style={{ margin: '0.75rem 0', border: 'none', borderTop: '1px solid var(--border-subtle, #E2E8F0)' }} />

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 700,
              color: 'var(--accent-red, #DC2626)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left'
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="clean-card" style={{ padding: '1.75rem', minWidth: 0 }}>
          {/* 1. ACCOUNT PROFILE */}
          {activeSection === 'account' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)' }}>Student Account Profile</h3>
                <p className="form-helper" style={{ marginTop: '0.2rem', fontSize: '0.8rem', color: 'var(--text-muted, #64748B)' }}>
                  Manage your public display name, biography, and academic department.
                </p>
              </div>

              {/* Profile Avatar Card */}
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle, #F8FAFC)', borderRadius: '12px', border: '1px solid var(--border-subtle, #E2E8F0)', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                <UserAvatar src={avatarInput} name={nameInput || currentUser?.name || 'Student'} size="lg" />
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>Profile Photo & Initials</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {avatarInput ? 'Custom image provided' : 'Defaulting to your name initials on UC Blue/Gold branding'}
                  </div>
                  {avatarInput ? (
                    <button
                      type="button"
                      onClick={() => setAvatarInput('')}
                      style={{
                        marginTop: '0.4rem',
                        fontSize: '0.74rem',
                        color: 'var(--accent-red, #DC2626)',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                    >
                      Clear Photo & Use Name Initials
                    </button>
                  ) : (
                    <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--accent-green, #059669)', fontWeight: 700 }}>
                      ✓ Dynamic Name Initials Active
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="clean-input"
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Student Bio
                </label>
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  rows={3}
                  placeholder="Tell campus peers what books, gear, or supplies you trade..."
                  className="clean-input"
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Profile Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={avatarInput}
                  onChange={(e) => setAvatarInput(e.target.value)}
                  placeholder="https://... (Leave blank to use your name initials)"
                  className="clean-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Department / College
                  </label>
                  <select
                    value={collegeInput}
                    onChange={(e: any) => setCollegeInput(e.target.value)}
                    className="clean-input"
                  >
                    <option value="CCS">CCS (Computer Studies)</option>
                    <option value="CBA">CBA (Business & Accountancy)</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Nursing">Nursing</option>
                    <option value="Maritime">Maritime</option>
                    <option value="Criminology">Criminology</option>
                    <option value="Arts & Sciences">Arts & Sciences</option>
                    <option value="Education">Education</option>
                    <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Law">Law</option>
                    <option value="Senior High (STEM)">Senior High (STEM)</option>
                    <option value="Senior High (ABM)">Senior High (ABM)</option>
                    <option value="Senior High (HUMSS)">Senior High (HUMSS)</option>
                    <option value="Senior High (TVL/GAS)">Senior High (TVL/GAS)</option>
                    <option value="Junior High School">Junior High School</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Year Level
                  </label>
                  <select
                    value={yearLevelInput}
                    onChange={(e) => setYearLevelInput(e.target.value)}
                    className="clean-input"
                  >
                    <option value="1st Year College">1st Year College</option>
                    <option value="2nd Year College">2nd Year College</option>
                    <option value="3rd Year College">3rd Year College</option>
                    <option value="4th Year College">4th Year College</option>
                    <option value="5th Year College">5th Year College</option>
                    <option value="Grade 11 (Senior High)">Grade 11 (Senior High)</option>
                    <option value="Grade 12 (Senior High)">Grade 12 (Senior High)</option>
                    <option value="Junior High">Junior High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Enrolled UC Campus
                </label>
                <input
                  type="text"
                  value={currentUser?.campus || 'UC Main'}
                  disabled
                  className="clean-input disabled"
                  style={{ opacity: 0.8, backgroundColor: 'var(--bg-subtle, #F1F5F9)' }}
                />
                <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                  Campus affiliation is verified with your official University of Cebu student ID number.
                </span>
              </div>

              <button type="submit" className="btn-primary" style={{ width: 'fit-content', marginTop: '0.5rem', padding: '0.6rem 1.35rem' }}>
                <Save size={15} /> Save Changes
              </button>
            </form>
          )}

          {/* 2. NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Notification Preferences</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Choose what alerts you receive via in-app notifications.</p>
              <ToggleSwitch on={notifSwaps} onToggle={() => setNotifSwaps(!notifSwaps)} label="Swap Proposals & Offers" description="Instant notifications when peers offer barter trades for your items" />
              <ToggleSwitch on={notifMeetups} onToggle={() => setNotifMeetups(!notifMeetups)} label="Meetup Schedule Reminders" description="Alerts for scheduled campus handshakes and 4-digit verification codes" />
              <ToggleSwitch on={notifPriceDrops} onToggle={() => setNotifPriceDrops(!notifPriceDrops)} label="Saved Item Price Drops" description="Get notified when bookmarked items have their price reduced" />
              <ToggleSwitch on={notifWanted} onToggle={() => setNotifWanted(!notifWanted)} label="Wanted Board Item Matches" description="Alerts when items matching your requested wanted items are posted" />
              <ToggleSwitch on={notifSystem} onToggle={() => setNotifSystem(!notifSystem)} label="Campus Safety & System Alerts" description="Official University of Cebu safety and platform announcements" />
            </div>
          )}

          {/* 3. PRIVACY */}
          {activeSection === 'privacy' && (
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Privacy Settings</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Control what other UC students can see on your profile and listings.</p>
              <ToggleSwitch on={profilePublic} onToggle={() => setProfilePublic(!profilePublic)} label="Public Student Profile" description="Allow classmates to view your active items and campus trade reviews" />
              <ToggleSwitch on={showCampus} onToggle={() => setShowCampus(!showCampus)} label="Show Campus Badge on Listings" description="Display your UC campus location badge on item cards" />
              <ToggleSwitch on={showOnline} onToggle={() => setShowOnline(!showOnline)} label="Show Active Indicator" description="Display online green dot when you are active on TradeLink" />
            </div>
          )}

          {/* 4. SESSION & DATA */}
          {activeSection === 'data' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Session & Cloud Data</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Manage your active login session and platform preferences.
                </p>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', borderRadius: '10px', border: '1px solid var(--uc-blue-border, #BCD1F7)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle size={20} color="var(--uc-blue, #002B7F)" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: '0.82rem', color: 'var(--uc-blue, #002B7F)', lineHeight: 1.5, margin: 0 }}>
                  All your listings, chats, and trade histories are securely saved in the cloud database. Signing out clears your active browser session token safely.
                </p>
              </div>

              {!showLogoutConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="btn-danger"
                  style={{ width: 'fit-content', padding: '0.6rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <LogOut size={15} /> Sign Out of All Sessions
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', border: '1.5px solid var(--accent-red, #DC2626)', borderRadius: '12px', backgroundColor: 'var(--accent-red-subtle, #FEF2F2)' }}>
                  <p style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--accent-red, #DC2626)', margin: 0 }}>
                    Are you sure you want to sign out? You will need your UC credentials to log back in.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={handleLogout} className="btn-danger" style={{ padding: '0.5rem 1rem' }}>
                      Yes, Sign Out
                    </button>
                    <button type="button" onClick={() => setShowLogoutConfirm(false)} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
