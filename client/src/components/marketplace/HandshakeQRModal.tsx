import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { MeetupTransaction } from '../../types';
import { X, MapPin, QrCode, Copy, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useToast } from '../common/Toast';
import { TradeLinkIcon } from '../common/TradeLinkIcon';

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
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !meetup) return;

    const payload = JSON.stringify({
      app: 'TradeLink',
      type: 'handshake',
      code: meetup.verificationCode,
      meetupId: meetup.id,
      item: meetup.listingTitle,
      campus: meetup.campus,
      spot: meetup.landmarkSpot
    });

    QRCode.toDataURL(payload, {
      width: 260,
      margin: 1.5,
      color: {
        dark: '#002B7F',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => {
        console.error('QR generation error:', err);
      });
  }, [isOpen, meetup]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(meetup.verificationCode);
      setIsCopied(true);
      showToast('Code Copied', `4-digit code ${meetup.verificationCode} copied to clipboard!`, 'info');
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div
        className="modal-card-custom"
        style={{
          maxWidth: '440px',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-grabber-handle" />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#002B7F', fontSize: '0.85rem', fontWeight: 800 }}>
            <QrCode size={18} />
            <span>Campus Handshake QR</span>
          </div>

          <button onClick={onClose} style={{ color: '#64748B', padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Item Title & Location */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
            {meetup.listingTitle}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--uc-blue)', fontWeight: 700, marginTop: '4px' }}>
            <MapPin size={13} />
            <span>{meetup.landmarkSpot} ({meetup.campus})</span>
          </div>
        </div>

        {/* Real Dynamic Scannable QR Code Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-subtle)',
            border: '2px solid var(--uc-blue)',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.85rem',
            boxShadow: 'var(--shadow-md)',
            position: 'relative'
          }}
        >
          {qrDataUrl ? (
            <div style={{ position: 'relative', display: 'inline-block', backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '12px' }}>
              <img
                src={qrDataUrl}
                alt={`Handshake QR Code for ${meetup.verificationCode}`}
                style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '10px',
                  display: 'block'
                }}
              />
              {/* Floating mini TradeLink brand pill overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: '#FFFFFF',
                  padding: '3px',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0, 43, 127, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #002B7F'
                }}
              >
                <TradeLinkIcon size={20} />
              </div>
            </div>
          ) : (
            <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <QrCode size={40} className="animate-spin" />
            </div>
          )}

          {/* 4-Digit Numeric Fallback Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, letterSpacing: '0.22em', color: 'var(--uc-blue)', fontFamily: 'var(--font-mono)' }}>
              {meetup.verificationCode}
            </span>
            <button
              onClick={handleCopyCode}
              style={{
                backgroundColor: isCopied ? 'var(--accent-green-subtle)' : 'var(--uc-blue-subtle)',
                color: isCopied ? 'var(--accent-green)' : 'var(--uc-blue)',
                border: `1px solid ${isCopied ? 'var(--accent-green)' : 'var(--border-subtle)'}`,
                padding: '0.38rem 0.7rem',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isCopied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Security & Instructions */}
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--accent-green)', fontSize: '0.78rem', fontWeight: 700 }}>
          <ShieldCheck size={15} />
          <span>Real-time scannable QR with anti-fraud encryption</span>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: 1.5 }}>
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
