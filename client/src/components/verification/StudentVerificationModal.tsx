import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Upload,
  AlertCircle,
  FileText,
  CreditCard,
  Camera,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { Modal } from '../common/Modal';
import { compressImage } from '../../utils/imageCompressor';

interface StudentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenAuth?: () => void;
}

type Step = 'status_view' | 'form_id' | 'form_proof' | 'review' | 'submitted';

export const StudentVerificationModal: React.FC<StudentVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, submitIdVerification, getVerificationStatus } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('form_id');
  const [studentIdInput, setStudentIdInput] = useState(currentUser?.studentId || '');
  const [idPhotoUrl, setIdPhotoUrl] = useState<string>('');
  const [proofPhotoUrl, setProofPhotoUrl] = useState<string>('');
  const [proofType, setProofType] = useState<'cor' | 'holding_id'>('cor');

  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [serverStatus, setServerStatus] = useState<'unverified' | 'pending' | 'approved' | 'rejected'>('unverified');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const idFileInputRef = useRef<HTMLInputElement | null>(null);
  const proofFileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state on modal open and fetch live status from local DB
  useEffect(() => {
    if (!isOpen) return;

    if (currentUser?.studentId) {
      setStudentIdInput(currentUser.studentId);
    }

    setIsLoadingStatus(true);
    getVerificationStatus()
      .then((data) => {
        if (data?.status) {
          setServerStatus(data.status);
          setRejectionReason(data.rejectionReason || null);
          if (data.status === 'pending' || data.status === 'approved') {
            setStep('status_view');
          } else {
            setStep('form_id');
          }
        }
      })
      .catch(() => {
        setStep('form_id');
      })
      .finally(() => {
        setIsLoadingStatus(false);
      });
  }, [isOpen, currentUser?.studentId, getVerificationStatus]);

  // Handle ID card image upload
  const handleIdFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please upload an image file (JPG, PNG, or WebP).', 'warning');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      showToast('File Too Large', 'Image must be under 12MB.', 'warning');
      return;
    }

    try {
      const compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 });
      setIdPhotoUrl(compressed);
    } catch {
      showToast('Image Error', 'Failed to compress image. Please try another photo.', 'error');
    }
  };

  // Handle proof document image upload
  const handleProofFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please upload an image file (JPG, PNG, or WebP).', 'warning');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      showToast('File Too Large', 'Image must be under 12MB.', 'warning');
      return;
    }

    try {
      const compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 });
      setProofPhotoUrl(compressed);
    } catch {
      showToast('Image Error', 'Failed to compress document. Please try another photo.', 'error');
    }
  };

  const handleProceedToProof = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = studentIdInput.replace(/[^0-9A-Za-z-]/g, '').trim();
    if (cleanId.length < 6) {
      showToast('Invalid Student ID', 'Please enter a valid Student ID number (at least 6 characters).', 'warning');
      return;
    }
    if (!idPhotoUrl) {
      showToast('ID Photo Required', 'Please attach a clear photo of your University of Cebu student ID.', 'warning');
      return;
    }
    setStep('form_proof');
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofPhotoUrl) {
      showToast('Secondary Document Required', 'Please attach your Certificate of Registration (COR) or selfie holding ID.', 'warning');
      return;
    }
    setStep('review');
  };

  const handleSubmitVerification = async () => {
    if (!idPhotoUrl) {
      showToast('ID Photo Required', 'Please attach your Student ID photo.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitIdVerification(
        studentIdInput.trim(),
        idPhotoUrl,
        proofPhotoUrl || undefined
      );

      setServerStatus('pending');
      setStep('submitted');
      showToast('Documents Submitted', 'Your student credentials have been sent to campus administration for KYC review.', 'success');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      showToast('Submission Failed', err?.message || 'Could not submit verification. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student ID Verification"
      subtitle="Official University of Cebu campus KYC verification"
      icon={<ShieldCheck size={22} color="#FFC72C" />}
      maxWidth="580px"
    >
      {isLoadingStatus ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', gap: '0.75rem' }}>
          <Loader2 size={32} className="animate-spin" color="var(--uc-blue, #002B7F)" />
          <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>Checking verification status...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Active Status View (Pending or Approved) */}
          {step === 'status_view' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: serverStatus === 'approved' ? '#ECFDF5' : '#FFFBEB',
                  color: serverStatus === 'approved' ? '#059669' : '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  border: `2px solid ${serverStatus === 'approved' ? '#A7F3D0' : '#FDE68A'}`
                }}
              >
                {serverStatus === 'approved' ? <CheckCircle2 size={32} /> : <Clock size={32} />}
              </div>

              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {serverStatus === 'approved' ? 'Student Account Verified' : 'Verification Under Review'}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                  {serverStatus === 'approved'
                    ? 'Your University of Cebu student badge is fully activated. You have full listing, trading, and swap access across campus.'
                    : 'Your student ID credentials are in the administrative review queue. An authorized campus administrator will verify your documents shortly.'}
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                  border: '1px solid var(--border-subtle, #E2E8F0)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  textAlign: 'left',
                  fontSize: '0.82rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Student ID Number</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{studentIdInput || currentUser?.studentId || 'Recorded'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Registered Campus</span>
                  <span style={{ fontWeight: 700, color: 'var(--uc-blue, #002B7F)' }}>{currentUser?.campus || 'UC Main'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>KYC Status</span>
                  <span
                    style={{
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      fontSize: '0.74rem',
                      color: serverStatus === 'approved' ? '#047857' : '#B45309'
                    }}
                  >
                    {serverStatus}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                {serverStatus !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => setStep('form_id')}
                    className="btn-secondary"
                    style={{
                      padding: '0.65rem 1.25rem',
                      fontSize: '0.84rem',
                      borderRadius: '10px'
                    }}
                  >
                    Re-submit Credentials
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary"
                  style={{
                    padding: '0.65rem 1.5rem',
                    fontSize: '0.84rem',
                    borderRadius: '10px',
                    backgroundColor: 'var(--uc-blue, #002B7F)',
                    color: '#FFFFFF'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Student ID Information & Photo Upload */}
          {step === 'form_id' && (
            <form onSubmit={handleProceedToProof} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {rejectionReason && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    color: '#991B1B',
                    fontSize: '0.8rem'
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Previous Submission Note:</strong> {rejectionReason}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 800, color: 'var(--uc-blue, #002B7F)' }}>Step 1 of 3:</span>
                <span>Enter your official UC student number and upload your ID card</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Student ID Number <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value.replace(/[^0-9A-Za-z-]/g, ''))}
                  placeholder="e.g. 2024-12345 or 12345678"
                  className="clean-input"
                  maxLength={20}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border-subtle, #CBD5E1)',
                    fontSize: '0.9rem'
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Must match the student number printed on your physical University of Cebu ID card.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Physical Student ID Card Photo <span style={{ color: '#DC2626' }}>*</span>
                </label>

                <input
                  ref={idFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleIdFileChange}
                  style={{ display: 'none' }}
                />

                {idPhotoUrl ? (
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '2px solid #059669',
                      backgroundColor: '#0F172A',
                      maxHeight: '220px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img
                      src={idPhotoUrl}
                      alt="Student ID Preview"
                      style={{ width: '100%', height: '220px', objectFit: 'contain' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        display: 'flex',
                        gap: '0.4rem'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => idFileInputRef.current?.click()}
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Change Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setIdPhotoUrl('')}
                        style={{
                          backgroundColor: '#DC2626',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.35rem',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                        aria-label="Remove photo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => idFileInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--border-subtle, #CBD5E1)',
                      borderRadius: '12px',
                      padding: '1.75rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      cursor: 'pointer',
                      backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: '#E0E7FF',
                        color: 'var(--uc-blue, #002B7F)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <CreditCard size={22} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)' }}>
                        Click to upload your Student ID Card
                      </span>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                        Supports JPG, PNG, or WebP. Make sure your name and ID number are clearly visible.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  style={{ padding: '0.65rem 1.25rem', fontSize: '0.84rem', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '0.65rem 1.5rem',
                    fontSize: '0.84rem',
                    borderRadius: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: 'var(--uc-blue, #002B7F)',
                    color: '#FFFFFF'
                  }}
                >
                  <span>Continue to Step 2</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Proof of Enrollment */}
          {step === 'form_proof' && (
            <form onSubmit={handleProceedToReview} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 800, color: 'var(--uc-blue, #002B7F)' }}>Step 2 of 3:</span>
                <span>Attach proof of current academic enrollment</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Document Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => setProofType('cor')}
                    style={{
                      padding: '0.65rem',
                      borderRadius: '10px',
                      border: `1.5px solid ${proofType === 'cor' ? 'var(--uc-blue, #002B7F)' : 'var(--border-subtle, #CBD5E1)'}`,
                      backgroundColor: proofType === 'cor' ? '#EFF6FF' : '#FFFFFF',
                      color: proofType === 'cor' ? 'var(--uc-blue, #002B7F)' : 'var(--text-primary)',
                      fontWeight: proofType === 'cor' ? 800 : 600,
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <FileText size={16} /> Certificate of Registration (COR)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProofType('holding_id')}
                    style={{
                      padding: '0.65rem',
                      borderRadius: '10px',
                      border: `1.5px solid ${proofType === 'holding_id' ? 'var(--uc-blue, #002B7F)' : 'var(--border-subtle, #CBD5E1)'}`,
                      backgroundColor: proofType === 'holding_id' ? '#EFF6FF' : '#FFFFFF',
                      color: proofType === 'holding_id' ? 'var(--uc-blue, #002B7F)' : 'var(--text-primary)',
                      fontWeight: proofType === 'holding_id' ? 800 : 600,
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Camera size={16} /> Photo Holding Student ID
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  {proofType === 'cor' ? 'Certificate of Registration (Study Load)' : 'Clear Photo of You Holding Your ID Card'} <span style={{ color: '#DC2626' }}>*</span>
                </label>

                <input
                  ref={proofFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleProofFileChange}
                  style={{ display: 'none' }}
                />

                {proofPhotoUrl ? (
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '2px solid #059669',
                      backgroundColor: '#0F172A',
                      maxHeight: '220px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img
                      src={proofPhotoUrl}
                      alt="Proof Document Preview"
                      style={{ width: '100%', height: '220px', objectFit: 'contain' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        display: 'flex',
                        gap: '0.4rem'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => proofFileInputRef.current?.click()}
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Change File
                      </button>
                      <button
                        type="button"
                        onClick={() => setProofPhotoUrl('')}
                        style={{
                          backgroundColor: '#DC2626',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.35rem',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                        aria-label="Remove file"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => proofFileInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--border-subtle, #CBD5E1)',
                      borderRadius: '12px',
                      padding: '1.75rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      cursor: 'pointer',
                      backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: '#FEF3C7',
                        color: '#D97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Upload size={22} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)' }}>
                        Click to upload {proofType === 'cor' ? 'Study Load / COR' : 'photo holding ID'}
                      </span>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                        Official current semester registration document with student details.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setStep('form_id')}
                  className="btn-secondary"
                  style={{
                    padding: '0.65rem 1.25rem',
                    fontSize: '0.84rem',
                    borderRadius: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '0.65rem 1.5rem',
                    fontSize: '0.84rem',
                    borderRadius: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: 'var(--uc-blue, #002B7F)',
                    color: '#FFFFFF'
                  }}
                >
                  <span>Review & Submit</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Review & Final Submission */}
          {step === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 800, color: 'var(--uc-blue, #002B7F)' }}>Step 3 of 3:</span>
                <span>Confirm your submission details</span>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle, #E2E8F0)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  fontSize: '0.84rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Student Name:</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{currentUser?.name || 'Student'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Campus:</span>
                  <span style={{ fontWeight: 700, color: 'var(--uc-blue, #002B7F)' }}>{currentUser?.campus || 'UC Main'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Student ID Number:</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{studentIdInput}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>ID Card Attached:</span>
                  <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <CheckCircle2 size={14} /> Ready
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Enrollment Proof:</span>
                  <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <CheckCircle2 size={14} /> Ready ({proofType === 'cor' ? 'COR' : 'Holding ID'})
                  </span>
                </div>
              </div>

              {/* Security Privacy Callout */}
              <div
                style={{
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  fontSize: '0.78rem',
                  color: '#1E3A8A',
                  lineHeight: 1.45
                }}
              >
                <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Campus Privacy Policy:</strong> All submitted verification credentials are encrypted with SHA-256 signatures, sanitized via Sharp, and inspected strictly by authorized University of Cebu administration staff. TradeLink never shares student identity documents with other students or third parties.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setStep('form_proof')}
                  disabled={isSubmitting}
                  className="btn-secondary"
                  style={{
                    padding: '0.65rem 1.25rem',
                    fontSize: '0.84rem',
                    borderRadius: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmitVerification}
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{
                    padding: '0.75rem 1.75rem',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    borderRadius: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    backgroundColor: 'var(--uc-blue, #002B7F)',
                    color: '#FFFFFF'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Submitting Documents...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Submit for Verification</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Submitted Confirmation State */}
          {step === 'submitted' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center', padding: '1.5rem 0' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  border: '2px solid #A7F3D0'
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                  Verification Submitted!
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                  Your student credentials have been securely transmitted to University of Cebu campus administration for KYC review.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                  border: '1px solid var(--border-subtle, #E2E8F0)',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}
              >
                <div>• Your Student ID: <strong>{studentIdInput}</strong></div>
                <div>• Review Queue: <strong>Active Campus KYC Desk</strong></div>
                <div>• Typical review duration: <strong>within 24 hours</strong></div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="btn-primary"
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.86rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--uc-blue, #002B7F)',
                  color: '#FFFFFF',
                  marginTop: '0.5rem'
                }}
              >
                Close & Continue to Marketplace
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
