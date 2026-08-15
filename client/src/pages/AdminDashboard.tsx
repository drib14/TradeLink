import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useWanted } from '../context/WantedContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/common/Toast';
import { VerificationRequest, User, Listing, WantedRequest, MeetupTransaction, Campus, CampusAnnouncement, AdminAuditLog } from '../types';
import { FlaggedListingItem } from '../context/AdminContext';
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
  Clock,
  Building2,
  FileText,
  BadgeCheck,
  ArrowUpRight,
  TrendingUp,
  Radio,
  Plus
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
    pendingVerificationsCount,
    pendingFlagsCount,
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
    completeMeetupByAdmin
  } = useAdmin();

  const { allUsers, currentUser } = useAuth();
  const { listings } = useMarket();
  const { requests: wantedRequests, deleteRequest: deleteWantedRequest } = useWanted();
  const { meetups } = useChat();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'verifications' | 'users' | 'listings' | 'wanted' | 'meetups' | 'announcements' | 'audit'
  >('overview');

  // Search and filters
  const [userSearch, setUserSearch] = useState('');
  const [userCampusFilter, setUserCampusFilter] = useState<string>('All');
  const [listingSearch, setListingSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

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

  // Filtered Users
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.studentId.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesCampus = userCampusFilter === 'All' || u.campus === userCampusFilter;
    return matchesSearch && matchesCampus;
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
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.15rem' }}>
            Manage student verification requests, user suspensions, listing reports, safe meetup escrows, and campus broadcasts.
          </p>
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
          { id: 'wanted', label: `Wanted Board (${wantedRequests.length})`, icon: <Sparkles size={14} /> },
          { id: 'meetups', label: `Meetup Escrows (${meetups.length})`, icon: <MapPin size={14} /> },
          { id: 'announcements', label: `Broadcasts (${announcements.length})`, icon: <Megaphone size={14} /> },
          { id: 'audit', label: `Audit Log (${auditLogs.length})`, icon: <History size={14} /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.5rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: isActive ? 800 : 600,
                backgroundColor: isActive ? '#002B7F' : 'transparent',
                color: isActive ? '#FFFFFF' : '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
            >
              {tab.icon}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Reported / Flagged Items</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: pendingFlags.length > 0 ? '#DC2626' : '#059669', fontFamily: 'var(--font-display)' }}>
                {pendingFlags.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700 }}>Action required</span>
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
          TAB 3: USER ACCOUNTS & MODERATION (BANNING / SUSPENSION)
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
          TAB 5: WANTED BOARD & PASABUY MODERATION
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
          TAB 6: SAFE MEETUP ESCROWS & LANDMARK HANDSHAKES
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
          TAB 7: CAMPUS BROADCAST ANNOUNCEMENTS
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
          TAB 8: REAL-TIME ADMIN AUDIT LOG
          ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} color="#002B7F" /> Administrative Activity & Audit Trail ({auditLogs.length})
          </h3>
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
                {auditLogs.map((log) => (
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
