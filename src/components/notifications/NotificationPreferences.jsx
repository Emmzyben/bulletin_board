import React, { useState } from 'react';
import { Bell, Volume2, Clock } from 'lucide-react';

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState({
    mentions: true,
    dms: true,
    channel_activity: true,
    sound_enabled: true,
    dnd_enabled: false,
    dnd_start: '22:00',
    dnd_end: '08:00',
  });

  const handleToggle = (key) => {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#EEF4FF', marginBottom: 24 }}>Notification Preferences</h2>

      {/* Notification types */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#7FA8D4', textTransform: 'uppercase', letterSpacing: '.8px' }}>Notification Types</div>
        {[
          { key: 'mentions', label: '👤 Mentions', desc: 'When someone mentions you' },
          { key: 'dms', label: '💬 Direct Messages', desc: 'New private messages' },
          { key: 'channel_activity', label: '📢 Channel Activity', desc: 'Updates in channels' },
        ].map(item => (
          <div key={item.key} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#EEF4FF', marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#6B93C4' }}>{item.desc}</div>
            </div>
            <button
              onClick={() => handleToggle(item.key)}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: prefs[item.key] ? '#00C853' : 'rgba(255,255,255,.1)',
                transition: '.2s',
              }}
            />
          </div>
        ))}
      </div>

      {/* Sound & Badge */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#7FA8D4', textTransform: 'uppercase', letterSpacing: '.8px' }}>Sound & Display</div>
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Volume2 style={{ width: 18, height: 18, color: '#6AADFF' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#EEF4FF' }}>Sound Notifications</div>
              <div style={{ fontSize: 12, color: '#6B93C4' }}>Play sound on new notifications</div>
            </div>
          </div>
          <button
            onClick={() => handleToggle('sound_enabled')}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: prefs.sound_enabled ? '#00C853' : 'rgba(255,255,255,.1)',
              transition: '.2s',
            }}
          />
        </div>
      </div>

      {/* Do Not Disturb */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#7FA8D4', textTransform: 'uppercase', letterSpacing: '.8px' }}>Do Not Disturb</div>
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock style={{ width: 18, height: 18, color: '#6AADFF' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#EEF4FF' }}>Enable Do Not Disturb</div>
            </div>
            <button
              onClick={() => handleToggle('dnd_enabled')}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: prefs.dnd_enabled ? '#00C853' : 'rgba(255,255,255,.1)',
                transition: '.2s',
              }}
            />
          </div>
          {prefs.dnd_enabled && (
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: '#6B93C4', display: 'block', marginBottom: 4 }}>From</label>
                <input
                  type="time"
                  value={prefs.dnd_start}
                  onChange={e => setPrefs(p => ({ ...p, dnd_start: e.target.value }))}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 6, background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.1)', color: '#EEF4FF', fontSize: 12 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: '#6B93C4', display: 'block', marginBottom: 4 }}>To</label>
                <input
                  type="time"
                  value={prefs.dnd_end}
                  onChange={e => setPrefs(p => ({ ...p, dnd_end: e.target.value }))}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 6, background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.1)', color: '#EEF4FF', fontSize: 12 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}