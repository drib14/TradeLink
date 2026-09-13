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
    ? <AlertTriangle size={24} />
    : <HelpCircle size={24} />;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          maxWidth: '460px',
          width: '100%',
          overflow: 'hidden',
          animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '24px 24px 16px',
            borderBottom: '1px solid #E2E8F0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backgroundColor: isDanger ? '#FEF2F2' : '#EBF1FC',
                color: isDanger ? '#DC2626' : '#002B7F'
              }}
            >
              {icon || defaultIcon}
            </div>
            <div>
              <h3
                id="confirm-modal-title"
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#0F172A',
                  margin: 0,
                  lineHeight: '1.3'
                }}
              >
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <p
            style={{
              fontSize: '14px',
              color: '#475569',
              lineHeight: '1.6',
              margin: 0
            }}
          >
            {message}
          </p>
        </div>

        <div
          style={{
            padding: '16px 24px 20px',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid #E2E8F0'
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              backgroundColor: isDanger ? '#DC2626' : '#002B7F',
              color: '#FFFFFF',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isDanger ? '0 2px 4px rgba(220, 38, 38, 0.25)' : '0 2px 4px rgba(0, 43, 127, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            {isLoading ? (
              <>
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#FFFFFF',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}
                />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
