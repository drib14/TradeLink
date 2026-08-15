import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { ToastNotification } from '../../types';

interface ToastContextType {
  showToast: (title: string, message: string, type?: ToastNotification['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = useCallback((title: string, message: string, type: ToastNotification['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastNotification = { id, title, message, type };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
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
          maxWidth: '380px',
          width: 'calc(100% - 3rem)'
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
              animation: 'slideInRight 0.25s ease'
            }}
          >
            <div style={{ flexShrink: 0, marginTop: '2px' }}>{getToastIcon(toast.type)}</div>
            <div style={{ flex: 1 }}>
              <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>{toast.title}</h5>
              <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.15rem' }}>{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                color: '#94A3B8',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px'
              }}
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
