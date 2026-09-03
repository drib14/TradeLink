import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/common/Toast';
import { HandshakeQRModal } from '../components/marketplace/HandshakeQRModal';
import { QRScannerModal } from '../components/marketplace/QRScannerModal';
import { ReviewModal } from '../components/marketplace/ReviewModal';
import { MeetupTransaction } from '../types';
import {
  ShieldCheck,
  MapPin,
  Calendar,
  KeyRound,
  CheckCircle2,
  QrCode,
  Camera,
  Star,
  ArrowRight,
  ShoppingBag,
  Copy,
  Navigation,
  Shield,
  Clock,
  Check
} from 'lucide-react';

interface MeetupsPageProps {
  onNavigate: (view: string, param?: any) => void;
  onOpenAuth?: () => void;
}

export const MeetupsPage: React.FC<MeetupsPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { currentUser } = useAuth();
  const { meetups, completeMeetupWithCode, updateMeetupStatus } = useChat();
  const { showToast } = useToast();

  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed'>('all');
  const [inputCodes, setInputCodes] = useState<Record<string, string>>({});
  const [isVerifyingMap, setIsVerifyingMap] = useState<Record<string, boolean>>({});
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const [selectedQRMeetup, setSelectedQRMeetup] = useState<MeetupTransaction | null>(null);
  const [selectedScanMeetup, setSelectedScanMeetup] = useState<MeetupTransaction | null>(null);
  const [selectedReviewMeetup, setSelectedReviewMeetup] = useState<MeetupTransaction | null>(null);

  const myMeetups = currentUser
    ? meetups.filter(
        (m: MeetupTransaction) => m.sellerId === currentUser.id || m.buyerId === currentUser.id
      )
    : [];

  const filteredMeetups = myMeetups.filter((m) => {
    if (filterTab === 'active') return m.status !== 'completed' && m.status !== 'cancelled';
    if (filterTab === 'completed') return m.status === 'completed';
    return true;
  });

  const handleCodeChange = (meetupId: string, val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    setInputCodes((prev) => ({ ...prev, [meetupId]: clean }));
  };

  const handleVerifySubmit = async (meetupId: string) => {
    const code = inputCodes[meetupId] || '';
    if (!code.trim() || code.length !== 4) {
      showToast('4-Digit Code Required', 'Please enter the complete 4-digit Handshake code provided by the buyer.', 'warning');
      return;
    }

    setIsVerifyingMap((prev) => ({ ...prev, [meetupId]: true }));
    try {
      const res = await completeMeetupWithCode(meetupId, code);
      if (res.success) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });

        showToast('Handshake Verified & Trade Completed!', res.message, 'success');
        setInputCodes((prev) => ({ ...prev, [meetupId]: '' }));

        // Automatically prompt review modal for the completed meetup
        const completedMeetup = myMeetups.find((m) => m.id === meetupId);
        if (completedMeetup) {
          setTimeout(() => {
            setSelectedReviewMeetup(completedMeetup);
          }, 800);
        }
      } else {
        showToast('Verification Failed', res.message, 'error');
      }
    } catch (err: any) {
      showToast('Error', err?.message || 'Verification failed. Please double-check the 4-digit code.', 'error');
    } finally {
      setIsVerifyingMap((prev) => ({ ...prev, [meetupId]: false }));
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    if (code && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      showToast('Code Copied', `Handshake code ${code} copied to clipboard.`, 'info');
      setTimeout(() => setCopiedCodeId(null), 2500);
    }
  };

  const handleMarkArrived = async (meetupId: string) => {
    await updateMeetupStatus(meetupId, 'on_the_way');
    showToast('Status Updated', 'Marked as at the campus meetup spot. Counterpart student notified.', 'success');
  };

  return (
    <div className="container page-enter" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--uc-blue, #002B7F)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <ShieldCheck size={16} /> Verified Campus Handshake Desk
        </div>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--text-primary, #002B7F)', letterSpacing: '-0.02em' }}>
          Safe Campus Meetups & OTP Verification
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748B)', maxWidth: '750px', lineHeight: 1.55 }}>
          Coordinate item inspection inside official University of Cebu guard stations and security desks. Trades are finalized securely using 4-digit OTP codes or live QR verification.
        </p>
      </div>

      {/* Safety Protocol Info Box */}
      <div
        style={{
          backgroundColor: '#EFF6FF',
          border: '1.5px solid #BFDBFE',
          borderRadius: '14px',
          padding: '1.1rem 1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.85rem'
        }}
      >
        <Shield size={22} color="#002B7F" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.82rem', color: '#1E3A8A', lineHeight: 1.5 }}>
          <strong style={{ fontWeight: 800 }}>UC Handshake Protocol: </strong>
          Buyers inspect textbooks, gear, or uniforms first. Once satisfied, the buyer reveals their 4-digit code (or shows QR). The seller submits the code to complete the trade, prevent disputes, and earn +10 Campus Trust Points.
        </div>
      </div>

      {/* Filter Tabs & Quick Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'inline-flex', backgroundColor: 'var(--bg-subtle, #F1F5F9)', padding: '3px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle, #CBD5E1)' }}>
          <button
            onClick={() => setFilterTab('all')}
            className={`segmented-tab ${filterTab === 'all' ? 'active' : ''}`}
            style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
          >
            All Trades ({myMeetups.length})
          </button>
          <button
            onClick={() => setFilterTab('active')}
            className={`segmented-tab ${filterTab === 'active' ? 'active' : ''}`}
            style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
          >
            Active / Scheduled ({myMeetups.filter((m) => m.status !== 'completed' && m.status !== 'cancelled').length})
          </button>
          <button
            onClick={() => setFilterTab('completed')}
            className={`segmented-tab ${filterTab === 'completed' ? 'active' : ''}`}
            style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
          >
            Completed ({myMeetups.filter((m) => m.status === 'completed').length})
          </button>
        </div>

        <button
          onClick={() => onNavigate('campus-map')}
          className="btn-secondary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <MapPin size={15} color="var(--uc-blue)" />
          <span>View Campus Safe Zones</span>
        </button>
      </div>

      {/* Active Scheduled Meetups */}
      <section>
        {filteredMeetups.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filteredMeetups.map((meetup: MeetupTransaction) => {
              const isSeller = currentUser ? meetup.sellerId === currentUser.id : false;
              const isBuyer = currentUser ? meetup.buyerId === currentUser.id : false;
              const counterpartName = isSeller ? meetup.buyerName : meetup.sellerName;
              const isCompleted = meetup.status === 'completed';
              const isOnTheWay = meetup.status === 'on_the_way';
              const isVerifying = Boolean(isVerifyingMap[meetup.id]);

              return (
                <div
                  key={meetup.id}
                  className="clean-card"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                    borderLeft: isCompleted ? '4px solid var(--accent-green, #059669)' : '4px solid var(--uc-blue, #002B7F)'
                  }}
                >
                  {/* Status header & Visual Step Tracker */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem', borderBottom: '1px solid var(--border-subtle, #E2E8F0)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--uc-blue, #002B7F)' }}>{meetup.campus}</span>
                      <span style={{ color: 'var(--border-subtle, #CBD5E1)' }}>•</span>
                      <span style={{ color: 'var(--text-muted, #64748B)', fontWeight: 600 }}>
                        Your Role: <strong style={{ color: isSeller ? '#D97706' : '#0284C7' }}>{isSeller ? 'Seller' : 'Buyer'}</strong>
                      </span>
                      {isOnTheWay && (
                        <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '4px' }}>
                          At Spot / Arrived
                        </span>
                      )}
                    </div>

                    {/* Step progress pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 700 }}>
                      <span style={{ color: 'var(--uc-blue, #002B7F)', backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        1. Scheduled
                      </span>
                      <ArrowRight size={12} color="var(--text-muted, #64748B)" />
                      <span style={{ color: isOnTheWay || isCompleted ? 'var(--uc-blue, #002B7F)' : 'var(--text-muted, #64748B)', backgroundColor: isOnTheWay || isCompleted ? 'var(--uc-blue-subtle, #EBF1FC)' : 'var(--bg-subtle, #F1F5F9)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        2. At Landmark
                      </span>
                      <ArrowRight size={12} color="var(--text-muted, #64748B)" />
                      <span style={{ color: isCompleted ? 'var(--accent-green, #059669)' : 'var(--text-muted, #64748B)', backgroundColor: isCompleted ? 'var(--accent-green-subtle, #ECFDF5)' : 'var(--bg-subtle, #F1F5F9)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        {isCompleted && <CheckCircle2 size={12} color="var(--accent-green, #059669)" />}
                        3. Verified
                      </span>
                    </div>
                  </div>

                  {/* Body Info Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '1.25rem',
                      alignItems: 'stretch'
                    }}
                  >
                    {/* Item snapshot */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      {meetup.listingImage && meetup.listingImage.trim() !== '' ? (
                        <img
                          src={meetup.listingImage}
                          alt=""
                          style={{ width: '68px', height: '68px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border-subtle, #E2E8F0)' }}
                        />
                      ) : (
                        <div style={{ width: '68px', height: '68px', borderRadius: '10px', backgroundColor: 'var(--bg-subtle, #F1F5F9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted, #64748B)' }}>
                          <ShoppingBag size={26} />
                        </div>
                      )}
                      <div>
                        <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)', lineHeight: 1.3 }}>
                          {meetup.listingTitle}
                        </h4>
                        <p style={{ fontSize: '1.05rem', color: 'var(--uc-blue, #002B7F)', fontWeight: 900, fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                          ₱{meetup.finalPrice.toLocaleString()}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748B)', marginTop: '2px' }}>
                          {isSeller ? 'Buyer' : 'Seller'}: <strong style={{ color: 'var(--text-primary, #0F172A)' }}>{counterpartName}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Spot & Time */}
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #334155)', display: 'flex', flexDirection: 'column', gap: '0.45rem', backgroundColor: 'var(--bg-subtle, #F8FAFC)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-subtle, #E2E8F0)', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <MapPin size={16} color="var(--uc-blue, #002B7F)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span><strong>Spot:</strong> {meetup.landmarkSpot}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={16} color="var(--text-muted, #64748B)" style={{ flexShrink: 0 }} />
                        <span>{meetup.scheduledDateTime}</span>
                      </div>
                      {meetup.notes && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748B)', fontStyle: 'italic', marginTop: '2px' }}>
                          Note: {meetup.notes}
                        </div>
                      )}
                    </div>

                    {/* Role-Specific Actions & Handshake Box */}
                    <div
                      style={{
                        backgroundColor: isCompleted ? 'var(--accent-green-subtle, #ECFDF5)' : '#FFFFFF',
                        border: isCompleted ? '1.5px solid var(--accent-green, #059669)' : '1.5px solid var(--border-subtle, #E2E8F0)',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      {isCompleted ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', color: 'var(--accent-green, #059669)', fontWeight: 800, fontSize: '0.88rem' }}>
                            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                            <span>Trade Verified (+10 Campus Trust)</span>
                          </div>

                          <button
                            onClick={() => setSelectedReviewMeetup(meetup)}
                            className="btn-gold"
                            style={{ padding: '0.6rem 0.85rem', fontSize: '0.82rem', fontWeight: 800, width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                          >
                            <Star size={15} style={{ flexShrink: 0 }} />
                            <span>Rate & Award Trait Badges</span>
                          </button>
                        </div>
                      ) : isBuyer ? (
                        /* Buyer Perspective: Displays Handshake Code & QR */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary, #334155)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <KeyRound size={15} color="var(--uc-blue, #002B7F)" style={{ flexShrink: 0 }} /> Your Handshake OTP:
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span
                                style={{
                                  backgroundColor: 'var(--uc-blue, #002B7F)',
                                  color: '#FFC72C',
                                  padding: '0.3rem 0.75rem',
                                  borderRadius: '6px',
                                  fontWeight: 900,
                                  fontFamily: 'monospace',
                                  fontSize: '1.15rem',
                                  letterSpacing: '0.14em'
                                }}
                              >
                                {meetup.verificationCode || '••••'}
                              </span>
                              {meetup.verificationCode && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(meetup.verificationCode, meetup.id)}
                                  style={{ background: 'none', border: 'none', color: copiedCodeId === meetup.id ? 'var(--accent-green, #059669)' : 'var(--text-muted, #64748B)', cursor: 'pointer', padding: '4px' }}
                                  title="Copy Code"
                                >
                                  {copiedCodeId === meetup.id ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedQRMeetup(meetup)}
                              className="btn-primary"
                              style={{ flex: 1, padding: '0.55rem', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                            >
                              <QrCode size={14} style={{ flexShrink: 0 }} /> <span>Show QR Code</span>
                            </button>

                            {!isOnTheWay && (
                              <button
                                type="button"
                                onClick={() => handleMarkArrived(meetup.id)}
                                className="btn-secondary"
                                style={{ flex: 1, padding: '0.55rem', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                              >
                                <Navigation size={14} style={{ flexShrink: 0 }} /> <span>I Arrived</span>
                              </button>
                            )}
                          </div>

                          <p style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: 1.35, margin: 0 }}>
                            * Inspect the item thoroughly before showing this code or QR to {meetup.sellerName}.
                          </p>
                        </div>
                      ) : (
                        /* Seller Perspective: Enters 4-Digit Code from Buyer or Scans QR */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary, #334155)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <KeyRound size={15} color="var(--uc-blue, #002B7F)" /> Enter Buyer's 4-Digit Code:
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 700 }}>Awaiting Inspection</span>
                          </label>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="4 Digits"
                              value={inputCodes[meetup.id] || ''}
                              onChange={(e) => handleCodeChange(meetup.id, e.target.value)}
                              className="clean-input"
                              style={{
                                flex: 1,
                                textAlign: 'center',
                                fontSize: '1.05rem',
                                fontWeight: 800,
                                letterSpacing: '0.2em',
                                fontFamily: 'monospace',
                                padding: '0.45rem'
                              }}
                            />

                            <button
                              type="button"
                              onClick={() => handleVerifySubmit(meetup.id)}
                              disabled={isVerifying || (inputCodes[meetup.id]?.length || 0) < 4}
                              className="btn-primary"
                              style={{
                                padding: '0.45rem 0.95rem',
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                opacity: (inputCodes[meetup.id]?.length || 0) === 4 ? 1 : 0.6
                              }}
                            >
                              {isVerifying ? 'Verifying...' : 'Verify'}
                            </button>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedScanMeetup(meetup)}
                              className="btn-secondary"
                              style={{ width: '100%', padding: '0.45rem', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                            >
                              <Camera size={14} color="var(--uc-blue, #002B7F)" style={{ flexShrink: 0 }} />
                              <span>Or Scan Buyer QR Code</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !currentUser ? (
          <div className="clean-card" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--text-muted, #64748B)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', color: 'var(--uc-blue, #002B7F)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)' }}>
                Sign In to View Scheduled Meetups
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748B)', marginTop: '0.25rem', maxWidth: '460px', lineHeight: 1.5 }}>
                Log in with your University of Cebu account to view your scheduled physical handover times, designated campus safety spots, and 4-digit verification codes.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  if (onOpenAuth) onOpenAuth();
                  else onNavigate('home');
                }}
                className="btn-gold"
                style={{ padding: '0.65rem 1.5rem', fontSize: '0.85rem', fontWeight: 800 }}
              >
                Sign In to TradeLink
              </button>
              <button
                onClick={() => onNavigate('marketplace')}
                className="btn-secondary"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}
              >
                Browse Campus Catalog
              </button>
            </div>
          </div>
        ) : (
          <div className="clean-card" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--text-muted, #64748B)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', color: 'var(--uc-blue, #002B7F)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)' }}>
                No Scheduled Campus Meetups Found
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748B)', marginTop: '0.25rem', maxWidth: '420px' }}>
                {filterTab === 'completed'
                  ? 'You have not completed any campus meetups yet.'
                  : 'Select an item in the marketplace and tap "Buy Now" or "Propose Swap" to coordinate a safe campus inspection.'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('marketplace')}
              className="btn-gold"
              style={{ padding: '0.65rem 1.5rem', fontSize: '0.85rem', fontWeight: 800 }}
            >
              Browse Campus Catalog
            </button>
          </div>
        )}
      </section>

      {/* Modals */}
      {selectedQRMeetup && (
        <HandshakeQRModal
          isOpen={!!selectedQRMeetup}
          onClose={() => setSelectedQRMeetup(null)}
          meetup={selectedQRMeetup}
        />
      )}

      {selectedScanMeetup && (
        <QRScannerModal
          isOpen={!!selectedScanMeetup}
          onClose={() => setSelectedScanMeetup(null)}
          meetup={selectedScanMeetup}
          onSuccess={() => {
            setSelectedScanMeetup(null);
            showToast('QR Code Scanned', 'Handshake verified! Trade completed.', 'success');
          }}
        />
      )}

      {selectedReviewMeetup && (
        <ReviewModal
          isOpen={!!selectedReviewMeetup}
          onClose={() => setSelectedReviewMeetup(null)}
          meetup={selectedReviewMeetup}
          onSuccess={() => {
            setSelectedReviewMeetup(null);
          }}
        />
      )}
    </div>
  );
};
