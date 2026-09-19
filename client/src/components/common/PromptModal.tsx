import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HelpCircle, X, Check } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  inputType?: 'text' | 'textarea' | 'number';
  required?: boolean;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  title,
  message,
  placeholder = 'Enter value...',
  defaultValue = '',
  confirmText = 'Submit',
  cancelText = 'Cancel',
  inputType = 'text',
  required = false,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
        if (inputRef.current && 'select' in inputRef.current) {
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (required && !value.trim()) {
      setError('This field is required');
      return;
    }
    onSubmit(value);
  }, [value, required, onSubmit]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
    if (e.key === 'Enter' && inputType !== 'textarea' && !isLoading) {
      e.preventDefault();
      handleSubmit();
    }
  }, [onCancel, handleSubmit, inputType, isLoading]);

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
          maxWidth: '480px',
          width: '100%',
          overflow: 'hidden',
          animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-modal-title"
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '24px 24px 16px',
            borderBottom: '1px solid #E2E8F0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backgroundColor: 'var(--color-primary-subtle, #EBF1FC)',
                color: 'var(--color-primary, #002B7F)'
              }}
            >
              <HelpCircle size={24} />
            </div>
            <div>
              <h3
                id="prompt-modal-title"
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
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F1F5F9';
              e.currentTarget.style.color = '#334155';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#94A3B8';
            }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px' }}>
            {message && (
              <p
                style={{
                  fontSize: '14px',
                  color: '#475569',
                  lineHeight: '1.6',
                  margin: '0 0 16px'
                }}
              >
                {message}
              </p>
            )}

            {inputType === 'textarea' ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={placeholder}
                rows={4}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: error ? '1.5px solid var(--color-danger, #DC2626)' : '1.5px solid #CBD5E1',
                  fontSize: '14px',
                  color: '#0F172A',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary, #002B7F)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 43, 127, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = error ? 'var(--color-danger, #DC2626)' : '#CBD5E1';
                  e.target.style.boxShadow = 'none';
                }}
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={inputType}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={placeholder}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: error ? '1.5px solid var(--color-danger, #DC2626)' : '1.5px solid #CBD5E1',
                  fontSize: '14px',
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary, #002B7F)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 43, 127, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = error ? 'var(--color-danger, #DC2626)' : '#CBD5E1';
                  e.target.style.boxShadow = 'none';
                }}
              />
            )}

            {error && (
              <span
                style={{
                  display: 'block',
                  fontSize: '12px',
                  color: 'var(--color-danger, #DC2626)',
                  marginTop: '6px'
                }}
              >
                {error}
              </span>
            )}
          </div>

          {/* Footer */}
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
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#F1F5F9';
                  e.currentTarget.style.borderColor = '#94A3B8';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                backgroundColor: 'var(--color-primary, #002B7F)',
                color: '#FFFFFF',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(0, 43, 127, 0.2)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-dark, #001D59)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary, #002B7F)';
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
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
