import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications.js';
import { CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell({ userEmail }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userEmail);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getIcon = (n) => {
    if (n.title?.includes('upvoted')) return '👍';
    if (n.title?.includes('comment')) return '💬';
    if (n.title?.includes('mentioned')) return '🏷️';
    if (n.type === 'dm') return '✉️';
    if (n.type === 'channel_activity') return '📢';
    return '🔔';
  };

  const handleNotificationClick = (n) => {
    markAsRead(n.id);
    setOpen(false);
    if (n.link) {
      navigate(n.link);
    } else if (n.post_id) {
      navigate(`/?post=${n.post_id}`);
    } else if (n.channel_id) {
      navigate('/workspace');
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', zIndex: 9999 }}>
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && unreadCount > 0) markAllAsRead();
        }}
        style={{
          width: 34, height: 34, border: 'none', background: 'transparent',
          color: '#7FA8D4', borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 16, cursor: 'pointer', position: 'relative',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -2, width: 16, height: 16,
            background: '#EF5350', borderRadius: '50%', fontSize: 8, fontWeight: 800,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #060D1A',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8,
          background: '#132340', border: '1px solid rgba(255,255,255,.11)',
          borderRadius: 10, width: 360, maxHeight: 400, overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,.3)', zIndex: 9999,
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF' }}>Notifications</div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  fontSize: 11, color: '#6AADFF', background: 'none', border: 'none',
                  cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <CheckCheck style={{ width: 12, height: 12 }} /> Mark all read
              </button>
            )}
          </div>

          {/* Notifications list */}
          {notifications.length === 0 ? (
            <div style={{
              padding: '40px 20px', textAlign: 'center', color: '#6B93C4',
              fontSize: 13,
            }}>
              No notifications yet
            </div>
          ) : (
            <div>
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.05)',
                    cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(27,110,243,.08)',
                    transition: '.15s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
                  onMouseOut={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(27,110,243,.08)'}
                >
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>
                      {getIcon(n)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 700, color: '#EEF4FF',
                        marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        {n.title}
                        {!n.read && (
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: '#1B6EF3', flexShrink: 0,
                          }} />
                        )}
                      </div>
                      <div style={{
                        fontSize: 11, color: '#6B93C4', lineHeight: 1.4,
                        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {n.message}
                      </div>
                      <div style={{
                        fontSize: 10, color: '#2E4D6E', marginTop: 4,
                      }}>
                        {n.sender_name && `from ${n.sender_name}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}