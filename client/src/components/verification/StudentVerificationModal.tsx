import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Camera,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Upload,
  Loader2,
  Sparkles,
  Check,
  RotateCcw,
  Maximize2,
  Sun,
  Eye,
  Smile,
  Timer,
  Info,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import confetti from 'canvas-confetti';

interface StudentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type VerificationStep = 'id_upload' | 'live_selfie' | 'review' | 'success';

export const StudentVerificationModal: React.FC<StudentVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, submitIdVerification } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<VerificationStep>('id_upload');
  const [studentIdInput, setStudentIdInput] = useState(currentUser?.studentId || '');
  const [idPhotoUrl, setIdPhotoUrl] = useState<string>('');
  const [selfiePhotoUrl, setSelfiePhotoUrl] = useState<string>('');

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsLoadingCamera(false);
  }, []);

  // Reset modal state on close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setStep('id_upload');
      setIdPhotoUrl('');
      setSelfiePhotoUrl('');
      setCameraError(null);
      setCountdown(null);
    }
  }, [isOpen, stopCamera]);

  // Start webcam stream
  const startCamera = useCallback(async (mode: 'user' | 'environment' = 'user') => {
    stopCamera();
    setIsLoadingCamera(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your current browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn('Video play error:', e);
        }
      }

      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera stream error:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraError('Camera access was blocked by your browser. Please enable camera permissions in your address bar (lock/tune icon) and click Retry Connection.');
      } else {
        setCameraError(err?.message || 'Unable to access your device camera. Please check camera connections.');
      }
      setIsCameraActive(false);
    } finally {
      setIsLoadingCamera(false);
    }
  }, [stopCamera]);

  // Handle video element mount with callback ref to attach stream immediately
  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    if (element && streamRef.current) {
      element.srcObject = streamRef.current;
      element.play().catch(() => {});
    }
  }, []);

  // Manage camera lifecycle when step is live_selfie
  useEffect(() => {
    if (step === 'live_selfie' && !selfiePhotoUrl) {
      startCamera(facingMode);
    } else if (step !== 'live_selfie') {
      stopCamera();
    }
    return () => {
      if (step !== 'live_selfie') {
        stopCamera();
      }
    };
  }, [step, selfiePhotoUrl, facingMode, startCamera, stopCamera]);

  // Flip camera between front and back (if supported)
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Perform snapshot execution
  const executeSnap = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally for front camera mirror effect
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // Flash animation
    setIsFlashActive(true);
    setTimeout(() => {
      setIsFlashActive(false);
      setSelfiePhotoUrl(dataUrl);
      stopCamera();
    }, 220);
  }, [facingMode, stopCamera]);

  // Instant capture without countdown
  const triggerInstantCapture = () => {
    if (!isCameraActive || countdown !== null) return;
    executeSnap();
  };

  // Trigger countdown then snapshot
  const triggerSelfieCapture = () => {
    if (!isCameraActive || countdown !== null) return;

    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          executeSnap();
          return null;
        }
        return prev - 1;
      });
    }, 850);
  };

  // Handle ID image file upload
  const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('File Too Large', 'Please select an image smaller than 8MB.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setIdPhotoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProceedToSelfie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idPhotoUrl) {
      showToast('ID Photo Required', 'Please upload a clear photo of your student ID card.', 'warning');
      return;
    }
    if (!studentIdInput.trim()) {
      showToast('Student ID Missing', 'Please enter your student ID number.', 'warning');
      return;
    }
    setStep('live_selfie');
  };

  const handleProceedToReview = () => {
    if (!selfiePhotoUrl) {
      showToast('Live Selfie Required', 'Please capture your live webcam selfie to continue.', 'warning');
      return;
    }
    stopCamera();
    setStep('review');
  };

  const handleSubmitVerification = async () => {
    setIsSubmitting(true);
    try {
      await submitIdVerification(studentIdInput.trim(), idPhotoUrl, selfiePhotoUrl);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
      showToast('Verification Submitted', 'Your student ID and live selfie have been submitted for administrator review.', 'success');
      setStep('success');
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      showToast('Submission Error', 'Failed to submit verification request. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div
        className="modal-card-custom"
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.98)',
          boxShadow: '0 30px 70px -15px rgba(0, 43, 127, 0.35), 0 0 0 1px rgba(0, 43, 127, 0.1)',
          backdropFilter: 'blur(24px)',
          overflow: 'hidden',
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #002B7F 0%, #001A4E 100%)',
            padding: '1.25rem 1.6rem',
            position: 'relative',
            color: '#FFFFFF',
            flexShrink: 0,
            borderBottom: '2px solid rgba(255, 199, 44, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'rgba(255, 199, 44, 0.2)', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 800, color: '#FFC72C' }}>
              <ShieldCheck size={14} />
              <span>UC Student Verification Portal</span>
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

          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', marginTop: '0.65rem', margin: '0.65rem 0 0 0', fontFamily: 'var(--font-display)' }}>
            2-Step Identity Verification
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.75)', margin: '0.2rem 0 0 0' }}>
            Verify your official enrollment at University of Cebu to unlock instant marketplace listing & trade permissions.
          </p>

          {/* Stepper Progress Bar */}
          {step !== 'success' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.9rem' }}>
              <div
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFC72C',
                  boxShadow: '0 0 8px rgba(255, 199, 44, 0.6)'
                }}
              />
              <div
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '9999px',
                  backgroundColor: step === 'live_selfie' || step === 'review' ? '#FFC72C' : 'rgba(255, 255, 255, 0.25)',
                  boxShadow: step === 'live_selfie' || step === 'review' ? '0 0 8px rgba(255, 199, 44, 0.6)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
              <div
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '9999px',
                  backgroundColor: step === 'review' ? '#FFC72C' : 'rgba(255, 255, 255, 0.25)',
                  boxShadow: step === 'review' ? '0 0 8px rgba(255, 199, 44, 0.6)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* STEP 1: ID DOCUMENT UPLOAD */}
          {step === 'id_upload' && (
            <form onSubmit={handleProceedToSelfie} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Student ID Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  1. Official Student ID Number *
                </label>
                <input
                  type="text"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="ID Number"
                  className="clean-input"
                  maxLength={15}
                  required
                />
              </div>

              {/* Document Image Dropzone */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  2. Upload Clear Photo of Physical Student ID Card *
                </label>

                {idPhotoUrl ? (
                  <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1.5px solid var(--border-subtle)', backgroundColor: '#0B132B', maxHeight: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={idPhotoUrl} alt="Student ID Preview" style={{ width: '100%', maxHeight: '230px', objectFit: 'contain' }} />
                    <button
                      type="button"
                      onClick={() => setIdPhotoUrl('')}
                      style={{
                        position: 'absolute',
                        top: '0.65rem',
                        right: '0.65rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      border: '2px dashed var(--border-strong, #CBD5E1)',
                      borderRadius: '14px',
                      padding: '2rem 1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.65rem',
                      cursor: 'pointer',
                      backgroundColor: 'var(--bg-subtle)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--uc-blue-subtle)', color: 'var(--uc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Upload size={24} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                        Click to upload or take a photo of your ID
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        PNG, JPG, or WEBP (Max. 8MB). Ensure name & ID number are legible.
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIdFileChange}
                      style={{ display: 'none' }}
                      required
                    />
                  </label>
                )}
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                  boxShadow: '0 4px 14px rgba(0, 43, 127, 0.25)'
                }}
              >
                <span>Proceed to Step 2: Live Selfie</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* STEP 2: STUNNING BIOMETRIC LIVE WEBCAM SELFIE */}
          {step === 'live_selfie' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.96rem', fontWeight: 900, color: 'var(--uc-blue)' }}>
                    <Sparkles size={17} color="#FFC72C" />
                    <span>Step 2: Biometric Live Facial Verification</span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Capture a real-time live webcam photo to match with your submitted UC student ID.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setStep('id_upload');
                  }}
                  className="btn-ghost"
                  style={{ fontSize: '0.78rem', color: 'var(--uc-blue)', fontWeight: 700 }}
                >
                  <ArrowLeft size={14} /> Back to ID
                </button>
              </div>

              {/* LIVE SELFIE GUIDELINES & INSTRUCTIONS PANEL */}
              <div
                style={{
                  backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                  border: '1.5px solid var(--border-subtle, #E2E8F0)',
                  borderRadius: '16px',
                  padding: '1rem 1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                    <ShieldCheck size={16} color="var(--accent-green, #10B981)" />
                    <span>Live Selfie Guidelines for Quick Approval:</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', color: 'var(--uc-blue)', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 800 }}>
                    Strict Live Only
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', backgroundColor: 'var(--bg-surface, #FFFFFF)', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle, #E2E8F0)' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'rgba(255, 199, 44, 0.2)', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Sun size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>1. Bright & Even Light</div>
                      <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>Face a good light source. Avoid dark shadows or strong backlight.</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', backgroundColor: 'var(--bg-surface, #FFFFFF)', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle, #E2E8F0)' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Eye size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>2. Uncovered Face</div>
                      <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>Remove sunglasses, caps, and face masks so all features are visible.</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', backgroundColor: 'var(--bg-surface, #FFFFFF)', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle, #E2E8F0)' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Maximize2 size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>3. Center in Oval</div>
                      <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>Position your face inside the golden oval reticle at eye level.</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', backgroundColor: 'var(--bg-surface, #FFFFFF)', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle, #E2E8F0)' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Smile size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>4. Natural Expression</div>
                      <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>Look straight at the camera lens with your eyes clearly open.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* HIGH-TECH BIOMETRIC CAMERA VIEWPORT */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '390px',
                  borderRadius: '20px',
                  backgroundColor: '#050B17',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(0, 43, 127, 0.4)',
                  boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.9), 0 12px 30px rgba(0, 29, 89, 0.25)'
                }}
              >
                {/* 1. Flash effect layer */}
                {isFlashActive && <div className="camera-flash-effect" />}

                {/* 2. Captured Selfie Preview */}
                {selfiePhotoUrl ? (
                  <>
                    <img
                      src={selfiePhotoUrl}
                      alt="Captured Live Selfie Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Verified capture badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '1rem',
                        left: '1rem',
                        backgroundColor: 'rgba(5, 150, 105, 0.95)',
                        color: '#FFFFFF',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '9999px',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
                        backdropFilter: 'blur(8px)'
                      }}
                    >
                      <Check size={15} /> Live Biometric Selfie Captured
                    </div>

                    {/* Bottom Action Controls */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '1.25rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '0.75rem',
                        backgroundColor: 'rgba(0, 18, 61, 0.9)',
                        padding: '0.55rem 1rem',
                        borderRadius: '9999px',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255, 199, 44, 0.35)'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelfiePhotoUrl('');
                          startCamera(facingMode);
                        }}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <RotateCcw size={14} /> Retake Photo
                      </button>
                      <button
                        type="button"
                        onClick={handleProceedToReview}
                        style={{
                          backgroundColor: 'var(--uc-gold, #FFC72C)',
                          color: '#002B7F',
                          border: 'none',
                          padding: '0.5rem 1.15rem',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 2px 10px rgba(255, 199, 44, 0.4)'
                        }}
                      >
                        <CheckCircle2 size={15} /> Use This Selfie
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Active Live Video Element */}
                    <video
                      ref={setVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                        opacity: isCameraActive ? 1 : 0,
                        transition: 'opacity 0.25s ease'
                      }}
                    />

                    {/* Holographic 4 Corner Targeting Reticles */}
                    <div style={{ position: 'absolute', top: 14, left: 14, width: 22, height: 22, borderTop: '3px solid #FFC72C', borderLeft: '3px solid #FFC72C', borderRadius: '4px 0 0 0', pointerEvents: 'none', zIndex: 12 }} />
                    <div style={{ position: 'absolute', top: 14, right: 14, width: 22, height: 22, borderTop: '3px solid #FFC72C', borderRight: '3px solid #FFC72C', borderRadius: '0 4px 0 0', pointerEvents: 'none', zIndex: 12 }} />
                    <div style={{ position: 'absolute', bottom: 14, left: 14, width: 22, height: 22, borderBottom: '3px solid #FFC72C', borderLeft: '3px solid #FFC72C', borderRadius: '0 0 0 4px', pointerEvents: 'none', zIndex: 12 }} />
                    <div style={{ position: 'absolute', bottom: 14, right: 14, width: 22, height: 22, borderBottom: '3px solid #FFC72C', borderRight: '3px solid #FFC72C', borderRadius: '0 0 4px 0', pointerEvents: 'none', zIndex: 12 }} />

                    {isCameraActive ? (
                      <>
                        {/* Biometric Scanning Laser Line */}
                        <div className="biometric-scanner-line" />

                        {/* Oval Face Guide with Glowing Pulse */}
                        <div className="face-guide-oval" />

                        {/* Top Security Status Pill */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '1rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(0, 24, 76, 0.88)',
                            border: '1px solid rgba(255, 199, 44, 0.45)',
                            color: '#FFFFFF',
                            padding: '0.35rem 1rem',
                            borderRadius: '9999px',
                            fontSize: '0.73rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            backdropFilter: 'blur(8px)',
                            zIndex: 15,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.35)'
                          }}
                        >
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                          <span>Live Biometric Stream Active</span>
                        </div>

                        {/* Bottom Live Alignment Cue */}
                        {countdown === null && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '1rem',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              backgroundColor: 'rgba(0, 0, 0, 0.65)',
                              color: '#FFC72C',
                              padding: '0.3rem 0.85rem',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              zIndex: 15,
                              pointerEvents: 'none',
                              backdropFilter: 'blur(6px)'
                            }}
                          >
                            Align face inside oval & hold steady
                          </div>
                        )}

                        {/* Center Countdown Overlay (if active) */}
                        {countdown !== null && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              fontSize: '5rem',
                              fontWeight: 900,
                              color: '#FFC72C',
                              textShadow: '0 0 30px rgba(0,0,0,0.9), 0 0 20px rgba(255, 199, 44, 0.8)',
                              fontFamily: 'var(--font-display)',
                              zIndex: 30,
                              animation: 'shutterPulseRing 0.85s ease-out infinite'
                            }}
                          >
                            {countdown}
                          </div>
                        )}

                        {/* Camera Flip Switch (Top Right) */}
                        <button
                          type="button"
                          onClick={toggleFacingMode}
                          style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 15,
                            transition: 'transform 0.15s ease'
                          }}
                          title="Switch Camera View"
                        >
                          <RefreshCw size={15} />
                        </button>
                      </>
                    ) : (
                      /* Camera Connecting or Error State */
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.9rem',
                          padding: '1.75rem',
                          textAlign: 'center',
                          color: '#FFFFFF',
                          zIndex: 10,
                          backgroundColor: 'rgba(5, 11, 23, 0.96)'
                        }}
                      >
                        {isLoadingCamera ? (
                          <>
                            <Loader2 size={40} className="spin-animation" color="#FFC72C" />
                            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFC72C' }}>
                              Connecting to Secure Video Stream...
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#94A3B8', maxWidth: '320px' }}>
                              Please allow browser camera permissions when prompted.
                            </div>
                          </>
                        ) : cameraError ? (
                          <>
                            <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(220, 38, 38, 0.2)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ShieldAlert size={28} />
                            </div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F87171' }}>
                              Camera Access Required
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#CBD5E1', maxWidth: '420px', lineHeight: 1.45 }}>
                              {cameraError}
                            </div>
                            
                            {/* Clear Troubleshooting Guidance */}
                            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '0.75rem 1rem', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', maxWidth: '390px', width: '100%' }}>
                              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#FFC72C', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Info size={13} /> Troubleshooting Camera Access:
                              </div>
                              <ul style={{ fontSize: '0.71rem', color: '#94A3B8', paddingLeft: '1.1rem', margin: 0, lineHeight: 1.4 }}>
                                <li>Click the <strong>Lock / Camera icon</strong> in your browser address bar.</li>
                                <li>Set <strong>Camera</strong> permission to <strong>Allow</strong>.</li>
                                <li>Close any other app using your webcam (e.g. Zoom, Teams, Meet).</li>
                              </ul>
                            </div>

                            <button
                              type="button"
                              onClick={() => startCamera(facingMode)}
                              className="btn-gold"
                              style={{ padding: '0.6rem 1.4rem', fontSize: '0.82rem', fontWeight: 800, marginTop: '0.25rem' }}
                            >
                              <RefreshCw size={14} /> Retry Camera Connection
                            </button>
                          </>
                        ) : (
                          <>
                            <div style={{ width: '58px', height: '58px', borderRadius: '50%', backgroundColor: 'rgba(255, 199, 44, 0.15)', color: '#FFC72C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Camera size={30} />
                            </div>
                            <div style={{ fontSize: '0.96rem', fontWeight: 800 }}>
                              Ready for Facial Verification
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#94A3B8', maxWidth: '340px' }}>
                              Click below to activate your live webcam feed for biometric matching.
                            </div>
                            <button
                              type="button"
                              onClick={() => startCamera(facingMode)}
                              className="btn-gold"
                              style={{ padding: '0.65rem 1.5rem', fontSize: '0.86rem', fontWeight: 800 }}
                            >
                              <Camera size={17} /> Turn On Camera
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Shutter Capture Controls (Dual: Instant Snap & 3s Countdown Snap) */}
              {isCameraActive && !selfiePhotoUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Instant Snap Button */}
                    <button
                      type="button"
                      onClick={triggerInstantCapture}
                      disabled={countdown !== null}
                      style={{
                        backgroundColor: '#FFC72C',
                        color: '#002B7F',
                        border: '3px solid #FFFFFF',
                        boxShadow: '0 0 20px rgba(255, 199, 44, 0.5), 0 6px 16px rgba(0, 43, 127, 0.25)',
                        borderRadius: '9999px',
                        padding: '0.65rem 1.4rem',
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        cursor: countdown !== null ? 'not-allowed' : 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                      title="Take Live Selfie Now"
                    >
                      <Camera size={18} color="#002B7F" />
                      <span>Take Instant Selfie</span>
                    </button>

                    {/* 3s Countdown Snap Button */}
                    <button
                      type="button"
                      onClick={triggerSelfieCapture}
                      disabled={countdown !== null}
                      style={{
                        backgroundColor: 'var(--uc-blue)',
                        color: '#FFFFFF',
                        border: '1.5px solid var(--border-subtle, #E2E8F0)',
                        borderRadius: '9999px',
                        padding: '0.65rem 1.25rem',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        cursor: countdown !== null ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                      title="Take Selfie with 3-second timer"
                    >
                      <Timer size={16} color="#FFC72C" />
                      <span>3s Timer</span>
                    </button>
                  </div>

                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {countdown !== null ? `Capturing in ${countdown}... Hold still!` : 'Choose Instant Selfie or 3s Timer to capture your live photo'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: REVIEW & SUBMIT */}
          {step === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 900, color: 'var(--uc-blue)' }}>
                  Step 3: Review & Submit Official Verification
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  Please confirm that your student ID and facial live selfie match clearly.
                </div>
              </div>

              {/* Side-by-Side Comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div style={{ border: '1.5px solid var(--border-subtle)', borderRadius: '14px', padding: '0.85rem', backgroundColor: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--uc-blue)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CreditCard size={15} /> Student ID Card
                  </div>
                  <img src={idPhotoUrl} alt="ID Preview" style={{ width: '100%', height: '145px', objectFit: 'cover', borderRadius: '10px' }} />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.35rem', fontWeight: 800 }}>
                    ID: {studentIdInput}
                  </div>
                </div>

                <div style={{ border: '1.5px solid var(--border-subtle)', borderRadius: '14px', padding: '0.85rem', backgroundColor: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--uc-blue)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Camera size={15} /> Live Facial Selfie
                  </div>
                  <img src={selfiePhotoUrl} alt="Selfie Preview" style={{ width: '100%', height: '145px', objectFit: 'cover', borderRadius: '10px' }} />
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-green, #059669)', marginTop: '0.35rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Check size={13} /> Biometric Match Ready
                  </div>
                </div>
              </div>

              {/* Student Summary Info */}
              <div style={{ backgroundColor: 'var(--uc-blue-subtle)', border: '1px solid var(--uc-blue-border)', borderRadius: '14px', padding: '0.9rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                  Verification Summary:
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Student: <strong>{currentUser?.name}</strong> • Campus: <strong>{currentUser?.campus}</strong>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Upon submission, your credentials will be reviewed by campus administrators to ensure official University of Cebu student safety.
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setStep('live_selfie')}
                  className="btn-secondary"
                  disabled={isSubmitting}
                  style={{ flex: 1, padding: '0.85rem', fontSize: '0.86rem', fontWeight: 700 }}
                >
                  <ArrowLeft size={15} /> Retake Selfie
                </button>
                <button
                  type="button"
                  onClick={handleSubmitVerification}
                  className="btn-primary"
                  disabled={isSubmitting}
                  style={{
                    flex: 2,
                    padding: '0.85rem',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(0, 43, 127, 0.25)'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="spin-animation" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Submit For Admin Review</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CELEBRATORY SUCCESS */}
          {step === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.75rem 1rem', gap: '1.1rem' }}>
              <div style={{ width: '68px', height: '68px', borderRadius: '50%', backgroundColor: 'var(--accent-green-subtle)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={40} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--uc-blue)', margin: 0, fontFamily: 'var(--font-display)' }}>
                  Verification Submitted for Review!
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '440px', lineHeight: 1.5 }}>
                  Your student ID and biometric live selfie have been securely submitted to campus moderators. Once approved, your profile will be awarded the official Verified Student badge and full marketplace listing access.
                </p>
              </div>

              <button
                onClick={onClose}
                className="btn-primary"
                style={{ padding: '0.8rem 2.25rem', fontSize: '0.92rem', fontWeight: 800, borderRadius: '12px', marginTop: '0.5rem' }}
              >
                Close & Return
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
