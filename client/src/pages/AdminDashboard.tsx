import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useWanted } from '../context/WantedContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/common/Toast';
import { VerificationRequest, User, Listing, Campus, TradeDispute } from '../types';
import { CAMPUS_MEETUP_SPOTS } from '../data/campusLocations';
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
  Sparkles,
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
  Shield
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
    | 'scanner'
    | 'disputes'
    | 'reputation'
    | 'wanted'
    | 'meetups'
    | 'landmarks'
    | 'priceAdvisor'
    | 'announcements'
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
    setBanReasonInput('Violation of UC TradeLink Safety & Campus Community Guidelines');
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
              backgroundColor: '#F1F5F9',
              color: '#475569',
              borderRadius: '8px',
              border: '1px solid #CBD5E1'
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
          backgroundColor: '#FFFFFF',
          padding: '0.35rem',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          width: '100%',
          minWidth: 0
        }}
      >
        {[
          { id: 'overview', label: 'Overview', icon: <TrendingUp size={14} /> },
          { id: 'verifications', label: `ID Verifications (${pendingRequests.length})`, icon: <BadgeCheck size={14} /> },
          { id: 'users', label: `Users & Moderation (${allUsers.length})`, icon: <UserCheck size={14} /> },
          { id: 'listings', label: `Listings & Flags (${pendingFlags.length})`, icon: <ShieldAlert size={14} /> },
          { id: 'scanner', label: `Prohibited Scanner (${scannedViolations.length})`, icon: <Shield size={14} /> },
          { id: 'disputes', label: `Trade Disputes (${pendingDisputesCount})`, icon: <Scale size={14} /> },
          { id: 'reputation', label: 'Trust & Reputation', icon: <Award size={14} /> },
          { id: 'wanted', label: `Wanted Board (${wantedRequests.length})`, icon: <Sparkles size={14} /> },
          { id: 'meetups', label: `Meetup Escrows (${meetups.length})`, icon: <MapPin size={14} /> },
          { id: 'landmarks', label: 'Guarded Hubs', icon: <Building2 size={14} /> },
          { id: 'priceAdvisor', label: 'Price Compliance', icon: <DollarSign size={14} /> },
          { id: 'announcements', label: `Broadcasts (${announcements.length})`, icon: <Megaphone size={14} /> },
          { id: 'audit', label: `Audit Log (${auditLogs.length})`, icon: <History size={14} /> }
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
                backgroundColor: isActive ? '#002B7F' : 'transparent',
                color: isActive ? '#FFFFFF' : '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                flexShrink: 0,
                cursor: 'pointer'
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

          {/* Campus Breakdown Table */}
          <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} color="#002B7F" /> 8 Official Campuses Trading Hub Distribution
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
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
                      <tr key={campus} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <CampusBadge campus={campus} size="sm" />
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0F172A' }}>{campusUsers.length}</td>
                        <td style={{ padding: '0.75rem', color: '#002B7F', fontWeight: 700 }}>{campusListings.length}</td>
                        <td style={{ padding: '0.75rem', color: '#D97706', fontWeight: 700 }}>{campusWanted.length}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ fontWeight: 800, color: rate >= 50 ? '#059669' : '#D97706' }}>{rate}%</span>
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
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                fontWeight: 600,
                backgroundColor: '#FFFFFF',
                color: '#334155'
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
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#F1F5F9', color: '#475569' }}>
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
        </div>
      )}

      {/* =========================================================================
          TAB 4: LISTINGS & CONTENT MODERATION
          ========================================================================= */}
      {activeTab === 'listings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Flagged Queue */}
          <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldAlert size={18} /> Reported Items Queue ({pendingFlags.length})
            </h3>

            {pendingFlags.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B', fontSize: '0.85rem' }}>
                <Check size={28} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
                <span>All reported listings have been reviewed and resolved.</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {pendingFlags.map((flag) => (
                  <div key={flag.id} style={{ border: '1.5px solid #FECACA', borderRadius: '10px', padding: '1rem', backgroundColor: '#FFF5F5', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <img src={flag.listingImage} alt={flag.listingTitle} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {flag.listingTitle}
                        </h4>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Seller: {flag.sellerName} ({flag.campus})</div>
                        <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700, marginTop: '0.2rem' }}>
                          Reason: {flag.reason}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <button
                        onClick={() => handleResolveFlag(flag.id)}
                        style={{ flex: 1, padding: '0.45rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, backgroundColor: '#059669', color: '#FFFFFF' }}
                      >
                        Mark Safe
                      </button>
                      <button
                        onClick={() => handleRemoveListing(flag.id, flag.listingId, flag.listingTitle)}
                        style={{ flex: 1, padding: '0.45rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, backgroundColor: '#DC2626', color: '#FFFFFF' }}
                      >
                        Take Down
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Listings Manager */}
          <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>All Active Marketplace Items ({listings.length})</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Listing</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Campus</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Price / Mode</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Seller</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((l) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img src={l.images[0]} alt={l.title} style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{l.title}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{l.condition}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <CampusBadge campus={l.sellerCampus} size="sm" />
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 800, color: '#002B7F' }}>
                        {l.tradeMode === 'free_donation' ? 'FREE' : `₱${l.price.toLocaleString()}`}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#334155' }}>{l.sellerName}</td>
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
                              backgroundColor: l.isBoosted ? '#FFC72C' : '#F1F5F9',
                              color: '#002B7F'
                            }}
                          >
                            <Sparkles size={12} /> {l.isBoosted ? 'Boosted' : 'Boost'}
                          </button>
                          <button
                            onClick={() => handleRemoveListing('direct', l.id, l.title)}
                            title="Delete Listing"
                            style={{ padding: '0.35rem 0.55rem', borderRadius: '6px', color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
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
          TAB 5: PROHIBITED CONTENT SCANNER & AUTO-MODERATION TOOL
          ========================================================================= */}
      {activeTab === 'scanner' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Config Card */}
          <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#002B7F', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={20} /> Prohibited Keywords & Auto-Moderation Blacklist
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Define prohibited term patterns to automatically scan listings for academic leaks, contraband, and hazardous goods.
                </p>
              </div>

              <button
                onClick={handleTriggerScanner}
                disabled={isScanning}
                className="btn-gold"
                style={{ padding: '0.55rem 1.1rem', fontSize: '0.82rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Search size={14} />
                <span>{isScanning ? 'Scanning Marketplace...' : 'Run Auto-Scan Now'}</span>
              </button>
            </div>

            {/* Keyword Pills List */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                Active Blacklisted Terms ({prohibitedKeywords.length}):
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {prohibitedKeywords.map((kw) => (
                  <span
                    key={kw}
                    style={{
                      backgroundColor: '#FEF2F2',
                      color: '#DC2626',
                      border: '1px solid #FECACA',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span>{kw}</span>
                    <button
                      onClick={() => removeProhibitedKeyword(kw)}
                      style={{ color: '#DC2626', cursor: 'pointer', display: 'flex' }}
                      title="Remove keyword"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Add New Keyword Form */}
            <form onSubmit={handleAddKeyword} style={{ display: 'flex', gap: '0.5rem', maxWidth: '420px' }}>
              <input
                type="text"
                placeholder="Add prohibited term e.g. 'vape' or 'exam leak'..."
                value={newKeywordInput}
                onChange={(e) => setNewKeywordInput(e.target.value)}
                className="clean-input"
                style={{ fontSize: '0.82rem' }}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem', fontWeight: 800, whiteSpace: 'nowrap' }}
              >
                <Plus size={14} /> Add Filter
              </button>
            </form>
          </div>

          {/* Scanner Match Results */}
          <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={18} color="#DC2626" /> Scanner Detection Queue ({scannedViolations.length} Detected)
              </h3>
            </div>

            {scannedViolations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: '#059669', fontSize: '0.85rem' }}>
                <Check size={32} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Clean Marketplace</div>
                <p style={{ color: '#64748B', marginTop: '0.2rem' }}>No active listings match blacklisted prohibited terms.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {scannedViolations.map(({ listing, matchedKeywords }) => (
                  <div
                    key={listing.id}
                    style={{
                      border: '1.5px solid #FECACA',
                      backgroundColor: '#FFF5F5',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <img src={listing.images[0]} alt={listing.title} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {listing.title}
                        </h4>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Seller: {listing.sellerName} ({listing.sellerCampus})</div>
                        <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {matchedKeywords.map((kw) => (
                            <span key={kw} style={{ fontSize: '0.68rem', fontWeight: 800, backgroundColor: '#DC2626', color: '#FFFFFF', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                              ⚠️ Matched: {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <button
                        onClick={() => handleRemoveListing('scanner', listing.id, listing.title)}
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, backgroundColor: '#DC2626', color: '#FFFFFF' }}
                      >
                        Takedown Listing
                      </button>
                      <button
                        onClick={() => handleOpenBanModal(allUsers.find((u) => u.id === listing.sellerId) || allUsers[0])}
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
                      >
                        Ban Seller
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: TRADE DISPUTE & MEDIATION DESK
          ========================================================================= */}
      {activeTab === 'disputes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#002B7F', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Scale size={20} /> Student Trade Dispute & Mediation Cases ({disputes.length})
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.2rem' }}>
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
                    border: disp.status === 'pending' ? '1.5px solid #FDE68A' : '1px solid #E2E8F0',
                    backgroundColor: disp.status === 'pending' ? '#FFFDF5' : '#FFFFFF'
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
                        backgroundColor: disp.status === 'pending' ? '#FFFBEB' : '#ECFDF5',
                        color: disp.status === 'pending' ? '#D97706' : '#059669'
                      }}
                    >
                      {disp.status}
                    </span>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>{disp.listingTitle}</h4>
                    <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.25rem' }}>
                      Buyer: <strong>{disp.buyerName}</strong> ↔ Seller: <strong>{disp.sellerName}</strong>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem', color: '#334155', lineHeight: 1.45 }}>
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
                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
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
          TAB 7: STUDENT TRUST & HONOR CODE MANAGER
          ========================================================================= */}
      {activeTab === 'reputation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Adjustment Card */}
          <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#002B7F', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Award size={20} /> Student Trust Score & Honor Code Manager
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
              Manually adjust student reputation points to reward verified honest barter merchants or penalize code of conduct infractions.
            </p>

            <form onSubmit={handleApplyTrustAdjustment} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                  Target Student
                </label>
                <select
                  value={repTargetUserId}
                  onChange={(e) => setRepTargetUserId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                >
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.campus} • Trust: {u.trustScore || 80}/100)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                  Point Delta (+/-)
                </label>
                <select
                  value={repDelta}
                  onChange={(e) => setRepDelta(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <option value={15}>+15 Points (Honor Roll Trading)</option>
                  <option value={10}>+10 Points (Verified Punctual Handshake)</option>
                  <option value={-10}>-10 Points (Late Arrival at Landmark)</option>
                  <option value={-20}>-20 Points (Condition Misrepresentation)</option>
                  <option value={-35}>-35 Points (Severe Community Warning)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                  Compliance Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Excellent conduct / Disciplinary deduction"
                  value={repReason}
                  onChange={(e) => setRepReason(e.target.value)}
                  className="clean-input"
                  style={{ fontSize: '0.82rem' }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '0.65rem 1rem', fontSize: '0.82rem', fontWeight: 800, justifyContent: 'center' }}
              >
                Apply Score Adjustment
              </button>
            </form>
          </div>

          {/* Honor Roll & Watchlist Grids */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Honor Roll Merchants */}
            <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Check size={16} /> Campus Honor Roll (Trust ≥ 90%)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allUsers
                  .filter((u) => (u.trustScore || 80) >= 90)
                  .map((u) => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.65rem', borderRadius: '6px', backgroundColor: '#ECFDF5', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img src={u.avatar} alt={u.name} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                        <div>
                          <strong style={{ color: '#065F46' }}>{u.name}</strong>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{u.campus}</div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 900, color: '#059669' }}>{u.trustScore || 90}/100</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Low Trust Watchlist */}
            <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <AlertTriangle size={16} /> Moderation Watchlist (Trust &lt; 75%)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allUsers
                  .filter((u) => (u.trustScore || 80) < 75)
                  .map((u) => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.65rem', borderRadius: '6px', backgroundColor: '#FEF2F2', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img src={u.avatar} alt={u.name} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                        <div>
                          <strong style={{ color: '#991B1B' }}>{u.name}</strong>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{u.campus} • {u.warningsCount || 0} Strikes</div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 900, color: '#DC2626' }}>{u.trustScore || 60}/100</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 8: WANTED BOARD & PASABUY MODERATION
          ========================================================================= */}
      {activeTab === 'wanted' && (
        <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>Student Wanted & Pasabuy Requests ({wantedRequests.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Requested Item</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Campus</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Target Budget</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Requester</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {wantedRequests.map((w) => (
                  <tr key={w.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A' }}>{w.itemTitle}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{w.description}</div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <CampusBadge campus={w.preferredCampus} size="sm" />
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 800, color: '#002B7F' }}>₱{w.targetBudget.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem', color: '#334155' }}>{w.requesterName}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete request "${w.itemTitle}"?`)) {
                            removeWantedByAdmin(w.id, 'Moderator removed request');
                            deleteWantedRequest(w.id);
                            showToast('Deleted', 'Wanted post deleted.', 'info');
                          }
                        }}
                        style={{ padding: '0.35rem 0.55rem', borderRadius: '6px', color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 9: SAFE MEETUP ESCROWS & LANDMARK HANDSHAKES
          ========================================================================= */}
      {activeTab === 'meetups' && (
        <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>Campus Safe Meetup Escrow Monitor ({meetups.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Item & Code</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Guarded Meetup Spot</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Buyer & Seller</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Admin Overrides</th>
                </tr>
              </thead>
              <tbody>
                {meetups.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A' }}>{m.listingTitle}</div>
                      <div style={{ fontSize: '0.72rem', color: '#002B7F', fontFamily: 'monospace', fontWeight: 800 }}>
                        Code: {m.verificationCode}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: '#002B7F' }}>{m.landmarkSpot}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{m.campus} • {m.scheduledDateTime}</div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.78rem', color: '#334155' }}>
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
                          backgroundColor: m.status === 'completed' ? '#ECFDF5' : m.status === 'cancelled' ? '#FEF2F2' : '#FFFBEB',
                          color: m.status === 'completed' ? '#059669' : m.status === 'cancelled' ? '#DC2626' : '#D97706'
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
                            style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#059669', color: '#FFFFFF' }}
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => {
                              cancelMeetupByAdmin(m.id, 'Cancelled by admin safety desk');
                              showToast('Cancelled', 'Meetup cancelled and flagged.', 'info');
                            }}
                            style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#DC2626', color: '#FFFFFF' }}
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
          TAB 10: GUARDED LANDMARK HUBS CONFIGURATOR
          ========================================================================= */}
      {activeTab === 'landmarks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#002B7F', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building2 size={20} /> Guarded Campus Meetup Landmarks ({CAMPUS_MEETUP_SPOTS.length} Designated Spots)
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Configure active security-supervised student trade rendezvous hubs across all 8 UC campuses.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={landmarkCampusFilter}
                  onChange={(e) => setLandmarkCampusFilter(e.target.value)}
                  style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
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
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {CAMPUS_MEETUP_SPOTS.filter(
                (spot) => landmarkCampusFilter === 'All' || spot.campus === landmarkCampusFilter
              ).map((spot) => {
                const isSpotActive = activeLandmarks[spot.id] !== false;
                return (
                  <div key={spot.id} className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <CampusBadge campus={spot.campus as Campus} size="sm" />
                      <button
                        onClick={() => {
                          setActiveLandmarks((prev) => ({ ...prev, [spot.id]: !isSpotActive }));
                          showToast('Landmark Status', `${spot.name} is now ${!isSpotActive ? 'Active' : 'Disabled'}.`, 'info');
                        }}
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          backgroundColor: isSpotActive ? '#ECFDF5' : '#F1F5F9',
                          color: isSpotActive ? '#059669' : '#64748B'
                        }}
                      >
                        {isSpotActive ? '● Active Guard Hub' : '○ Offline'}
                      </button>
                    </div>

                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>{spot.name}</h4>
                    <p style={{ fontSize: '0.78rem', color: '#64748B' }}>{spot.locationDetails}</p>

                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', fontSize: '0.72rem', color: '#002B7F', fontWeight: 700 }}>
                      🕒 {spot.bestHours}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 11: FAIR PRICE COMPLIANCE & GOUGING INSPECTOR
          ========================================================================= */}
      {activeTab === 'priceAdvisor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#002B7F', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <DollarSign size={20} /> Campus Fair-Pricing & Anti-Gouging Inspector
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
              Automatically checks student listings against official SRP campus benchmarks to prevent uniform and textbook price gouging.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Item</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Campus</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Listed Price</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Original SRP</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Pricing Evaluation</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Compliance Action</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((l) => {
                    const pctOfSrp = l.originalSrp > 0 ? Math.round((l.price / l.originalSrp) * 100) : 100;
                    const isGouging = l.originalSrp > 0 && l.price > l.originalSrp * 0.9;
                    return (
                      <tr key={l.id} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: isGouging ? '#FFFBEB' : 'transparent' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0F172A' }}>{l.title}</td>
                        <td style={{ padding: '0.75rem' }}><CampusBadge campus={l.sellerCampus} size="sm" /></td>
                        <td style={{ padding: '0.75rem', fontWeight: 800, color: '#002B7F' }}>₱{l.price.toLocaleString()}</td>
                        <td style={{ padding: '0.75rem', color: '#64748B' }}>₱{l.originalSrp.toLocaleString()}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              backgroundColor: pctOfSrp <= 50 ? '#ECFDF5' : pctOfSrp <= 85 ? '#EBF1FC' : '#FEF2F2',
                              color: pctOfSrp <= 50 ? '#059669' : pctOfSrp <= 85 ? '#002B7F' : '#DC2626'
                            }}
                          >
                            {pctOfSrp <= 50 ? 'Great Bargain' : pctOfSrp <= 85 ? 'Fair Campus Price' : '⚠️ High / Review'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              warnUserByAdmin(l.sellerId, `Pricing notice for "${l.title}". Please verify compliance with student affordability guidelines.`);
                              showToast('Price Notice Sent', `Issued pricing notice to seller ${l.sellerName}.`, 'warning');
                            }}
                            style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}
                          >
                            Send Notice
                          </button>
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
          TAB 12: CAMPUS BROADCAST ANNOUNCEMENTS
          ========================================================================= */}
      {activeTab === 'announcements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>Active Campus Broadcasts ({announcements.length})</h3>
            <button
              onClick={() => setIsNewAnnModalOpen(true)}
              className="btn-primary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 800 }}
            >
              <Plus size={14} /> New Broadcast
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {announcements.map((ann) => (
              <div key={ann.id} className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        backgroundColor: ann.type === 'alert' ? '#FEF2F2' : '#EBF1FC',
                        color: ann.type === 'alert' ? '#DC2626' : '#002B7F'
                      }}
                    >
                      {ann.type}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>• {ann.campus}</span>
                  </div>

                  <button
                    onClick={() => deleteAnnouncement(ann.id)}
                    style={{ color: '#DC2626', padding: '0.2rem' }}
                    title="Delete Announcement"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>{ann.title}</h4>
                <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>{ann.message}</p>

                <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
                  <span>By: {ann.authorName}</span>
                  <button
                    onClick={() => toggleAnnouncement(ann.id)}
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontWeight: 800,
                      backgroundColor: ann.isActive ? '#ECFDF5' : '#F1F5F9',
                      color: ann.isActive ? '#059669' : '#64748B'
                    }}
                  >
                    {ann.isActive ? 'Active' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 13: REAL-TIME ADMIN AUDIT LOG & CSV EXPORTER
          ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} color="#002B7F" /> Administrative Activity & Audit Trail ({auditLogs.length})
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.15rem' }}>
                Immutable record of every moderator action, KYC verification, ban, dispute verdict, and takedown.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={auditTypeFilter}
                onChange={(e) => setAuditTypeFilter(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
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
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Action</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Target Type</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Details</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Moderator</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 800, color: '#002B7F' }}>{log.action}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ padding: '0.2rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#F1F5F9', color: '#334155', textTransform: 'uppercase' }}>
                        {log.targetType}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#334155' }}>{log.details}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600, color: '#64748B' }}>{log.adminName}</td>
                    <td style={{ padding: '0.75rem', color: '#94A3B8', fontSize: '0.75rem' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: BAN USER MODAL
          ========================================================================= */}
      {banModalUser && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 29, 89, 0.65)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setBanModalUser(null)}
        >
          <div
            style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1.5px solid #FECACA', width: '100%', maxWidth: '460px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626', fontWeight: 800, fontSize: '1.1rem' }}>
                <UserX size={20} /> Ban Student Account
              </div>
              <button onClick={() => setBanModalUser(null)} style={{ color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#475569' }}>
              You are about to suspend <strong>{banModalUser.name}</strong> ({banModalUser.studentId} • {banModalUser.campus}). They will be locked out of buying, selling, and chatting on UC TradeLink.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Reason for Suspension:
              </label>
              <textarea
                rows={3}
                value={banReasonInput}
                onChange={(e) => setBanReasonInput(e.target.value)}
                className="clean-input"
                style={{ fontSize: '0.84rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                onClick={() => setBanModalUser(null)}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 700, backgroundColor: '#F1F5F9', color: '#475569' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBan}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 800, backgroundColor: '#DC2626', color: '#FFFFFF' }}
              >
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: DISPUTE VERDICT MODAL
          ========================================================================= */}
      {selectedDispute && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 29, 89, 0.65)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setSelectedDispute(null)}
        >
          <div
            style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1.5px solid #CBD5E1', width: '100%', maxWidth: '480px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#002B7F', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Scale size={18} /> Dispute Mediation Desk
              </h3>
              <button onClick={() => setSelectedDispute(null)} style={{ color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', fontSize: '0.82rem', color: '#334155' }}>
              <div><strong>Item:</strong> {selectedDispute.listingTitle}</div>
              <div><strong>Buyer:</strong> {selectedDispute.buyerName}</div>
              <div><strong>Seller:</strong> {selectedDispute.sellerName}</div>
              <div style={{ marginTop: '0.25rem' }}><strong>Reason:</strong> "{selectedDispute.reason}"</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                Official Verdict & Resolution Note:
              </label>
              <textarea
                rows={3}
                value={disputeVerdictNote}
                onChange={(e) => setDisputeVerdictNote(e.target.value)}
                className="clean-input"
                style={{ fontSize: '0.82rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                onClick={() => handleConfirmDisputeVerdict('refund')}
                style={{ padding: '0.55rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, backgroundColor: '#059669', color: '#FFFFFF' }}
              >
                ✓ Remedy / Refund
              </button>
              <button
                onClick={() => handleConfirmDisputeVerdict('warning')}
                style={{ padding: '0.55rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, backgroundColor: '#D97706', color: '#FFFFFF' }}
              >
                ⚠️ Issue Strike Warning
              </button>
              <button
                onClick={() => handleConfirmDisputeVerdict('dismissed')}
                style={{ padding: '0.55rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, backgroundColor: '#F1F5F9', color: '#475569' }}
              >
                Dismiss Report
              </button>
              <button
                onClick={() => handleConfirmDisputeVerdict('ban')}
                style={{ padding: '0.55rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, backgroundColor: '#DC2626', color: '#FFFFFF' }}
              >
                Ban Offender
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: REJECT VERIFICATION MODAL
          ========================================================================= */}
      {rejectReqModal && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 29, 89, 0.65)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setRejectReqModal(null)}
        >
          <div
            style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1.5px solid #CBD5E1', width: '100%', maxWidth: '440px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>Decline Student ID</h3>
              <button onClick={() => setRejectReqModal(null)} style={{ color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#475569' }}>
              Specify the reason for declining <strong>{rejectReqModal.userName}</strong>'s verification request:
            </p>

            <textarea
              rows={3}
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              className="clean-input"
              style={{ fontSize: '0.84rem' }}
            />

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setRejectReqModal(null)}
                style={{ flex: 1, padding: '0.55rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, backgroundColor: '#F1F5F9', color: '#475569' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectVerification}
                style={{ flex: 1, padding: '0.55rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, backgroundColor: '#DC2626', color: '#FFFFFF' }}
              >
                Decline Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: NEW ANNOUNCEMENT MODAL
          ========================================================================= */}
      {isNewAnnModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 29, 89, 0.65)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setIsNewAnnModalOpen(false)}
        >
          <div
            style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1.5px solid #CBD5E1', width: '100%', maxWidth: '480px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#002B7F', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Megaphone size={18} /> Post Campus Broadcast
              </h3>
              <button onClick={() => setIsNewAnnModalOpen(false)} style={{ color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
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
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Target Campus
                  </label>
                  <select
                    value={newAnnCampus}
                    onChange={(e: any) => setNewAnnCampus(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
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
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Category
                  </label>
                  <select
                    value={newAnnType}
                    onChange={(e: any) => setNewAnnType(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  >
                    <option value="info">Information</option>
                    <option value="alert">Safety Alert</option>
                    <option value="event">Trading Event</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                  Broadcast Message *
                </label>
                <textarea
                  rows={3}
                  placeholder="Type the announcement details..."
                  value={newAnnMessage}
                  onChange={(e) => setNewAnnMessage(e.target.value)}
                  className="clean-input"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsNewAnnModalOpen(false)}
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, backgroundColor: '#F1F5F9', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.82rem', fontWeight: 800, justifyContent: 'center' }}
                >
                  Publish Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: FULL-SCREEN ID PHOTO VIEWER
          ========================================================================= */}
      {inspectedImage && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
          onClick={() => setInspectedImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '700px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={inspectedImage} alt="ID Document Inspection" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '12px', objectFit: 'contain' }} />
            <button
              onClick={() => setInspectedImage(null)}
              style={{ marginTop: '1rem', backgroundColor: '#FFFFFF', color: '#0F172A', padding: '0.5rem 1.25rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 800 }}
            >
              Close Viewer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
