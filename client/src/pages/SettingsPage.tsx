import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Save,
  ToggleLeft,
  ToggleRight,
  MapPin,
  LogOut
} from 'lucide-react';

interface SettingsPageProps {
  onNavigate: (view: string, param?: any) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { currentUser, updateProfile, logout, resetAllData } = useAuth();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState<'account' | 'notifications' | 'privacy' | 'data'>('account');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Account settings
  const [nameInput, setNameInput] = useState(currentUser?.name || '');
  const [emailInput, setEmailInput] = useState(currentUser?.email || '');

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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      updateProfile({ name: nameInput.trim(), email: emailInput.trim() });
      showToast('Settings Saved', 'Your account details have been updated.', 'success');
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Logged Out', 'You have been logged out.', 'info');
    onNavigate('home');
  };

  const sections = [
    { id: 'account' as const, label: 'Account', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield },
    { id: 'data' as const, label: 'Data & Storage', icon: Trash2 }
  ];

  const ToggleSwitch = ({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) => (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: '1px solid var(--border-subtle)' }}
    >
      <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
      <button
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', color: on ? 'var(--accent-green)' : 'var(--text-subtle)', cursor: 'pointer', background: 'none', border: 'none' }}
      >
        {on ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
      </button>
    </div>
  );

  return (
    <div className="container page-enter" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-header-eyebrow">
            <SettingsIcon size={14} style={{ flexShrink: 0 }} /> Preferences
          </div>
          <h1 className="page-header-title" style={{ marginTop: '0.2rem' }}>
            Settings
          </h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem' }}>
        {/* Sidebar */}
        <div className="clean-card" style={{ padding: '0.75rem', height: 'fit-content' }}>
          <nav className="sidebar-nav">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`sidebar-nav-item ${activeSection === s.id ? 'active' : ''}`}
              >
                <s.icon size={16} />
                <span>{s.label}</span>
              </button>
            ))}
          </nav>

          <hr className="divider" />

          <button onClick={handleLogout} className="sidebar-nav-item" style={{ color: 'var(--accent-red)' }}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="clean-card" style={{ padding: '1.75rem' }}>
          {/* ACCOUNT SETTINGS */}
          {activeSection === 'account' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Account Profile</h3>
              <p className="form-helper" style={{ marginTop: '-0.75rem' }}>Manage your public display name and campus verification email.</p>

              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="clean-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="clean-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Campus</label>
                <input
                  type="text"
                  value={currentUser?.campus || 'UC Main'}
                  disabled
                  className="clean-input disabled"
                />
                <span className="form-helper">Campus affiliation is tied to your verified student record.</span>
              </div>

              <button type="submit" className="btn-primary" style={{ width: 'fit-content', marginTop: '0.5rem' }}>
                <Save size={14} /> Save Changes
              </button>
            </form>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Notification Preferences</h3>
              <p className="form-helper" style={{ marginBottom: '1rem' }}>Choose what alerts you receive via in-app notifications.</p>
              <ToggleSwitch on={notifSwaps} onToggle={() => setNotifSwaps(!notifSwaps)} label="Swap Proposals & Offers" />
              <ToggleSwitch on={notifMeetups} onToggle={() => setNotifMeetups(!notifMeetups)} label="Meetup Schedule Reminders" />
              <ToggleSwitch on={notifPriceDrops} onToggle={() => setNotifPriceDrops(!notifPriceDrops)} label="Saved Item Price Drops" />
              <ToggleSwitch on={notifWanted} onToggle={() => setNotifWanted(!notifWanted)} label="Wanted Board Item Matches" />
              <ToggleSwitch on={notifSystem} onToggle={() => setNotifSystem(!notifSystem)} label="Campus Safety & System Alerts" />
            </div>
          )}

          {/* PRIVACY */}
          {activeSection === 'privacy' && (
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Privacy Settings</h3>
              <p className="form-helper" style={{ marginBottom: '1rem' }}>Control what other students can see about you.</p>
              <ToggleSwitch on={profilePublic} onToggle={() => setProfilePublic(!profilePublic)} label="Public Profile" />
              <ToggleSwitch on={showCampus} onToggle={() => setShowCampus(!showCampus)} label="Show Campus on Listings" />
              <ToggleSwitch on={showOnline} onToggle={() => setShowOnline(!showOnline)} label="Show Online Status" />
            </div>
          )}

          {/* DATA & STORAGE */}
          {activeSection === 'data' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Data & Storage</h3>
              <p className="form-helper">Manage your local data and cache.</p>

              <div className="card-highlight" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle size={18} color="var(--uc-blue)" />
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  TradeLink stores all data locally in your browser. Clearing data will reset the entire app to its default state.
                </p>
              </div>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn-danger"
                  style={{ width: 'fit-content' }}
                >
                  <Trash2 size={14} /> Reset All Data
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', border: '2px solid var(--accent-red)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--accent-red-subtle)' }}>
                  <p style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--accent-red)' }}>
                    ⚠️ Are you sure? This will delete all listings, conversations, and user data.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={resetAllData} className="btn-danger">
                      Yes, Reset Everything
                    </button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">
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
