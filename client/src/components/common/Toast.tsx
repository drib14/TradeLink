import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { ToastNotification } from '../../types';

interface ToastContextType {
  showToast: (title: string, message: string, type?: ToastNotification['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Automatically cleans up technical errors, driver messages, and raw exceptions
 * into user-friendly, crystal-clear notifications.
 */
export function formatUserFriendlyMessage(rawMessage: string, type: ToastNotification['type']): string {
  if (!rawMessage || typeof rawMessage !== 'string') {
    return type === 'error' ? 'An unexpected issue occurred. Please try again.' : '';
  }

  const str = rawMessage.trim();

  // If HTML document was returned by a proxy or server error (e.g. <!doctype html>)
  if (str.startsWith('<!doctype') || str.startsWith('<html') || str.includes('FUNCTION_INVOCATION_FAILED')) {
    return 'Unable to reach the campus server. Please verify your connection or try again shortly.';
  }

  // TiDB Cloud / MySQL insecure transport / SSL error
  if (str.toLowerCase().includes('insecure transport') || str.toLowerCase().includes('pingcap.com')) {
    return 'Secure database connection error. The server is reconnecting, please try again in a few moments.';
  }

  // Network / Fetch errors
  if (
    str.toLowerCase().includes('failed to fetch') ||
    str.toLowerCase().includes('networkerror') ||
    str.toLowerCase().includes('network request failed') ||
    str.toLowerCase().includes('load failed')
  ) {
    return 'Unable to connect to the campus server. Please check your internet connection.';
  }

  // Connection refused / Service unavailable
  if (
    str.toLowerCase().includes('econnrefused') ||
    str.toLowerCase().includes('service temporarily unavailable') ||
    str.toLowerCase().includes('etimedout') ||
    str.toLowerCase().includes('connect timeout')
  ) {
    return 'The server is temporarily warming up or reconnecting. Please retry in a few moments.';
  }

  // Invalid / expired token
  if (str.toLowerCase().includes('jwt expired') || str.toLowerCase().includes('token is invalid') || str.toLowerCase().includes('session has expired')) {
    return 'Your session has expired. Please sign in again to continue.';
  }

  // Generic 500
  if (str === 'Internal Server Error') {
    return 'An unexpected server error occurred. Please try again shortly.';
  }

  return str;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = useCallback((title: string, message: string, type: ToastNotification['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const cleanMessage = formatUserFriendlyMessage(message, type);
    const newToast: ToastNotification = { id, title, message: cleanMessage, type };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastIcon = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} color="#10B981" />;
      case 'warning':
        return <AlertTriangle size={20} color="#F59E0B" />;
      case 'error':
        return <AlertCircle size={20} color="#EF4444" />;
      case 'info':
      default:
        return <Info size={20} color="#3B82F6" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Overlay Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          zIndex: 9999,
          maxWidth: '400px',
          width: 'calc(100% - 3rem)'
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              backgroundColor: 'var(--bg-surface, #FFFFFF)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle, #E2E8F0)',
              padding: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0, 0, 0, 0.1))',
              animation: 'slideInRight 0.25s ease'
            }}
          >
            <div style={{ flexShrink: 0, marginTop: '2px' }}>{getToastIcon(toast.type)}</div>
            <div style={{ flex: 1 }}>
              <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>{toast.title}</h5>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #475569)', marginTop: '0.2rem', lineHeight: 1.45 }}>{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                color: 'var(--text-muted, #94A3B8)',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
