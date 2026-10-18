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
  Clock,
  Sparkles,
  SwitchCamera,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import confetti from 'canvas-confetti';
import { compressImage } from '../../utils/imageCompressor';
import { compareIdAndSelfie, FaceMatchResult } from '../../services/faceVerification.service';

interface StudentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'id_upload' | 'selfie' | 'result';

export const StudentVerificationModal: React.FC<StudentVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, submitIdVerification, getVerificationSession } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('id_upload');
  const [studentIdInput, setStudentIdInput] = useState(currentUser?.studentId || '');
  const [idPhotoUrl, setIdPhotoUrl] = useState<string>('');
  const [selfiePhotoUrl, setSelfiePhotoUrl] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<string>('');

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Submission & Result states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'approved' | 'pending' | null>(null);
  const [matchScore, setMatchScore] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Clean stop camera stream
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

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    stopCamera();
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setShouldRender(false);
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
      onClose();
    }, 200);
  }, [isSubmitting, stopCamera, onClose]);

  // Modal open body locking & modal-open class
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else if (shouldRender && !isClosing) {
      handleClose();
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    if (shouldRender) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shouldRender, handleClose]);

  // Fetch cryptographic session token silently in background on modal open
  useEffect(() => {
    if (!isOpen) return;
    getVerificationSession()
      .then((data) => {
        if (data?.sessionToken) {
          setSessionToken(data.sessionToken);
        }
      })
      .catch(() => {
        // Safe silent fallback
      });
  }, [isOpen, getVerificationSession]);

  // Start webcam stream
  const startCamera = useCallback(async (mode: 'user' | 'environment' = 'user') => {
    stopCamera();
    setIsLoadingCamera(true);
    setCameraError(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 960 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('[StudentVerificationModal] Camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser settings.'
          : 'Could not access camera. Please check your camera connection.'
      );
    } finally {
      setIsLoadingCamera(false);
    }
  }, [stopCamera]);

  // Clean up camera on step change or close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      // Reset flow
      setStep('id_upload');
      setSelfiePhotoUrl('');
      setSubmissionStatus(null);
    } else if (step === 'selfie' && !selfiePhotoUrl) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, step, selfiePhotoUrl, facingMode, startCamera, stopCamera]);

  // Toggle front / rear camera
  const toggleCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Handle ID photo file upload with automatic client-side compression
  const handleIdFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress immediately to ~1024px JPEG under 150KB
      const compressed = await compressImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.82 });
      setIdPhotoUrl(compressed);
    } catch {
      showToast('Photo Error', 'Failed to process selected image. Please try another photo.', 'error');
    }
  };

  // Snap photo from video stream
  const handleSnapSelfie = async () => {
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

    const rawData = canvas.toDataURL('image/jpeg', 0.85);
    stopCamera();

    // Compress to clean lightweight size
    const compressed = await compressImage(rawData, { maxWidth: 800, maxHeight: 800, quality: 0.82 });
    setSelfiePhotoUrl(compressed);
  };

  // Retake selfie
  const handleRetakeSelfie = () => {
    setSelfiePhotoUrl('');
    startCamera(facingMode);
  };

  // Proceed from ID upload to Selfie step
  const handleProceedToSelfie = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = studentIdInput.replace(/\D/g, '');
    if (cleanId.length < 6) {
      showToast('Invalid Student ID', 'Please enter a valid Student ID number (at least 6 digits).', 'warning');
      return;
    }
    if (!idPhotoUrl) {
      showToast('ID Photo Required', 'Please upload a clear photo of your student ID card.', 'warning');
      return;
    }
    setStep('selfie');
  };

  // Submit verification with automated face matching
  const handleSubmitVerification = async () => {
    if (!idPhotoUrl || !selfiePhotoUrl) {
      showToast('Missing Photos', 'Please provide both your ID photo and a selfie.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Run automated biometric face match making using @vladmandic/face-api
      let matchResult: FaceMatchResult;
      try {
        matchResult = await compareIdAndSelfie(idPhotoUrl, selfiePhotoUrl);
      } catch (err) {
        console.warn('[StudentVerificationModal] Automated match comparison skipped:', err);
        matchResult = {
          matchScore: 75,
          distance: null,
          isMatchOver85: false,
          isManualReviewNeeded: true,
          faceDetectedInId: true,
          faceDetectedInSelfie: true,
          statusMessage: 'Forwarded for admin verification'
        };
      }

      setMatchScore(matchResult.matchScore);

      // 2. Prepare telemetry for backend verification engine
      const telemetry = {
        facialMatchScore: matchResult.matchScore,
        isMatchOver85: matchResult.isMatchOver85,
        faceDistance: matchResult.distance,
        faceDetectedInId: matchResult.faceDetectedInId,
        faceDetectedInSelfie: matchResult.faceDetectedInSelfie,
        deviceTime: new Date().toISOString()
      };

      // 3. Submit to server
      const res = await submitIdVerification(
        studentIdInput.trim(),
        idPhotoUrl,
        selfiePhotoUrl,
        sessionToken,
        telemetry
      );

      const isAuto = Boolean(res?.autoApproved || res?.data?.autoApproved);
      const finalStatus = isAuto ? 'approved' : 'pending';
      setSubmissionStatus(finalStatus);

      if (isAuto) {
        confetti({
          particleCount: 140,
          spread: 70,
          origin: { y: 0.6 }
        });
        showToast('Identity Verified!', 'Your ID and selfie matched. Verified badge unlocked!', 'success');
      } else {
        showToast('Submitted for Review', 'Your verification was received and queued for manual admin review.', 'info');
      }

      setStep('result');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      showToast('Submission Failed', err?.message || 'Could not submit verification. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`modal-backdrop-custom ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
      id="student-verification-modal-backdrop"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-card-custom"
        id="student-verification-modal-card"
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          background: '#FFFFFF',
          boxShadow: '0 25px 60px -15px rgba(0, 43, 127, 0.25)',
          overflow: 'hidden',
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#002B7F',
            padding: '1.25rem 1.5rem',
            color: '#FFFFFF',
            position: 'relative',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', fontWeight: 700, color: '#FFC72C' }}>
              <ShieldCheck size={16} />
              <span>Student Verification</span>
            </div>
            <button
              onClick={handleClose}
              id="close-verification-modal-btn"
              className="modal-close-btn"
              style={{
                color: 'rgba(255, 255, 255, 0.9)',
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}
              aria-label="Close dialog (Esc)"
              title="Close dialog (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginTop: '0.4rem', margin: '0.4rem 0 0 0' }}>
            Verify Your University ID
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.8)', margin: '0.2rem 0 0 0' }}>
            Get the verified student badge, build trust, and unlock trading on campus.
          </p>

          {/* Simple 2-Step Progress Indicator */}
          {step !== 'result' && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
              <div
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFC72C'
                }}
              />
              <div
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '9999px',
                  backgroundColor: step === 'selfie' ? '#FFC72C' : 'rgba(255, 255, 255, 0.25)',
                  transition: 'background-color 0.25s ease'
                }}
              />
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.4rem', overflowY: 'auto', flex: 1 }}>
          {/* STEP 1: ID PHOTO & ID NUMBER */}
          {step === 'id_upload' && (
            <form onSubmit={handleProceedToSelfie} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.35rem' }}>
                  Student ID Number
                </label>
                <input
                  type="text"
                  id="student-id-number-input"
                  inputMode="numeric"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value.replace(/[^0-9-]/g, ''))}
                  placeholder="e.g. 2024-12345 or 12345678"
                  className="clean-input"
                  maxLength={20}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.35rem' }}>
                  Student ID Card Photo
                </label>

                {idPhotoUrl ? (
                  <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #E2E8F0' }}>
                    <img
                      src={idPhotoUrl}
                      alt="Student ID Preview"
                      style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', backgroundColor: '#F8FAFC' }}
                    />
                    <label
                      htmlFor="change-id-file-input"
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        backgroundColor: '#FFFFFF',
                        color: '#002B7F',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <RefreshCw size={13} />
                      <span>Change Photo</span>
                    </label>
                    <input
                      type="file"
                      id="change-id-file-input"
                      accept="image/*"
                      onChange={handleIdFileChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                ) : (
                  <label
                    htmlFor="id-card-file-input"
                    style={{
                      border: '2px dashed #CBD5E1',
                      borderRadius: '14px',
                      padding: '1.8rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: '#F8FAFC',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: '#EEF2FF',
                        color: '#002B7F',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.6rem'
                      }}
                    >
                      <CreditCard size={22} />
                    </div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                      Click to upload your Student ID
                    </span>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '0.2rem' }}>
                      PNG, JPG, or WebP. Make sure your name and ID photo are legible.
                    </span>
                    <input
                      type="file"
                      id="id-card-file-input"
                      accept="image/*"
                      onChange={handleIdFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                id="proceed-to-selfie-btn"
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  backgroundColor: '#002B7F',
                  color: '#FFFFFF',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  marginTop: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <span>Next: Take Selfie</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* STEP 2: QUICK SELFIE */}
          {step === 'selfie' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
                  Take a Quick Selfie
                </span>
                <button
                  type="button"
                  onClick={() => setStep('id_upload')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#002B7F',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <ArrowLeft size={13} /> Back to ID
                </button>
              </div>

              {/* Camera or Snapshot View */}
              {selfiePhotoUrl ? (
                <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC', textAlign: 'center' }}>
                  <img
                    src={selfiePhotoUrl}
                    alt="Selfie Preview"
                    style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.9)',
                      color: '#FFFFFF',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>Selfie Captured</span>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    backgroundColor: '#0F172A',
                    minHeight: '260px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isLoadingCamera && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#FFFFFF' }}>
                      <Loader2 size={26} className="animate-spin" />
                      <span style={{ fontSize: '0.8rem' }}>Starting camera...</span>
                    </div>
                  )}

                  {cameraError && (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#FFFFFF', maxWidth: '340px' }}>
                      <AlertCircle size={32} color="#EF4444" style={{ margin: '0 auto 0.5rem auto' }} />
                      <p style={{ fontSize: '0.82rem', margin: 0 }}>{cameraError}</p>
                      <button
                        onClick={() => startCamera(facingMode)}
                        style={{
                          marginTop: '0.85rem',
                          backgroundColor: '#002B7F',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.4rem 0.9rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: isCameraActive ? 'block' : 'none',
                      transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                    }}
                  />

                  {/* Face Guide Oval */}
                  {isCameraActive && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '180px',
                        height: '230px',
                        borderRadius: '50%',
                        border: '2.5px dashed rgba(255, 199, 44, 0.85)',
                        pointerEvents: 'none',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)'
                      }}
                    />
                  )}

                  {/* Camera switch button */}
                  {isCameraActive && (
                    <button
                      type="button"
                      onClick={toggleCamera}
                      title="Switch camera"
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        border: 'none',
                        color: '#FFFFFF',
                        padding: '6px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <SwitchCamera size={16} />
                    </button>
                  )}
                </div>
              )}

              <p style={{ fontSize: '0.78rem', color: '#64748B', textAlign: 'center', margin: '0.1rem 0' }}>
                Center your face in the oval with good lighting, then snap a photo.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.3rem' }}>
                {selfiePhotoUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRetakeSelfie}
                      disabled={isSubmitting}
                      style={{
                        flex: 1,
                        padding: '0.8rem',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        borderRadius: '10px',
                        backgroundColor: '#F1F5F9',
                        color: '#334155',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <RefreshCw size={15} />
                      <span>Retake</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitVerification}
                      disabled={isSubmitting}
                      style={{
                        flex: 2,
                        padding: '0.8rem',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        borderRadius: '10px',
                        backgroundColor: '#002B7F',
                        color: '#FFFFFF',
                        border: 'none',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        opacity: isSubmitting ? 0.7 : 1
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Matching faces...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={16} />
                          <span>Submit & Verify</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleSnapSelfie}
                    disabled={!isCameraActive}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      borderRadius: '10px',
                      backgroundColor: '#002B7F',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: !isCameraActive ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      opacity: !isCameraActive ? 0.6 : 1
                    }}
                  >
                    <Camera size={17} />
                    <span>Take Selfie</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: RESULT SCREEN */}
          {step === 'result' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem 0.5rem', gap: '1rem' }}>
              {submissionStatus === 'approved' ? (
                <>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#ECFDF5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CheckCircle2 size={36} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      You're Verified!
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '0.4rem', maxWidth: '380px' }}>
                      Your Student ID and live selfie matched ({matchScore}% match). Your verified badge is now active on your profile.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#EFF6FF',
                      color: '#002B7F',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Clock size={36} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Submitted for Review
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '0.4rem', maxWidth: '380px' }}>
                      Thanks for submitting! Because of slight lighting or camera differences, our student moderators will quickly review your ID manually.
                    </p>
                    <span style={{ display: 'inline-block', fontSize: '0.76rem', color: '#002B7F', fontWeight: 700, backgroundColor: '#EEF2FF', padding: '4px 10px', borderRadius: '6px', marginTop: '0.6rem' }}>
                      Usually verified within 24 hours
                    </span>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  maxWidth: '240px',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  backgroundColor: '#002B7F',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '0.5rem'
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
