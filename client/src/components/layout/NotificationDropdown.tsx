import React, { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { AppNotification } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/chat.service';

interface NotificationDropdownProps {
  onNavigate: (view: string, param?: any) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigate }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !currentUser) {
      setNotifications([]);
      return;
    }
    setIsLoading(true);
    try {
      const liveNotifs = await chatService.getNotifications();
      if (Array.isArray(liveNotifs)) {
        setNotifications(liveNotifs);
      }
    } catch {
      // Handled gracefully
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (notif: AppNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    setIsOpen(false);
    try {
      await chatService.markNotificationAsRead(notif.id);
    } catch {
      // Handled
    }
    if (notif.linkView) {
      onNavigate(notif.linkView, notif.linkParams);
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await chatService.markAllNotificationsAsRead();
    } catch {
      // Handled
    }
  };

  const toggleDropdown = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && isAuthenticated) {
      fetchNotifications();
    }
  };

  const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        style={{
          position: 'relative',
          padding: '0.45rem',
          borderRadius: '8px',
          color: 'var(--text-primary)',
          backgroundColor: isOpen ? 'var(--uc-blue-subtle)' : 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        title="Notifications & Alerts"
      >
        <Bell size={16} color="var(--uc-blue)" />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: 'var(--accent-red, #DC2626)',
              color: '#FFFFFF',
              fontSize: '0.6rem',
              fontWeight: 800,
              width: '15px',
              height: '15px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 'min(340px, 90vw)',
            backgroundColor: 'var(--bg-surface, #FFFFFF)',
            border: '1.5px solid var(--border-subtle, #CBD5E1)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg, 0 12px 30px rgba(0, 43, 127, 0.15))',
            zIndex: 100,
            overflow: 'hidden'
          }}
        >
          {/* Top Bar */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--uc-blue, #002B7F)',
              color: '#FFFFFF'
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>Campus Alerts</div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{ fontSize: '0.7rem', color: 'var(--uc-gold, #FFC72C)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {isLoading && notifications.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Loading alerts...
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: notif.isRead ? 'var(--bg-surface)' : 'var(--uc-blue-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--uc-blue)' }}>
                      {notif.title}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{notif.createdAt}</span>
                  </div>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                    {notif.message}
                  </p>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No notifications right now
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
