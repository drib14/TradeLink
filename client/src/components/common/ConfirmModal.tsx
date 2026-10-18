import React, { useEffect, useCallback, useState, useRef } from 'react';
import { AlertTriangle, Trash2, CheckCircle2, HelpCircle, X, Loader2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'success';
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  icon,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setShouldRender(false);
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
      onCancel();
    }, 200);
  }, [isLoading, onCancel]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      setTimeout(() => cardRef.current?.focus(), 50);
    } else if (shouldRender && !isClosing) {
      handleClose();
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    }
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      onConfirm();
    }
  }, [handleClose, onConfirm, isLoading]);

  useEffect(() => {
    if (shouldRender) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shouldRender, handleKeyDown]);

  if (!shouldRender) return null;

  const isDanger = variant === 'danger';
  const isSuccess = variant === 'success';

  const defaultIcon = isDanger
    ? <AlertTriangle size={24} />
    : isSuccess
      ? <CheckCircle2 size={24} />
      : <HelpCircle size={24} />;

  const badgeClass = isDanger
    ? 'confirm-badge-danger'
    : isSuccess
      ? 'confirm-badge-success'
      : 'confirm-badge-primary';

  const confirmBtnClass = isDanger
    ? 'btn-danger'
    : isSuccess
      ? 'btn-success'
      : 'btn-primary';

  return (
    <div
      className={`modal-backdrop-custom ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
      aria-hidden="false"
    >
      <div
        ref={cardRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        className="modal-card-custom confirm-dialog-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon Badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div className={`confirm-icon-badge ${badgeClass}`}>
            {icon || defaultIcon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 id="confirm-modal-title" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h3>
            <p id="confirm-modal-desc" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.55 }}>
              {message}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="modal-close-btn"
            aria-label="Close dialog"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="btn-neutral"
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`${confirmBtnClass}`}
            style={{
              padding: '0.65rem 1.35rem',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                {isDanger && <Trash2 size={15} />}
                {isSuccess && <CheckCircle2 size={15} />}
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
