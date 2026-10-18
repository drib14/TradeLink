import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = '560px',
  className = ''
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      setShouldRender(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');

      // Focus modal card for screen readers and keyboard users
      setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setShouldRender(false);
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
      onClose();
      previousActiveElementRef.current?.focus?.();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen && shouldRender && !isClosing) {
      handleClose();
    }
  }, [isOpen, shouldRender, isClosing, handleClose]);

  // Trap focus and handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      // Focus trapping inside modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
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
      aria-hidden="false"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`modal-card-custom ${className}`}
        style={{
          maxWidth,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          outline: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Grabber Handle (visible on small screens via CSS) */}
        <div className="modal-drawer-grabber-wrap">
          <div className="drawer-grabber-handle" />
        </div>

        {/* Modal Header */}
        <div className="modal-header-premium">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
            {icon && (
              <div className="modal-icon-badge">
                {icon}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <h3 id="modal-title" className="modal-title-text">
                {title}
              </h3>
              {subtitle && (
                <p className="modal-subtitle-text">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleClose}
            className="modal-close-btn"
            title="Close dialog (Esc)"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="modal-body-scrollable">
          {children}
        </div>
      </div>
    </div>
  );
};
