import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, CheckCheck } from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationCenter({ userEmail }) {
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();
  const { notifications, markAsRead, markAllAsRead } = useNotifications(userEmail);

  const handleMarkAsRead = async (id) => {
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.read) {
      try {
        await markAsRead(id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#EEF4FF' }}>Notification Center</h2>
        {notifications.filter(n => !n.read).length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#6AADFF', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <CheckCheck style={{ width: 14, height: 14 }} /> Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'unread', 'read'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              background: filter === f ? '#1B6EF3' : 'transparent',
              borderColor: filter === f ? '#1B6EF3' : 'rgba(255,255,255,.15)',
              color: filter === f ? '#fff' : '#7FA8D4',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredNotifs.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6B93C4', fontSize: 14 }}>
            No notifications
          </div>
        ) : (
          filteredNotifs.map(n => (
            <div
              key={n.id}
              onClick={() => handleMarkAsRead(n.id)}
              style={{
                padding: '14px 16px', borderRadius: 10, background: n.read ? 'transparent' : 'rgba(27,110,243,.08)',
                border: '1px solid rgba(255,255,255,.07)', cursor: 'pointer', transition: '.15s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
              onMouseOut={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(27,110,243,.08)'}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>
                  {n.type === 'mention' && '👤'}
                  {n.type === 'dm' && '💬'}
                  {n.type === 'channel_activity' && '📢'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#EEF4FF' }}>{n.title}</span>
                    {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1B6EF3' }} />}
                  </div>
                  <p style={{ fontSize: 12, color: '#6B93C4', marginBottom: 6 }}>{n.message}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#2E4D6E' }}>
                    {n.sender_name && <span>{n.sender_name}</span>}
                    <span>•</span>
                    <span>{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(n.id); }}
                  style={{ background: 'none', border: 'none', color: '#6B93C4', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}