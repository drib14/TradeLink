import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { ListingCard } from '../components/marketplace/ListingCard';
import { useToast } from '../components/common/Toast';
import { SEED_REVIEWS } from '../data/seedData';
import { DragDropUpload } from '../components/common/DragDropUpload';
import { User, Listing, Review } from '../types';
import {
  ShieldCheck,
  Star,
  Clock,
  ArrowLeftRight,
  Upload,
  AlertCircle,
  FileCheck,
  Edit3
} from 'lucide-react';

interface ProfilePageProps {
  userId?: string;
  onNavigate: (view: string, param?: any) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ userId, onNavigate }) => {
  const { currentUser, allUsers, updateProfile, submitIdVerification } = useAuth();
  const { listings } = useMarket();
  const { showToast } = useToast();

  const targetUser = (userId ? allUsers.find((u: User) => u.id === userId) : null) || currentUser || allUsers[0];
  const isSelf = !!currentUser && currentUser.id === targetUser.id;

  const [activeTab, setActiveTab] = useState<'listings' | 'reviews' | 'verify'>('listings');
  const [bioInput, setBioInput] = useState(targetUser?.bio || '');
  const [isEditingBio, setIsEditingBio] = useState(false);

  const [studentIdInput, setStudentIdInput] = useState(targetUser?.studentId || '202501824');
  const [idPhotoPreview, setIdPhotoPreview] = useState<string>(
    targetUser?.idPhotoUrl ||
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80'
  );

  const userListings = listings.filter((l: Listing) => l.sellerId === targetUser?.id && !l.isSold);
  const userReviews = SEED_REVIEWS.filter((r: Review) => r.targetUserId === targetUser?.id);

  const handleSaveBio = () => {
    updateProfile({ bio: bioInput });
    setIsEditingBio(false);
    showToast('Bio Updated', 'Profile bio saved.', 'success');
  };

  const formatStudentIdNumber = (val: string): string => {
    return val.replace(/\D/g, '').slice(0, 10);
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setIdPhotoPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = studentIdInput.replace(/\D/g, '');
    if (cleanDigits.length < 6) {
      showToast(
        'Invalid Student ID',
        'Please enter a valid numeric UC Student ID (e.g., 2024-05182). Letters and special characters are not permitted.',
        'warning'
      );
      return;
    }

    submitIdVerification(studentIdInput, idPhotoPreview);
    showToast(
      'ID Submitted',
      'Your UC Student ID is sent for moderation approval.',
      'info'
    );
  };

  return (
    <div className="container" style={{ maxWidth: '920px', padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Profile Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E4E4E7',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img
              src={targetUser.avatar}
              alt={targetUser.name}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid #E4E4E7'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#18181B' }}>
                  {targetUser.name}
                </h1>
                {targetUser.isVerified && (
                  <VerifiedBadge size="sm" variant={targetUser.role === 'admin' ? 'gold' : 'blue'} />
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#71717A', marginTop: '0.15rem' }}>
                {targetUser.campus} • {targetUser.college} • {targetUser.yearLevel}
              </div>
            </div>
          </div>

          <div>
            {targetUser.isVerified ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: '#ECFDF5',
                  color: '#047857',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
              >
                <ShieldCheck size={14} /> Verified Student
              </span>
            ) : (
              <button
                onClick={() => setActiveTab('verify')}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                <AlertCircle size={14} color="#D97706" /> Submit ID for Verification
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        <div style={{ backgroundColor: '#FAFAFA', borderRadius: '8px', padding: '0.85rem 1rem', border: '1px solid #F4F4F5' }}>
          {isEditingBio ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                rows={2}
                className="clean-input"
              />
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button onClick={handleSaveBio} className="btn-primary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}>
                  Save
                </button>
                <button onClick={() => setIsEditingBio(false)} className="btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.82rem', color: '#52525B', lineHeight: 1.5 }}>
                {targetUser.bio || 'No bio added yet.'}
              </p>
              {isSelf && (
                <button onClick={() => setIsEditingBio(true)} style={{ color: '#71717A', marginLeft: '0.5rem' }}>
                  <Edit3 size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Metrics Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.75rem'
          }}
        >
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: '8px', padding: '0.75rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#71717A', fontWeight: 600 }}>Trust Score</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>
              {targetUser.trustScore}%
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: '8px', padding: '0.75rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#71717A', fontWeight: 600 }}>Rating</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#18181B', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>
              {targetUser.rating.toFixed(1)} / 5.0
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: '8px', padding: '0.75rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#71717A', fontWeight: 600 }}>Punctuality</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#18181B', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>
              {targetUser.punctualityRate}%
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: '8px', padding: '0.75rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#71717A', fontWeight: 600 }}>Trades</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#18181B', fontFamily: 'var(--font-display)', marginTop: '0.1rem' }}>
              {targetUser.completedTrades} Completed
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'inline-flex', backgroundColor: '#F4F4F5', padding: '3px', borderRadius: '9999px', alignSelf: 'flex-start' }}>
        <button
          onClick={() => setActiveTab('listings')}
          className={`segmented-tab ${activeTab === 'listings' ? 'active' : ''}`}
        >
          Listings ({userListings.length})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`segmented-tab ${activeTab === 'reviews' ? 'active' : ''}`}
        >
          Reviews ({userReviews.length})
        </button>

        {isSelf && (
          <button
            onClick={() => setActiveTab('verify')}
            className={`segmented-tab ${activeTab === 'verify' ? 'active' : ''}`}
          >
            ID Verification
          </button>
        )}
      </div>

      {/* Tab 1: Listings */}
      {activeTab === 'listings' && (
        <div>
          {userListings.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '1rem'
              }}
            >
              {userListings.map((item: Listing) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  onClick={() => onNavigate('item-detail', { id: item.id })}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#71717A', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E4E4E7' }}>
              No active listings posted yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Reviews */}
      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {userReviews.length > 0 ? (
            userReviews.map((rev: Review) => (
              <div
                key={rev.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #E4E4E7',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img
                      src={rev.reviewerAvatar}
                      alt={rev.reviewerName}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#18181B' }}>{rev.reviewerName}</div>
                      <div style={{ fontSize: '0.68rem', color: '#71717A' }}>{rev.reviewerCampus}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', color: '#D97706' }}>
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} size={12} fill="#D97706" />
                    ))}
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#52525B', lineHeight: 1.45 }}>
                  "{rev.comment}"
                </p>

                <div style={{ fontSize: '0.72rem', color: '#71717A', paddingTop: '0.25rem', borderTop: '1px solid #F4F4F5' }}>
                  Item: {rev.itemTitle} • {rev.tradeType}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#71717A', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E4E4E7' }}>
              No reviews yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: ID Verification */}
      {activeTab === 'verify' && isSelf && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E4E4E7',
            padding: '1.5rem',
            maxWidth: '540px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck size={20} color="#2563EB" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#18181B' }}>
                UC Student ID Verification
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#71717A' }}>
                Get the Verified UCian checkbadge and increase your campus trust score.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitVerification} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#52525B', marginBottom: '0.25rem' }}>
                Student ID
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(formatStudentIdNumber(e.target.value))}
                placeholder="Student ID"
                className="clean-input"
                maxLength={10}
                required
              />
            </div>

            <DragDropUpload
              images={idPhotoPreview ? [idPhotoPreview] : []}
              onChange={(imgs) => setIdPhotoPreview(imgs[0] || '')}
              maxFiles={1}
              label="Student ID or Study Load (COR)"
              helperText="Drag & drop photo of your student ID here"
              isMultiple={false}
            />

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '0.55rem 1.15rem' }}>
              Submit for Verification
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
