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
            width="170"
            height="170"
            viewBox="0 0 170 170"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background */}
            <rect width="170" height="170" rx="8" fill="#FFFFFF" />

            {/* Position Detection Top-Left */}
            <rect x="12" y="12" width="40" height="40" rx="3" fill="#0F172A" />
            <rect x="18" y="18" width="28" height="28" rx="2" fill="#FFFFFF" />
            <rect x="23" y="23" width="18" height="18" rx="1" fill="#0F172A" />

            {/* Position Detection Top-Right */}
            <rect x="118" y="12" width="40" height="40" rx="3" fill="#0F172A" />
            <rect x="124" y="18" width="28" height="28" rx="2" fill="#FFFFFF" />
            <rect x="129" y="23" width="18" height="18" rx="1" fill="#0F172A" />

            {/* Position Detection Bottom-Left */}
            <rect x="12" y="118" width="40" height="40" rx="3" fill="#0F172A" />
            <rect x="18" y="124" width="28" height="28" rx="2" fill="#FFFFFF" />
            <rect x="23" y="129" width="18" height="18" rx="1" fill="#0F172A" />

            {/* Standard Monochrome QR Data Modules */}
            <rect x="62" y="16" width="8" height="8" fill="#0F172A" />
            <rect x="76" y="16" width="8" height="8" fill="#0F172A" />
            <rect x="90" y="16" width="8" height="8" fill="#0F172A" />
            <rect x="104" y="16" width="8" height="8" fill="#0F172A" />

            <rect x="62" y="30" width="8" height="8" fill="#0F172A" />
            <rect x="90" y="30" width="8" height="8" fill="#0F172A" />

            <rect x="16" y="62" width="8" height="8" fill="#0F172A" />
            <rect x="30" y="62" width="8" height="8" fill="#0F172A" />
            <rect x="44" y="62" width="8" height="8" fill="#0F172A" />
            <rect x="58" y="62" width="8" height="8" fill="#0F172A" />
            <rect x="72" y="62" width="8" height="8" fill="#0F172A" />
            <rect x="86" y="62" width="8" height="8" fill="#0F172A" />
            <rect x="100" y="62" width="8" height="8" fill="#0F172A" />
            <rect x="114" y="62" width="8" height="8" fill="#0F172A" />
            <rect x="128" y="62" width="8" height="8" fill="#0F172A" />
            <rect x="142" y="62" width="8" height="8" fill="#0F172A" />

            <rect x="16" y="76" width="8" height="8" fill="#0F172A" />
            <rect x="44" y="76" width="8" height="8" fill="#0F172A" />
            <rect x="72" y="76" width="24" height="24" rx="3" fill="#002B7F" />
            <rect x="114" y="76" width="8" height="8" fill="#0F172A" />
            <rect x="142" y="76" width="8" height="8" fill="#0F172A" />

            <rect x="16" y="90" width="8" height="8" fill="#0F172A" />
            <rect x="30" y="90" width="8" height="8" fill="#0F172A" />
            <rect x="128" y="90" width="8" height="8" fill="#0F172A" />
            <rect x="142" y="90" width="8" height="8" fill="#0F172A" />

            <rect x="62" y="118" width="8" height="8" fill="#0F172A" />
            <rect x="76" y="118" width="8" height="8" fill="#0F172A" />
            <rect x="104" y="118" width="8" height="8" fill="#0F172A" />
            <rect x="132" y="118" width="8" height="8" fill="#0F172A" />
            <rect x="146" y="118" width="8" height="8" fill="#0F172A" />

            <rect x="62" y="132" width="8" height="8" fill="#0F172A" />
            <rect x="90" y="132" width="8" height="8" fill="#0F172A" />
            <rect x="104" y="132" width="8" height="8" fill="#0F172A" />
            <rect x="118" y="132" width="8" height="8" fill="#0F172A" />
            <rect x="146" y="132" width="8" height="8" fill="#0F172A" />

            <rect x="62" y="146" width="8" height="8" fill="#0F172A" />
            <rect x="76" y="146" width="8" height="8" fill="#0F172A" />
            <rect x="104" y="146" width="8" height="8" fill="#0F172A" />
            <rect x="132" y="146" width="8" height="8" fill="#0F172A" />
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
