import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { MeetupTransaction } from '../../types';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../common/Toast';
import { X, QrCode, CheckCircle2, ShieldCheck, Camera, RefreshCw, AlertCircle, Zap } from 'lucide-react';

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
  const [isVerified, setIsVerified] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<'requesting' | 'active' | 'denied' | 'unsupported'>('requesting');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Stop camera tracks helper
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Process verification
  const handleVerifyCode = useCallback(async (codeToVerify: string) => {
    if (!meetup) return;
    const res = await completeMeetupWithCode(meetup.id, codeToVerify.trim());
    if (res.success) {
      setIsVerified(true);
      stopCamera();
      showToast('Handshake Verified', res.message, 'success');
      if (onSuccess) onSuccess();
    } else {
      showToast('Verification Failed', res.message, 'error');
    }
  }, [meetup, completeMeetupWithCode, stopCamera, showToast, onSuccess]);

  // Scan video frame with jsQR
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isVerified) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        try {
          // Check if payload is TradeLink JSON or raw code
          let extractedCode = code.data;
          try {
            const parsed = JSON.parse(code.data);
            if (parsed && parsed.code) {
              extractedCode = parsed.code;
            }
          } catch {
            // Raw text or fallback
            const match = code.data.match(/\b\d{4}\b/);
            if (match) {
              extractedCode = match[0];
            }
          }

          if (extractedCode) {
            setInputCode(extractedCode);
            handleVerifyCode(extractedCode);
            return;
          }
        } catch (err) {
          console.error('QR parse error:', err);
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(scanFrame);
  }, [isVerified, handleVerifyCode]);

  // Start real user camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraStatus('requesting');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('unsupported');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraStatus('active');
        animationFrameId.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
      } else {
        setCameraStatus('unsupported');
      }
    }
  }, [facingMode, stopCamera, scanFrame]);

  useEffect(() => {
    if (isOpen && !isVerified) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, isVerified, startCamera, stopCamera]);

  if (!isOpen) return null;

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    handleVerifyCode(inputCode.trim());
  };

  const handleSimulatedScan = () => {
    if (meetup) {
      setInputCode(meetup.verificationCode);
      handleVerifyCode(meetup.verificationCode);
    }
  };

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div
        className="modal-card-custom"
        style={{
          maxWidth: '460px',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-grabber-handle" />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--uc-blue)', fontSize: '0.88rem', fontWeight: 800 }}>
            <Camera size={18} />
            <span>Campus QR Camera Scanner</span>
          </div>

          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)', padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {!isVerified ? (
          <div>
            {/* Live Camera Viewfinder */}
            <div
              style={{
                width: '100%',
                height: '240px',
                backgroundColor: '#0F172A',
                borderRadius: '16px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                border: '2px solid var(--uc-blue)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              {/* Real Video Element */}
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: cameraStatus === 'active' ? 'block' : 'none'
                }}
                muted
                autoPlay
                playsInline
              />

              {/* Hidden Canvas for Frame Decoding */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Camera Fallback / State Messages */}
              {cameraStatus === 'requesting' && (
                <div style={{ color: '#CBD5E1', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw size={28} className="animate-spin" color="#FFC72C" />
                  <span>Requesting camera access...</span>
                </div>
              )}

              {cameraStatus === 'denied' && (
                <div style={{ padding: '1rem', color: '#CBD5E1', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={32} color="#EF4444" />
                  <span style={{ fontWeight: 700, color: '#FECACA' }}>Camera Access Blocked</span>
                  <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                    Enable camera permissions in browser settings or use manual 4-digit code entry below.
                  </span>
                  <button
                    type="button"
                    onClick={startCamera}
                    style={{
                      marginTop: '0.35rem',
                      padding: '0.35rem 0.75rem',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: '#FFFFFF',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      cursor: 'pointer'
                    }}
                  >
                    Retry Camera
                  </button>
                </div>
              )}

              {cameraStatus === 'unsupported' && (
                <div style={{ padding: '1rem', color: '#CBD5E1', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <QrCode size={36} color="#FFC72C" />
                  <span style={{ fontWeight: 700 }}>Align Buyer's QR Code</span>
                  <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                    Camera hardware not detected. Please enter the 4-digit code below.
                  </span>
                </div>
              )}

              {/* Active Camera Viewfinder Overlay with Glowing Corner Brackets & Laser Scan */}
              {cameraStatus === 'active' && (
                <>
                  {/* Corner brackets */}
                  <div style={{ position: 'absolute', top: '20px', left: '20px', width: '28px', height: '28px', borderTop: '3.5px solid #FFC72C', borderLeft: '3.5px solid #FFC72C', borderRadius: '4px 0 0 0' }} />
                  <div style={{ position: 'absolute', top: '20px', right: '20px', width: '28px', height: '28px', borderTop: '3.5px solid #FFC72C', borderRight: '3.5px solid #FFC72C', borderRadius: '0 4px 0 0' }} />
                  <div style={{ position: 'absolute', bottom: '20px', left: '20px', width: '28px', height: '28px', borderBottom: '3.5px solid #FFC72C', borderLeft: '3.5px solid #FFC72C', borderRadius: '0 0 0 4px' }} />
                  <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '28px', height: '28px', borderBottom: '3.5px solid #FFC72C', borderRight: '3.5px solid #FFC72C', borderRadius: '0 0 4px 0' }} />

                  {/* Animated Glowing Laser Scanning Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '15%',
                      right: '15%',
                      height: '2.5px',
                      background: 'linear-gradient(90deg, transparent 0%, #FFC72C 50%, transparent 100%)',
                      boxShadow: '0 0 12px #FFC72C',
                      top: '50%',
                      animation: 'pulse 1.6s infinite ease-in-out'
                    }}
                  />

                  {/* Camera Controls Overlay */}
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px' }}>
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '9999px',
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer'
                      }}
                      title="Flip camera"
                    >
                      <RefreshCw size={12} /> Flip
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Quick 1-Click Verification Demo button */}
            {meetup && (
              <button
                type="button"
                onClick={handleSimulatedScan}
                className="btn-gold"
                style={{ width: '100%', padding: '0.65rem', marginBottom: '1.25rem', fontSize: '0.84rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
              >
                <Zap size={15} /> Instant 1-Click Scan ({meetup.verificationCode})
              </button>
            )}

            {/* Manual 4-Digit Code Input Form */}
            <form onSubmit={handleManualCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                Or enter buyer's 4-digit numeric code:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  maxLength={4}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 7492"
                  className="clean-input"
                  style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.22em', fontFamily: 'var(--font-mono)' }}
                  required
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.35rem', whiteSpace: 'nowrap', fontWeight: 800 }}
                >
                  Verify
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Verified Celebration Confirmation */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-green-subtle)',
                color: 'var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--accent-green)',
                boxShadow: '0 8px 24px rgba(5, 150, 105, 0.2)'
              }}
            >
              <CheckCircle2 size={44} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                Handshake Verified!
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Transaction completed successfully at {meetup?.landmarkSpot || 'Campus Meetup Zone'}.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--uc-gold-light)',
                border: '1.5px solid var(--uc-gold)',
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
              <ShieldCheck size={18} color="#D97706" />
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
