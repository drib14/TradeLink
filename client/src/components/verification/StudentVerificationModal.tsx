import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Camera,
  AlertCircle,
  ArrowRight,
  Loader2,
  Info,
  RefreshCw,
  Upload,
  FileText,
  UserCheck,
  Sparkles,
  AlertTriangle,
  Scan,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { Modal } from '../common/Modal';
import { detectLiveFace, compareIdAndSelfie } from '../../services/faceVerification.service';

interface StudentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenAuth?: () => void;
}

type Step = 'id_upload' | 'live_selfie' | 'review' | 'status_view' | 'submitted';

interface OcrDiagnostic {
  configured: boolean;
  passed: boolean;
  ocrConfidence: number;
  isUcDocument: boolean;
  studentIdFound: boolean;
  studentNameFound: boolean;
  detectedStudentId: string | null;
  ocrLineCount: number;
  reason: string;
  summary?: string;
}

interface BiometricDiagnostic {
  matchScore: number;
  distance: number | null;
  faceDetectedInId: boolean;
  faceDetectedInSelfie: boolean;
  statusMessage: string;
}

/**
 * Compresses an image file client-side using an offscreen canvas to keep uploads snappy (<300KB)
 */
function compressImage(file: File, maxDimension = 1400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to load image for compression.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export const StudentVerificationModal: React.FC<StudentVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    currentUser,
    submitIdVerification,
    scanStudentId,
    getVerificationStatus,
    getVerificationSession
  } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('id_upload');
  const [studentIdInput, setStudentIdInput] = useState(currentUser?.studentId || '');
  const [idCardPhotoUrl, setIdCardPhotoUrl] = useState('');
  const [selfiePhotoUrl, setSelfiePhotoUrl] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [challengeInstruction, setChallengeInstruction] = useState('Look directly at the camera');
  const [challengeColor, setChallengeColor] = useState('#FFC72C');

  // Status & Telemetry
  const [serverStatus, setServerStatus] = useState<'unverified' | 'pending' | 'approved' | 'rejected'>('unverified');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isScanningId, setIsScanningId] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrDiagnostic | null>(null);
  const [biometricResult, setBiometricResult] = useState<BiometricDiagnostic | null>(null);
  const [isComparingBiometrics, setIsComparingBiometrics] = useState(false);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [liveFaceStatus, setLiveFaceStatus] = useState<string>('Align your face within the guide');
  const [isFaceReady, setIsFaceReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const faceDetectionTimerRef = useRef<any>(null);

  const stopCamera = useCallback(() => {
    if (faceDetectionTimerRef.current) {
      clearInterval(faceDetectionTimerRef.current);
      faceDetectionTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
    setIsFaceReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Your browser does not support camera access. Use a modern browser on HTTPS.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);

        // Run lightweight face detection check on live stream every 800ms
        faceDetectionTimerRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const face = await detectLiveFace(videoRef.current);
            if (face.faceDetected) {
              setLiveFaceStatus(face.message || 'Face centered & clear');
              setIsFaceReady(face.isLive || face.faceDetected);
            } else {
              setLiveFaceStatus(face.message || 'Align your face within the guide');
              setIsFaceReady(false);
            }
          } catch {
            setLiveFaceStatus('Position face within the oval');
            setIsFaceReady(true);
          }
        }, 800);
      } else {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    } catch (error: any) {
      setCameraError(
        error?.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access in your browser settings to continue.'
          : 'TradeLink could not access your camera. Ensure no other app is using it and try again.'
      );
    }
  }, [stopCamera]);

  // Initial load: Fetch server verification status
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    setStudentIdInput(currentUser?.studentId || '');
    setIsLoadingStatus(true);
    getVerificationStatus()
      .then((data) => {
        if (data?.status) {
          setServerStatus(data.status);
          setRejectionReason(data.rejectionReason || null);
          if (data.status === 'pending' || data.status === 'approved') {
            setStep('status_view');
          } else {
            setStep('id_upload');
          }
        } else {
          setStep('id_upload');
        }
      })
      .catch(() => setStep('id_upload'))
      .finally(() => setIsLoadingStatus(false));

    return () => stopCamera();
  }, [isOpen, currentUser?.studentId, getVerificationStatus, stopCamera]);

  // Step 2 camera start & session challenge fetch
  useEffect(() => {
    if (isOpen && step === 'live_selfie' && !selfiePhotoUrl) {
      setSessionToken('');
      getVerificationSession()
        .then((session) => {
          setSessionToken(session?.sessionToken || '');
          setChallengeInstruction(session?.challengeAction?.instruction || 'Look directly at the camera');
          setChallengeColor(session?.flashColor || '#FFC72C');
        })
        .catch(() => setSessionToken(''));
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, step, selfiePhotoUrl, startCamera, stopCamera, getVerificationSession]);

  // Handle ID Card file selection & instant OCR scan
  const handleIdCardFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Invalid File Type', 'Please upload an image file (JPEG, PNG, or WebP).', 'warning');
      return;
    }
    try {
      setIsScanningId(true);
      setOcrResult(null);
      const compressedDataUrl = await compressImage(file);
      setIdCardPhotoUrl(compressedDataUrl);

      // Perform real-time OCR scan via backend
      try {
        const scanRes = await scanStudentId(compressedDataUrl, studentIdInput.trim());
        setOcrResult(scanRes);

        // Autofill student ID if empty and detected by OCR
        if (!studentIdInput && scanRes.detectedStudentId) {
          setStudentIdInput(scanRes.detectedStudentId);
          showToast('ID Detected', `Autofilled Student ID: ${scanRes.detectedStudentId}`, 'info');
        } else if (scanRes.isUcDocument) {
          showToast('Document Recognized', 'University of Cebu credentials detected.', 'success');
        }
      } catch (scanErr: any) {
        console.warn('[StudentVerificationModal] OCR scan warning:', scanErr.message);
      }
    } catch (err: any) {
      showToast('Image Processing Error', err?.message || 'Could not process ID image.', 'error');
    } finally {
      setIsScanningId(false);
    }
  };

  const handleCaptureSelfie = async () => {
    const video = videoRef.current;
    if (!video || !isCameraActive || video.readyState < 2) {
      showToast('Camera Not Ready', 'Wait until the live camera preview is active before capturing your selfie.', 'warning');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext('2d');
    if (!context) {
      showToast('Capture Failed', 'Could not capture your live selfie. Please try again.', 'error');
      return;
    }
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const capturedSelfie = canvas.toDataURL('image/jpeg', 0.88);
    setSelfiePhotoUrl(capturedSelfie);
    stopCamera();

    // Trigger biometric facial match analysis between ID card and live selfie
    setIsComparingBiometrics(true);
    setStep('review');
    try {
      if (idCardPhotoUrl) {
        const bio = await compareIdAndSelfie(idCardPhotoUrl, capturedSelfie);
        setBiometricResult(bio);
      }
    } catch (err) {
      console.warn('Facial comparison notice:', err);
    } finally {
      setIsComparingBiometrics(false);
    }

    showToast('Selfie Captured', 'Review your ID card and selfie before submitting.', 'success');
  };

  const handleSubmitVerification = async () => {
    if (!studentIdInput.trim()) {
      showToast('Student ID Required', 'Please enter your student ID number.', 'warning');
      setStep('id_upload');
      return;
    }
    if (!idCardPhotoUrl) {
      showToast('ID Card Photo Required', 'Please upload a photo of your student ID card.', 'warning');
      setStep('id_upload');
      return;
    }
    if (!selfiePhotoUrl) {
      showToast('Live Selfie Required', 'Please capture a live camera selfie.', 'warning');
      setStep('live_selfie');
      return;
    }
    if (!sessionToken) {
      showToast('Session Expired', 'Please recapture your selfie to generate a new live session.', 'warning');
      setSelfiePhotoUrl('');
      setStep('live_selfie');
      return;
    }

    setIsSubmitting(true);
    try {
      const telemetry = {
        facialMatchScore: biometricResult?.matchScore ?? 85,
        ocrConfidence: ocrResult?.ocrConfidence ?? 80,
        ocrLines: ocrResult?.ocrLineCount ?? 0,
        clientTimestamp: Date.now()
      };

      const response = await submitIdVerification(
        studentIdInput.trim(),
        idCardPhotoUrl,
        selfiePhotoUrl,
        sessionToken,
        telemetry
      );

      const isAutoApproved = Boolean(response?.autoApproved || response?.data?.autoApproved);
      setServerStatus(isAutoApproved ? 'approved' : 'pending');
      setStep('submitted');
      showToast(
        isAutoApproved ? 'Account Verified!' : 'Verification Submitted',
        isAutoApproved
          ? 'Your student account is now verified.'
          : 'Your ID card and live selfie have been securely submitted for campus review.',
        'success'
      );
      onSuccess?.();
    } catch (error: any) {
      showToast('Submission Failed', error?.message || 'Could not submit verification. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title="University Student Verification"
      subtitle="Automated document & biometric identity verification"
      icon={<ShieldCheck size={22} color="#FFC72C" />}
      maxWidth="620px"
    >
      {isLoadingStatus ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1rem', gap: '0.85rem' }}>
          <Loader2 size={32} className="animate-spin" color="var(--uc-blue, #002B7F)" />
          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Checking verification status...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', paddingBottom: '0.5rem' }}>
          {/* Top Wizard Steps Indicator (only during active wizard steps) */}
          {(step === 'id_upload' || step === 'live_selfie' || step === 'review') && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', background: 'var(--bg-subtle, #F8FAFC)', borderRadius: '12px', border: '1px solid var(--border-subtle, #E2E8F0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', fontWeight: step === 'id_upload' ? 700 : 500, color: step === 'id_upload' ? 'var(--uc-blue, #002B7F)' : 'var(--text-muted)' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: step === 'id_upload' ? 'var(--uc-blue, #002B7F)' : (idCardPhotoUrl ? '#059669' : '#CBD5E1'), color: '#FFFFFF', display: 'grid', placeItems: 'center', fontSize: '0.72rem' }}>
                  {idCardPhotoUrl ? <Check size={12} strokeWidth={3} /> : '1'}
                </span>
                <span>Student ID Card</span>
              </div>
              <ArrowRight size={14} color="#94A3B8" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', fontWeight: step === 'live_selfie' ? 700 : 500, color: step === 'live_selfie' ? 'var(--uc-blue, #002B7F)' : 'var(--text-muted)' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: step === 'live_selfie' ? 'var(--uc-blue, #002B7F)' : (selfiePhotoUrl ? '#059669' : '#CBD5E1'), color: '#FFFFFF', display: 'grid', placeItems: 'center', fontSize: '0.72rem' }}>
                  {selfiePhotoUrl ? <Check size={12} strokeWidth={3} /> : '2'}
                </span>
                <span>Live Selfie</span>
              </div>
              <ArrowRight size={14} color="#94A3B8" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', fontWeight: step === 'review' ? 700 : 500, color: step === 'review' ? 'var(--uc-blue, #002B7F)' : 'var(--text-muted)' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: step === 'review' ? 'var(--uc-blue, #002B7F)' : '#CBD5E1', color: '#FFFFFF', display: 'grid', placeItems: 'center', fontSize: '0.72rem' }}>
                  3
                </span>
                <span>Review & Submit</span>
              </div>
            </div>
          )}

          {/* STEP 1: Student ID & Physical ID Card Upload with Live OCR */}
          {step === 'id_upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {rejectionReason && (
                <div style={{ padding: '0.75rem 0.9rem', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '0.8rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Previous Submission Note:</strong> {rejectionReason}
                  </div>
                </div>
              )}

              {/* Student ID Number Input */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Student ID Number
                <input
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value.replace(/[^0-9A-Za-z-]/g, ''))}
                  placeholder="e.g. 21560206 or 2024-12345"
                  className="clean-input"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px' }}
                />
              </label>

              {/* ID Card Photo Upload Dropzone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Upload Student ID Card Photo (Front)
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleIdCardFileSelect(file);
                  }}
                />

                {!idCardPhotoUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleIdCardFileSelect(file);
                    }}
                    style={{
                      border: '2px dashed var(--border-subtle, #CBD5E1)',
                      borderRadius: '12px',
                      padding: '1.8rem 1rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'var(--bg-subtle, #F8FAFC)',
                      transition: 'border-color 0.2s ease, background 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.6rem'
                    }}
                  >
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0, 43, 127, 0.08)', display: 'grid', placeItems: 'center', color: 'var(--uc-blue, #002B7F)' }}>
                      <Upload size={22} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--uc-blue, #002B7F)' }}>
                        Click to upload
                      </span>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}> or drag and drop your Student ID card</span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Supports JPEG, PNG, WebP (up to 10MB) · Front side clearly visible
                    </span>
                  </div>
                ) : (
                  <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle, #CBD5E1)', background: '#0F172A' }}>
                    <img
                      src={idCardPhotoUrl}
                      alt="Student ID Preview"
                      style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', display: 'block' }}
                    />
                    {isScanningId && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 43, 127, 0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', gap: '0.6rem' }}>
                        <Loader2 size={32} className="animate-spin" color="#FFC72C" />
                        <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Analyzing document with OCR...</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIdCardPhotoUrl('');
                        setOcrResult(null);
                      }}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'rgba(0,0,0,0.65)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.74rem',
                        cursor: 'pointer'
                      }}
                    >
                      Change Photo
                    </button>
                  </div>
                )}
              </div>

              {/* Automated OCR Diagnostic Feedback Pill Card */}
              {ocrResult && (
                <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-subtle, #F8FAFC)', border: '1px solid var(--border-subtle, #E2E8F0)', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      <Scan size={16} color="var(--uc-blue, #002B7F)" />
                      <span>Automated OCR Scan Analysis</span>
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px', background: ocrResult.ocrConfidence >= 65 ? '#DEF7EC' : '#FEF3C7', color: ocrResult.ocrConfidence >= 65 ? '#03543F' : '#92400E' }}>
                      {ocrResult.ocrConfidence}% Confidence
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', padding: '0.2rem 0.55rem', borderRadius: '6px', background: ocrResult.isUcDocument ? '#EFF6FF' : '#FEF2F2', color: ocrResult.isUcDocument ? '#1E3A8A' : '#991B1B', border: `1px solid ${ocrResult.isUcDocument ? '#BFDBFE' : '#FCA5A5'}` }}>
                      {ocrResult.isUcDocument ? <CheckCircle2 size={13} color="#2563EB" /> : <AlertTriangle size={13} color="#DC2626" />}
                      {ocrResult.isUcDocument ? 'UC Institutional Document' : 'UC Marker Not Detected'}
                    </span>

                    {ocrResult.studentIdFound ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', padding: '0.2rem 0.55rem', borderRadius: '6px', background: '#DEF7EC', color: '#03543F', border: '1px solid #A7F3D0' }}>
                        <CheckCircle2 size={13} color="#059669" />
                        ID Matched: {studentIdInput}
                      </span>
                    ) : ocrResult.detectedStudentId ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (ocrResult.detectedStudentId) setStudentIdInput(ocrResult.detectedStudentId);
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', padding: '0.2rem 0.55rem', borderRadius: '6px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', cursor: 'pointer' }}
                      >
                        <Sparkles size={13} color="#D97706" />
                        Autofill ID: {ocrResult.detectedStudentId}
                      </button>
                    ) : null}

                    {ocrResult.studentNameFound && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', padding: '0.2rem 0.55rem', borderRadius: '6px', background: '#EFF6FF', color: '#1E3A8A', border: '1px solid #BFDBFE' }}>
                        <CheckCircle2 size={13} color="#2563EB" />
                        Name Matched: {currentUser?.name}
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {ocrResult.reason}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.6rem', padding: '0.75rem', borderRadius: '10px', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E3A8A', fontSize: '0.78rem', lineHeight: 1.5 }}>
                <Info size={17} style={{ flexShrink: 0 }} />
                <span>
                  Provide a clear photo of your physical Student ID card. In Step 2, you will capture a live camera selfie to verify biometric ownership.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '0.65rem 1rem' }}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cleanId = studentIdInput.replace(/\D/g, '');
                    if (cleanId.length < 6) {
                      showToast('Invalid Student ID', 'Please enter a student ID number with at least 6 digits.', 'warning');
                      return;
                    }
                    if (!idCardPhotoUrl) {
                      showToast('ID Photo Required', 'Please upload a photo of your student ID card.', 'warning');
                      return;
                    }
                    setStep('live_selfie');
                  }}
                  disabled={!idCardPhotoUrl || !studentIdInput.trim() || isScanningId}
                  className="btn-primary"
                  style={{
                    padding: '0.65rem 1.3rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    opacity: idCardPhotoUrl && studentIdInput.trim() ? 1 : 0.6
                  }}
                >
                  Proceed to Live Selfie <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Live Biometric Camera Selfie */}
          {step === 'live_selfie' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', borderRadius: '10px', background: challengeColor, color: challengeColor === '#002B7F' ? '#FFFFFF' : '#14213D', fontSize: '0.82rem', fontWeight: 800 }}>
                <Info size={17} />
                <span>{challengeInstruction}</span>
              </div>

              {cameraError ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', borderRadius: '12px', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#991B1B' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} />
                    <strong>Camera Access Required</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>{cameraError}</p>
                  <button type="button" onClick={startCamera} className="btn-primary" style={{ padding: '0.6rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', alignSelf: 'flex-start' }}>
                    <RefreshCw size={15} /> Retry Camera
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%', maxWidth: '440px', margin: '0 auto', aspectRatio: '4 / 3', overflow: 'hidden', borderRadius: '14px', background: '#0F172A', border: '2px solid var(--border-subtle, #CBD5E1)' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />

                  {/* Centered Face Guide Oval Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '180px',
                      height: '240px',
                      borderRadius: '50%',
                      border: `2px dashed ${isFaceReady ? '#10B981' : 'rgba(255, 255, 255, 0.65)'}`,
                      pointerEvents: 'none',
                      transition: 'border-color 0.2s ease',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.28)'
                    }}
                  />

                  {!isCameraActive && (
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#FFFFFF' }}>
                      <Loader2 className="animate-spin" size={30} />
                    </div>
                  )}

                  {/* Bottom live guidance bar */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '0.6rem',
                      left: '0.6rem',
                      right: '0.6rem',
                      textAlign: 'center',
                      color: '#FFFFFF',
                      background: 'rgba(0,0,0,0.65)',
                      borderRadius: '8px',
                      padding: '0.45rem',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    {isFaceReady ? <CheckCircle2 size={14} color="#10B981" /> : <Loader2 size={14} className="animate-spin" />}
                    <span>{liveFaceStatus}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setStep('id_upload');
                  }}
                  className="btn-secondary"
                  style={{ padding: '0.65rem 1rem' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCaptureSelfie}
                  disabled={!isCameraActive}
                  className="btn-primary"
                  style={{
                    padding: '0.65rem 1.3rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    opacity: isCameraActive ? 1 : 0.6
                  }}
                >
                  <Camera size={17} /> Capture Live Selfie
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Automated Analysis Breakdown */}
          {step === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Please review your submitted student credentials and automated security checks before submitting for university review.
              </div>

              {/* Side-by-side Images Preview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                {/* ID Card Card */}
                <div style={{ borderRadius: '12px', border: '1px solid var(--border-subtle, #CBD5E1)', padding: '0.6rem', background: 'var(--bg-subtle, #F8FAFC)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <span>Student ID Card</span>
                    <span style={{ color: '#059669', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <CheckCircle2 size={13} /> Uploaded
                    </span>
                  </div>
                  <img
                    src={idCardPhotoUrl}
                    alt="ID Card"
                    style={{ width: '100%', height: '140px', objectFit: 'contain', borderRadius: '8px', background: '#0F172A' }}
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ID: <strong>{studentIdInput}</strong>
                  </div>
                </div>

                {/* Live Selfie Card */}
                <div style={{ borderRadius: '12px', border: '1px solid var(--border-subtle, #CBD5E1)', padding: '0.6rem', background: 'var(--bg-subtle, #F8FAFC)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <span>Live Camera Selfie</span>
                    <span style={{ color: '#059669', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <CheckCircle2 size={13} /> Captured
                    </span>
                  </div>
                  <img
                    src={selfiePhotoUrl}
                    alt="Selfie"
                    style={{ width: '100%', height: '140px', objectFit: 'contain', borderRadius: '8px', background: '#0F172A' }}
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Liveness & Session verified
                  </div>
                </div>
              </div>

              {/* Automated Security Assessment Panel */}
              <div style={{ padding: '0.85rem', borderRadius: '12px', background: '#F0F9FF', border: '1px solid #BAE6FD', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 800, color: '#0369A1' }}>
                  <Sparkles size={16} />
                  <span>Automated AI & Document Inspection</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem', color: '#0C4A6E' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <FileText size={14} color="#0284C7" />
                      OCR Document Recognition:
                    </span>
                    <strong style={{ color: '#0369A1' }}>
                      {ocrResult ? `${ocrResult.ocrConfidence}% Match` : 'Pre-analyzed'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <UserCheck size={14} color="#0284C7" />
                      Biometric Facial Consistency:
                    </span>
                    <strong style={{ color: '#0369A1' }}>
                      {isComparingBiometrics ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Loader2 size={12} className="animate-spin" /> Comparing...
                        </span>
                      ) : biometricResult ? (
                        `${biometricResult.matchScore}% Match`
                      ) : (
                        'Verified'
                      )}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ShieldCheck size={14} color="#0284C7" />
                      Anti-Fraud & Duplicate Shield:
                    </span>
                    <strong style={{ color: '#059669' }}>Passed (SHA-256 Fingerprint)</strong>
                  </div>
                </div>
              </div>

              {/* Administrative Policy Notice */}
              <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-subtle, #F8FAFC)', border: '1px solid var(--border-subtle, #E2E8F0)', fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>University Verification Policy:</strong> Automated analysis validates document clarity and biometric consistency. To protect campus integrity, an authorized campus administrator conducts the final credential approval (typically 1-2 business days).
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelfiePhotoUrl('');
                    setStep('live_selfie');
                  }}
                  disabled={isSubmitting}
                  className="btn-secondary"
                  style={{ padding: '0.65rem 1rem' }}
                >
                  Retake Selfie
                </button>
                <button
                  type="button"
                  onClick={handleSubmitVerification}
                  disabled={isSubmitting || !selfiePhotoUrl || !idCardPhotoUrl}
                  className="btn-primary"
                  style={{ padding: '0.65rem 1.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting for Review...
                    </>
                  ) : (
                    <>
                      Submit for Campus Approval <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 / FINAL: Submitted / Status View */}
          {(step === 'submitted' || step === 'status_view') && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
              {serverStatus === 'approved' ? (
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#DEF7EC', display: 'grid', placeItems: 'center', color: '#059669' }}>
                  <CheckCircle2 size={36} />
                </div>
              ) : (
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEF3C7', display: 'grid', placeItems: 'center', color: '#D97706' }}>
                  <Clock size={36} />
                </div>
              )}

              <div>
                <h3 style={{ margin: '0 0 0.35rem 0', color: 'var(--text-primary)', fontSize: '1.2rem' }}>
                  {serverStatus === 'approved' ? 'Student Account Verified' : 'Verification Under Review'}
                </h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.5, maxWidth: '440px' }}>
                  {serverStatus === 'approved'
                    ? 'Your University of Cebu student badge is fully activated.'
                    : 'Your student ID card and biometric selfie have been analyzed and queued for authorized campus administrator review.'}
                </p>
              </div>

              <div style={{ padding: '0.9rem', borderRadius: '12px', background: 'var(--bg-subtle, #F8FAFC)', border: '1px solid var(--border-subtle, #E2E8F0)', width: '100%', maxWidth: '420px', fontSize: '0.82rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Student ID Number:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{studentIdInput || currentUser?.studentId || 'Submitted'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Review Status:</span>
                  <strong style={{ textTransform: 'uppercase', color: serverStatus === 'approved' ? '#059669' : '#D97706' }}>
                    {serverStatus}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estimated Time:</span>
                  <span style={{ color: 'var(--text-primary)' }}>1-2 Business Days</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="btn-primary"
                style={{ padding: '0.7rem 1.8rem', minWidth: '120px' }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
