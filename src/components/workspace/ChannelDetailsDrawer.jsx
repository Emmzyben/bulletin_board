import React, { useState } from 'react';
import { X, Hash, Lock, Users, FileText, Settings, Bell, BellOff, LogOut, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function ChannelDetailsDrawer({
  channel,
  workspaceId,
  user,
  userProfiles = {},
  onClose,
  onLeaveChannel,
}) {
  const [activeTab, setActiveTab] = useState('about'); // 'about' | 'members' | 'files' | 'settings'
  const [memberSearch, setMemberSearch] = useState('');
  const [muted, setMuted] = useState(false);

  // Fetch channel members
  const { data: membersData, isLoading: loadingMembers } = useQuery({
    queryKey: ['channelDetailsMembers', channel?.id],
    queryFn: async () => {
      if (!channel?.id) return { members: [] };
      try {
        const res = await api.get(`/channels/${channel.id}/members`);
        return res || { members: [] };
      } catch {
        return { members: [] };
      }
    },
    enabled: !!channel?.id,
  });

  // Fetch channel files
  const { data: files = [], isLoading: loadingFiles } = useQuery({
    queryKey: ['channelFiles', channel?.id],
    queryFn: async () => {
      if (!channel?.id) return [];
      try {
        const res = await api.get(`/messages?workspace_id=${workspaceId}&channel_id=${channel.id}&limit=100`);
        return (res || []).filter(m => !!m.file_url);
      } catch {
        return [];
      }
    },
    enabled: !!channel?.id,
  });

  if (!channel) return null;

  const channelMembers = Array.isArray(membersData?.members) ? membersData.members : [];
  const filteredMembers = channelMembers.filter(m => {
    const email = (m?.email || m?.user_email || '').toLowerCase();
    const name = (m?.name || m?.full_name || '').toLowerCase();
    const q = memberSearch.toLowerCase();
    return email.includes(q) || name.includes(q);
  });

  return (
    <div style={{
      width: 380, flexShrink: 0, height: '100%', background: '#0D1829',
      borderLeft: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column',
      zIndex: 30, animation: 'fadeIn .15s ease-out',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {channel.type === 'private' ? (
            <Lock size={17} className="text-[#6AADFF] flex-shrink-0" />
          ) : (
            <Hash size={17} className="text-[#6AADFF] flex-shrink-0" />
          )}
          <span style={{ fontSize: 16, fontWeight: 800, color: '#EEF4FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {channel.name}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,.05)', border: 'none', color: '#6B93C4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.07)', background: 'rgba(0,0,0,.15)' }}>
        {[
          { id: 'about', label: 'About', icon: Hash },
          { id: 'members', label: `Members (${channelMembers.length})`, icon: Users },
          { id: 'files', label: `Files (${files.length})`, icon: FileText },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '10px 4px', border: 'none', background: 'transparent',
                borderBottom: isActive ? '2px solid #1B6EF3' : '2px solid transparent',
                color: isActive ? '#6AADFF' : '#6B93C4', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: '.12s',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B93C4', textTransform: 'uppercase', marginBottom: 6 }}>
                Topic / Description
              </div>
              <div style={{ fontSize: 13, color: '#C8D8EE', lineHeight: 1.5 }}>
                {channel.description || 'No description provided. Add topics to help members understand what belongs in this channel.'}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B93C4', textTransform: 'uppercase', marginBottom: 8 }}>
                Channel Details
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9AB8DC' }}>
                  <span>Type</span>
                  <span style={{ color: '#EEF4FF', fontWeight: 600, textTransform: 'capitalize' }}>
                    {channel.type || 'Public'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9AB8DC' }}>
                  <span>Created</span>
                  <span style={{ color: '#EEF4FF', fontWeight: 600 }}>
                    {channel.createdAt ? format(new Date(channel.createdAt), 'MMMM d, yyyy') : 'Recently'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9AB8DC' }}>
                  <span>Channel ID</span>
                  <span style={{ color: '#6B93C4', fontFamily: 'monospace', fontSize: 11 }}>
                    {channel.id?.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              placeholder="Find members..."
              style={{
                width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 8, padding: '8px 12px', color: '#EEF4FF', fontSize: 13, outline: 'none',
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {channelMembers.length === 0 && !loadingMembers ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#6B93C4', fontSize: 13 }}>
                  This is a public channel — all workspace members have access.
                </div>
              ) : filteredMembers.map(m => {
                const email = m.email || m.user_email;
                const profile = userProfiles[email];
                const name = profile?.full_name || m.name || m.full_name || email?.split('@')[0];
                return (
                  <div
                    key={email}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                      borderRadius: 8, background: 'rgba(255,255,255,.02)',
                    }}
                  >
                    <Avatar className="h-8 w-8 rounded-lg flex-shrink-0">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback style={{ background: '#1B6EF3', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                        {(name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#EEF4FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {name} {email === user?.email ? '(You)' : ''}
                      </div>
                      <div style={{ fontSize: 11, color: '#6B93C4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {email}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FILES TAB */}
        {activeTab === 'files' && (
          <div>
            {files.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#6B93C4', fontSize: 13 }}>
                No files or images shared in this channel yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {files.map(f => (
                  <div
                    key={f.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 6, background: 'rgba(27,110,243,.2)',
                      color: '#6AADFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <FileText size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#EEF4FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.file_name || 'Shared file'}
                      </div>
                      <div style={{ fontSize: 11, color: '#6B93C4' }}>
                        Shared by {f.sender_name || f.sender_email?.split('@')[0]} · {format(new Date(f.createdAt), 'MMM d')}
                      </div>
                    </div>
                    <a
                      href={f.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      style={{ padding: 6, borderRadius: 6, background: 'rgba(255,255,255,.05)', color: '#6AADFF', display: 'flex', alignItems: 'center' }}
                    >
                      <Download size={14} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              onClick={() => {
                setMuted(!muted);
                toast.success(muted ? 'Notifications unmuted' : 'Notifications muted for this channel');
              }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px',
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 10, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {muted ? <BellOff size={16} className="text-[#EF5350]" /> : <Bell size={16} className="text-[#6AADFF]" />}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#EEF4FF' }}>Mute Notifications</div>
                  <div style={{ fontSize: 11, color: '#6B93C4' }}>Prevent sound alerts for messages in this channel</div>
                </div>
              </div>
              <input type="checkbox" checked={muted} readOnly style={{ cursor: 'pointer' }} />
            </div>

            {channel.name !== 'general' && onLeaveChannel && (
              <button
                onClick={() => {
                  if (window.confirm(`Leave #${channel.name}?`)) {
                    onLeaveChannel(channel.id);
                    onClose();
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px 14px', background: 'rgba(239,83,80,.12)', border: '1px solid rgba(239,83,80,.25)',
                  borderRadius: 10, color: '#EF5350', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  marginTop: 10,
                }}
              >
                <LogOut size={15} />
                Leave Channel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
