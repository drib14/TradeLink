import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/common/Toast';
import { VerificationRequest, User } from '../types';
import { FlaggedListingItem } from '../context/AdminContext';
import {
  ShieldAlert,
  Trash2
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (view: string, param?: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const {
    verificationRequests,
    flaggedListings,
    approveVerification,
    rejectVerification,
    resolveFlag,
    removeListingByAdmin
  } = useAdmin();
  const { allUsers } = useAuth();
  const { listings } = useMarket();
  const { meetups } = useChat();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'verifications' | 'flags' | 'analytics'>('verifications');
  const [inspectedImage, setInspectedImage] = useState<string | null>(null);

  const pendingRequests = verificationRequests.filter((r: VerificationRequest) => r.status === 'pending');
  const pendingFlags = flaggedListings.filter((f: FlaggedListingItem) => f.status === 'pending');

  const handleApprove = (reqId: string, name: string) => {
    approveVerification(reqId);
    showToast('Verified', `${name} has been verified.`, 'success');
  };

  const handleReject = (reqId: string, name: string) => {
    rejectVerification(reqId);
    showToast('Declined', `Declined verification request for ${name}.`, 'info');
  };

  const handleResolveFlag = (flagId: string) => {
    resolveFlag(flagId);
    showToast('Resolved', 'Listing marked as safe.', 'success');
  };

  const handleRemoveListing = (flagId: string, listingId: string, title: string) => {
    if (window.confirm(`Delete "${title}" permanently?`)) {
      removeListingByAdmin(flagId, listingId);
      showToast('Deleted', `"${title}" has been deleted.`, 'info');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#D97706', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <ShieldAlert size={14} /> Campus Moderation
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#18181B', marginTop: '0.15rem' }}>
            Moderation & ID Review
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#71717A' }}>
            Review student ID credentials, safety reports, and campus analytics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span style={{ backgroundColor: '#F4F4F5', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#18181B' }}>
            {pendingRequests.length} Pending IDs
          </span>
          <span style={{ backgroundColor: '#FEF2F2', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#DC2626' }}>
            {pendingFlags.length} Flagged
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E4E4E7', padding: '1rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#71717A', fontWeight: 600 }}>Students Registered</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#18181B', marginTop: '0.15rem' }}>{allUsers.length}</div>
          <span style={{ fontSize: '0.72rem', color: '#047857' }}>{allUsers.filter((u: User) => u.isVerified).length} Verified</span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E4E4E7', padding: '1rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#71717A', fontWeight: 600 }}>Active Listings</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#18181B', marginTop: '0.15rem' }}>{listings.length}</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E4E4E7', padding: '1rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#71717A', fontWeight: 600 }}>Handshakes</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#18181B', marginTop: '0.15rem' }}>{meetups.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'inline-flex', backgroundColor: '#F4F4F5', padding: '3px', borderRadius: '9999px', alignSelf: 'flex-start' }}>
        <button
          onClick={() => setActiveTab('verifications')}
          className={`segmented-tab ${activeTab === 'verifications' ? 'active' : ''}`}
        >
          ID Queue ({pendingRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('flags')}
          className={`segmented-tab ${activeTab === 'flags' ? 'active' : ''}`}
        >
          Safety Flags ({pendingFlags.length})
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`segmented-tab ${activeTab === 'analytics' ? 'active' : ''}`}
        >
          Campus Analytics
        </button>
      </div>

      {/* Tab 1: Verifications */}
      {activeTab === 'verifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {verificationRequests.length > 0 ? (
            verificationRequests.map((req: VerificationRequest) => (
              <div
                key={req.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #E4E4E7',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <img
                    src={req.idCardImageUrl}
                    alt="ID Proof"
                    onClick={() => setInspectedImage(req.idCardImageUrl)}
                    style={{
                      width: '72px',
                      height: '48px',
                      borderRadius: '6px',
                      objectFit: 'cover',
                      cursor: 'zoom-in',
                      border: '1px solid #E4E4E7'
                    }}
                    title="Zoom ID"
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#18181B' }}>
                        {req.userName}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#71717A' }}>({req.campus})</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#52525B', marginTop: '2px' }}>
                      ID: {req.studentIdNumber} • {req.college} • {req.userEmail}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {req.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprove(req.id, req.userName)}
                        className="btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                      >
                        Approve ID
                      </button>
                      <button
                        onClick={() => handleReject(req.id, req.userName)}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', color: '#DC2626' }}
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: req.status === 'approved' ? '#047857' : '#DC2626' }}>
                      {req.status.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#71717A', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E4E4E7' }}>
              No ID verification requests pending.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Flags */}
      {activeTab === 'flags' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {flaggedListings.length > 0 ? (
            flaggedListings.map((flag: FlaggedListingItem) => (
              <div
                key={flag.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #E4E4E7',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={flag.listingImage}
                    alt=""
                    style={{ width: '52px', height: '52px', borderRadius: '6px', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#18181B' }}>
                      {flag.listingTitle} ({flag.campus})
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600 }}>
                      "{flag.reason}"
                    </p>
                    <p style={{ fontSize: '0.7rem', color: '#71717A' }}>
                      Seller: {flag.sellerName}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {flag.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleResolveFlag(flag.id)}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                      >
                        Keep Safe
                      </button>
                      <button
                        onClick={() => handleRemoveListing(flag.id, flag.listingId, flag.listingTitle)}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', backgroundColor: '#DC2626', color: '#FFFFFF', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#71717A' }}>
                      {flag.status.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#71717A', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E4E4E7' }}>
              No safety flags reported.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Analytics */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {[
            { campus: 'UC Main', items: 12, volume: '₱14,200', students: '1,420 Active' },
            { campus: 'UC Banilad', items: 8, volume: '₱18,500', students: '1,150 Active' },
            { campus: 'UC LM', items: 9, volume: '₱12,800', students: '980 Active' },
            { campus: 'UC METC', items: 5, volume: '₱8,600', students: '700 Active' }
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #E4E4E7',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#18181B' }}>{stat.campus}</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#18181B', fontFamily: 'var(--font-display)' }}>
                {stat.volume}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#71717A' }}>Est. monthly trade volume</p>
              <div style={{ borderTop: '1px solid #F4F4F5', paddingTop: '0.45rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#52525B' }}>
                <span>{stat.items} Listings</span>
                <span>{stat.students}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Inspection Zoom Modal */}
      {inspectedImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '2rem'
          }}
          onClick={() => setInspectedImage(null)}
        >
          <div style={{ maxWidth: '640px', width: '100%', position: 'relative' }}>
            <img
              src={inspectedImage}
              alt="Zoomed ID"
              style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px' }}
            />
            <button
              onClick={() => setInspectedImage(null)}
              style={{
                position: 'absolute',
                top: '-36px',
                right: 0,
                color: '#FFFFFF',
                fontSize: '0.8rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '0.25rem 0.6rem',
                borderRadius: '4px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
