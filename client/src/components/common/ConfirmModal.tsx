import React, { useEffect, useCallback } from 'react';
import { AlertTriangle, Trash2, CheckCircle2, HelpCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
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
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
    if (e.key === 'Enter' && !isLoading) onConfirm();
  }, [onCancel, onConfirm, isLoading]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  const defaultIcon = isDanger
    ? <AlertTriangle size={28} />
    : <HelpCircle size={28} />;

  const iconBg = isDanger ? 'var(--color-danger-subtle, #FEF2F2)' : 'var(--color-primary-subtle, #EBF1FC)';
  const iconColor = isDanger ? 'var(--color-danger, #DC2626)' : 'var(--color-primary, #002B7F)';
  const confirmBg = isDanger ? 'var(--color-danger, #DC2626)' : 'var(--color-primary, #002B7F)';
  const confirmHoverBg = isDanger ? 'var(--color-danger-dark, #B91C1C)' : 'var(--color-primary-dark, #001D59)';

  return (
    <div
      className="modal-backdrop-custom"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '2rem',
          maxWidth: '420px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: '0 25px 60px -15px rgba(0, 43, 127, 0.3)',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: iconBg,
              color: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {icon || defaultIcon}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.35rem', lineHeight: 1.55, margin: '0.35rem 0 0 0' }}>
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: '4px',
              borderRadius: '8px',
              display: 'flex'
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
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
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 800,
              backgroundColor: confirmBg,
              color: '#FFFFFF',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'background-color 0.15s ease, opacity 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = confirmHoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = confirmBg; }}
          >
            {isDanger && <Trash2 size={14} />}
            {!isDanger && <CheckCircle2 size={14} />}
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
