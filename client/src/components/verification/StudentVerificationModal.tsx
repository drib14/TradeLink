import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ShieldCheck, CheckCircle2, Clock, Camera, AlertCircle, ArrowRight, Loader2, Info, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { Modal } from '../common/Modal';

interface StudentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenAuth?: () => void;
}

type Step = 'student_id' | 'live_selfie' | 'review' | 'status_view' | 'submitted';

export const StudentVerificationModal: React.FC<StudentVerificationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser, submitIdVerification, getVerificationStatus, getVerificationSession } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>('student_id');
  const [studentIdInput, setStudentIdInput] = useState(currentUser?.studentId || '');
  const [selfiePhotoUrl, setSelfiePhotoUrl] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [serverStatus, setServerStatus] = useState<'unverified' | 'pending' | 'approved' | 'rejected'>('unverified');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Your browser does not support camera access. Use a supported browser on a secure HTTPS connection.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      } else {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    } catch (error: any) {
      setCameraError(error?.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow camera access in your browser settings to continue.'
        : 'TradeLink could not access your camera. Enable your device camera and try again.');
    }
  }, [stopCamera]);

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
          setStep(data.status === 'pending' || data.status === 'approved' ? 'status_view' : 'student_id');
        } else {
          setStep('student_id');
        }
      })
      .catch(() => setStep('student_id'))
      .finally(() => setIsLoadingStatus(false));

    getVerificationSession()
      .then((session) => setSessionToken(session?.sessionToken || ''))
      .catch(() => setSessionToken(''));

    return () => stopCamera();
  }, [isOpen, currentUser?.studentId, getVerificationStatus, getVerificationSession, stopCamera]);

  useEffect(() => {
    if (isOpen && step === 'live_selfie' && !selfiePhotoUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, step, selfiePhotoUrl, startCamera, stopCamera]);

  const handleCaptureSelfie = () => {
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
    setSelfiePhotoUrl(canvas.toDataURL('image/jpeg', 0.88));
    stopCamera();
    showToast('Live Selfie Captured', 'Review your live camera selfie before submitting it for campus review.', 'success');
  };

  const handleSubmitVerification = async () => {
    if (!selfiePhotoUrl) {
      showToast('Live Selfie Required', 'Capture a live selfie using your device camera before submitting.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      // The live camera capture is stored in the existing primary image field for backward compatibility.
      // No student ID card, COE, COR, or other enrollment document is requested or submitted.
      const response = await submitIdVerification(studentIdInput.trim(), selfiePhotoUrl, undefined, sessionToken || undefined);
      const isAutoApproved = Boolean(response?.autoApproved || response?.data?.autoApproved);
      setServerStatus(isAutoApproved ? 'approved' : 'pending');
      setStep('submitted');
      showToast(
        isAutoApproved ? 'Account Verified!' : 'Verification Submitted',
        isAutoApproved ? 'Your student account is verified.' : 'Your live selfie has been sent to campus administrators for review.',
        'success'
      );
      onSuccess?.();
    } catch (error: any) {
      showToast('Could Not Submit', error?.message || 'Your live selfie could not be submitted. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { stopCamera(); onClose(); }}
      title="Student Verification"
      subtitle="Live selfie verification for campus safety"
      icon={<ShieldCheck size={22} color="#FFC72C" />}
      maxWidth="560px"
    >
      {isLoadingStatus ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 1rem', gap: '0.75rem' }}>
          <Loader2 size={30} className="animate-spin" color="var(--uc-blue, #002B7F)" />
          <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>Checking verification status...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '0.5rem' }}>
          {step === 'status_view' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', padding: '1rem 0' }}>
              {serverStatus === 'approved' ? <CheckCircle2 size={42} color="#059669" /> : <Clock size={42} color="#D97706" />}
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{serverStatus === 'approved' ? 'Student Account Verified' : 'Verification Under Review'}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.5 }}>
                {serverStatus === 'approved' ? 'Your student account is verified.' : 'Your live selfie is awaiting review by an authorized campus administrator.'}
              </p>
              <button type="button" onClick={onClose} className="btn-primary" style={{ padding: '0.65rem 1.4rem' }}>Done</button>
            </div>
          )}

          {step === 'student_id' && (
            <form onSubmit={(event) => {
              event.preventDefault();
              const cleanId = studentIdInput.replace(/\D/g, '');
              if (cleanId.length < 6) {
                showToast('Invalid Student ID', 'Enter a valid student ID number with at least 6 digits.', 'warning');
                return;
              }
              setStep('live_selfie');
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {rejectionReason && <div style={{ padding: '0.75rem', borderRadius: '10px', background: '#FEF2F2', color: '#991B1B', fontSize: '0.8rem' }}><strong>Previous review:</strong> {rejectionReason}</div>}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}><strong style={{ color: 'var(--uc-blue, #002B7F)' }}>Step 1 of 2</strong> · Enter your student number</div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Student ID Number
                <input value={studentIdInput} onChange={(event) => setStudentIdInput(event.target.value.replace(/\D/g, ''))} maxLength={20} required placeholder="Enter your student ID number" className="clean-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px' }} />
              </label>
              <div style={{ display: 'flex', gap: '0.6rem', padding: '0.85rem', borderRadius: '10px', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E3A8A', fontSize: '0.78rem', lineHeight: 1.5 }}>
                <Info size={17} style={{ flexShrink: 0 }} />
                <span>A live selfie captured directly from your device camera is mandatory. Uploaded photos and enrollment documents are not accepted.</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '0.65rem 1rem' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.65rem 1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>Continue <ArrowRight size={15} /></button>
              </div>
            </form>
          )}

          {step === 'live_selfie' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}><strong style={{ color: 'var(--uc-blue, #002B7F)' }}>Step 2 of 2</strong> · Capture a live selfie</div>
              {cameraError ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', borderRadius: '12px', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#991B1B' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={18} /><strong>Camera Access Required</strong></div>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>{cameraError}</p>
                  <button type="button" onClick={startCamera} className="btn-primary" style={{ padding: '0.6rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', alignSelf: 'flex-start' }}><RefreshCw size={15} /> Retry Camera</button>
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%', maxWidth: '420px', margin: '0 auto', aspectRatio: '4 / 3', overflow: 'hidden', borderRadius: '14px', background: '#0F172A', border: '2px solid var(--border-subtle, #CBD5E1)' }}>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                  {!isCameraActive && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#FFFFFF' }}><Loader2 className="animate-spin" size={28} /></div>}
                  <div style={{ position: 'absolute', bottom: '0.6rem', left: '0.6rem', right: '0.6rem', textAlign: 'center', color: '#FFFFFF', background: 'rgba(0,0,0,0.58)', borderRadius: '8px', padding: '0.4rem', fontSize: '0.72rem' }}>Keep your face centered and clearly visible</div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem' }}>
                <button type="button" onClick={() => { stopCamera(); setStep('student_id'); }} className="btn-secondary" style={{ padding: '0.65rem 1rem' }}>Back</button>
                <button type="button" onClick={handleCaptureSelfie} disabled={!isCameraActive} className="btn-primary" style={{ padding: '0.65rem 1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', opacity: isCameraActive ? 1 : 0.55 }}><Camera size={17} /> Capture Live Selfie</button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Review the live camera capture before submitting it for campus administrator review.</div>
              <img src={selfiePhotoUrl} alt="Captured live selfie" style={{ display: 'block', width: '100%', maxWidth: '320px', maxHeight: '280px', objectFit: 'contain', margin: '0 auto', borderRadius: '12px', background: '#0F172A' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem' }}>
                <button type="button" onClick={() => { setSelfiePhotoUrl(''); setStep('live_selfie'); }} disabled={isSubmitting} className="btn-secondary" style={{ padding: '0.65rem 1rem' }}>Retake Selfie</button>
                <button type="button" onClick={handleSubmitVerification} disabled={isSubmitting || !selfiePhotoUrl} className="btn-primary" style={{ padding: '0.65rem 1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>{isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <>Submit Verification <ArrowRight size={15} /></>}</button>
              </div>
            </div>
          )}

          {step === 'submitted' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', padding: '1rem 0' }}>
              <CheckCircle2 size={42} color="#059669" />
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{serverStatus === 'approved' ? 'Student Account Verified' : 'Live Selfie Submitted'}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.5 }}>{serverStatus === 'approved' ? 'Your student account is verified.' : 'Your live selfie is queued for authorized campus administrator review.'}</p>
              <div style={{ padding: '0.8rem', borderRadius: '10px', background: 'var(--bg-subtle, #F8FAFC)', width: '100%', fontSize: '0.8rem', textAlign: 'left' }}>Student ID: <strong>{studentIdInput}</strong><br />Status: <strong style={{ textTransform: 'uppercase' }}>{serverStatus}</strong></div>
              <button type="button" onClick={onClose} className="btn-primary" style={{ padding: '0.65rem 1.3rem' }}>Close</button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
