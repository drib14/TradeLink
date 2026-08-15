import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/common/Toast';
import { HandshakeQRModal } from '../components/marketplace/HandshakeQRModal';
import { QRScannerModal } from '../components/marketplace/QRScannerModal';
import { ReviewModal } from '../components/marketplace/ReviewModal';
import { CAMPUS_MEETUP_SPOTS, SAFE_MEETUP_CHECKLIST } from '../data/campusLocations';
import { MeetupTransaction } from '../types';
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Camera,
  Star,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface MeetupsPageProps {
  onNavigate: (view: string, param?: any) => void;
}

export const MeetupsPage: React.FC<MeetupsPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { meetups, completeMeetupWithCode } = useChat();
  const { showToast } = useToast();

  const [inputCodes, setInputCodes] = useState<Record<string, string>>({});
  const [selectedQRMeetup, setSelectedQRMeetup] = useState<MeetupTransaction | null>(null);
  const [selectedScanMeetup, setSelectedScanMeetup] = useState<MeetupTransaction | null>(null);
  const [selectedReviewMeetup, setSelectedReviewMeetup] = useState<MeetupTransaction | null>(null);

  const myMeetups = currentUser
    ? meetups.filter(
        (m: MeetupTransaction) => m.sellerId === currentUser.id || m.buyerId === currentUser.id
      )
    : [];

  const handleCodeChange = (meetupId: string, val: string) => {
    setInputCodes((prev) => ({ ...prev, [meetupId]: val }));
  };

  const handleVerifyCode = (meetupId: string) => {
    const code = inputCodes[meetupId] || '';
    if (!code.trim()) {
      showToast('Code Missing', 'Please enter the 4-digit code provided by the other student.', 'warning');
      return;
    }

    const res = completeMeetupWithCode(meetupId, code);
    if (res.success) {
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.6 }
      });

      showToast('Trade Verified & Completed! 🎉', res.message, 'success');
      setInputCodes((prev) => ({ ...prev, [meetupId]: '' }));
    } else {
      showToast('Verification Failed', res.message, 'error');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#002B7F', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <ShieldCheck size={16} /> Verified Handshake Coordinator
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#002B7F', marginTop: '0.25rem' }}>
          Safe Campus Meetups & Handshake Desk
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.15rem' }}>
          Coordinate inspections safely inside official University of Cebu security hubs using 4-digit codes or QR scanners.
        </p>
      </div>

      {/* Active Scheduled Meetups */}
      <section>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.85rem' }}>
          My Active Meetups ({myMeetups.length})
        </h3>

        {myMeetups.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {myMeetups.map((meetup: MeetupTransaction) => {
              const isSeller = meetup.sellerId === currentUser.id;
              const counterpartName = isSeller ? meetup.buyerName : meetup.sellerName;
              const isCompleted = meetup.status === 'completed';

              return (
                <div
                  key={meetup.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1.5px solid #CBD5E1',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.15rem',
                    boxShadow: '0 6px 18px rgba(0, 43, 127, 0.06)'
                  }}
                >
                  {/* Status header & Visual Step Tracker */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 800, color: '#002B7F' }}>{meetup.campus}</span>
                      <span style={{ color: '#CBD5E1' }}>•</span>
                      <span style={{ color: '#64748B', fontWeight: 600 }}>Your Role: <strong>{isSeller ? 'Seller' : 'Buyer'}</strong></span>
                    </div>

                    {/* Step progress pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 700 }}>
                      <span style={{ color: '#002B7F', backgroundColor: '#EBF1FC', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        1. Scheduled
                      </span>
                      <ArrowRight size={12} color="#94A3B8" />
                      <span style={{ color: '#002B7F', backgroundColor: '#EBF1FC', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        2. At Landmark
                      </span>
                      <ArrowRight size={12} color="#94A3B8" />
                      <span style={{ color: isCompleted ? '#047857' : '#64748B', backgroundColor: isCompleted ? '#ECFDF5' : '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        {isCompleted && <CheckCircle2 size={12} color="#047857" />}
                        3. Verified Handshake
                      </span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: '1.25rem',
                      alignItems: 'center'
                    }}
                  >
                    {/* Item snapshot */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <img
                        src={meetup.listingImage}
                        alt=""
                        style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #CBD5E1' }}
                      />
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                          {meetup.listingTitle}
                        </h4>
                        <p style={{ fontSize: '0.9rem', color: '#002B7F', fontWeight: 900, fontFamily: 'var(--font-display)' }}>
                          ₱{meetup.finalPrice.toLocaleString()}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                          Meeting: <strong>{counterpartName}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Spot & Time */}
                    <div style={{ fontSize: '0.82rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                        <MapPin size={15} color="#002B7F" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span><strong>Spot:</strong> {meetup.landmarkSpot}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={15} color="#64748B" />
                        <span>{meetup.scheduledDateTime}</span>
                      </div>
                    </div>

                    {/* Verification Actions & Code */}
                    <div
                      style={{
                        backgroundColor: isCompleted ? '#ECFDF5' : '#F8FAFC',
                        border: isCompleted ? '1.5px solid #A7F3D0' : '1.5px solid #BCD1F7',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem'
                      }}
                    >
                      {isCompleted ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#047857', fontWeight: 800, fontSize: '0.88rem' }}>
                            <CheckCircle2 size={18} />
                            <span>Handshake Verified (+10 Trust)</span>
                          </div>

                          <button
                            onClick={() => setSelectedReviewMeetup(meetup)}
                            className="btn-gold"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', fontWeight: 800, width: '100%' }}
                          >
                            <Star size={14} /> Rate & Award Badges
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <KeyRound size={14} color="#002B7F" /> Handshake Code:
                            </span>
                            <span
                              style={{
                                backgroundColor: '#002B7F',
                                color: '#FFFFFF',
                                padding: '0.2rem 0.65rem',
                                borderRadius: '6px',
                                fontWeight: 900,
                                fontFamily: 'monospace',
                                fontSize: '1rem',
                                letterSpacing: '0.1em'
                              }}
                            >
                              {meetup.verificationCode}
                            </span>
                          </div>

                          {/* QR Buttons */}
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedQRMeetup(meetup)}
                              className="btn-secondary"
                              style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem', fontWeight: 700 }}
                            >
                              <QrCode size={14} /> Show QR
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedScanMeetup(meetup)}
                              className="btn-primary"
                              style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem', fontWeight: 700 }}
                            >
                              <Camera size={14} /> Scan QR
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #CBD5E1', padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.88rem' }}>
            No scheduled meetups yet. Select an item in the marketplace and tap <strong>"Buy Now"</strong> to schedule a guarded campus exchange!
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
        />
      )}

      {selectedReviewMeetup && (
        <ReviewModal
          isOpen={!!selectedReviewMeetup}
          onClose={() => setSelectedReviewMeetup(null)}
          meetup={selectedReviewMeetup}
        />
      )}
    </div>
  );
};
