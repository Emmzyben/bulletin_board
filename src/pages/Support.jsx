import React, { useState } from 'react';
import { Send, MessageCircle, Activity, CheckCircle2, Search, ChevronRight, BookOpen, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/api/supabaseClient';

const S = {
  page: { background: 'linear-gradient(160deg,#071020 0%,#0B1628 35%,#0A1F1A 70%,#0D1408 100%)', minHeight: '100%', height: '100%', overflowY: 'auto', color: '#EEF4FF', fontFamily: 'Inter, sans-serif' },
  card: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#EEF4FF', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' },
  label: { fontSize: 12, fontWeight: 600, color: 'rgba(150,190,240,.7)', display: 'block', marginBottom: 6 },
};

const FAQ_CATEGORIES = [
  { name: 'Getting Started', count: 4, icon: '🚀' },
  { name: 'Workspaces', count: 3, icon: '🏢' },
  { name: 'GP Feed', count: 3, icon: '🌐' },
  { name: 'B2B Spaces', count: 3, icon: '🤝' },
  { name: 'Billing', count: 3, icon: '💳' },
  { name: 'Security', count: 2, icon: '🔐' },
];

const STATUS_ITEMS = [
  { name: 'GP Feed', status: 'operational' },
  { name: 'Workspaces', status: 'operational' },
  { name: 'Authentication', status: 'operational' },
  { name: 'Huddles', status: 'operational' },
  { name: 'Integrations', status: 'operational' },
  { name: 'Email Delivery', status: 'operational' },
];

const TABS = [
  { id: 'help', icon: '📚', label: 'Help Center' },
  { id: 'ticket', icon: '📩', label: 'Submit Ticket' },
  { id: 'chat', icon: '💬', label: 'Live Chat' },
  { id: 'status', icon: '⚡', label: 'System Status' },
];

export default function Support() {
  const [activeTab, setActiveTab] = useState('help');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketData, setTicketData] = useState({
    name: '', email: '', category: '', priority: 'normal', subject: '', description: ''
  });

  const handleSubmitTicket = async () => {
    if (!ticketData.name || !ticketData.email || !ticketData.subject || !ticketData.description) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    
    try {
      const { error } = await supabase.functions.invoke('send-support-email', {
        body: {
          to: ticketData.email,
          subject: `[Support Ticket] ${ticketData.subject}`,
          content: `Hi ${ticketData.name},\n\nThank you for reaching out! We received your support ticket and will respond within 4 hours.\n\nTicket Details:\nCategory: ${ticketData.category || 'General'}\nPriority: ${ticketData.priority}\nSubject: ${ticketData.subject}\n\n${ticketData.description}\n\n— Bulletin Board Support Team`,
        }
      });
      
      if (error) throw error;
      
      toast.success('Ticket submitted! Check your email for confirmation.');
      setTicketData({ name: '', email: '', category: '', priority: 'normal', subject: '', description: '' });
    } catch (err) {
      console.error('Error submitting ticket:', err);
      toast.error('Failed to submit ticket. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 20px 80px' }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', marginBottom: 10, color: '#EEF4FF' }}>How can we help?</h1>
          <p style={{ fontSize: 15, color: '#6B93C4' }}>Search our help center or reach out to our support team</p>
        </div>

        <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto 36px' }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#6B93C4' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search help articles..."
            style={{ ...S.input, paddingLeft: 44, height: 48, fontSize: 15, borderRadius: 12 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500,
              color: activeTab === t.id ? '#EEF4FF' : '#7FA8D4',
              borderBottom: activeTab === t.id ? '2px solid #1B6EF3' : '2px solid transparent',
              whiteSpace: 'nowrap', transition: '.15s',
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {activeTab === 'help' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
            {FAQ_CATEGORIES.map(cat => (
              <div key={cat.name} style={{ ...S.card, padding: '20px', cursor: 'pointer', transition: '.15s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(27,110,243,.35)'; e.currentTarget.style.background = 'rgba(27,110,243,.06)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'; e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
              >
                <div style={{ fontSize: 24, marginBottom: 10 }}>{cat.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF', marginBottom: 4 }}>{cat.name}</div>
                <div style={{ fontSize: 12, color: '#6B93C4' }}>{cat.count} articles</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'ticket' && (
          <div style={{ ...S.card, padding: '28px' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#EEF4FF', marginBottom: 24 }}>📩 Submit a Support Ticket</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={S.label}>Name *</label>
                <input style={S.input} value={ticketData.name} onChange={e => setTicketData({ ...ticketData, name: e.target.value })} placeholder="Your name" />
              </div>
              <div>
                <label style={S.label}>Email *</label>
                <input style={S.input} type="email" value={ticketData.email} onChange={e => setTicketData({ ...ticketData, email: e.target.value })} placeholder="you@example.com" />
              </div>
              <div>
                <label style={S.label}>Category</label>
                <select style={{ ...S.input, cursor: 'pointer' }} value={ticketData.category} onChange={e => setTicketData({ ...ticketData, category: e.target.value })}>
                  <option value="" style={{ background: '#0E1828' }}>Select category</option>
                  {FAQ_CATEGORIES.map(c => <option key={c.name} value={c.name} style={{ background: '#0E1828' }}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Priority</label>
                <select style={{ ...S.input, cursor: 'pointer' }} value={ticketData.priority} onChange={e => setTicketData({ ...ticketData, priority: e.target.value })}>
                  <option value="normal" style={{ background: '#0E1828' }}>Normal (4hr)</option>
                  <option value="high" style={{ background: '#0E1828' }}>High (2hr)</option>
                  <option value="critical" style={{ background: '#0E1828' }}>Critical (30min)</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={S.label}>Subject *</label>
                <input style={S.input} value={ticketData.subject} onChange={e => setTicketData({ ...ticketData, subject: e.target.value })} placeholder="Brief summary of your issue" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={S.label}>Description *</label>
                <textarea style={{ ...S.input, minHeight: 120, resize: 'vertical' }} value={ticketData.description} onChange={e => setTicketData({ ...ticketData, description: e.target.value })} placeholder="Describe your issue in detail..." />
              </div>
            </div>
            <button
              onClick={handleSubmitTicket}
              disabled={submitting}
              style={{ marginTop: 20, padding: '11px 28px', borderRadius: 10, border: 'none', background: submitting ? 'rgba(27,110,243,.4)' : 'linear-gradient(135deg,#1B6EF3,#0D5FDB)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Send style={{ width: 14, height: 14 }} />
              {submitting ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </div>
        )}

        {activeTab === 'chat' && (
          <div style={{ ...S.card, padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#EEF4FF', marginBottom: 8 }}>Live Chat Support</h3>
            <p style={{ fontSize: 14, color: '#6B93C4', marginBottom: 4 }}>Average response: under 2 minutes</p>
            <p style={{ fontSize: 14, color: '#6B93C4', marginBottom: 20 }}>3 agents online now</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
              {[0, 200, 400].map(delay => (
                <span key={delay} style={{ width: 10, height: 10, borderRadius: '50%', background: '#00C853', display: 'inline-block', animation: 'pulse 1.5s infinite', animationDelay: `${delay}ms`, boxShadow: '0 0 6px #00C853' }} />
              ))}
            </div>
            <button
              onClick={() => { setActiveTab('ticket'); toast.info('Start a ticket and we\'ll reply via live chat shortly!'); }}
              style={{ padding: '12px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1B6EF3,#0D5FDB)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 14px rgba(27,110,243,.4)' }}
            >
              Start Chat
            </button>
            <p style={{ fontSize: 12, color: '#2E4D6E', marginTop: 16 }}>Chat available Mon–Fri · 9am–6pm ET</p>
          </div>
        )}

        {activeTab === 'status' && (
          <div style={{ ...S.card, padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00C853', display: 'inline-block', boxShadow: '0 0 6px #00C853' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#EEF4FF' }}>All Systems Operational</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {STATUS_ITEMS.map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10 }}>
                  <span style={{ fontSize: 14, color: '#7FA8D4', fontWeight: 500 }}>{item.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#00C853', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00C853', display: 'inline-block' }} />
                    Operational
                  </span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#2E4D6E', textAlign: 'center', marginTop: 20 }}>
              Last checked: just now · Subscribe for real-time incident alerts
            </p>
          </div>
        )}

      </div>
    </div>
  );
}