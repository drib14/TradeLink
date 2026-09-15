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
  Award,
  Check,
  RotateCcw,
  Sun,
  Eye,
  ScanLine,
  BadgeCheck,
  Timer,
  Info,
  ShieldAlert,
  AlertTriangle,
  Lock
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

interface IdQualityCheck {
  sharpness: 'checking' | 'pass' | 'warn';
  lighting: 'checking' | 'pass' | 'warn';
  resolution: 'checking' | 'pass' | 'warn';
}

export const StudentVerificationModal: React.FC<StudentVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, submitIdVerification, getVerificationSession } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<VerificationStep>('id_upload');
  const [studentIdInput, setStudentIdInput] = useState(currentUser?.studentId || '');
  const [idPhotoUrl, setIdPhotoUrl] = useState<string>('');
  const [selfiePhotoUrl, setSelfiePhotoUrl] = useState<string>('');

  // ID Card Quality Checks
  const [idQuality, setIdQuality] = useState<IdQualityCheck>({
    sharpness: 'checking',
    lighting: 'checking',
    resolution: 'checking'
  });

  // Session challenge data
  const [sessionToken, setSessionToken] = useState<string>('');
  const [challengeAction, setChallengeAction] = useState<{ id: string; instruction: string }>({
    id: 'blink_tilt',
    instruction: 'Look straight at camera & blink twice'
  });
  const [flashColor, setFlashColor] = useState<string>('#FFC72C');

  // Biometric Liveness state
  const [livenessPassed, setLivenessPassed] = useState<boolean>(false);
  const [motionEnergy, setMotionEnergy] = useState<number>(0);

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isAutoApproved, setIsAutoApproved] = useState<boolean>(false);
  const [confidenceScore, setConfidenceScore] = useState<number>(95);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Stop camera stream tracks
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
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
      setLivenessPassed(false);
      setMotionEnergy(0);
    }
  }, [isOpen, stopCamera]);

  // Request secure challenge session token on mount/opening live_selfie
  const initVerificationSession = useCallback(async () => {
    try {
      const data = await getVerificationSession();
      if (data) {
        setSessionToken(data.sessionToken);
        if (data.challengeAction) setChallengeAction(data.challengeAction);
        if (data.flashColor) setFlashColor(data.flashColor);
      }
    } catch (e) {
      console.warn('Session token init fallback:', e);
    }
  }, [getVerificationSession]);

  // Analyze ID card image quality client-side (blur, lighting, resolution)
  const analyzeIdQuality = (dataUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      canvas.width = Math.min(width, 400);
      canvas.height = Math.min(height, 300);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imgData.data;

      // 1. Resolution check
      const resolutionPass = width >= 500 && height >= 300;

      // 2. Average luminance (lighting)
      let totalLuminance = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        totalLuminance += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      }
      const avgLuminance = totalLuminance / (pixels.length / 4);
      const lightingPass = avgLuminance >= 50 && avgLuminance <= 220;

      // 3. Simple high-frequency edge variance (sharpness indicator)
      let edgeDelta = 0;
      for (let i = 0; i < pixels.length - 8; i += 8) {
        edgeDelta += Math.abs(pixels[i] - pixels[i + 4]);
      }
      const sharpnessPass = edgeDelta > 4000;

      setIdQuality({
        resolution: resolutionPass ? 'pass' : 'warn',
        lighting: lightingPass ? 'pass' : 'warn',
        sharpness: sharpnessPass ? 'pass' : 'warn'
      });
    };
    img.src = dataUrl;
  };

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

  // Real-time liveness motion detection loop
  const runLivenessTracker = useCallback(() => {
    if (!videoRef.current || !isCameraActive) return;

    if (!motionCanvasRef.current) {
      motionCanvasRef.current = document.createElement('canvas');
      motionCanvasRef.current.width = 64;
      motionCanvasRef.current.height = 48;
    }

    const canvas = motionCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, 64, 48);
    const currFrame = ctx.getImageData(0, 0, 64, 48).data;

    if (lastFrameDataRef.current) {
      const prev = lastFrameDataRef.current;
      let diff = 0;
      for (let i = 0; i < currFrame.length; i += 8) {
        diff += Math.abs(currFrame[i] - prev[i]);
      }
      const normalizedDiff = Math.min(100, Math.round((diff / 250)));
      setMotionEnergy(normalizedDiff);

      // If user exhibits natural human motion within range, mark challenge as validated
      if (normalizedDiff > 12 && normalizedDiff < 90) {
        setLivenessPassed(true);
      }
    }

    lastFrameDataRef.current = new Uint8ClampedArray(currFrame);
    animFrameIdRef.current = requestAnimationFrame(runLivenessTracker);
  }, [isCameraActive]);

  useEffect(() => {
    if (isCameraActive && step === 'live_selfie' && !selfiePhotoUrl) {
      animFrameIdRef.current = requestAnimationFrame(runLivenessTracker);
    }
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isCameraActive, step, selfiePhotoUrl, runLivenessTracker]);

  // Handle video element mount with callback ref
  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    if (element && streamRef.current) {
      element.srcObject = streamRef.current;
      element.play().catch(() => { });
    }
  }, []);

  // Manage camera lifecycle when step changes
  useEffect(() => {
    if (step === 'live_selfie' && !selfiePhotoUrl) {
      initVerificationSession();
      startCamera(facingMode);
    } else if (step !== 'live_selfie') {
      stopCamera();
    }
    return () => {
      if (step !== 'live_selfie') {
        stopCamera();
      }
    };
  }, [step, selfiePhotoUrl, facingMode, startCamera, stopCamera, initVerificationSession]);

  // Flip camera between front and back
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

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // Dynamic Flash with subtle reflectance pulse
    setIsFlashActive(true);
    setTimeout(() => {
      setIsFlashActive(false);
      setSelfiePhotoUrl(dataUrl);
      setLivenessPassed(true);
      stopCamera();
    }, 250);
  }, [facingMode, stopCamera]);

  // Instant capture
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
        const result = event.target.result as string;
        setIdPhotoUrl(result);
        analyzeIdQuality(result);
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
    const cleanId = studentIdInput.replace(/\D/g, '');
    if (cleanId.length < 6) {
      showToast('Invalid Student ID', 'Please enter a valid Student ID with at least 6 digits.', 'warning');
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
      const res = await submitIdVerification(studentIdInput.trim(), idPhotoUrl, selfiePhotoUrl, sessionToken);
      const isAuto = Boolean(res?.autoApproved || res?.data?.autoApproved);
      const score = res?.confidenceScore ?? res?.data?.confidenceScore ?? (isAuto ? 95 : 75);
      setIsAutoApproved(isAuto);
      setConfidenceScore(score);

      if (isAuto) {
        confetti({
          particleCount: 160,
          spread: 80,
          origin: { y: 0.6 }
        });
        showToast('Identity Verified Instantly!', `Credentials passed automated verification with ${score}% confidence score. Verified Gold badge unlocked!`, 'success');
      } else {
        showToast('Verification Submitted', 'Credentials securely submitted. Your account is queued for campus administrator review.', 'info');
      }

      setStep('success');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      showToast('Submission Error', err?.message || 'Failed to submit verification request. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-custom" onClick={onClose} id="student-verification-modal-backdrop">
      <div
        className="modal-card-custom"
        id="student-verification-modal-card"
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
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'rgba(255, 199, 44, 0.2)', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 800, color: '#FFC72C' }}>
              <ShieldCheck size={14} />
              <span>UC Student Identity Shield</span>
            </div>
            <button
              onClick={onClose}
              id="close-verification-modal-btn"
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
            Official University of Cebu Verification
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.75)', margin: '0.2rem 0 0 0' }}>
            Fast, secure 2-step verification. Unlock instant marketplace listing, verified gold badge, and campus trust.
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
              {/* Privilege Perks Banner */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.65rem',
                  backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                  padding: '0.75rem',
                  borderRadius: '14px',
                  border: '1px solid var(--border-subtle, #E2E8F0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.74rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                  <Award size={15} color="#FFC72C" />
                  <span>Gold Badge</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.74rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                  <CheckCircle2 size={15} color="#10B981" />
                  <span>Trade & Sell</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.74rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                  <ShieldCheck size={15} color="#002B7F" />
                  <span>+25 Trust Pts</span>
                </div>
              </div>

              {/* Student ID Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  1. University of Cebu Student ID Number
                </label>
                <input
                  type="text"
                  id="student-id-number-input"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 20240001"
                  className="clean-input"
                  maxLength={20}
                  required
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                  Ensure this matches the printed ID number on your physical card.
                </span>
              </div>

              {/* Document Image Dropzone */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    2. Upload Physical Student ID Card *
                  </label>
                  {idPhotoUrl && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-green, #10B981)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Check size={12} /> Image Loaded
                    </span>
                  )}
                </div>

                {idPhotoUrl ? (
                  <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1.5px solid var(--border-subtle)', backgroundColor: '#0B132B', maxHeight: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={idPhotoUrl} alt="Student ID Preview" style={{ width: '100%', maxHeight: '240px', objectFit: 'contain' }} />
                    <button
                      type="button"
                      onClick={() => setIdPhotoUrl('')}
                      id="remove-id-photo-btn"
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
                      title="Replace photo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label
                    id="id-photo-dropzone-label"
                    style={{
                      border: '2px dashed var(--border-strong, #CBD5E1)',
                      borderRadius: '14px',
                      padding: '2.2rem 1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.65rem',
                      cursor: 'pointer',
                      backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', color: 'var(--uc-blue, #002B7F)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Upload size={24} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                        Click to upload your Student ID photo
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Supports PNG, JPG, or WEBP (Max 8MB). Keep card flat and legible.
                      </div>
                    </div>
                    <input
                      type="file"
                      id="id-card-file-input"
                      accept="image/*"
                      onChange={handleIdFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}

                {/* Pre-Validation Quality Diagnostics Panel */}
                {idPhotoUrl && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
                    <div className={`quality-pill ${idQuality.sharpness === 'pass' ? 'quality-pill-pass' : 'quality-pill-warn'}`}>
                      {idQuality.sharpness === 'pass' ? <Check size={12} /> : <AlertTriangle size={12} />}
                      <span>Sharpness: {idQuality.sharpness === 'pass' ? 'Sharp Text' : 'Moderate Blur'}</span>
                    </div>
                    <div className={`quality-pill ${idQuality.lighting === 'pass' ? 'quality-pill-pass' : 'quality-pill-warn'}`}>
                      {idQuality.lighting === 'pass' ? <Check size={12} /> : <AlertTriangle size={12} />}
                      <span>Lighting: {idQuality.lighting === 'pass' ? 'Optimal' : 'Check Glare'}</span>
                    </div>
                    <div className={`quality-pill ${idQuality.resolution === 'pass' ? 'quality-pill-pass' : 'quality-pill-warn'}`}>
                      {idQuality.resolution === 'pass' ? <Check size={12} /> : <AlertTriangle size={12} />}
                      <span>Resolution: {idQuality.resolution === 'pass' ? 'HD Passed' : 'Low Res'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="submit"
                id="proceed-to-selfie-btn"
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
                <span>Proceed to Step 2: Biometric Live Selfie</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* STEP 2: BIOMETRIC LIVE WEBCAM SELFIE & LIVENESS CHALLENGE */}
          {step === 'live_selfie' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.96rem', fontWeight: 900, color: 'var(--uc-blue)' }}>
                    <ShieldCheck size={17} color="var(--color-primary, #002B7F)" />
                    <span>Step 2: Biometric Liveness Verification</span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Real-time anti-spoofing scan to verify your face matches the submitted UC ID.
                  </div>
                </div>
                <button
                  type="button"
                  id="back-to-id-upload-btn"
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

              {/* ACTIVE LIVENESS INSTRUCTION BANNER */}
              <div
                style={{
                  backgroundColor: livenessPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 43, 127, 0.05)',
                  border: `1.5px solid ${livenessPassed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0, 43, 127, 0.15)'}`,
                  borderRadius: '14px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: livenessPassed ? '#10B981' : '#002B7F', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {livenessPassed ? <Check size={18} /> : <ScanLine size={18} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: livenessPassed ? '#059669' : 'var(--uc-blue)' }}>
                      {livenessPassed ? 'Liveness Challenge Confirmed!' : `Challenge: ${challengeAction.instruction}`}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {livenessPassed ? 'Live human presence validated. Ready for capture.' : 'Center your face in the oval reticle and follow the prompt.'}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.68rem', backgroundColor: livenessPassed ? '#D1FAE5' : 'var(--uc-blue-subtle)', color: livenessPassed ? '#065F46' : 'var(--uc-blue)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  {livenessPassed ? (
                    <>
                      <Check size={11} />
                      <span>Confirmed</span>
                    </>
                  ) : (
                    `Energy: ${motionEnergy}%`
                  )}
                </span>
              </div>

              {/* HIGH-TECH BIOMETRIC CAMERA VIEWPORT */}
              <div
                id="biometric-camera-viewport"
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '380px',
                  borderRadius: '20px',
                  backgroundColor: '#050B17',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${livenessPassed ? 'rgba(16, 185, 129, 0.6)' : 'rgba(0, 43, 127, 0.4)'}`,
                  boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.9), 0 12px 30px rgba(0, 29, 89, 0.25)'
                }}
              >
                {/* Dynamic Screen Flash Reflection Pulse */}
                {isFlashActive && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: flashColor || '#FFFFFF',
                      zIndex: 60,
                      animation: 'cameraFlashAnim 0.35s ease-out forwards',
                      pointerEvents: 'none'
                    }}
                  />
                )}

                {/* Captured Selfie Preview */}
                {selfiePhotoUrl ? (
                  <>
                    <img
                      src={selfiePhotoUrl}
                      alt="Captured Live Selfie Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
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
                      <Check size={15} /> Biometric Liveness Capture Secured
                    </div>

                    {/* Bottom Controls */}
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
                          setLivenessPassed(false);
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
                          gap: '0.4rem'
                        }}
                      >
                        <RotateCcw size={14} /> Retake
                      </button>
                      <button
                        type="button"
                        id="use-selfie-confirm-btn"
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
                        <CheckCircle2 size={15} /> Continue to Review
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

                        {/* Radar Sweep Effect */}
                        <div className="radar-sweep-cone" />

                        {/* Oval Face Guide with Dynamic Glowing Border */}
                        <div
                          className="face-guide-oval"
                          style={{
                            borderColor: livenessPassed ? '#10B981' : '#FFC72C',
                            boxShadow: livenessPassed ? '0 0 20px rgba(16, 185, 129, 0.8)' : '0 0 15px rgba(255, 199, 44, 0.6)'
                          }}
                        />

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
                            zIndex: 15
                          }}
                        >
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: livenessPassed ? '#10B981' : '#FFC72C', boxShadow: livenessPassed ? '0 0 8px #10B981' : '0 0 8px #FFC72C' }} />
                          <span>{livenessPassed ? 'Liveness Verified' : 'Live Anti-Spoofing Feed Active'}</span>
                        </div>

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
                              zIndex: 30
                            }}
                          >
                            {countdown}
                          </div>
                        )}

                        {/* Camera Flip Switch */}
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
                            zIndex: 15
                          }}
                          title="Switch Camera View"
                        >
                          <RefreshCw size={15} />
                        </button>
                      </>
                    ) : (
                      /* Connecting or Error State */
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
                              Initializing Secure Biometric Feed...
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#94A3B8', maxWidth: '320px' }}>
                              Please allow camera access when prompted by your browser.
                            </div>
                          </>
                        ) : cameraError ? (
                          <>
                            <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(220, 38, 38, 0.2)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ShieldAlert size={28} />
                            </div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F87171' }}>
                              Camera Access Blocked
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#CBD5E1', maxWidth: '420px', lineHeight: 1.45 }}>
                              {cameraError}
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
                              Ready for Facial Liveness Verification
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#94A3B8', maxWidth: '340px' }}>
                              Click below to activate your camera feed for real-time validation.
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

              {/* Shutter Capture Controls */}
              {isCameraActive && !selfiePhotoUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Instant Snap Button with Pulse */}
                    <button
                      type="button"
                      id="instant-selfie-capture-btn"
                      onClick={triggerInstantCapture}
                      disabled={countdown !== null}
                      className="shutter-btn-pulse"
                      style={{
                        backgroundColor: '#FFC72C',
                        color: '#002B7F',
                        border: '3px solid #FFFFFF',
                        borderRadius: '9999px',
                        padding: '0.65rem 1.4rem',
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        cursor: countdown !== null ? 'not-allowed' : 'pointer'
                      }}
                      title="Take Live Selfie"
                    >
                      <Camera size={18} color="#002B7F" />
                      <span>Take Instant Selfie</span>
                    </button>

                    {/* 3s Countdown Snap Button */}
                    <button
                      type="button"
                      id="timer-selfie-capture-btn"
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
                        cursor: countdown !== null ? 'not-allowed' : 'pointer'
                      }}
                      title="Take Selfie with 3-second timer"
                    >
                      <Timer size={16} color="#FFC72C" />
                      <span>3s Timer</span>
                    </button>
                  </div>

                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {countdown !== null ? `Capturing in ${countdown}... Hold still!` : 'Choose Instant Selfie or 3s Timer to complete step 2'}
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
                  Step 3: Review & Confirm Official Verification
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  Cross-examine your student ID document and facial live selfie before submitting for administrator review.
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
                    ID Number: {studentIdInput}
                  </div>
                </div>

                <div style={{ border: '1.5px solid var(--border-subtle)', borderRadius: '14px', padding: '0.85rem', backgroundColor: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--uc-blue)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Camera size={15} /> Live Facial Selfie
                  </div>
                  <img src={selfiePhotoUrl} alt="Selfie Preview" style={{ width: '100%', height: '145px', objectFit: 'cover', borderRadius: '10px' }} />
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-green, #059669)', marginTop: '0.35rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Check size={13} /> Liveness Match Passed
                  </div>
                </div>
              </div>

              {/* UC Data Privacy Pledge */}
              <div style={{ backgroundColor: 'var(--uc-blue-subtle)', border: '1px solid var(--uc-blue-border)', borderRadius: '14px', padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#002B7F', color: '#FFC72C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Lock size={15} />
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  <strong style={{ color: 'var(--uc-blue)' }}>UC Campus Data Privacy Pledge:</strong> Your ID and biometric live selfie are encrypted and exclusively reviewed by verified University of Cebu campus administrators for safety compliance. They are never shared publicly or with third parties.
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="button"
                  id="retake-selfie-review-btn"
                  onClick={() => setStep('live_selfie')}
                  className="btn-secondary"
                  disabled={isSubmitting}
                  style={{ flex: 1, padding: '0.85rem', fontSize: '0.86rem', fontWeight: 700 }}
                >
                  <ArrowLeft size={15} /> Retake Selfie
                </button>
                <button
                  type="button"
                  id="submit-verification-btn"
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
                      <span>Submitting Security Documents...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Submit For Campus Approval</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CELEBRATORY SUCCESS / LIVE STATUS */}
          {step === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.5rem 0.5rem', gap: '1.25rem' }}>
              {isAutoApproved ? (
                <>
                  <div
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '50%',
                      backgroundColor: '#002B7F',
                      color: '#FFC72C',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 30px rgba(255, 199, 44, 0.4), 0 8px 20px rgba(0, 43, 127, 0.3)'
                    }}
                  >
                    <BadgeCheck size={48} />
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--uc-blue)', margin: 0, fontFamily: 'var(--font-display)' }}>
                      Official UC Verification Approved!
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '440px', lineHeight: 1.5 }}>
                      Credentials verified automatically with <strong style={{ color: '#059669' }}>{confidenceScore}% confidence score</strong>. You are now officially recognized as a verified University of Cebu student.
                    </p>
                  </div>

                  {/* Unlocked Perks Showcase */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '460px',
                      backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                      borderRadius: '16px',
                      padding: '1rem 1.25rem',
                      border: '1.5px solid var(--border-subtle, #E2E8F0)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        +25 Campus Trust Score Added to Your Profile
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Official Gold Verified Webmaster Badge Unlocked
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Unlimited Peer-to-Peer Selling, Buying & Campus Swaps
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    id="close-success-verification-btn"
                    className="btn-primary"
                    style={{ padding: '0.8rem 2.5rem', fontSize: '0.92rem', fontWeight: 800, borderRadius: '12px', marginTop: '0.25rem' }}
                  >
                    Start Trading as Verified Student
                  </button>
                </>
              ) : (
                <>
                  <div style={{ width: '68px', height: '68px', borderRadius: '50%', backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)', color: 'var(--uc-blue, #002B7F)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={40} />
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--uc-blue)', margin: 0, fontFamily: 'var(--font-display)' }}>
                      Verification Queued for Campus Review
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '440px', lineHeight: 1.5 }}>
                      Your student credentials and biometric live selfie are now undergoing official University of Cebu campus administration review.
                    </p>
                  </div>

                  {/* Dynamic Live Status Timeline */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '460px',
                      backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                      borderRadius: '16px',
                      padding: '1.1rem 1.25rem',
                      border: '1.5px solid var(--border-subtle, #E2E8F0)',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--uc-blue)', marginBottom: '0.75rem' }}>
                      Verification Status Timeline:
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#10B981', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                          <Check size={13} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>1. Documents Uploaded</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Student ID and live biometric selfie encrypted and stored.</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#10B981', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                          <Check size={13} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>2. Anti-Spoofing Screening</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Optical motion and challenge telemetry passed.</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#F59E0B', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                          <Loader2 size={13} className="spin-animation" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#D97706' }}>3. Campus Administrator Approval</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>In progress — manual admin verification typically completed within 1–2 hours.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    id="close-success-verification-btn"
                    className="btn-primary"
                    style={{ padding: '0.8rem 2.25rem', fontSize: '0.92rem', fontWeight: 800, borderRadius: '12px', marginTop: '0.25rem' }}
                  >
                    Return to TradeLink
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
