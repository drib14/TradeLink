import React, { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '560px'
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setShouldRender(false);
      document.body.style.overflow = 'unset';
      onClose();
    }, 220); // Match CSS animation duration
  }, [onClose]);

  useEffect(() => {
    if (!isOpen && shouldRender && !isClosing) {
      handleClose();
    }
  }, [isOpen, shouldRender, isClosing, handleClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (shouldRender) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shouldRender, handleClose]);

  if (!shouldRender) return null;

  return (
    <div
      className={`modal-backdrop-custom ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
    >
      <div
        className="modal-card-custom"
        style={{
          maxWidth,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Grabber Handle */}
        <div style={{ paddingTop: '0.75rem', backgroundColor: 'var(--bg-subtle, #F8FAFC)' }}>
          <div className="drawer-grabber-handle" style={{ marginBottom: '0.25rem' }} />
        </div>

        {/* Header */}
        <div
          style={{
            padding: '1rem 1.35rem 1.15rem 1.35rem',
            borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-subtle, #F8FAFC)'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--uc-blue, #002B7F)', fontFamily: 'var(--font-display)' }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748B)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="btn-icon"
            style={{
              backgroundColor: 'var(--bg-subtle, #F1F5F9)',
              border: '1px solid var(--border-subtle, #E2E8F0)'
            }}
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '1.35rem', overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
