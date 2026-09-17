import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useToast } from '../components/common/Toast';
import { VerificationRequest, User, Listing, Campus, TradeDispute } from '../types';
import {
  ShieldAlert,
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
  Heart,
  ExternalLink,
  Filter,
  Receipt,
  Edit3,
  Clock,
  Building2
} from 'lucide-react';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { CampusBadge } from '../components/common/CampusBadge';
import { UserAvatar } from '../components/common/UserAvatar';

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

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
    banUserByAdmin,
    unbanUserByAdmin,
    warnUserByAdmin,
    toggleVerifyByAdmin,
    deleteUserByAdmin,
    createAnnouncement,
    deleteAnnouncement,
    toggleAnnouncement,
    addProhibitedKeyword,
    removeProhibitedKeyword,
    resolveDispute,
    adjustUserTrustScore,
    allUsers,
    listings,
    flashRequests = [],
    wantedRequests = [],
    transactions = [],
    meetups,
    createListingByAdmin,
    updateListingByAdmin,
    deleteFlashRequest,
    removeWantedByAdmin,
    deleteWantedRequest,
    completeTransactionByAdmin,
    cancelTransactionByAdmin,
    completeMeetupByAdmin,
    cancelMeetupByAdmin
  } = useAdmin();

  const { adminUser: currentUser, isAdminAuthenticated: isAdmin, login, logout, forgotPassword, resetPassword } = useAdminAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'verifications'
    | 'users'
    | 'listings'
    | 'scanner'
    | 'disputes'
    | 'reputation'
    | 'flash-market'
    | 'wanted'
    | 'transactions'
    | 'meetups'
    | 'announcements'
    | 'audit'
  >('overview');

  // Admin gate login input state
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  // Search and filters
  const [userSearch, setUserSearch] = useState('');
  const [userCampusFilter, setUserCampusFilter] = useState<string>('All');
  const [verificationFilter, setVerificationFilter] = useState<'pending' | 'suspicious' | 'approved' | 'rejected' | 'all'>('pending');

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

  // Audit Log Filters
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState<string>('');

  // Modals state
  const [inspectedImage, setInspectedImage] = useState<string | null>(null);
  const [banModalUser, setBanModalUser] = useState<User | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('');
  const [rejectReqModal, setRejectReqModal] = useState<VerificationRequest | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<any | null>(null);
  const [isNewAnnModalOpen, setIsNewAnnModalOpen] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnMessage, setNewAnnMessage] = useState('');
  const [newAnnCampus, setNewAnnCampus] = useState<Campus | 'All'>('All');
  const [newAnnType, setNewAnnType] = useState<'info' | 'alert' | 'event'>('info');

  // Listings Manager States
  const [listingSearch, setListingSearch] = useState('');
  const [listingStatusFilter, setListingStatusFilter] = useState<'all' | 'active' | 'sold'>('all');
  const [listingCampusFilter, setListingCampusFilter] = useState<string>('All');
  const [listingCategoryFilter, setListingCategoryFilter] = useState<string>('All');
  const [listingDeleteModal, setListingDeleteModal] = useState<{ flagId?: string; listingId: string; title: string } | null>(null);
  const [visibleListingsCount, setVisibleListingsCount] = useState(25);

  // Admin Create / Edit Listing States
  const [isCreateListingModalOpen, setIsCreateListingModalOpen] = useState(false);
  const [editingAdminListing, setEditingAdminListing] = useState<Listing | null>(null);
  const [adminListingForm, setAdminListingForm] = useState({
    title: '',
    category: 'Electronics',
    price: 0,
    originalSrp: 0,
    tradeMode: 'buy_sell' as 'buy_sell' | 'swap' | 'free_donation',
    condition: 'Like New',
    quantity: 1,
    campus: 'UC Main',
    status: 'active' as 'active' | 'sold',
    description: '',
    imageUrl: ''
  });

  const handleOpenCreateListing = () => {
    setAdminListingForm({
      title: '',
      category: 'Electronics',
      price: 0,
      originalSrp: 0,
      tradeMode: 'buy_sell',
      condition: 'Like New',
      quantity: 1,
      campus: 'UC Main',
      status: 'active',
      description: '',
      imageUrl: ''
    });
    setIsCreateListingModalOpen(true);
  };

  const handleOpenEditListing = (listing: Listing) => {
    setEditingAdminListing(listing);
    setAdminListingForm({
      title: listing.title,
      category: listing.category || 'Electronics',
      price: listing.price || 0,
      originalSrp: listing.originalSrp || 0,
      tradeMode: listing.tradeMode || 'buy_sell',
      condition: listing.condition || 'Like New',
      quantity: listing.quantity !== undefined ? listing.quantity : 1,
      campus: listing.sellerCampus || 'UC Main',
      status: listing.status === 'sold' || listing.isSold ? 'sold' : 'active',
      description: listing.description || '',
      imageUrl: listing.images?.[0] || ''
    });
  };

  const handleSaveCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminListingForm.title.trim()) {
      showToast('Validation Error', 'Listing title is required.', 'warning');
      return;
    }
    try {
      await createListingByAdmin({
        title: adminListingForm.title.trim(),
        category: adminListingForm.category,
        price: Number(adminListingForm.price) || 0,
        originalSrp: adminListingForm.originalSrp ? Number(adminListingForm.originalSrp) : undefined,
        tradeMode: adminListingForm.tradeMode,
        condition: adminListingForm.condition,
        quantity: Number(adminListingForm.quantity) || 1,
        description: adminListingForm.description.trim(),
        images: adminListingForm.imageUrl.trim() ? [adminListingForm.imageUrl.trim()] : []
      });
      showToast('Listing Created', `Created official listing "${adminListingForm.title}".`, 'success');
      setIsCreateListingModalOpen(false);
    } catch (err: any) {
      showToast('Creation Failed', err?.message || 'Failed to create listing.', 'error');
    }
  };

  const handleSaveEditListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminListing) return;
    try {
      await updateListingByAdmin(editingAdminListing.id, {
        title: adminListingForm.title.trim(),
        category: adminListingForm.category,
        price: Number(adminListingForm.price) || 0,
        originalSrp: adminListingForm.originalSrp ? Number(adminListingForm.originalSrp) : undefined,
        tradeMode: adminListingForm.tradeMode,
        condition: adminListingForm.condition,
        quantity: Number(adminListingForm.quantity) || 0,
        status: adminListingForm.status,
        description: adminListingForm.description.trim(),
        images: adminListingForm.imageUrl.trim() ? [adminListingForm.imageUrl.trim()] : editingAdminListing.images
      });
      showToast('Listing Updated', `"${adminListingForm.title}" updated successfully.`, 'success');
      setEditingAdminListing(null);
    } catch (err: any) {
      showToast('Update Failed', err?.message || 'Failed to update listing.', 'error');
    }
  };

  const pendingRequests = verificationRequests.filter((r) => r.status === 'pending');
  const pendingFlags = flaggedListings.filter((f) => f.status === 'pending');
  const bannedUsers = allUsers.filter((u) => u.isBanned);

  const handleAdminGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmailInput.trim() || !adminPasswordInput.trim()) {
      showToast('Input Required', 'Please enter your administrator ID/email and password.', 'warning');
      return;
    }
    const res = await login(adminEmailInput, adminPasswordInput);
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
          <form onSubmit={handleAdminGateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                ID Number
              </label>
              <input
                type="text"
                value={adminEmailInput}
                onChange={(e) => setAdminEmailInput(e.target.value)}
                placeholder="ID Number"
                className="clean-input"
                autoFocus
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Password
              </label>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="Password"
                className="clean-input"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '0.75rem', width: '100%', fontWeight: 600, fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginTop: '0.25rem', borderRadius: '8px' }}
            >
              <LogIn size={16} style={{ flexShrink: 0 }} />
              <span>Sign In</span>
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
    setUserToDelete(user);
  };

  const handleConfirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserByAdmin(userToDelete.id);
      showToast('Account Deleted', `${userToDelete.name} was removed from the database.`, 'info');
      setUserToDelete(null);
    }
  };

  const handleConfirmDeleteRequest = () => {
    if (requestToDelete) {
      if (deleteFlashRequest) {
        deleteFlashRequest(requestToDelete.id, 'Moderator removed request');
      } else {
        removeWantedByAdmin(requestToDelete.id, 'Moderator removed request');
      }
      showToast('Flash Request Removed', `Removed "${requestToDelete.itemTitle}" from Flash Market.`, 'info');
      setRequestToDelete(null);
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
    setListingDeleteModal({ flagId, listingId, title });
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
      const textToSearch = `${item.title} ${item.description} ${item.category}`.toLowerCase();
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

  // Filtered Listings for Admin Management
  const listingCategories = Array.from(new Set(listings.map((l) => l.category).filter(Boolean)));
  const filteredAdminListings = listings.filter((l) => {
    const q = listingSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      l.title.toLowerCase().includes(q) ||
      (l.sellerName && l.sellerName.toLowerCase().includes(q)) ||
      (l.description && l.description.toLowerCase().includes(q));
    const matchesCampus = listingCampusFilter === 'All' || l.sellerCampus === listingCampusFilter;
    const matchesCategory = listingCategoryFilter === 'All' || l.category === listingCategoryFilter;
    const isItemSold = l.status === 'sold' || l.isSold;
    const matchesStatus =
      listingStatusFilter === 'all' ||
      (listingStatusFilter === 'sold' ? isItemSold : !isItemSold);
    return matchesSearch && matchesCampus && matchesCategory && matchesStatus;
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
          { id: 'verifications', label: `ID Verifications (${pendingVerificationsCount})`, icon: <BadgeCheck size={14} /> },
          { id: 'users', label: `Users & Moderation (${allUsers.length})`, icon: <UserCheck size={14} /> },
          { id: 'listings', label: `Listings & Flags (${pendingFlagsCount})`, icon: <ShieldAlert size={14} /> },
          { id: 'scanner', label: `Prohibited Scanner (${scannedViolations.length})`, icon: <Shield size={14} /> },
          { id: 'disputes', label: `Trade Disputes (${pendingDisputesCount})`, icon: <Scale size={14} /> },
          { id: 'reputation', label: 'Trust & Reputation', icon: <Award size={14} /> },
          { id: 'flash-market', label: `Flash Market (${(flashRequests || wantedRequests).length})`, icon: <Zap size={14} /> },
          { id: 'transactions', label: `Transactions (${transactions.length})`, icon: <Receipt size={14} /> },
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
                {listings.filter((l) => l.status !== 'sold' && !l.isSold).length}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 700 }}>
                {listings.filter((l) => l.tradeMode === 'swap').length} Swaps • {listings.filter((l) => l.tradeMode === 'free_donation').length} Free
              </span>
            </div>

            <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Completed Trades</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#059669', fontFamily: 'var(--font-display)' }}>
                {listings.filter((l) => l.status === 'sold' || l.isSold).length}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>Successfully transacted</span>
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
                    <th style={{ padding: '0.65rem 0.75rem' }}>Flash Requests</th>
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
                    const campusFlash = (flashRequests.length > 0 ? flashRequests : wantedRequests).filter((w) => w.preferredCampus === campus);
                    const rate = campusUsers.length > 0 ? Math.round((campusVerified.length / campusUsers.length) * 100) : 0;
                    return (
                      <tr key={campus} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <CampusBadge campus={campus} size="sm" />
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0F172A' }}>{campusUsers.length}</td>
                        <td style={{ padding: '0.75rem', color: '#002B7F', fontWeight: 700 }}>{campusListings.length}</td>
                        <td style={{ padding: '0.75rem', color: '#D97706', fontWeight: 700 }}>{campusFlash.length}</td>
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
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(['pending', 'suspicious', 'approved', 'rejected', 'all'] as const).map((filter) => {
                const count = filter === 'suspicious'
                  ? verificationRequests.filter((r) => r.isSuspicious && r.status === 'pending').length
                  : filter === 'pending'
                    ? verificationRequests.filter((r) => r.status === 'pending').length
                    : filter === 'approved'
                      ? verificationRequests.filter((r) => r.status === 'approved').length
                      : filter === 'rejected'
                        ? verificationRequests.filter((r) => r.status === 'rejected').length
                        : verificationRequests.length;

                return (
                  <button
                    key={filter}
                    onClick={() => setVerificationFilter(filter)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: verificationFilter === filter ? 800 : 600,
                      backgroundColor: verificationFilter === filter
                        ? (filter === 'suspicious' ? '#DC2626' : '#002B7F')
                        : '#F1F5F9',
                      color: verificationFilter === filter ? '#FFFFFF' : '#475569',
                      textTransform: 'capitalize',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span>{filter}</span>
                    <span style={{
                      backgroundColor: verificationFilter === filter ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      fontSize: '0.7rem'
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {verificationRequests
              .filter((r) => {
                if (verificationFilter === 'all') return true;
                if (verificationFilter === 'suspicious') return r.isSuspicious && r.status === 'pending';
                return r.status === verificationFilter;
              })
              .map((req) => (
                <div
                  key={req.id}
                  className="clean-card"
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    border: req.isSuspicious && req.status === 'pending' ? '1.5px solid #FCA5A5' : undefined,
                    backgroundColor: req.isSuspicious && req.status === 'pending' ? '#FFFDFD' : undefined
                  }}
                >
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '6px',
                            backgroundColor: (req.confidenceScore ?? 0) >= 90 ? '#ECFDF5' : '#FEF3C7',
                            color: (req.confidenceScore ?? 0) >= 90 ? '#059669' : '#B45309',
                            border: `1px solid ${(req.confidenceScore ?? 0) >= 90 ? '#A7F3D0' : '#FDE68A'}`
                          }}
                        >
                          Confidence: {req.confidenceScore ?? 75}%
                        </span>
                        {req.isSuspicious && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '6px',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <AlertTriangle size={11} /> Suspicious Flag
                          </span>
                        )}
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

                  {/* Suspicious Reasons Diagnostic Box */}
                  {req.isSuspicious && req.suspiciousReasons && req.suspiciousReasons.length > 0 && (
                    <div
                      style={{
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#B91C1C', fontSize: '0.72rem', fontWeight: 800 }}>
                        <AlertTriangle size={12} />
                        <span>Action Required: Suspicious Signals Flagged</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.66rem', color: '#991B1B', lineHeight: 1.4 }}>
                        {req.suspiciousReasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Side-by-Side ID & Biometric Selfie Preview */}
                  <div style={{ display: 'grid', gridTemplateColumns: req.selfiePhotoUrl ? '1fr 1fr' : '1fr', gap: '0.5rem' }}>
                    {req.idCardImageUrl && (
                      <div
                        onClick={() => setInspectedImage(req.idCardImageUrl)}
                        style={{
                          height: '130px',
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
                            bottom: '4px',
                            left: '4px',
                            backgroundColor: 'rgba(0,0,0,0.75)',
                            color: '#FFFFFF',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.62rem',
                            fontWeight: 700
                          }}
                        >
                          ID Card
                        </div>
                      </div>
                    )}

                    {req.selfiePhotoUrl && (
                      <div
                        onClick={() => setInspectedImage(req.selfiePhotoUrl)}
                        style={{
                          height: '130px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#0F172A',
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                      >
                        <img src={req.selfiePhotoUrl} alt="Live Biometric Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: '4px',
                            backgroundColor: 'rgba(5, 150, 105, 0.85)',
                            color: '#FFFFFF',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.62rem',
                            fontWeight: 700
                          }}
                        >
                          Live Selfie
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rejection reason if already rejected */}
                  {req.status === 'rejected' && (req as any).rejectionReason && (
                    <div style={{ fontSize: '0.72rem', color: '#DC2626', backgroundColor: '#FEF2F2', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #FECACA' }}>
                      <strong>Reason:</strong> {(req as any).rejectionReason}
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
                style={{ paddingLeft: '2.5rem', fontSize: '0.82rem' }}
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
                          <UserAvatar src={u.avatar} name={u.name} size={36} />
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
                            <div style={{ width: `${Number(u.trustScore ?? 0)}%`, height: '100%', backgroundColor: Number(u.trustScore ?? 0) > 70 ? '#059669' : Number(u.trustScore ?? 0) > 0 ? '#D97706' : '#94A3B8' }} />
                          </div>
                          <span style={{ fontWeight: 800, fontSize: '0.75rem' }}>{Number(u.trustScore ?? 0)}/100</span>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldAlert size={18} /> Reported Items Queue ({pendingFlags.length})
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Community-submitted listing moderation flags
              </span>
            </div>

            {pendingFlags.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B', fontSize: '0.85rem' }}>
                <Check size={28} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
                <span style={{ fontWeight: 700, color: '#059669', display: 'block' }}>All Clean!</span>
                <span>All reported listings have been reviewed and resolved.</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {pendingFlags.map((flag) => (
                  <div key={flag.id} style={{ border: '1.5px solid #FECACA', borderRadius: '10px', padding: '1rem', backgroundColor: '#FFF5F5', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <img
                        src={flag.listingImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120&auto=format&fit=crop&q=80'}
                        alt={flag.listingTitle}
                        style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {flag.listingTitle}
                        </h4>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                          <span>Seller: {flag.sellerName}</span>
                          {flag.campus && <CampusBadge campus={flag.campus as Campus} size="sm" />}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700, marginTop: '0.25rem' }}>
                          Reason: {flag.reason}
                        </div>
                        {flag.reporterName && (
                          <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '0.2rem' }}>
                            Reported by <strong>{flag.reporterName}</strong> {flag.reportedAt ? `• ${formatRelativeTime(flag.reportedAt)}` : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <button
                        onClick={() => handleResolveFlag(flag.id)}
                        style={{ flex: 1, padding: '0.45rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, backgroundColor: '#059669', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
                      >
                        Dismiss / Mark Safe
                      </button>
                      <button
                        onClick={() => handleRemoveListing(flag.id, flag.listingId, flag.listingTitle)}
                        style={{ flex: 1, padding: '0.45rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
                      >
                        Take Down
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Listings Manager with Filtering & Search */}
          <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                  Marketplace Directory ({filteredAdminListings.length} / {listings.length} items)
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.15rem' }}>
                  Search and manage listings across all 8 UC campuses or take down non-compliant items.
                </p>
              </div>

              <button
                onClick={handleOpenCreateListing}
                className="btn-gold"
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Plus size={14} /> Post Official Listing
              </button>
            </div>

            {/* Filter Controls Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '200px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search item, seller, or description..."
                  value={listingSearch}
                  onChange={(e) => {
                    setListingSearch(e.target.value);
                    setVisibleListingsCount(25);
                  }}
                  className="clean-input"
                  style={{ paddingLeft: '2.25rem', fontSize: '0.82rem', height: '36px' }}
                />
              </div>

              {/* Status Filter */}
              <select
                value={listingStatusFilter}
                onChange={(e: any) => {
                  setListingStatusFilter(e.target.value);
                  setVisibleListingsCount(25);
                }}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', height: '36px', backgroundColor: '#FFFFFF', color: '#334155' }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="sold">Sold / Completed</option>
              </select>

              {/* Campus Filter */}
              <select
                value={listingCampusFilter}
                onChange={(e) => {
                  setListingCampusFilter(e.target.value);
                  setVisibleListingsCount(25);
                }}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', height: '36px', backgroundColor: '#FFFFFF', color: '#334155' }}
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

              {/* Category Filter */}
              {listingCategories.length > 0 && (
                <select
                  value={listingCategoryFilter}
                  onChange={(e) => {
                    setListingCategoryFilter(e.target.value);
                    setVisibleListingsCount(25);
                  }}
                  style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', height: '36px', backgroundColor: '#FFFFFF', color: '#334155' }}
                >
                  <option value="All">All Categories</option>
                  {listingCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}

              {/* Reset Filters button */}
              {(listingSearch || listingStatusFilter !== 'all' || listingCampusFilter !== 'All' || listingCategoryFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setListingSearch('');
                    setListingStatusFilter('all');
                    setListingCampusFilter('All');
                    setListingCategoryFilter('All');
                    setVisibleListingsCount(25);
                  }}
                  style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', fontWeight: 600, color: '#64748B', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                >
                  Reset
                </button>
              )}
            </div>

            {/* Listings Table */}
            {filteredAdminListings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748B' }}>
                <Search size={32} color="#94A3B8" style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#334155' }}>No listings matched the filter criteria</div>
                <p style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>Try clearing the search query or adjusting campus/status filters.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                      <th style={{ padding: '0.65rem 0.75rem' }}>Item</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>Campus</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>Price / Mode</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>Engagement</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>Seller</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdminListings.slice(0, visibleListingsCount).map((l) => {
                      const isSold = l.status === 'sold' || l.isSold;
                      return (
                        <tr key={l.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <img
                                src={l.images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120&auto=format&fit=crop&q=80'}
                                alt={l.title}
                                style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                                  {l.title}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#002B7F', backgroundColor: '#EBF1FC', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                    {l.category}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{l.condition}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <CampusBadge campus={l.sellerCampus} size="sm" />
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span
                              style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                backgroundColor: isSold ? '#F1F5F9' : '#ECFDF5',
                                color: isSold ? '#64748B' : '#059669'
                              }}
                            >
                              {isSold ? 'Sold' : 'Active'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {l.tradeMode === 'free_donation' ? (
                              <span style={{ fontWeight: 800, color: '#059669', backgroundColor: '#ECFDF5', padding: '0.2rem 0.45rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                                FREE
                              </span>
                            ) : l.tradeMode === 'swap' ? (
                              <span style={{ fontWeight: 800, color: '#D97706', backgroundColor: '#FFFBEB', padding: '0.2rem 0.45rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                                SWAP
                              </span>
                            ) : (
                              <span style={{ fontWeight: 800, color: '#002B7F' }}>
                                ₱{l.price.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.75rem', color: '#64748B' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }} title="Total Views">
                                <Eye size={13} /> {l.views || 0}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem', color: '#334155' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontWeight: 600 }}>{l.sellerName}</span>
                              {l.sellerIsVerified && <VerifiedBadge size="sm" />}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                              <button
                                onClick={() => handleOpenEditListing(l)}
                                title="Edit Listing Details"
                                style={{
                                  padding: '0.35rem 0.6rem',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  backgroundColor: '#EBF1FC',
                                  color: '#002B7F',
                                  border: '1px solid #BCD1F7',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <Edit3 size={12} /> Edit
                              </button>
                              <button
                                onClick={() => handleRemoveListing('direct', l.id, l.title)}
                                title="Take Down Listing"
                                style={{ padding: '0.35rem 0.55rem', borderRadius: '6px', color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', cursor: 'pointer' }}
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
            )}

            {/* Pagination / Load More */}
            {filteredAdminListings.length > visibleListingsCount && (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setVisibleListingsCount((prev) => prev + 25)}
                  className="btn-outline"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  Load More Listings ({filteredAdminListings.length - visibleListingsCount} remaining)
                </button>
              </div>
            )}
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
                placeholder="Prohibited term"
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
                            <span key={kw} style={{ fontSize: '0.68rem', fontWeight: 800, backgroundColor: '#DC2626', color: '#FFFFFF', padding: '0.15rem 0.4rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <AlertTriangle size={10} /> Matched: {kw}
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
                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} /> Case Resolved ({disp.verdictAction?.toUpperCase()}): {disp.verdictNote}
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
                  placeholder="Reason for adjustment"
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
                  .filter((u) => Number(u.trustScore ?? 0) >= 90)
                  .map((u) => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.65rem', borderRadius: '6px', backgroundColor: '#ECFDF5', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserAvatar src={u.avatar} name={u.name} size={28} />
                        <div>
                          <strong style={{ color: '#065F46' }}>{u.name}</strong>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{u.campus}</div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 900, color: '#059669' }}>{Number(u.trustScore ?? 0)}/100</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Low Trust Watchlist */}
            <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <AlertTriangle size={16} /> Moderation Watchlist (Warnings / Low Trust)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allUsers
                  .filter((u) => (u.warningsCount || 0) > 0 || (Number(u.trustScore ?? 0) < 75 && (u.completedTrades || 0) > 0))
                  .map((u) => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.65rem', borderRadius: '6px', backgroundColor: '#FEF2F2', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserAvatar src={u.avatar} name={u.name} size={28} />
                        <div>
                          <strong style={{ color: '#991B1B' }}>{u.name}</strong>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{u.campus} • {u.warningsCount || 0} Strikes</div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 900, color: '#DC2626' }}>{Number(u.trustScore ?? 0)}/100</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 8: FLASH MARKET MODERATION
          ========================================================================= */}
      {(activeTab === 'flash-market' || activeTab === 'wanted') && (
        <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={20} color="var(--uc-gold, #FFC72C)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Student Flash Market Requests ({(flashRequests.length > 0 ? flashRequests : wantedRequests).length})
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                Rapid peer-to-peer campus broadcasts. Flash requests are lightweight text broadcasts without photo uploads.
              </p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Requested Item</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Campus</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Target Budget</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Urgency</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Requester</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(flashRequests.length > 0 ? flashRequests : wantedRequests).map((w) => {
                  const isCardExpired = Boolean(w.isExpired || w.status === 'expired' || (w.expiresAt && new Date(w.expiresAt).getTime() <= Date.now()));
                  return (
                    <tr key={w.id} style={{ borderBottom: '1px solid #F1F5F9', opacity: isCardExpired ? 0.75 : 1 }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>{w.itemTitle}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{w.description}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <CampusBadge campus={w.preferredCampus} size="sm" />
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 800, color: '#002B7F' }}>₱{w.targetBudget.toLocaleString()}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: w.urgency === 'Immediate / Urgent' ? '#FEF2F2' : '#F1F5F9',
                          color: w.urgency === 'Immediate / Urgent' ? '#DC2626' : '#475569'
                        }}>
                          {w.urgency || 'Standard'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {isCardExpired ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#F1F5F9', color: '#64748B' }}>
                            <Clock size={11} /> Expired
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#ECFDF5', color: '#059669' }}>
                            <Check size={11} /> Active
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <UserAvatar src={w.requesterAvatar} name={w.requesterName} size={24} />
                          <span style={{ color: '#334155', fontWeight: 600 }}>{w.requesterName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button
                          onClick={() => setRequestToDelete(w)}
                          title="Remove Flash Request"
                          style={{ padding: '0.35rem 0.55rem', borderRadius: '6px', color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', cursor: 'pointer' }}
                        >
                          <Trash2 size={13} />
                        </button>
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
          TAB 9: CAMPUS TRANSACTIONS MONITOR
          ========================================================================= */}
      {(activeTab === 'transactions' || activeTab === 'meetups') && (
        <div className="clean-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                Campus Transactions Monitor ({transactions.length})
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
                Live ledger of direct student purchases, barter swaps, and order settlements across UC campuses.
              </p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Reference & Date</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Item & Mode</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Buyer ↔ Seller</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Payment</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Order Status</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Admin Overrides</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      No transactions recorded yet. When students place orders or swaps, they will appear here in real time.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx: any) => {
                    const refCode = tx.referenceNo || tx.reference_no || `TL-TX-${tx.id?.slice(0, 6)}`;
                    const amount = Number(tx.amount || tx.finalPrice || 0);
                    const payMethod = (tx.paymentMethod || tx.payment_method || 'cash').toUpperCase();
                    const payStatus = tx.paymentStatus || tx.payment_status || 'unpaid';
                    const txStatus = tx.status || 'pending';

                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 800, color: '#002B7F', fontFamily: 'monospace' }}>
                            {refCode}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                            {new Date(tx.createdAt || tx.created_at || Date.now()).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{tx.listingTitle || 'Campus Marketplace Item'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'capitalize' }}>
                            {(tx.tradeMode || tx.trade_mode || 'buy_sell').replace('_', '/')}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                            <span style={{ color: '#002B7F', fontWeight: 600 }}>Buyer:</span> {tx.buyerName || 'Student Buyer'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                            <span style={{ color: '#059669', fontWeight: 600 }}>Seller:</span> {tx.sellerName || 'Student Seller'}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 800, color: '#0F172A' }}>
                            {amount > 0 ? `₱${amount.toLocaleString()}` : 'Free / Barter'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            {payMethod} • <span style={{ color: payStatus === 'paid' ? '#059669' : '#D97706', fontWeight: 600 }}>{payStatus}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span
                            style={{
                              padding: '0.25rem 0.55rem',
                              borderRadius: '9999px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              backgroundColor: txStatus === 'completed' ? '#ECFDF5' : txStatus === 'cancelled' ? '#FEF2F2' : '#FFFBEB',
                              color: txStatus === 'completed' ? '#059669' : txStatus === 'cancelled' ? '#DC2626' : '#D97706'
                            }}
                          >
                            {txStatus.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          {txStatus === 'pending' && (
                            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                              <button
                                onClick={() => {
                                  completeTransactionByAdmin(tx.id);
                                  showToast('Completed', 'Transaction marked as completed.', 'success');
                                }}
                                style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#059669', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => {
                                  cancelTransactionByAdmin(tx.id, 'Cancelled by admin moderation desk');
                                  showToast('Cancelled', 'Transaction cancelled.', 'info');
                                }}
                                style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 11: CAMPUS BROADCAST ANNOUNCEMENTS
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

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit trail..."
                className="clean-input"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', minWidth: '180px' }}
              />
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
              You are about to suspend <strong>{banModalUser.name}</strong> ({banModalUser.studentId} • {banModalUser.campus}). They will be locked out of buying, selling, and chatting on TradeLink.
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
                style={{ padding: '0.55rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, backgroundColor: '#059669', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Check size={13} />
                <span>Remedy / Refund</span>
              </button>
              <button
                onClick={() => handleConfirmDisputeVerdict('warning')}
                style={{ padding: '0.55rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, backgroundColor: '#D97706', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <AlertTriangle size={13} />
                <span>Issue Strike Warning</span>
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

            {/* Preset Rejection Reasons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>Quick Presets:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {[
                  'Incomplete or blurry student ID photo',
                  'Face in live selfie does not match student ID photo',
                  'Student ID number does not match card details',
                  'ID card appears expired or unreadable'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReasonInput(preset)}
                    style={{
                      fontSize: '0.68rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: rejectReasonInput === preset ? '#FEF2F2' : '#F8FAFC',
                      color: rejectReasonInput === preset ? '#DC2626' : '#475569',
                      border: `1px solid ${rejectReasonInput === preset ? '#FECACA' : '#E2E8F0'}`,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

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
                  placeholder="Announcement title"
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
          MODALS: LISTING DELETION CONFIRMATION
          ========================================================================= */}
      {listingDeleteModal && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)', zIndex: 3500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setListingDeleteModal(null)}
        >
          <div
            style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #CBD5E1', width: '100%', maxWidth: '440px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', flexShrink: 0 }}>
                <Trash2 size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-display)' }}>
                  Take Down Listing?
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.35rem', lineHeight: 1.45 }}>
                  Are you sure you want to permanently remove <strong style={{ color: '#0F172A' }}>"{listingDeleteModal.title}"</strong>? This will delete associated images, tags, favorites, and pending flags.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setListingDeleteModal(null)}
                style={{ padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  removeListingByAdmin(listingDeleteModal.listingId, listingDeleteModal.flagId);
                  showToast('Listing Removed', `"${listingDeleteModal.title}" has been taken down.`, 'info');
                  setListingDeleteModal(null);
                }}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
              >
                Confirm Take Down
              </button>
            </div>
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

      {/* =========================================================================
          MODALS: ADMIN CREATE OFFICIAL LISTING
          ========================================================================= */}
      {isCreateListingModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 29, 89, 0.65)', backdropFilter: 'blur(6px)', zIndex: 3200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setIsCreateListingModalOpen(false)}
        >
          <div
            style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #CBD5E1', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#002B7F', fontFamily: 'var(--font-display)', margin: 0 }}>
                  Post Official Campus Listing
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                  Create verified inventory items on behalf of UC Campus Hub
                </p>
              </div>
              <button onClick={() => setIsCreateListingModalOpen(false)} style={{ color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCreateListing} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                  Item Title *
                </label>
                <input
                  type="text"
                  placeholder="Listing title"
                  value={adminListingForm.title}
                  onChange={(e) => setAdminListingForm({ ...adminListingForm, title: e.target.value })}
                  className="clean-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Category *
                  </label>
                  <select
                    value={adminListingForm.category}
                    onChange={(e) => setAdminListingForm({ ...adminListingForm, category: e.target.value })}
                    className="clean-input"
                  >
                    <option value="Electronics">Electronics & Tech</option>
                    <option value="Textbooks">Textbooks & Reviewers</option>
                    <option value="Uniforms">Uniforms & Scrubs</option>
                    <option value="Junior High">Junior High (JHS)</option>
                    <option value="Senior High">Senior High (SHS)</option>
                    <option value="Gaming">Gaming & PC Gear</option>
                    <option value="Fashion">Fashion & Footwear</option>
                    <option value="Music">Music & Audio</option>
                    <option value="Dorm">Dorm & Living</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Trade Mode *
                  </label>
                  <select
                    value={adminListingForm.tradeMode}
                    onChange={(e: any) => setAdminListingForm({ ...adminListingForm, tradeMode: e.target.value })}
                    className="clean-input"
                  >
                    <option value="buy_sell">Buy & Sell</option>
                    <option value="swap">Swap / Barter</option>
                    <option value="free_donation">Free Donation</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Price (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adminListingForm.price}
                    onChange={(e) => setAdminListingForm({ ...adminListingForm, price: Number(e.target.value) })}
                    className="clean-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Original SRP (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adminListingForm.originalSrp || ''}
                    onChange={(e) => setAdminListingForm({ ...adminListingForm, originalSrp: Number(e.target.value) })}
                    placeholder="Optional"
                    className="clean-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={adminListingForm.quantity}
                    onChange={(e) => setAdminListingForm({ ...adminListingForm, quantity: Math.max(1, Number(e.target.value)) })}
                    className="clean-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Condition *
                  </label>
                  <select
                    value={adminListingForm.condition}
                    onChange={(e) => setAdminListingForm({ ...adminListingForm, condition: e.target.value })}
                    className="clean-input"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Like New">Like New</option>
                    <option value="Lightly Used">Lightly Used</option>
                    <option value="Well Used">Well Used</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Campus Hub
                  </label>
                  <select
                    value={adminListingForm.campus}
                    onChange={(e) => setAdminListingForm({ ...adminListingForm, campus: e.target.value })}
                    className="clean-input"
                  >
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

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="Image URL"
                  value={adminListingForm.imageUrl}
                  onChange={(e) => setAdminListingForm({ ...adminListingForm, imageUrl: e.target.value })}
                  className="clean-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide specifications, pickup guidelines, and official verification details..."
                  value={adminListingForm.description}
                  onChange={(e) => setAdminListingForm({ ...adminListingForm, description: e.target.value })}
                  className="clean-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateListingModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '0.6rem 1.1rem', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.4rem', fontSize: '0.84rem', fontWeight: 800 }}
                >
                  Publish Official Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: ADMIN EDIT LISTING
          ========================================================================= */}
      {editingAdminListing && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 29, 89, 0.65)', backdropFilter: 'blur(6px)', zIndex: 3200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setEditingAdminListing(null)}
        >
          <div
            style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #CBD5E1', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#002B7F', fontFamily: 'var(--font-display)', margin: 0 }}>
                  Edit Marketplace Item
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                  Admin override for listing #{editingAdminListing.id.slice(0, 8)}
                </p>
              </div>
              <button onClick={() => setEditingAdminListing(null)} style={{ color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditListing} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                  Item Title *
                </label>
                <input
                  type="text"
                  value={adminListingForm.title}
                  onChange={(e) => setAdminListingForm({ ...adminListingForm, title: e.target.value })}
                  className="clean-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Listing Status
                  </label>
                  <select
                    value={adminListingForm.status}
                    onChange={(e: any) => setAdminListingForm({ ...adminListingForm, status: e.target.value })}
                    className="clean-input"
                  >
                    <option value="active">Active (Available)</option>
                    <option value="sold">Sold / Completed</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={adminListingForm.category}
                    onChange={(e) => setAdminListingForm({ ...adminListingForm, category: e.target.value })}
                    className="clean-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Price (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adminListingForm.price}
                    onChange={(e) => setAdminListingForm({ ...adminListingForm, price: Number(e.target.value) })}
                    className="clean-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Original SRP (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adminListingForm.originalSrp || ''}
                    onChange={(e) => setAdminListingForm({ ...adminListingForm, originalSrp: Number(e.target.value) })}
                    className="clean-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adminListingForm.quantity}
                    onChange={(e) => setAdminListingForm({ ...adminListingForm, quantity: Math.max(0, Number(e.target.value)) })}
                    className="clean-input"
                  />
                </div>
              </div>



              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={adminListingForm.description}
                  onChange={(e) => setAdminListingForm({ ...adminListingForm, description: e.target.value })}
                  className="clean-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingAdminListing(null)}
                  className="btn-secondary"
                  style={{ padding: '0.6rem 1.1rem', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.4rem', fontSize: '0.84rem', fontWeight: 800 }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(userToDelete)}
        title="Permanently Delete Account?"
        message={`Are you sure you want to permanently delete ${userToDelete?.name}'s account? This will remove all their profile data and cannot be undone.`}
        confirmText="Delete Account"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDeleteUser}
        onCancel={() => setUserToDelete(null)}
      />

      {/* Delete Request Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(requestToDelete)}
        title="Delete Post?"
        message={`Are you sure you want to delete the request for "${requestToDelete?.itemTitle || 'this item'}"?`}
        confirmText="Delete Request"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDeleteRequest}
        onCancel={() => setRequestToDelete(null)}
      />
    </div>
  );
};
