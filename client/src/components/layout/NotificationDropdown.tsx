import React, { useState } from 'react';
import { Bell, ArrowLeftRight, Calendar, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { AppNotification } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';

interface NotificationDropdownProps {
  onNavigate: (view: string, param?: any) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      userId: 'user-maria',
      title: 'Swap Proposal Received',
      message: 'Beatrice Tan offered Keychron K2 + ₱800 for your Squier Guitar.',
      type: 'swap',
      isRead: false,
      linkView: 'swaps',
      createdAt: '10m ago'
    },
    {
      id: 'notif-2',
      userId: 'user-maria',
      title: 'Meetup Reminder',
      message: 'Meetup tomorrow at 1:30 PM with Alex Rivera at Banilad lobby.',
      type: 'meetup',
      isRead: false,
      linkView: 'meetups',
      createdAt: '1h ago'
    },
    {
      id: 'notif-3',
      userId: 'user-maria',
      title: 'Wanted Item Response',
      message: 'A student has the Casio fx-991ES Plus you were looking for!',
      type: 'wanted_response',
      isRead: true,
      linkView: 'wanted',
      createdAt: '3h ago'
    }
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (notif: AppNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    setIsOpen(false);
    if (notif.linkView) {
      onNavigate(notif.linkView, notif.linkParams);
    }
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
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
            width: 'min(320px, 90vw)',
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
            {notifications.length > 0 ? (
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
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
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
