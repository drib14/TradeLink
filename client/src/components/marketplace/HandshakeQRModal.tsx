import React from 'react';
import { MeetupTransaction } from '../../types';
import { X, ShieldCheck, MapPin, Calendar, QrCode, CheckCircle2, Copy } from 'lucide-react';
import { useToast } from '../common/Toast';

interface HandshakeQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetup: MeetupTransaction;
}

export const HandshakeQRModal: React.FC<HandshakeQRModalProps> = ({
  isOpen,
  onClose,
  meetup
}) => {
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(meetup.verificationCode);
      showToast('Code Copied', `4-digit code ${meetup.verificationCode} copied to clipboard!`, 'info');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 29, 89, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 2200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1.5px solid #BCD1F7',
          width: '100%',
          maxWidth: '440px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0, 43, 127, 0.25)',
          padding: '1.75rem',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#002B7F', fontSize: '0.82rem', fontWeight: 800 }}>
            <QrCode size={18} />
            <span>Campus Handshake QR</span>
          </div>

          <button onClick={onClose} style={{ color: '#64748B', padding: '0.25rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Item Title & Location */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.25 }}>
            {meetup.listingTitle}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#002B7F', fontWeight: 700, marginTop: '4px' }}>
            <MapPin size={13} />
            <span>{meetup.landmarkSpot} ({meetup.campus})</span>
          </div>
        </div>

        {/* Crisp Vector QR Code Simulation with UC Branding */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '2px solid #002B7F',
            borderRadius: '14px',
            padding: '1.25rem',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 4px 12px rgba(0, 43, 127, 0.08)'
          }}
        >
          <svg
            width="180"
            height="180"
            viewBox="0 0 180 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background */}
            <rect width="180" height="180" rx="8" fill="#FFFFFF" />

            {/* Position Detection Squares Top-Left */}
            <rect x="15" y="15" width="45" height="45" rx="4" fill="#002B7F" />
            <rect x="22" y="22" width="31" height="31" rx="2" fill="#FFFFFF" />
            <rect x="28" y="28" width="19" height="19" rx="2" fill="#002B7F" />

            {/* Position Detection Squares Top-Right */}
            <rect x="120" y="15" width="45" height="45" rx="4" fill="#002B7F" />
            <rect x="127" y="22" width="31" height="31" rx="2" fill="#FFFFFF" />
            <rect x="133" y="28" width="19" height="19" rx="2" fill="#002B7F" />

            {/* Position Detection Squares Bottom-Left */}
            <rect x="15" y="120" width="45" height="45" rx="4" fill="#002B7F" />
            <rect x="22" y="127" width="31" height="31" rx="2" fill="#FFFFFF" />
            <rect x="28" y="133" width="19" height="19" rx="2" fill="#002B7F" />

            {/* Simulated Data Grid */}
            <rect x="70" y="20" width="10" height="10" fill="#002B7F" />
            <rect x="85" y="20" width="10" height="10" fill="#002B7F" />
            <rect x="100" y="20" width="10" height="10" fill="#FFC72C" />

            <rect x="70" y="35" width="10" height="10" fill="#002B7F" />
            <rect x="100" y="35" width="10" height="10" fill="#002B7F" />

            <rect x="20" y="70" width="10" height="10" fill="#002B7F" />
            <rect x="35" y="70" width="10" height="10" fill="#FFC72C" />
            <rect x="50" y="70" width="10" height="10" fill="#002B7F" />
            <rect x="65" y="70" width="10" height="10" fill="#002B7F" />
            <rect x="80" y="70" width="10" height="10" fill="#002B7F" />
            <rect x="95" y="70" width="10" height="10" fill="#FFC72C" />
            <rect x="110" y="70" width="10" height="10" fill="#002B7F" />
            <rect x="125" y="70" width="10" height="10" fill="#002B7F" />
            <rect x="140" y="70" width="10" height="10" fill="#002B7F" />
            <rect x="155" y="70" width="10" height="10" fill="#002B7F" />

            <rect x="20" y="85" width="10" height="10" fill="#FFC72C" />
            <rect x="50" y="85" width="10" height="10" fill="#002B7F" />
            <rect x="80" y="85" width="20" height="20" rx="4" fill="#002B7F" />
            <circle cx="90" cy="95" r="5" fill="#FFC72C" />
            <rect x="125" y="85" width="10" height="10" fill="#002B7F" />
            <rect x="155" y="85" width="10" height="10" fill="#FFC72C" />

            <rect x="20" y="100" width="10" height="10" fill="#002B7F" />
            <rect x="35" y="100" width="10" height="10" fill="#002B7F" />
            <rect x="140" y="100" width="10" height="10" fill="#002B7F" />

            <rect x="70" y="125" width="10" height="10" fill="#002B7F" />
            <rect x="85" y="125" width="10" height="10" fill="#002B7F" />
            <rect x="100" y="125" width="10" height="10" fill="#002B7F" />
            <rect x="130" y="125" width="10" height="10" fill="#FFC72C" />
            <rect x="145" y="125" width="10" height="10" fill="#002B7F" />

            <rect x="70" y="145" width="10" height="10" fill="#FFC72C" />
            <rect x="95" y="145" width="10" height="10" fill="#002B7F" />
            <rect x="115" y="145" width="10" height="10" fill="#002B7F" />
            <rect x="130" y="145" width="10" height="10" fill="#002B7F" />
            <rect x="150" y="145" width="10" height="10" fill="#002B7F" />
          </svg>

          {/* 4-Digit Code Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '0.2em', color: '#002B7F', fontFamily: 'monospace' }}>
              {meetup.verificationCode}
            </span>
            <button
              onClick={handleCopyCode}
              style={{
                backgroundColor: '#EBF1FC',
                color: '#002B7F',
                border: '1px solid #BCD1F7',
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Copy size={12} /> Copy
            </button>
          </div>
        </div>

        {/* Instructions */}
        <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '1rem', lineHeight: 1.5 }}>
          Show this QR code to the seller at the designated campus guard landmark to instantly verify and complete the trade.
        </p>

        <button
          onClick={onClose}
          className="btn-primary"
          style={{ width: '100%', marginTop: '1.25rem', padding: '0.65rem' }}
        >
          Close QR View
        </button>
      </div>
    </div>
  );
};
