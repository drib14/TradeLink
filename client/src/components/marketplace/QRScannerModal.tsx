import React, { useState, useEffect } from 'react';
import { MeetupTransaction } from '../../types';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../common/Toast';
import { X, QrCode, CheckCircle2, Sparkles, ShieldCheck, Camera, ArrowRight } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetup?: MeetupTransaction;
  onSuccess?: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  meetup,
  onSuccess
}) => {
  const { completeMeetupWithCode } = useChat();
  const { showToast } = useToast();

  const [inputCode, setInputCode] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsScanning(true);
      setIsVerified(false);
      setInputCode('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulatedScan = () => {
    if (meetup) {
      setInputCode(meetup.verificationCode);
      const res = completeMeetupWithCode(meetup.id, meetup.verificationCode);
      if (res.success) {
        setIsVerified(true);
        setIsScanning(false);
        showToast('Handshake Verified!', res.message, 'success');
        if (onSuccess) onSuccess();
      }
    }
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim() || !meetup) return;

    const res = completeMeetupWithCode(meetup.id, inputCode.trim());
    if (res.success) {
      setIsVerified(true);
      setIsScanning(false);
      showToast('Handshake Verified!', res.message, 'success');
      if (onSuccess) onSuccess();
    } else {
      showToast('Invalid Code', res.message, 'error');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 29, 89, 0.7)',
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
          maxWidth: '460px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0, 43, 127, 0.25)',
          padding: '1.75rem',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#002B7F', fontSize: '0.85rem', fontWeight: 800 }}>
            <Camera size={18} />
            <span>Scan Handshake QR</span>
          </div>

          <button onClick={onClose} style={{ color: '#64748B', padding: '0.25rem' }}>
            <X size={18} />
          </button>
        </div>

        {!isVerified ? (
          <div>
            {/* Camera Viewfinder Mock */}
            <div
              style={{
                width: '100%',
                height: '220px',
                backgroundColor: '#0F172A',
                borderRadius: '12px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                border: '2px solid #002B7F'
              }}
            >
              {/* Corner brackets */}
              <div style={{ position: 'absolute', top: '16px', left: '16px', width: '24px', height: '24px', borderTop: '3px solid #FFC72C', borderLeft: '3px solid #FFC72C' }} />
              <div style={{ position: 'absolute', top: '16px', right: '16px', width: '24px', height: '24px', borderTop: '3px solid #FFC72C', borderRight: '3px solid #FFC72C' }} />
              <div style={{ position: 'absolute', bottom: '16px', left: '16px', width: '24px', height: '24px', borderBottom: '3px solid #FFC72C', borderLeft: '3px solid #FFC72C' }} />
              <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '24px', height: '24px', borderBottom: '3px solid #FFC72C', borderRight: '3px solid #FFC72C' }} />

              {/* Scanning Red Laser Line Animation */}
              <div
                style={{
                  position: 'absolute',
                  left: '10%',
                  right: '10%',
                  height: '2px',
                  backgroundColor: '#FFC72C',
                  boxShadow: '0 0 10px #FFC72C',
                  top: '50%',
                  animation: 'pulse 1.5s infinite'
                }}
              />

              <div style={{ color: '#CBD5E1', fontSize: '0.8rem', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={36} color="#FFC72C" />
                <span>Align buyer's QR code within viewfinder</span>
              </div>
            </div>

            {/* Quick 1-Click Scan Simulator */}
            {meetup && (
              <button
                type="button"
                onClick={handleSimulatedScan}
                className="btn-gold"
                style={{ width: '100%', padding: '0.65rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}
              >
                <Sparkles size={15} /> Instant 1-Click Scan Verification
              </button>
            )}

            {/* Manual Code Input Option */}
            <form onSubmit={handleManualCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                Or enter buyer's 4-digit code manually:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  maxLength={4}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="e.g. 7492"
                  className="clean-input"
                  style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.2em' }}
                  required
                />
                <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.25rem', whiteSpace: 'nowrap' }}>
                  Verify
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Celebration View */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={40} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#002B7F' }}>
                Handshake Verified!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.25rem' }}>
                Transaction completed successfully at {meetup?.landmarkSpot}.
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#FFFBEB',
                border: '1.5px solid #FDE68A',
                borderRadius: '12px',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#B45309',
                fontSize: '0.85rem',
                fontWeight: 800
              }}
            >
              <Sparkles size={18} color="#D97706" />
              <span>+10 Campus Trust Points Awarded to Both Students!</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.7rem' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
