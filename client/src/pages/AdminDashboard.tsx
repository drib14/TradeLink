import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useWanted } from '../context/WantedContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/common/Toast';
import { VerificationRequest, User, Listing, Campus, TradeDispute } from '../types';
import { CAMPUS_MEETUP_SPOTS } from '../data/campusLocations';
import { Modal } from '../components/common/Modal';
import {
  ShieldAlert,
  ShieldCheck,
  UserX,
  UserCheck,
  AlertTriangle,
  Trash2,
  Check,
  X,
  Search,
  Megaphone,
  History,
  Eye,
  Flame,
  Zap,
  MapPin,
  Building2,
  BadgeCheck,
  TrendingUp,
  Plus,
  LogIn,
  LogOut,
  ArrowLeft,
  Download,
  Scale,
  Award,
  DollarSign,
  AlertCircle,
  Shield,
  Layers
} from 'lucide-react';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { CampusBadge } from '../components/common/CampusBadge';

interface AdminDashboardProps {
  onNavigate: (view: string, param?: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const {
    verificationRequests,
    flaggedListings,
    announcements,
    auditLogs,
    prohibitedKeywords,
    disputes,
    pendingVerificationsCount,
    pendingFlagsCount,
    pendingDisputesCount,
    approveVerification,
    rejectVerification,
    resolveFlag,
    removeListingByAdmin,
    boostListingByAdmin,
    banUserByAdmin,
    unbanUserByAdmin,
    warnUserByAdmin,
    toggleVerifyByAdmin,
    deleteUserByAdmin,
    createAnnouncement,
    deleteAnnouncement,
    toggleAnnouncement,
    removeWantedByAdmin,
    cancelMeetupByAdmin,
    completeMeetupByAdmin,
    addProhibitedKeyword,
    removeProhibitedKeyword,
    resolveDispute,
    adjustUserTrustScore
  } = useAdmin();

  const { allUsers, currentUser, login, logout, isAdmin } = useAuth();
  const { listings } = useMarket();
  const { requests: wantedRequests, deleteRequest: deleteWantedRequest } = useWanted();
  const { meetups } = useChat();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'verifications'
    | 'users'
    | 'listings'
    | 'disputes'
    | 'meetups'
    | 'audit'
  >('overview');

  // Admin gate login input state
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  // Search and filters
  const [userSearch, setUserSearch] = useState('');
  const [userCampusFilter, setUserCampusFilter] = useState<string>('All');
  const [verificationFilter, setVerificationFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  // Scanner Tool State
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Dispute Tool State
  const [selectedDispute, setSelectedDispute] = useState<TradeDispute | null>(null);
  const [disputeVerdictNote, setDisputeVerdictNote] = useState('');

  // Reputation Tool State
  const [repTargetUserId, setRepTargetUserId] = useState<string>(allUsers[0]?.id || '');
  const [repDelta, setRepDelta] = useState<number>(10);
  const [repReason, setRepReason] = useState<string>('Exemplary honest trading & punctuality');

  // Landmark Configurator State
  const [landmarkCampusFilter, setLandmarkCampusFilter] = useState<string>('All');
  const [activeLandmarks, setActiveLandmarks] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    CAMPUS_MEETUP_SPOTS.forEach((s) => (map[s.id] = true));
    return map;
  });

  // Audit Log Filters
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState<string>('');

  // Modals state
  const [inspectedImage, setInspectedImage] = useState<string | null>(null);
  const [banModalUser, setBanModalUser] = useState<User | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('');
  const [rejectReqModal, setRejectReqModal] = useState<VerificationRequest | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [isNewAnnModalOpen, setIsNewAnnModalOpen] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnMessage, setNewAnnMessage] = useState('');
  const [newAnnCampus, setNewAnnCampus] = useState<Campus | 'All'>('All');
  const [newAnnType, setNewAnnType] = useState<'info' | 'alert' | 'event'>('info');

  const pendingRequests = verificationRequests.filter((r) => r.status === 'pending');
  const pendingFlags = flaggedListings.filter((f) => f.status === 'pending');
  const bannedUsers = allUsers.filter((u) => u.isBanned);

  const handleAdminGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmailInput.trim() || !adminPasswordInput.trim()) {
      showToast('Input Required', 'Please enter your administrator ID/email and password.', 'warning');
      return;
    }
    const res = login(adminEmailInput, adminPasswordInput);
    if (res.success) {
      showToast('Admin Authorized', res.message, 'success');
    } else {
      showToast('Access Denied', res.message, 'error');
    }
  };

  // If user is not authenticated as admin, show the official Admin Access Gate
  if (!isAdmin) {
    return (
      <div className="container" style={{ padding: '3.5rem 1.5rem 6rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '75vh' }}>
        <div
          className="clean-card"
          style={{
            maxWidth: '480px',
            width: '100%',
            padding: '2.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            border: '2px solid #BCD1F7',
            boxShadow: '0 20px 40px rgba(0, 43, 127, 0.12)'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: '#EBF1FC',
                border: '1.5px solid #BCD1F7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#002B7F'
              }}
            >
              <ShieldAlert size={30} />
            </div>

            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#002B7F', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', backgroundColor: '#EBF1FC', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                Restricted Access
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A', marginTop: '0.35rem', fontFamily: 'var(--font-display)' }}>
                Campus Moderation & Safety Desk
              </h1>
              <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.25rem' }}>
                Please authenticate with official University of Cebu Administrator credentials to access moderation tools, KYC queues, and safety escrows.
              </p>
            </div>
          </div>

          {/* Standard Secure Login Form */}
          <form onSubmit={handleAdminGateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                Administrator ID or Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  placeholder="e.g. admin@uc.edu.ph"
                  className="clean-input"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Enter administrator password"
                  className="clean-input"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '0.75rem', width: '100%', fontWeight: 800, fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginTop: '0.25rem' }}
            >
              <LogIn size={16} style={{ flexShrink: 0 }} />
              <span>Authenticate as Administrator</span>
            </button>
          </form>

          {/* Back button */}
          <div style={{ textAlign: 'center', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              style={{
                fontSize: '0.8rem',
                color: '#64748B',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={14} style={{ flexShrink: 0 }} />
              <span>Back to Student Marketplace</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User Actions
  const handleOpenBanModal = (user: User) => {
    setBanModalUser(user);
    setBanReasonInput('Violation of TradeLink Safety & Campus Community Guidelines');
  };

  const handleConfirmBan = () => {
    if (!banModalUser) return;
    banUserByAdmin(banModalUser.id, banReasonInput.trim() || 'Safety violation');
    showToast('User Suspended', `${banModalUser.name} has been banned from the platform.`, 'error');
    setBanModalUser(null);
  };

  const handleUnban = (user: User) => {
    unbanUserByAdmin(user.id);
    showToast('Access Restored', `${user.name}'s account has been unbanned.`, 'success');
  };

  const handleWarnUser = (user: User) => {
    warnUserByAdmin(user.id, 'Official warning: inappropriate conduct or listing violations.');
    showToast('Warning Sent', `Official warning recorded for ${user.name}. Trust score deducted.`, 'warning');
  };

  const handleToggleVerify = (user: User) => {
    toggleVerifyByAdmin(user.id);
    showToast('Verification Updated', `Toggled verification badge for ${user.name}.`, 'info');
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Permanently delete ${user.name}'s account? This action cannot be undone.`)) {
      deleteUserByAdmin(user.id);
      showToast('Account Deleted', `${user.name} was removed from the database.`, 'info');
    }
  };

  // Verification Actions
  const handleApproveVerification = (req: VerificationRequest) => {
    approveVerification(req.id);
    showToast('Verified Student', `${req.userName} has been verified with official badge.`, 'success');
  };

  const handleConfirmRejectVerification = () => {
    if (!rejectReqModal) return;
    rejectVerification(rejectReqModal.id, rejectReasonInput.trim() || 'Incomplete or unreadable photo');
    showToast('Request Declined', `Declined verification for ${rejectReqModal.userName}.`, 'info');
    setRejectReqModal(null);
  };

  // Listing Actions
  const handleResolveFlag = (flagId: string) => {
    resolveFlag(flagId);
    showToast('Flag Resolved', 'Listing marked as safe and compliant.', 'success');
  };

  const handleRemoveListing = (flagId: string, listingId: string, title: string) => {
    if (window.confirm(`Permanently take down and remove "${title}"?`)) {
      removeListingByAdmin(flagId, listingId, 'Removed by campus moderation team');
      showToast('Item Taken Down', `"${title}" has been deleted from the marketplace.`, 'info');
    }
  };

  const handleBoostListing = (listing: Listing) => {
    boostListingByAdmin(listing.id);
    showToast('Boost Updated', `Hero carousel boost toggled for "${listing.title}".`, 'success');
  };

  // Scanner Tool Actions
  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywordInput.trim()) return;
    addProhibitedKeyword(newKeywordInput.trim());
    showToast('Keyword Filter Added', `Added "${newKeywordInput.trim()}" to blacklist.`, 'success');
    setNewKeywordInput('');
  };

  const handleTriggerScanner = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      showToast('Scan Completed', `Analyzed ${listings.length} active listings across 8 campuses.`, 'info');
    }, 600);
  };

  // Scan Listings for Prohibited Keywords
  const scannedViolations = listings
    .map((item) => {
      const textToSearch = `${item.title} ${item.description} ${item.category} ${(item.tags || []).join(' ')}`.toLowerCase();
      const matched = prohibitedKeywords.filter((kw) => textToSearch.includes(kw.toLowerCase()));
      return {
        listing: item,
        matchedKeywords: matched,
        riskScore: matched.length >= 2 ? 'High Risk' : matched.length === 1 ? 'Medium Risk' : 'Clean'
      };
    })
    .filter((res) => res.matchedKeywords.length > 0);

  // Dispute Actions
  const handleConfirmDisputeVerdict = (action: 'refund' | 'warning' | 'dismissed' | 'ban') => {
    if (!selectedDispute) return;
    resolveDispute(selectedDispute.id, action, disputeVerdictNote.trim() || `Verdict rendered: ${action}`);
    showToast('Dispute Resolved', `Applied verdict: ${action.toUpperCase()}`, 'success');
    setSelectedDispute(null);
    setDisputeVerdictNote('');
  };

  // Reputation Adjustment Action
  const handleApplyTrustAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repTargetUserId) {
      showToast('Select User', 'Please choose a student to adjust.', 'warning');
      return;
    }
    adjustUserTrustScore(repTargetUserId, repDelta, repReason.trim() || 'Moderator trust adjustment');
    showToast('Trust Score Updated', `Score adjusted by ${repDelta >= 0 ? '+' : ''}${repDelta} points.`, 'success');
  };

  // Announcement Actions
  const handleCreateAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnMessage.trim()) {
      showToast('Missing Fields', 'Please enter a title and message.', 'warning');
      return;
    }
    createAnnouncement(newAnnTitle, newAnnMessage, newAnnCampus, newAnnType);
    showToast('Broadcast Published', 'Campus-wide announcement is now live.', 'success');
    setNewAnnTitle('');
    setNewAnnMessage('');
    setIsNewAnnModalOpen(false);
  };

  // Export Audit Trail to CSV
  const handleExportAuditCSV = () => {
    const headers = ['ID', 'Admin Name', 'Action', 'Target Type', 'Target ID', 'Details', 'Timestamp'];
    const rows = auditLogs.map((log) => [
      log.id,
      `"${log.adminName}"`,
      `"${log.action}"`,
      `"${log.targetType}"`,
      `"${log.targetId}"`,
      `"${log.details.replace(/"/g, '""')}"`,
      `"${log.timestamp}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UC_TradeLink_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Export Successful', 'Downloaded audit compliance report as CSV.', 'success');
  };

  // Filtered Users
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.studentId.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesCampus = userCampusFilter === 'All' || u.campus === userCampusFilter;
    return matchesSearch && matchesCampus;
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesType = auditTypeFilter === 'all' || log.targetType === auditTypeFilter;
    const matchesSearch =
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.adminName.toLowerCase().includes(auditSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 6rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#002B7F', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#EBF1FC', padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid #BCD1F7' }}>
            <ShieldAlert size={14} color="#002B7F" /> University of Cebu Moderation Desk
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0F172A', marginTop: '0.45rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            Campus Administration & Safety Center
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
              Logged in as: <strong style={{ color: '#002B7F' }}>{currentUser?.name || 'UC Admin Moderator'}</strong> ({currentUser?.email ? <code>{currentUser.email}</code> : 'Authenticated'})
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', backgroundColor: '#ECFDF5', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
              ● All 8 Campuses Moderation Active
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsNewAnnModalOpen(true)}
            className="btn-gold"
            style={{ padding: '0.55rem 1rem', fontSize: '0.82rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Megaphone size={14} />
            <span>Post Broadcast</span>
          </button>
          <button
            onClick={() => {
              logout();
              showToast('Signed Out', 'Signed out of administrator account.', 'info');
              onNavigate('home');
            }}
            style={{
              padding: '0.55rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <LogOut size={14} />
            <span>Exit Admin</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div
        className="touch-scroll-row"
        style={{
          backgroundColor: 'var(--bg-surface, #FFFFFF)',
          padding: '0.35rem',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle, #E2E8F0)',
          width: '100%',
          minWidth: 0
        }}
      >
        {[
          { id: 'overview', label: 'Overview', icon: <TrendingUp size={14} /> },
          { id: 'verifications', label: `ID Verifications (${pendingRequests.length})`, icon: <BadgeCheck size={14} /> },
          { id: 'users', label: `Users & Trust (${allUsers.length})`, icon: <UserCheck size={14} /> },
          { id: 'listings', label: `Listings & Flags (${pendingFlags.length})`, icon: <ShieldAlert size={14} /> },
          { id: 'disputes', label: `Trade Disputes (${pendingDisputesCount})`, icon: <Scale size={14} /> },
          { id: 'meetups', label: `Meetup Escrows (${meetups.length})`, icon: <MapPin size={14} /> },
          { id: 'audit', label: `Audit & Broadcasts (${auditLogs.length})`, icon: <History size={14} /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.55rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: isActive ? 800 : 600,
                backgroundColor: isActive ? 'var(--uc-blue)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                flexShrink: 0,
                cursor: 'pointer',
                border: 'none'
              }}
            >
              <span style={{ display: 'inline-flex', flexShrink: 0 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW & SYSTEM METRICS
          ========================================================================= */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Key Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
            <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Registered UCians</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#002B7F', fontFamily: 'var(--font-display)' }}>
                {allUsers.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                {allUsers.filter((u) => u.isVerified).length} Verified Students
              </span>
            </div>

            <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Listings</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#002B7F', fontFamily: 'var(--font-display)' }}>
                {listings.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 700 }}>
                {listings.filter((l) => l.tradeMode === 'swap').length} Swaps Available
              </span>
            </div>

            <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Pending ID Verifications</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: pendingRequests.length > 0 ? '#D97706' : '#059669', fontFamily: 'var(--font-display)' }}>
                {pendingRequests.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Awaiting moderator approval</span>
            </div>

            <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Reported / Flagged</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: pendingFlags.length > 0 ? '#DC2626' : '#059669', fontFamily: 'var(--font-display)' }}>
                {pendingFlags.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700 }}>Action required</span>
            </div>

            <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Trade Disputes</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: pendingDisputesCount > 0 ? '#D97706' : '#059669', fontFamily: 'var(--font-display)' }}>
                {pendingDisputesCount}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Mediation queue</span>
            </div>

            <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Suspended Accounts</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#DC2626', fontFamily: 'var(--font-display)' }}>
                {bannedUsers.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Restricted access</span>
            </div>
          </div>

          {/* Interactive Analytics & Trends Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.25rem' }}>
            {/* Chart 1: Trade Volume Trends */}
            <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <TrendingUp size={17} color="var(--uc-blue)" /> Campus Trade Volume & Velocity
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Monthly completed handshakes and barter trades</p>
                </div>
                <span className="badge-pill badge-green">+28.4% vs prev</span>
              </div>

              {/* Bar Chart Visual */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', gap: '0.75rem', paddingTop: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                {[
                  { month: 'Mar', val: 45, max: 100, gmv: '₱38k' },
                  { month: 'Apr', val: 62, max: 100, gmv: '₱54k' },
                  { month: 'May', val: 58, max: 100, gmv: '₱49k' },
                  { month: 'Jun', val: 84, max: 100, gmv: '₱76k' },
                  { month: 'Jul', val: 92, max: 100, gmv: '₱88k' },
                  { month: 'Aug', val: 100, max: 100, gmv: '₱112k', current: true },
                ].map((bar) => (
                  <div key={bar.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: bar.current ? 'var(--uc-blue)' : 'var(--text-muted)' }}>{bar.gmv}</span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '36px',
                        height: `${bar.val}%`,
                        borderRadius: '6px 6px 0 0',
                        background: bar.current
                          ? 'linear-gradient(180deg, var(--uc-blue) 0%, #1D4ED8 100%)'
                          : 'linear-gradient(180deg, var(--uc-gold) 0%, #F59E0B 100%)',
                        transition: 'height 0.4s ease'
                      }}
                      title={`${bar.month}: ${bar.gmv} volume (${bar.val} trades)`}
                    />
                    <span style={{ fontSize: '0.74rem', fontWeight: bar.current ? 800 : 600, color: bar.current ? 'var(--uc-blue)' : 'var(--text-secondary)' }}>{bar.month}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <span>Total GMV Exchanged: <strong style={{ color: 'var(--text-primary)' }}>₱417,000</strong></span>
                <span>Handshake Success Rate: <strong style={{ color: 'var(--accent-green)' }}>99.2%</strong></span>
              </div>
            </div>

            {/* Chart 2: Category Distribution Breakdown */}
            <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Layers size={17} color="#D97706" /> Trading Demand by Category
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{listings.length} Active Items</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'College Uniforms & Scrubs', percent: 34, color: 'var(--uc-blue)', count: '142 listings' },
                  { label: 'Electronics, Phones & Tabs', percent: 28, color: '#D97706', count: '118 listings' },
                  { label: 'Textbooks & SHS Modules', percent: 20, color: 'var(--accent-green)', count: '84 listings' },
                  { label: 'Footwear & Campus Fashion', percent: 12, color: '#8B5CF6', count: '50 listings' },
                  { label: 'STEM & Engineering Kits', percent: 6, color: '#EC4899', count: '26 listings' }
                ].map((cat) => (
                  <div key={cat.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cat.label}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{cat.count} ({cat.percent}%)</span>
                    </div>
                    <div className="progress-bar" style={{ height: '7px' }}>
                      <div style={{ width: `${cat.percent}%`, height: '100%', backgroundColor: cat.color, borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Campus Breakdown Table */}
          <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} color="var(--uc-blue)" /> 8 Official Campuses Trading Hub Distribution
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Campus Hub</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Registered Students</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Active Listings</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Wanted Requests</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Verification Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    'UC Main',
                    'UC Banilad',
                    'UC LM',
                    'UC METC',
                    'UC PRI',
                    'UC Pardo-Talisay',
                    'UC South Campus',
                    'UC Medical Center'
                  ] as Campus[]).map((campus) => {
                    const campusUsers = allUsers.filter((u) => u.campus === campus);
                    const campusVerified = campusUsers.filter((u) => u.isVerified);
                    const campusListings = listings.filter((l) => l.sellerCampus === campus);
                    const campusWanted = wantedRequests.filter((w) => w.preferredCampus === campus);
                    const rate = campusUsers.length > 0 ? Math.round((campusVerified.length / campusUsers.length) * 100) : 0;
                    return (
                      <tr key={campus} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <CampusBadge campus={campus} size="sm" />
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{campusUsers.length}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--uc-blue)', fontWeight: 700 }}>{campusListings.length}</td>
                        <td style={{ padding: '0.75rem', color: '#D97706', fontWeight: 700 }}>{campusWanted.length}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ fontWeight: 800, color: rate >= 50 ? 'var(--accent-green)' : '#D97706' }}>{rate}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: STUDENT ID VERIFICATIONS (KYC)
          ========================================================================= */}
      {activeTab === 'verifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['pending', 'approved', 'rejected', 'all'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setVerificationFilter(filter)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: verificationFilter === filter ? 800 : 600,
                    backgroundColor: verificationFilter === filter ? '#002B7F' : '#F1F5F9',
                    color: verificationFilter === filter ? '#FFFFFF' : '#475569',
                    textTransform: 'capitalize'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {verificationRequests
              .filter((r) => verificationFilter === 'all' || r.status === verificationFilter)
              .map((req) => (
                <div key={req.id} className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>{req.userName}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <CampusBadge campus={req.campus} size="sm" />
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>• {req.college}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#002B7F', fontWeight: 700, marginTop: '0.25rem' }}>
                        ID: {req.studentIdNumber}
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        backgroundColor: req.status === 'approved' ? '#ECFDF5' : req.status === 'rejected' ? '#FEF2F2' : '#FFFBEB',
                        color: req.status === 'approved' ? '#059669' : req.status === 'rejected' ? '#DC2626' : '#D97706'
                      }}
                    >
                      {req.status}
                    </span>
                  </div>

                  {/* ID Photo Preview */}
                  {req.idCardImageUrl && (
                    <div
                      onClick={() => setInspectedImage(req.idCardImageUrl)}
                      style={{
                        width: '100%',
                        height: '140px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#0F172A',
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                    >
                      <img src={req.idCardImageUrl} alt="Student ID" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: '#FFFFFF',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <Eye size={12} /> Inspect Photo
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {req.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <button
                        onClick={() => handleApproveVerification(req)}
                        className="btn-primary"
                        style={{ flex: 1, padding: '0.55rem', fontSize: '0.8rem', fontWeight: 800, justifyContent: 'center' }}
                      >
                        <Check size={14} /> Approve ID
                      </button>
                      <button
                        onClick={() => {
                          setRejectReqModal(req);
                          setRejectReasonInput('Incomplete student ID photo or information mismatch');
                        }}
                        style={{
                          flex: 1,
                          padding: '0.55rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          backgroundColor: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <X size={14} /> Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: USER ACCOUNTS & MODERATION
          ========================================================================= */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
              <Search size={15} color="#64748B" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search by name, ID number, or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="clean-input"
                style={{ paddingLeft: '2.25rem', fontSize: '0.82rem' }}
              />
            </div>

            <select
              value={userCampusFilter}
              onChange={(e) => setUserCampusFilter(e.target.value)}
              className="clean-input"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                width: 'auto'
              }}
            >
              <option value="All">All Campuses</option>
              <option value="UC Main">UC Main</option>
              <option value="UC Banilad">UC Banilad</option>
              <option value="UC LM">UC LM</option>
              <option value="UC METC">UC METC</option>
              <option value="UC PRI">UC PRI</option>
              <option value="UC Pardo-Talisay">UC Pardo-Talisay</option>
              <option value="UC South Campus">UC South Campus</option>
              <option value="UC Medical Center">UC Medical Center</option>
            </select>
          </div>

          {/* User Table */}
          <div className="clean-card" style={{ padding: '1rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Student Profile</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Campus & College</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Trust Score</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Warnings</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isUserBanned = u.isBanned;
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: isUserBanned ? '#FEF2F2' : 'transparent' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <img src={u.avatar} alt={u.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span>{u.name}</span>
                              {u.isVerified && <VerifiedBadge size="xs" variant="gold" />}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              ID: {u.studentId} • {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 700, color: '#002B7F' }}>{u.campus}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{u.college} ({u.yearLevel})</div>
                      </td>

                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <div style={{ flex: 1, width: '60px', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ width: `${u.trustScore || 60}%`, height: '100%', backgroundColor: (u.trustScore || 60) > 70 ? '#059669' : '#D97706' }} />
                          </div>
                          <span style={{ fontWeight: 800, fontSize: '0.75rem' }}>{u.trustScore || 60}/100</span>
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ fontWeight: 700, color: (u.warningsCount || 0) > 0 ? '#DC2626' : '#64748B' }}>
                          {u.warningsCount || 0}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem' }}>
                        {isUserBanned ? (
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, backgroundColor: '#DC2626', color: '#FFFFFF' }}>
                            BANNED
                          </span>
                        ) : u.isVerified ? (
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, backgroundColor: '#ECFDF5', color: '#059669' }}>
                            VERIFIED
                          </span>
                        ) : (
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                            ACTIVE
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            onClick={() => handleToggleVerify(u)}
                            title="Toggle Verified Badge"
                            style={{ padding: '0.35rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#EBF1FC', color: '#002B7F', border: '1px solid #BCD1F7' }}
                          >
                            <BadgeCheck size={13} />
                          </button>

                          <button
                            onClick={() => handleWarnUser(u)}
                            title="Issue Official Warning"
                            style={{ padding: '0.35rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}
                          >
                            <AlertTriangle size={13} />
                          </button>

                          {isUserBanned ? (
                            <button
                              onClick={() => handleUnban(u)}
                              title="Unban and Restore Account"
                              style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#059669', color: '#FFFFFF' }}
                            >
                              <UserCheck size={13} /> Unban
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenBanModal(u)}
                              title="Ban User"
                              style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#DC2626', color: '#FFFFFF' }}
                            >
                              <UserX size={13} /> Ban
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteUser(u)}
                            title="Delete Account"
                            style={{ padding: '0.35rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Student Trust Score & Honor Code Manager */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginTop: '0.75rem' }}>
            {/* Quick Adjustment Card */}
            <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={18} /> Adjust Student Trust Score
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Reward honest student barter merchants or penalize code of conduct infractions.
              </p>

              <form onSubmit={handleApplyTrustAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Target Student
                  </label>
                  <select
                    value={repTargetUserId}
                    onChange={(e) => setRepTargetUserId(e.target.value)}
                    className="clean-input"
                    style={{ fontSize: '0.8rem' }}
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.campus} • Trust: {u.trustScore || 80}/100)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Point Delta
                    </label>
                    <select
                      value={repDelta}
                      onChange={(e) => setRepDelta(Number(e.target.value))}
                      className="clean-input"
                      style={{ fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      <option value={15}>+15 (Honor Roll)</option>
                      <option value={10}>+10 (Verified Handshake)</option>
                      <option value={-10}>-10 (Late Arrival)</option>
                      <option value={-20}>-20 (Misrepresentation)</option>
                      <option value={-35}>-35 (Severe Warning)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Reason
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Conduct bonus"
                      value={repReason}
                      onChange={(e) => setRepReason(e.target.value)}
                      className="clean-input"
                      style={{ fontSize: '0.8rem' }}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '0.55rem 1rem', fontSize: '0.8rem', fontWeight: 800, justifyContent: 'center' }}
                >
                  Apply Score Adjustment
                </button>
              </form>
            </div>

            {/* Honor Roll & Watchlist */}
            <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Check size={16} /> Campus Honor Roll (Trust ≥ 90%)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                {allUsers
                  .filter((u) => (u.trustScore || 80) >= 90)
                  .map((u) => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', borderRadius: '6px', backgroundColor: 'var(--accent-green-subtle)', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img src={u.avatar} alt={u.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                        <div>
                          <strong style={{ color: 'var(--accent-green)' }}>{u.name}</strong>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{u.campus}</div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 900, color: 'var(--accent-green)' }}>{u.trustScore || 90}/100</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: LISTINGS & CONTENT MODERATION
          ========================================================================= */}
      {activeTab === 'listings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Flagged Queue */}
          <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldAlert size={18} /> Reported Items Queue ({pendingFlags.length})
            </h3>

            {pendingFlags.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Check size={24} color="var(--accent-green)" style={{ margin: '0 auto 0.4rem' }} />
                <span>All reported listings have been reviewed and resolved.</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {pendingFlags.map((flag) => (
                  <div key={flag.id} style={{ border: '1.5px solid var(--border-subtle)', borderRadius: '10px', padding: '1rem', backgroundColor: 'var(--accent-red-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <img src={flag.listingImage} alt={flag.listingTitle} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {flag.listingTitle}
                        </h4>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Seller: {flag.sellerName} ({flag.campus})</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-red)', fontWeight: 700, marginTop: '0.2rem' }}>
                          Reason: {flag.reason}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <button
                        onClick={() => handleResolveFlag(flag.id)}
                        className="btn-success"
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem' }}
                      >
                        Mark Safe
                      </button>
                      <button
                        onClick={() => handleRemoveListing(flag.id, flag.listingId, flag.listingTitle)}
                        className="btn-danger"
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem' }}
                      >
                        Take Down
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prohibited Keywords Scanner */}
          <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={18} /> Prohibited Keywords & Auto-Moderation Blacklist
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Scan listings for contraband, unauthorized items, and hazardous goods.
                </p>
              </div>

              <button
                onClick={handleTriggerScanner}
                disabled={isScanning}
                className="btn-gold"
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Search size={14} />
                <span>{isScanning ? 'Scanning...' : 'Run Auto-Scan'}</span>
              </button>
            </div>

            {/* Keyword Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {prohibitedKeywords.map((kw) => (
                <span
                  key={kw}
                  style={{
                    backgroundColor: 'var(--accent-red-subtle)',
                    color: 'var(--accent-red)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <span>{kw}</span>
                  <button
                    onClick={() => removeProhibitedKeyword(kw)}
                    style={{ color: 'var(--accent-red)', cursor: 'pointer', display: 'flex', background: 'none', border: 'none', padding: 0 }}
                    title="Remove keyword"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Add New Keyword Form */}
            <form onSubmit={handleAddKeyword} style={{ display: 'flex', gap: '0.5rem', maxWidth: '380px' }}>
              <input
                type="text"
                placeholder="Add prohibited term..."
                value={newKeywordInput}
                onChange={(e) => setNewKeywordInput(e.target.value)}
                className="clean-input"
                style={{ fontSize: '0.8rem' }}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', fontWeight: 800, whiteSpace: 'nowrap' }}
              >
                <Plus size={14} /> Add Filter
              </button>
            </form>
          </div>

          {/* All Listings Manager */}
          <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>All Active Marketplace Items ({listings.length})</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Listing</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Campus</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Price / Mode</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Seller</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((l) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img src={l.images[0]} alt={l.title} style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{l.title}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{l.condition}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <CampusBadge campus={l.sellerCampus} size="sm" />
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                        {l.tradeMode === 'free_donation' ? 'FREE' : `₱${l.price.toLocaleString()}`}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{l.sellerName}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => handleBoostListing(l)}
                            title={l.isBoosted ? 'Remove Boost' : 'Boost to Hero Carousel'}
                            style={{
                              padding: '0.35rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              backgroundColor: l.isBoosted ? 'var(--uc-gold)' : 'var(--bg-subtle)',
                              color: 'var(--uc-blue)',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <Zap size={12} fill={l.isBoosted ? 'var(--uc-blue)' : 'none'} /> {l.isBoosted ? 'Boosted' : 'Boost'}
                          </button>
                          <button
                            onClick={() => handleRemoveListing('direct', l.id, l.title)}
                            title="Delete Listing"
                            className="btn-icon"
                            style={{ color: 'var(--accent-red)', backgroundColor: 'var(--accent-red-subtle)', border: '1px solid var(--border-subtle)', padding: '0.35rem' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: TRADE DISPUTE & MEDIATION DESK
          ========================================================================= */}
      {activeTab === 'disputes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Scale size={20} /> Student Trade Dispute & Mediation Cases ({disputes.length})
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Mediate disputes regarding item condition discrepancies, landmark meetup ghosting, and payment settlement.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {disputes.map((disp) => (
                <div
                  key={disp.id}
                  className="clean-card"
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    border: disp.status === 'pending' ? '1.5px solid var(--uc-gold)' : '1px solid var(--border-subtle)',
                    backgroundColor: disp.status === 'pending' ? 'var(--uc-gold-subtle)' : 'var(--bg-surface)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <CampusBadge campus={disp.campus} size="sm" />
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        backgroundColor: disp.status === 'pending' ? 'var(--uc-gold-light)' : 'var(--accent-green-subtle)',
                        color: disp.status === 'pending' ? '#D97706' : 'var(--accent-green)'
                      }}
                    >
                      {disp.status}
                    </span>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{disp.listingTitle}</h4>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Buyer: <strong>{disp.buyerName}</strong> ↔ Seller: <strong>{disp.sellerName}</strong>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                    <strong>Dispute Claim:</strong> "{disp.reason}"
                  </div>

                  {disp.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <button
                        onClick={() => {
                          setSelectedDispute(disp);
                          setDisputeVerdictNote('Seller verified condition discrepancy. Warning strike recorded and partial remedy noted.');
                        }}
                        className="btn-primary"
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem', fontWeight: 800, justifyContent: 'center' }}
                      >
                        Render Verdict
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 700 }}>
                      ✓ Case Resolved ({disp.verdictAction?.toUpperCase()}): {disp.verdictNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: SAFE MEETUP ESCROWS & LANDMARK HANDSHAKES
          ========================================================================= */}
      {activeTab === 'meetups' && (
        <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Campus Safe Meetup Escrow Monitor ({meetups.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Item & Code</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Guarded Meetup Spot</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Buyer & Seller</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Admin Overrides</th>
                </tr>
              </thead>
              <tbody>
                {meetups.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{m.listingTitle}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--uc-blue)', fontFamily: 'monospace', fontWeight: 800 }}>
                        Code: {m.verificationCode}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--uc-blue)' }}>{m.landmarkSpot}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.campus} • {m.scheduledDateTime}</div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <strong>{m.buyerName}</strong> ↔ <strong>{m.sellerName}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          backgroundColor: m.status === 'completed' ? 'var(--accent-green-subtle)' : m.status === 'cancelled' ? 'var(--accent-red-subtle)' : 'var(--uc-gold-light)',
                          color: m.status === 'completed' ? 'var(--accent-green)' : m.status === 'cancelled' ? 'var(--accent-red)' : '#D97706'
                        }}
                      >
                        {m.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {m.status === 'scheduled' && (
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => {
                              completeMeetupByAdmin(m.id);
                              showToast('Completed', 'Handshake marked as completed.', 'success');
                            }}
                            className="btn-success"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', fontWeight: 800 }}
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => {
                              cancelMeetupByAdmin(m.id, 'Cancelled by admin safety desk');
                              showToast('Cancelled', 'Meetup cancelled and flagged.', 'info');
                            }}
                            className="btn-danger"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', fontWeight: 800 }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: AUDIT LOG & CAMPUS BROADCASTS
          ========================================================================= */}
      {activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Broadcast Announcements */}
          <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Megaphone size={18} color="var(--uc-blue)" /> Campus Broadcast Announcements ({announcements.length})
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Publish campus-wide safety alerts or schedules for students.</p>
              </div>
              <button
                onClick={() => setIsNewAnnModalOpen(true)}
                className="btn-primary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 800 }}
              >
                <Plus size={14} /> New Broadcast
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {announcements.map((ann) => (
                <div key={ann.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1rem', backgroundColor: 'var(--bg-subtle)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          backgroundColor: ann.type === 'alert' ? 'var(--accent-red-subtle)' : 'var(--uc-blue-subtle)',
                          color: ann.type === 'alert' ? 'var(--accent-red)' : 'var(--uc-blue)'
                        }}
                      >
                        {ann.type}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>• {ann.campus}</span>
                    </div>

                    <button
                      onClick={() => deleteAnnouncement(ann.id)}
                      style={{ color: 'var(--accent-red)', padding: '0.2rem', background: 'none', border: 'none', cursor: 'pointer' }}
                      title="Delete Announcement"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>{ann.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{ann.message}</p>

                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>By: {ann.authorName}</span>
                    <button
                      onClick={() => toggleAnnouncement(ann.id)}
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontWeight: 800,
                        backgroundColor: ann.isActive ? 'var(--accent-green-subtle)' : 'var(--bg-surface)',
                        color: ann.isActive ? 'var(--accent-green)' : 'var(--text-muted)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {ann.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={18} color="var(--uc-blue)" /> Administrative Activity & Audit Trail ({auditLogs.length})
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Immutable record of every moderator action, KYC verification, ban, dispute verdict, and takedown.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <select
                  value={auditTypeFilter}
                  onChange={(e) => setAuditTypeFilter(e.target.value)}
                  className="clean-input"
                  style={{ fontSize: '0.8rem' }}
                >
                  <option value="all">All Action Types</option>
                  <option value="verification">ID KYC Verifications</option>
                  <option value="user">User Bans & Warnings</option>
                  <option value="listing">Listing Takedowns</option>
                  <option value="dispute">Dispute Verdicts</option>
                  <option value="meetup">Meetup Escrows</option>
                  <option value="announcement">Broadcasts</option>
                  <option value="system">System Config</option>
                </select>

                <button
                  onClick={handleExportAuditCSV}
                  className="btn-gold"
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Download size={14} />
                  <span>Export CSV Report</span>
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Action</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Target Type</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Details</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Moderator</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 800, color: 'var(--uc-blue)' }}>{log.action}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ padding: '0.2rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                          {log.targetType}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>{log.details}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{log.adminName}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: BAN USER MODAL
          ========================================================================= */}
      {banModalUser && (
        <Modal
          isOpen={!!banModalUser}
          onClose={() => setBanModalUser(null)}
          title="Ban Student Account"
          subtitle={`You are about to suspend ${banModalUser.name} (${banModalUser.studentId} • ${banModalUser.campus}).`}
          maxWidth="460px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              They will be locked out of buying, selling, and chatting on TradeLink.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Reason for Suspension:
              </label>
              <textarea
                rows={3}
                value={banReasonInput}
                onChange={(e) => setBanReasonInput(e.target.value)}
                className="clean-textarea"
                style={{ fontSize: '0.84rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setBanModalUser(null)}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.84rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBan}
                className="btn-danger"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.84rem' }}
              >
                Confirm Ban
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODALS: DISPUTE VERDICT MODAL
          ========================================================================= */}
      {selectedDispute && (
        <Modal
          isOpen={!!selectedDispute}
          onClose={() => setSelectedDispute(null)}
          title="Dispute Mediation Desk"
          subtitle="Review conflict evidence and render an official administrative verdict."
          maxWidth="480px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div><strong>Item:</strong> {selectedDispute.listingTitle}</div>
              <div><strong>Buyer:</strong> {selectedDispute.buyerName}</div>
              <div><strong>Seller:</strong> {selectedDispute.sellerName}</div>
              <div style={{ marginTop: '0.25rem' }}><strong>Reason:</strong> "{selectedDispute.reason}"</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                Official Verdict & Resolution Note:
              </label>
              <textarea
                rows={3}
                value={disputeVerdictNote}
                onChange={(e) => setDisputeVerdictNote(e.target.value)}
                className="clean-textarea"
                style={{ fontSize: '0.82rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleConfirmDisputeVerdict('refund')}
                className="btn-success"
                style={{ padding: '0.55rem', fontSize: '0.78rem' }}
              >
                ✓ Remedy / Refund
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDisputeVerdict('warning')}
                className="btn-gold"
                style={{ padding: '0.55rem', fontSize: '0.78rem' }}
              >
                ⚠️ Issue Strike Warning
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDisputeVerdict('dismissed')}
                className="btn-secondary"
                style={{ padding: '0.55rem', fontSize: '0.78rem' }}
              >
                Dismiss Report
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDisputeVerdict('ban')}
                className="btn-danger"
                style={{ padding: '0.55rem', fontSize: '0.78rem' }}
              >
                Ban Offender
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODALS: REJECT VERIFICATION MODAL
          ========================================================================= */}
      {rejectReqModal && (
        <Modal
          isOpen={!!rejectReqModal}
          onClose={() => setRejectReqModal(null)}
          title="Decline Student ID"
          subtitle={`Specify reason for declining ${rejectReqModal.userName}'s verification request.`}
          maxWidth="440px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <textarea
              rows={3}
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              className="clean-textarea"
              style={{ fontSize: '0.84rem' }}
            />

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setRejectReqModal(null)}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.55rem', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectVerification}
                className="btn-danger"
                style={{ flex: 1, padding: '0.55rem', fontSize: '0.82rem' }}
              >
                Decline Request
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODALS: NEW ANNOUNCEMENT MODAL
          ========================================================================= */}
      {isNewAnnModalOpen && (
        <Modal
          isOpen={isNewAnnModalOpen}
          onClose={() => setIsNewAnnModalOpen(false)}
          title="Post Campus Broadcast"
          subtitle="Publish a campus-wide alert or update for students."
          maxWidth="480px"
        >
          <form onSubmit={handleCreateAnnouncementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                Broadcast Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Guarded Trade Desk Schedule"
                value={newAnnTitle}
                onChange={(e) => setNewAnnTitle(e.target.value)}
                className="clean-input"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                  Target Campus
                </label>
                <select
                  value={newAnnCampus}
                  onChange={(e: any) => setNewAnnCampus(e.target.value)}
                  className="clean-input"
                >
                  <option value="All">All Campuses</option>
                  <option value="UC Main">UC Main</option>
                  <option value="UC Banilad">UC Banilad</option>
                  <option value="UC LM">UC LM</option>
                  <option value="UC METC">UC METC</option>
                  <option value="UC PRI">UC PRI</option>
                  <option value="UC Pardo-Talisay">UC Pardo-Talisay</option>
                  <option value="UC South Campus">UC South Campus</option>
                  <option value="UC Medical Center">UC Medical Center</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                  Category
                </label>
                <select
                  value={newAnnType}
                  onChange={(e: any) => setNewAnnType(e.target.value)}
                  className="clean-input"
                >
                  <option value="info">Information</option>
                  <option value="alert">Safety Alert</option>
                  <option value="event">Trading Event</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                Broadcast Message *
              </label>
              <textarea
                rows={3}
                placeholder="Type the announcement details..."
                value={newAnnMessage}
                onChange={(e) => setNewAnnMessage(e.target.value)}
                className="clean-textarea"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsNewAnnModalOpen(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.82rem', justifyContent: 'center' }}
              >
                Publish Broadcast
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODALS: FULL-SCREEN ID PHOTO VIEWER
          ========================================================================= */}
      {inspectedImage && (
        <div
          className="modal-backdrop-custom"
          style={{ zIndex: 4000, backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
          onClick={() => setInspectedImage(null)}
        >
          <div
            style={{ position: 'relative', maxWidth: '700px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img src={inspectedImage} alt="ID Document Inspection" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '12px', objectFit: 'contain' }} />
            <button
              type="button"
              onClick={() => setInspectedImage(null)}
              className="btn-secondary"
              style={{ marginTop: '1rem', borderRadius: 'var(--radius-full)', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
            >
              Close Viewer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

