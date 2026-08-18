import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useChat } from '../context/ChatContext';
import { useWanted } from '../context/WantedContext';
import { useToast } from '../components/common/Toast';
import { User, SuperAdminConfig, FeatureFlag } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Settings,
  BarChart3,
  Database,
  Flag,
  Crown,
  Activity,
  Power,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  UserMinus,
  Download,
  Trash2,
  RefreshCw,
  Save,
  Eye,
  LogOut,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Zap,
  TrendingUp,
  Package,
  MessageSquare,
  ArrowLeftRight,
  HandshakeIcon
} from 'lucide-react';

interface SuperAdminDashboardProps {
  onNavigate: (view: string, param?: any) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate }) => {
  const {
    verificationRequests,
    flaggedListings,
    announcements,
    auditLogs,
    prohibitedKeywords,
    disputes,
    systemConfig,
    pendingVerificationsCount,
    pendingFlagsCount,
    pendingDisputesCount,
    updateSystemConfig,
    promoteToAdmin,
    demoteAdmin
  } = useAdmin();

  const { allUsers, currentUser, logout, isSuperAdmin, resetAllData } = useAuth();
  const { listings } = useMarket();
  const { requests: wantedRequests } = useWanted();
  const { meetups, swaps } = useChat();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'admins' | 'campus' | 'config' | 'flags' | 'activity' | 'data'
  >('overview');

  // System config form state
  const [configDraft, setConfigDraft] = useState<SuperAdminConfig>(systemConfig);

  const students = allUsers.filter((u) => u.role === 'student');
  const admins = allUsers.filter((u) => u.role === 'admin');
  const superAdmins = allUsers.filter((u) => u.role === 'superadmin');
  const totalTrades = meetups.filter((m) => m.status === 'completed').length;
  const activeListings = listings.filter((l) => !l.isSold).length;
  const bannedUsers = allUsers.filter((u) => u.isBanned).length;

  const tabs = [
    { id: 'overview', label: 'System Overview', icon: <BarChart3 size={16} /> },
    { id: 'admins', label: 'Admin Management', icon: <Crown size={16} /> },
    { id: 'config', label: 'System Config', icon: <Settings size={16} /> },
    { id: 'flags', label: 'Feature Flags', icon: <Flag size={16} /> },
    { id: 'activity', label: 'Activity Monitor', icon: <Activity size={16} /> },
    { id: 'data', label: 'Data Management', icon: <Database size={16} /> },
  ];

  const handleSaveConfig = () => {
    updateSystemConfig(configDraft);
    showToast('Config Saved', 'System configuration updated successfully.', 'success');
  };

  const handleToggleFlag = (flagId: string) => {
    const updatedFlags = configDraft.featureFlags.map((f) =>
      f.id === flagId ? { ...f, enabled: !f.enabled, updatedAt: new Date().toISOString() } : f
    );
    const newConfig = { ...configDraft, featureFlags: updatedFlags };
    setConfigDraft(newConfig);
    updateSystemConfig({ featureFlags: updatedFlags });
    showToast('Flag Toggled', `Feature flag updated.`, 'info');
  };

  const handlePromote = (userId: string) => {
    promoteToAdmin(userId);
    showToast('User Promoted', 'User has been promoted to Admin.', 'success');
  };

  const handleDemote = (userId: string) => {
    demoteAdmin(userId);
    showToast('Admin Demoted', 'Admin has been demoted to Student.', 'info');
  };

  const handleExportData = () => {
    const data = {
      users: allUsers,
      listings,
      meetups,
      swaps,
      wantedRequests,
      verificationRequests,
      flaggedListings,
      announcements,
      auditLogs,
      disputes,
      systemConfig,
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser?.name
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradelink-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data Exported', 'Full platform data exported as JSON.', 'success');
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  };

  const statCardStyle = (color: string, bg: string): React.CSSProperties => ({
    backgroundColor: bg,
    border: `1px solid ${color}20`,
    borderRadius: '14px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  });

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 50%, #DC2626 100%)',
        borderRadius: '16px',
        padding: '2rem',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'rgba(255,255,255,0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)'
          }}>
            <Crown size={28} color="#FFC72C" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
              Super Administration Console
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.15rem' }}>
              Full platform control • {allUsers.length} users • {listings.length} listings • All 8 campuses
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            backgroundColor: 'rgba(255, 199, 44, 0.15)', color: '#FFC72C',
            border: '1px solid rgba(255, 199, 44, 0.4)',
            padding: '0.35rem 0.75rem', borderRadius: '8px',
            fontSize: '0.78rem', fontWeight: 800
          }}>
            <ShieldCheck size={14} /> SUPER ADMIN
          </div>
          <button
            onClick={() => { logout(); showToast('Logged Out', 'Super Admin session ended.', 'info'); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '0.35rem 0.75rem', borderRadius: '8px',
              fontSize: '0.78rem', fontWeight: 700
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex', gap: '0.5rem', overflowX: 'auto',
        paddingBottom: '4px', borderBottom: '2px solid #F1F5F9'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.65rem 1.15rem', borderRadius: '10px 10px 0 0',
              fontSize: '0.82rem', fontWeight: activeTab === tab.id ? 800 : 600,
              color: activeTab === tab.id ? '#DC2626' : '#64748B',
              backgroundColor: activeTab === tab.id ? '#FEF2F2' : 'transparent',
              borderBottom: activeTab === tab.id ? '2px solid #DC2626' : '2px solid transparent',
              whiteSpace: 'nowrap', transition: 'all 0.15s ease',
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'inline-flex', flexShrink: 0 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={statCardStyle('#002B7F', '#EBF1FC')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#002B7F" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#002B7F', textTransform: 'uppercase' }}>Total Users</span>
              </div>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#002B7F', fontFamily: 'var(--font-display)' }}>{allUsers.length}</span>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{students.length} students • {admins.length} admins • {superAdmins.length} super</span>
            </div>

            <div style={statCardStyle('#059669', '#ECFDF5')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={20} color="#059669" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Active Listings</span>
              </div>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-display)' }}>{activeListings}</span>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{listings.filter(l => l.isSold).length} sold</span>
            </div>

            <div style={statCardStyle('#D97706', '#FFFBEB')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HandshakeIcon size={20} color="#D97706" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>Completed Trades</span>
              </div>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#D97706', fontFamily: 'var(--font-display)' }}>{totalTrades}</span>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{meetups.filter(m => m.status === 'scheduled').length} pending</span>
            </div>

            <div style={statCardStyle('#DC2626', '#FEF2F2')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} color="#DC2626" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>Action Items</span>
              </div>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#DC2626', fontFamily: 'var(--font-display)' }}>
                {pendingVerificationsCount + pendingFlagsCount + pendingDisputesCount}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                {pendingVerificationsCount} KYC • {pendingFlagsCount} flags • {pendingDisputesCount} disputes
              </span>
            </div>

            <div style={statCardStyle('#7C3AED', '#F5F3FF')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeftRight size={20} color="#7C3AED" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase' }}>Active Swaps</span>
              </div>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#7C3AED', fontFamily: 'var(--font-display)' }}>
                {swaps.filter(s => s.status === 'pending').length}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{swaps.length} total swap proposals</span>
            </div>

            <div style={statCardStyle('#0891B2', '#ECFEFF')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} color="#0891B2" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0891B2', textTransform: 'uppercase' }}>Banned</span>
              </div>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0891B2', fontFamily: 'var(--font-display)' }}>{bannedUsers}</span>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>suspended accounts</span>
            </div>
          </div>

          {/* System Status */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="#DC2626" /> System Status
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '10px', backgroundColor: systemConfig.maintenanceMode ? '#FEF2F2' : '#ECFDF5' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: systemConfig.maintenanceMode ? '#DC2626' : '#059669' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                  {systemConfig.maintenanceMode ? 'Maintenance Mode ON' : 'Platform Online'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '10px', backgroundColor: '#EBF1FC' }}>
                <Building2 size={16} color="#002B7F" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#002B7F' }}>8 Campuses Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '10px', backgroundColor: '#FFFBEB' }}>
                <Zap size={16} color="#D97706" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#D97706' }}>
                  {systemConfig.featureFlags.filter(f => f.enabled).length}/{systemConfig.featureFlags.length} Features Active
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Management Tab */}
      {activeTab === 'admins' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Current Admins */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Crown size={18} color="#DC2626" /> Active Administrators ({admins.length + superAdmins.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...superAdmins, ...admins].map((admin) => (
                <div
                  key={admin.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1rem', borderRadius: '12px', backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={admin.avatar}
                      alt={admin.name}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: admin.role === 'superadmin' ? '2px solid #DC2626' : '2px solid #002B7F' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {admin.name}
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '4px',
                          backgroundColor: admin.role === 'superadmin' ? '#DC2626' : '#002B7F',
                          color: '#FFFFFF', textTransform: 'uppercase'
                        }}>
                          {admin.role === 'superadmin' ? 'SUPER' : 'ADMIN'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{admin.email} • {admin.campus}</div>
                    </div>
                  </div>
                  {admin.role === 'admin' && admin.id !== currentUser?.id && (
                    <button
                      onClick={() => handleDemote(admin.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.4rem 0.85rem', borderRadius: '8px',
                        fontSize: '0.78rem', fontWeight: 700,
                        backgroundColor: '#FEF2F2', color: '#DC2626',
                        border: '1px solid #FECACA'
                      }}
                    >
                      <UserMinus size={14} /> Demote
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Promote Students */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={18} color="#059669" /> Promote Student to Admin
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '400px', overflowY: 'auto' }}>
              {students.filter(s => !s.isBanned && s.isVerified).length === 0 && (
                <p style={{ fontSize: '0.85rem', color: '#64748B', textAlign: 'center', padding: '2rem 0' }}>
                  No eligible verified students to promote.
                </p>
              )}
              {students.filter(s => !s.isBanned && s.isVerified).map((student) => (
                <div
                  key={student.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.85rem', borderRadius: '10px',
                    border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <img src={student.avatar} alt={student.name} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{student.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{student.campus} • {student.college} • Trust: {student.trustScore}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePromote(student.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.4rem 0.85rem', borderRadius: '8px',
                      fontSize: '0.78rem', fontWeight: 700,
                      backgroundColor: '#ECFDF5', color: '#059669',
                      border: '1px solid #A7F3D0'
                    }}
                  >
                    <UserPlus size={14} /> Promote
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Configuration Tab */}
      {activeTab === 'config' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={18} color="#DC2626" /> Platform Configuration
            </h3>
            <button
              onClick={handleSaveConfig}
              className="btn-primary"
              style={{ padding: '0.5rem 1.15rem', fontSize: '0.82rem', backgroundColor: '#DC2626' }}
            >
              <Save size={14} /> Save Changes
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Maintenance Mode */}
            <div style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: configDraft.maintenanceMode ? '#FEF2F2' : '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Maintenance Mode</span>
                <button
                  onClick={() => setConfigDraft(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                  style={{ color: configDraft.maintenanceMode ? '#DC2626' : '#059669' }}
                >
                  {configDraft.maintenanceMode ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748B' }}>
                When enabled, students see a maintenance page. Admins can still access the platform.
              </p>
            </div>

            {/* Max Listing Price */}
            <div style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>
                Max Listing Price (₱)
              </label>
              <input
                type="number"
                value={configDraft.maxListingPrice}
                onChange={(e) => setConfigDraft(prev => ({ ...prev, maxListingPrice: parseInt(e.target.value) || 0 }))}
                className="clean-input"
                style={{ maxWidth: '200px' }}
              />
            </div>

            {/* Max Images */}
            <div style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>
                Max Images Per Listing
              </label>
              <input
                type="number"
                value={configDraft.maxImagesPerListing}
                onChange={(e) => setConfigDraft(prev => ({ ...prev, maxImagesPerListing: parseInt(e.target.value) || 1 }))}
                className="clean-input"
                style={{ maxWidth: '200px' }}
              />
            </div>

            {/* Max Listings Per User */}
            <div style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>
                Max Listings Per User
              </label>
              <input
                type="number"
                value={configDraft.maxListingsPerUser}
                onChange={(e) => setConfigDraft(prev => ({ ...prev, maxListingsPerUser: parseInt(e.target.value) || 1 }))}
                className="clean-input"
                style={{ maxWidth: '200px' }}
              />
            </div>

            {/* Swap Mode Toggle */}
            <div style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Swap Mode</span>
                <button
                  onClick={() => setConfigDraft(prev => ({ ...prev, swapModeEnabled: !prev.swapModeEnabled }))}
                  style={{ color: configDraft.swapModeEnabled ? '#059669' : '#DC2626' }}
                >
                  {configDraft.swapModeEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748B' }}>Allow item-for-item swap proposals</p>
            </div>

            {/* Wanted Board Toggle */}
            <div style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Wanted Board</span>
                <button
                  onClick={() => setConfigDraft(prev => ({ ...prev, wantedBoardEnabled: !prev.wantedBoardEnabled }))}
                  style={{ color: configDraft.wantedBoardEnabled ? '#059669' : '#DC2626' }}
                >
                  {configDraft.wantedBoardEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748B' }}>Enable student wanted/request board</p>
            </div>

            {/* Free Donation Toggle */}
            <div style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Free Donations</span>
                <button
                  onClick={() => setConfigDraft(prev => ({ ...prev, freeDonationEnabled: !prev.freeDonationEnabled }))}
                  style={{ color: configDraft.freeDonationEnabled ? '#059669' : '#DC2626' }}
                >
                  {configDraft.freeDonationEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748B' }}>Allow free item donation listings</p>
            </div>
          </div>
        </div>
      )}

      {/* Feature Flags Tab */}
      {activeTab === 'flags' && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flag size={18} color="#DC2626" /> Feature Flags
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {systemConfig.featureFlags.map((flag) => (
              <div
                key={flag.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem 1.25rem', borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: flag.enabled ? '#ECFDF5' : '#F8FAFC',
                  flexWrap: 'wrap', gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {flag.name}
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px',
                      backgroundColor: flag.enabled ? '#059669' : '#94A3B8', color: '#FFFFFF'
                    }}>
                      {flag.enabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.15rem' }}>{flag.description}</p>
                </div>
                <button
                  onClick={() => handleToggleFlag(flag.id)}
                  style={{ color: flag.enabled ? '#059669' : '#94A3B8' }}
                >
                  {flag.enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Monitor Tab */}
      {activeTab === 'activity' && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="#DC2626" /> All Admin Activity ({auditLogs.length} actions)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto' }}>
            {auditLogs.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: '#64748B', textAlign: 'center', padding: '2rem 0' }}>
                No admin activity recorded yet.
              </p>
            )}
            {auditLogs.slice(0, 50).map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                  padding: '0.85rem 1rem', borderRadius: '10px',
                  border: '1px solid #F1F5F9', backgroundColor: '#FAFAFA'
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  backgroundColor: '#EBF1FC', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Eye size={16} color="#002B7F" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#002B7F' }}>{log.adminName}</span>
                    <span style={{ color: '#94A3B8' }}>•</span>
                    <span>{log.action}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.1rem' }}>{log.details}</p>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={11} />
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem',
                  borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#475569',
                  whiteSpace: 'nowrap', flexShrink: 0
                }}>
                  {log.targetType}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Management Tab */}
      {activeTab === 'data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} color="#DC2626" /> Data Management
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {/* Export */}
              <div style={{
                padding: '1.5rem', borderRadius: '14px',
                border: '1px solid #A7F3D0', backgroundColor: '#ECFDF5',
                display: 'flex', flexDirection: 'column', gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Download size={22} color="#059669" />
                  <h4 style={{ fontWeight: 800, fontSize: '1rem', color: '#059669' }}>Export All Data</h4>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                  Download the entire platform dataset (users, listings, meetups, swaps, audit logs) as a JSON file.
                </p>
                <button
                  onClick={handleExportData}
                  className="btn-primary"
                  style={{ backgroundColor: '#059669', alignSelf: 'flex-start', padding: '0.5rem 1.15rem', fontSize: '0.82rem' }}
                >
                  <Download size={14} /> Export JSON
                </button>
              </div>

              {/* Reset */}
              <div style={{
                padding: '1.5rem', borderRadius: '14px',
                border: '1px solid #FECACA', backgroundColor: '#FEF2F2',
                display: 'flex', flexDirection: 'column', gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trash2 size={22} color="#DC2626" />
                  <h4 style={{ fontWeight: 800, fontSize: '1rem', color: '#DC2626' }}>Reset All Data</h4>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                  Wipe all localStorage data and reload the app with fresh seed data. This action is irreversible.
                </p>
                <button
                  onClick={() => {
                    if (confirm('⚠️ This will DELETE all data and reset to defaults. Are you sure?')) {
                      resetAllData();
                    }
                  }}
                  style={{
                    alignSelf: 'flex-start', padding: '0.5rem 1.15rem', fontSize: '0.82rem',
                    fontWeight: 700, backgroundColor: '#DC2626', color: '#FFFFFF', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', gap: '0.35rem'
                  }}
                >
                  <Trash2 size={14} /> Reset Everything
                </button>
              </div>

              {/* Refresh Seed */}
              <div style={{
                padding: '1.5rem', borderRadius: '14px',
                border: '1px solid #BCD1F7', backgroundColor: '#EBF1FC',
                display: 'flex', flexDirection: 'column', gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw size={22} color="#002B7F" />
                  <h4 style={{ fontWeight: 800, fontSize: '1rem', color: '#002B7F' }}>Re-seed Demo Data</h4>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                  Clear all data and inject fresh demo users, listings, and transactions for testing.
                </p>
                <button
                  onClick={() => {
                    if (confirm('This will reset all data to demo defaults. Continue?')) {
                      resetAllData();
                    }
                  }}
                  className="btn-primary"
                  style={{ alignSelf: 'flex-start', padding: '0.5rem 1.15rem', fontSize: '0.82rem' }}
                >
                  <RefreshCw size={14} /> Re-seed Data
                </button>
              </div>
            </div>
          </div>

          {/* Data Summary */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Storage Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
              {[
                { label: 'Users', count: allUsers.length },
                { label: 'Listings', count: listings.length },
                { label: 'Meetups', count: meetups.length },
                { label: 'Swaps', count: swaps.length },
                { label: 'Wanted Posts', count: wantedRequests.length },
                { label: 'Verifications', count: verificationRequests.length },
                { label: 'Flags', count: flaggedListings.length },
                { label: 'Announcements', count: announcements.length },
                { label: 'Audit Logs', count: auditLogs.length },
                { label: 'Disputes', count: disputes.length },
                { label: 'Keywords', count: prohibitedKeywords.length },
              ].map((item) => (
                <div key={item.label} style={{ padding: '0.85rem', borderRadius: '10px', border: '1px solid #F1F5F9', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#002B7F', fontFamily: 'var(--font-display)' }}>{item.count}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
