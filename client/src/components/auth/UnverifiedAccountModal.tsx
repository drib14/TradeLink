import React from 'react';
import { ShieldAlert, ShieldCheck, CheckCircle2, ArrowRight, X, Camera, CreditCard, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface UnverifiedAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartVerification: () => void;
}

export const UnverifiedAccountModal: React.FC<UnverifiedAccountModalProps> = ({
  isOpen,
  onClose,
  onStartVerification
}) => {
  const { currentUser } = useAuth();

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div
        className="modal-card-custom"
        style={{
          maxWidth: '560px',
          width: '100%',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.98)',
          boxShadow: '0 25px 60px -15px rgba(0, 43, 127, 0.28), 0 0 0 1px rgba(0, 43, 127, 0.08)',
          backdropFilter: 'blur(24px)',
          overflow: 'hidden',
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with UC Blue Solid */}
        <div
          style={{
            backgroundColor: '#002B7F',
            padding: '1.5rem',
            position: 'relative',
            color: '#FFFFFF'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'rgba(255, 199, 44, 0.2)', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 800, color: '#FFC72C' }}>
              <ShieldAlert size={14} />
              <span>Unverified Student Account</span>
            </div>
            <button
              onClick={onClose}
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                padding: '0.35rem',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', marginTop: '0.75rem', marginBottom: '0.25rem', fontFamily: 'var(--font-display)' }}>
            Welcome to TradeLink, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Student'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: 1.45 }}>
            To protect our University of Cebu community from off-campus scammers and fake accounts, students must verify their identity before trading.
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Permissions Comparison Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            {/* Unverified Status */}
            <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                <Lock size={14} />
                <span>Current Access</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0.65rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={13} color="var(--accent-green, #059669)" />
                  <span>Browse campus listings</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={13} color="var(--accent-green, #059669)" />
                  <span>Explore meetup safety spots</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={13} color="var(--accent-green, #059669)" />
                  <span>Bookmark favorite items</span>
                </li>
              </ul>
            </div>

            {/* Verified Status */}
            <div style={{ backgroundColor: 'var(--uc-blue-subtle)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--uc-blue-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                <ShieldCheck size={14} />
                <span>Unlocked When Verified</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0.65rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.76rem', color: 'var(--uc-blue)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                  <CheckCircle2 size={13} />
                  <span>Post items for sale / barter</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                  <CheckCircle2 size={13} />
                  <span>Propose swaps & chat</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                  <CheckCircle2 size={13} />
                  <span>Encrypted campus chat & protection</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 2-Step Process Guide */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid var(--border-subtle)', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              How 2-Step Student Verification Works:
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '0.85rem' }}>
                <CreditCard size={17} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  1. Official Student ID Card
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Upload a clear photo of your physical UC Student ID card.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(255, 199, 44, 0.2)', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '0.85rem' }}>
                <Camera size={17} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  2. Real-Time Live Selfie
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Take a quick live webcam selfie within the facial frame to verify you match your student ID card.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button
              onClick={onStartVerification}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.92rem',
                fontWeight: 800,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(0, 43, 127, 0.25)'
              }}
            >
              <span>Start ID & Live Selfie Verification</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={onClose}
              className="btn-ghost"
              style={{
                width: '100%',
                padding: '0.65rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Explore Marketplace First (Verify Later in Profile)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
