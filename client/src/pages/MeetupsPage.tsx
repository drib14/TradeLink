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

  const handleVerifySubmit = async (meetupId: string) => {
    const code = inputCodes[meetupId] || '';
    if (!code.trim()) {
      showToast('Code Missing', 'Please enter the 4-digit code provided by the other student.', 'warning');
      return;
    }

    const res = await completeMeetupWithCode(meetupId, code);
    if (res.success) {
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.6 }
      });

      showToast('Trade Verified & Completed', res.message, 'success');
      setInputCodes((prev) => ({ ...prev, [meetupId]: '' }));
    } else {
      showToast('Verification Failed', res.message, 'error');
    }
  };

  return (
    <div className="container page-enter" style={{ padding: '2rem 1.5rem 5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--uc-blue, #002B7F)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <ShieldCheck size={16} /> Verified Handshake Coordinator
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary, #002B7F)', marginTop: '0.25rem' }}>
          Safe Campus Meetups & Handshake Desk
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748B)', marginTop: '0.15rem' }}>
          Coordinate inspections safely inside official University of Cebu security hubs using 4-digit codes or QR scanners.
        </p>
      </div>

      {/* Active Scheduled Meetups */}
      <section>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
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
                  className="clean-card"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.15rem'
                  }}
                >
                  {/* Status header & Visual Step Tracker */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--uc-blue)' }}>{meetup.campus}</span>
                      <span style={{ color: 'var(--border-subtle)' }}>•</span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Your Role: <strong>{isSeller ? 'Seller' : 'Buyer'}</strong></span>
                    </div>

                    {/* Step progress pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 700 }}>
                      <span style={{ color: 'var(--uc-blue)', backgroundColor: 'var(--uc-blue-subtle)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        1. Scheduled
                      </span>
                      <ArrowRight size={12} color="var(--text-muted)" />
                      <span style={{ color: 'var(--uc-blue)', backgroundColor: 'var(--uc-blue-subtle)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        2. At Landmark
                      </span>
                      <ArrowRight size={12} color="var(--text-muted)" />
                      <span style={{ color: isCompleted ? 'var(--accent-green)' : 'var(--text-muted)', backgroundColor: isCompleted ? 'var(--accent-green-subtle)' : 'var(--bg-subtle)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        {isCompleted && <CheckCircle2 size={12} color="var(--accent-green)" />}
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
                        style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                      />
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {meetup.listingTitle}
                        </h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--uc-blue)', fontWeight: 900, fontFamily: 'var(--font-display)' }}>
                          ₱{meetup.finalPrice.toLocaleString()}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Meeting: <strong>{counterpartName}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Spot & Time */}
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                        <MapPin size={15} color="var(--uc-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span><strong>Spot:</strong> {meetup.landmarkSpot}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={15} color="var(--text-muted)" />
                        <span>{meetup.scheduledDateTime}</span>
                      </div>
                    </div>


                    {/* Verification Actions & Code */}
                    <div
                      style={{
                        backgroundColor: isCompleted ? 'var(--accent-green-subtle)' : 'var(--bg-subtle)',
                        border: isCompleted ? '1.5px solid var(--accent-green)' : '1.5px solid var(--border-subtle)',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem'
                      }}
                    >
                      {isCompleted ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', color: 'var(--accent-green)', fontWeight: 800, fontSize: '0.88rem' }}>
                            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                            <span>Handshake Verified (+10 Trust)</span>
                          </div>

                          <button
                            onClick={() => setSelectedReviewMeetup(meetup)}
                            className="btn-gold"
                            style={{ padding: '0.55rem 0.85rem', fontSize: '0.8rem', fontWeight: 800, width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                          >
                            <Star size={15} style={{ flexShrink: 0 }} />
                            <span>Rate & Award Badges</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <KeyRound size={14} color="var(--uc-blue)" style={{ flexShrink: 0 }} /> Handshake Code:
                            </span>
                            <span
                              style={{
                                backgroundColor: 'var(--uc-blue)',
                                color: '#FFFFFF',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '6px',
                                fontWeight: 900,
                                fontFamily: 'monospace',
                                fontSize: '1.05rem',
                                letterSpacing: '0.1em'
                              }}
                            >
                              {meetup.verificationCode}
                            </span>
                          </div>

                          {/* QR Buttons */}
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedQRMeetup(meetup)}
                              className="btn-secondary"
                              style={{ flex: 1, padding: '0.55rem', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                            >
                              <QrCode size={14} style={{ flexShrink: 0 }} /> <span>Show QR</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedScanMeetup(meetup)}
                              className="btn-primary"
                              style={{ flex: 1, padding: '0.55rem', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                            >
                              <Camera size={14} style={{ flexShrink: 0 }} /> <span>Scan QR</span>
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
          <div className="clean-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
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
