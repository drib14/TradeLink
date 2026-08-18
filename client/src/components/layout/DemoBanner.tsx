import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { User } from '../../types';
import { Users, RotateCcw, ChevronDown, Check, LogIn, LogOut, ShieldCheck, Crown } from 'lucide-react';
import { useToast } from '../common/Toast';

interface DemoBannerProps {
  onNavigate?: (view: string, param?: any) => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onNavigate }) => {
  const { currentUser, allUsers, switchUser, resetAllData, logout } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleSwitch = (userId: string) => {
    switchUser(userId);
    setIsOpen(false);
    const target = allUsers.find((u) => u.id === userId);
    if (target) {
      showToast('Switched Persona', `Now browsing as ${target.name} (${target.campus})`, 'info');
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all demo listings, messages, and student records back to original seed data?')) {
      resetAllData();
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    showToast('Logged Out', 'Switched to Guest Mode (Browse Only).', 'info');
  };

  return (
    <div className="demo-banner-floating">
      {/* Floating Persona Pill Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: '#002B7F',
          color: '#FFFFFF',
          padding: '0.45rem 0.95rem',
          borderRadius: '9999px',
          fontSize: '0.8rem',
          fontWeight: 700,
          boxShadow: '0 6px 20px rgba(0, 43, 127, 0.35)',
          border: '1.5px solid #FFC72C',
          transition: 'all 0.15s ease',
          cursor: 'pointer'
        }}
      >
        {currentUser ? (
          <>
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #FFC72C', flexShrink: 0 }}
            />
            <span style={{ color: '#FFC72C', fontWeight: 800 }}>Role:</span>
            <span style={{ color: '#FFFFFF', fontWeight: 800 }}>{currentUser.name.split(' ')[0]}</span>
            {currentUser.isVerified && (
              <VerifiedBadge size="xs" variant="gold" showTooltip={false} />
            )}
            <span style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>({currentUser.campus.replace('UC ', '')})</span>
          </>
        ) : (
          <>
            <span style={{ color: '#FFC72C', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Users size={14} style={{ flexShrink: 0 }} /> Guest Mode
            </span>
            <span style={{ color: '#CBD5E1', fontSize: '0.72rem' }}>(Browse Only)</span>
          </>
        )}
        <ChevronDown size={14} color="#FFC72C" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            right: 0,
            width: '300px',
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1.5px solid #BCD1F7',
            boxShadow: '0 16px 36px rgba(0, 43, 127, 0.2)',
            overflow: 'hidden',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            zIndex: 100
          }}
        >
          {/* Header */}
          <div style={{ padding: '0.45rem 0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#002B7F', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick Switch Persona
            </span>
            <button
              onClick={handleReset}
              style={{
                fontSize: '0.72rem',
                color: '#D97706',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                cursor: 'pointer'
              }}
              title="Reset mock database"
            >
              <RotateCcw size={11} style={{ flexShrink: 0 }} /> Reset Data
            </button>
          </div>

          {/* User List */}
          <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {allUsers.map((user: User) => {
              const isSelected = !!currentUser && user.id === currentUser.id;
              return (
                <button
                  key={user.id}
                  onClick={() => handleSwitch(user.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? '#EBF1FC' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <img
                      src={user.avatar}
                      alt={user.name}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: user.role === 'superadmin' ? '1.5px solid #DC2626' : user.role === 'admin' ? '1.5px solid #002B7F' : '1px solid #CBD5E1' }}
                    />
                    <div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', lineHeight: 1.2 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 800 : 600, color: '#0F172A' }}>
                          {user.name}
                        </span>
                        {user.role === 'superadmin' ? (
                          <span style={{ fontSize: '0.62rem', fontWeight: 800, backgroundColor: '#DC2626', color: '#FFFFFF', padding: '1px 4px', borderRadius: '4px' }}>SUPER</span>
                        ) : user.role === 'admin' ? (
                          <span style={{ fontSize: '0.62rem', fontWeight: 800, backgroundColor: '#002B7F', color: '#FFC72C', padding: '1px 4px', borderRadius: '4px' }}>ADMIN</span>
                        ) : null}
                        {user.isVerified && (
                          <VerifiedBadge size="xs" variant="gold" showTooltip={false} />
                        )}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '1px' }}>
                        {user.campus} • {user.college}
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check size={14} color="#002B7F" style={{ flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          {/* Log out / Guest action */}
          {currentUser && (
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#DC2626',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={13} color="#DC2626" style={{ flexShrink: 0 }} />
                <span>Log Out (Browse as Guest)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
