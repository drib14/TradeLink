import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { User } from '../../types';
import { Users, RotateCcw, ChevronDown, Check, LogIn, LogOut } from 'lucide-react';
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
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: '#002B7F',
          color: '#FFFFFF',
          padding: '0.5rem 0.95rem',
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
              style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #FFC72C' }}
            />
            <span style={{ color: '#FFC72C' }}>Role:</span>
            <span style={{ color: '#FFFFFF', fontWeight: 800 }}>{currentUser.name.split(' ')[0]}</span>
            {currentUser.isVerified && (
              <VerifiedBadge size="xs" variant="gold" showTooltip={false} />
            )}
            <span style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>({currentUser.campus.replace('UC ', '')})</span>
          </>
        ) : (
          <>
            <span style={{ color: '#FFC72C', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Users size={14} /> Guest Mode
            </span>
            <span style={{ color: '#CBD5E1', fontSize: '0.72rem' }}>(Browse Only)</span>
          </>
        )}
        <ChevronDown size={14} color="#FFC72C" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            right: 0,
            width: '290px',
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1.5px solid #BCD1F7',
            boxShadow: '0 16px 36px rgba(0, 43, 127, 0.2)',
            overflow: 'hidden',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}
        >
          {/* Header */}
          <div style={{ padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#002B7F', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick Switch Role
            </span>
            <button
              onClick={handleReset}
              style={{
                fontSize: '0.72rem',
                color: '#D97706',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title="Reset mock database"
            >
              <RotateCcw size={11} /> Reset Data
            </button>
          </div>

          {/* User List */}
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
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
                    padding: '0.45rem 0.6rem',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? '#EBF1FC' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img
                      src={user.avatar}
                      alt={user.name}
                      style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 800 : 600, color: '#0F172A' }}>
                          {user.name}
                        </span>
                        {user.isVerified && (
                          <VerifiedBadge size="xs" variant="gold" showTooltip={false} />
                        )}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                        {user.campus} • {user.college}
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check size={14} color="#002B7F" />}
                </button>
              );
            })}
          </div>

          {/* Log out / Guest action */}
          {currentUser && (
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.35rem', marginTop: '0.15rem' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#DC2626',
                  backgroundColor: '#FEF2F2',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={13} color="#DC2626" />
                <span>Log Out (Browse as Guest)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
