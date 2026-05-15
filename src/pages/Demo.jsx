import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

const STEPS = [
  {
    id: 1,
    icon: '🌐',
    title: 'The GP Feed — Your public professional community',
    subtitle: 'GP Feed',
    duration: '1:00',
    desc: '9 industry ecosystems. Live posts, polls, and real professional conversations — all publicly indexed for SEO and community growth.',
  },
  {
    id: 2,
    icon: '🏢',
    title: 'Private Workspace — where your team gets work done',
    subtitle: 'Private Workspace',
    duration: '1:00',
    desc: 'Channels, direct messages, file sharing, and a management directory. All end-to-end encrypted. Your team, your data.',
  },
  {
    id: 3,
    icon: '🎙️',
    title: 'Voice & Video Huddles — built right in',
    subtitle: 'Voice & Video Huddles',
    duration: '0:45',
    desc: 'Start a voice or video call with your team in one click. No Zoom needed. Huddles are E2E encrypted and live inside your workspace.',
  },
  {
    id: 4,
    icon: '🔧',
    title: 'App Integrations — your tools, in one place',
    subtitle: 'App Integrations',
    duration: '0:45',
    desc: 'Connect Google Drive, Asana, GitHub, Jira, Notion and more. Integration cards appear directly inside your messages.',
  },
  {
    id: 5,
    icon: '🤝',
    title: 'B2B Collaboration — clients inside your workspace',
    subtitle: 'B2B Collaboration',
    duration: '1:00',
    desc: 'Invite clients, partners, and investors into dedicated shared spaces. Each company gets their own private area — fully isolated.',
  },
  {
    id: 6,
    icon: '💰',
    title: 'Simple, transparent pricing',
    subtitle: 'Pricing',
    duration: '0:30',
    desc: 'Start free. Upgrade when your team is ready. No per-seat surprises — every plan is honest and flat.',
  },
];

const MOCK_POSTS = [
  { score: 247, flair: '💬', flairLabel: 'Discussion', title: 'The rise of agentic AI in enterprise workflows — are teams ready for 2026?', eco: '💻 Technology', ago: '2h ago', comments: 34 },
  { score: 1200, flair: '📊', flairLabel: 'Poll', title: 'What is your biggest engineering challenge in 2026?', eco: '💻 Technology', ago: '2d ago', comments: 89, isPoll: true },
  { score: 89, flair: '💼', flairLabel: 'Job', title: '[Hiring] Senior Full-Stack Engineer · Remote · $140K–$180K · Houston', eco: '💼 Careers', ago: '3h ago', comments: 12 },
];

const INTEGRATIONS = [
  { icon: '📁', name: 'Google Drive', connected: true },
  { icon: '✅', name: 'Asana', connected: true },
  { icon: '🐙', name: 'GitHub', connected: true },
  { icon: '🎯', name: 'Jira', connected: false },
  { icon: '📓', name: 'Notion', connected: false },
  { icon: '💳', name: 'Stripe', connected: false },
  { icon: '☁️', name: 'Salesforce', connected: false },
  { icon: '📅', name: 'Calendar', connected: false },
  { icon: '🎨', name: 'Figma', connected: false },
];

const B2B_SPACES = [
  { initials: 'TN', name: 'TechNova Solutions', type: 'Client', channels: ['techno-project', 'techno-support'], grad: 'linear-gradient(135deg,#1B6EF3,#00B4D8)' },
  { initials: 'PG', name: 'Petro-Drill Global', type: 'Partner', channels: ['petro-contracts', 'petro-updates'], grad: 'linear-gradient(135deg,#00C853,#00897B)' },
  { initials: 'FC', name: 'Falcon Capital', type: 'Investor', channels: ['falcon-deal-room'], grad: 'linear-gradient(135deg,#7C4DFF,#1B6EF3)' },
];

function StepContent({ step }) {
  if (step === 1) return (
    <div style={{ background: '#0B1628', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', gap: 8, alignItems: 'center' }}>
        {['🌐 Explore', '📰 News', '💼 Careers', '🔥 Popular', '📊 Polls'].map(t => (
          <button key={t} style={{ padding: '4px 10px', borderRadius: 6, background: t === '🌐 Explore' ? '#1B6EF3' : 'transparent', border: t === '🌐 Explore' ? 'none' : '1px solid rgba(255,255,255,.08)', color: t === '🌐 Explore' ? '#fff' : '#7FA8D4', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>
      {MOCK_POSTS.map((p, i) => (
        <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.05)', display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: '#6B93C4' }}>▲</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1B6EF3' }}>{p.score}</span>
            <span style={{ fontSize: 10, color: '#6B93C4' }}>▼</span>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 11, background: 'rgba(27,110,243,.1)', border: '1px solid rgba(27,110,243,.2)', borderRadius: 4, padding: '2px 7px', color: '#6AADFF', fontWeight: 700 }}>{p.flair} {p.flairLabel}</span>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#EEF4FF', marginTop: 6, lineHeight: 1.4 }}>{p.title}</p>
            {p.isPoll && (
              <div style={{ marginTop: 8 }}>
                {[['AI integration', 46], ['Talent hiring', 32], ['Budget cuts', 14]].map(([label, pct]) => (
                  <div key={label} style={{ marginBottom: 4, position: 'relative', background: 'rgba(255,255,255,.04)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'rgba(27,110,243,.2)', position: 'absolute', top: 0, left: 0 }} />
                    <div style={{ position: 'relative', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#EEF4FF' }}>
                      <span>{label}</span><span>{pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, color: '#6B93C4', marginTop: 6 }}>{p.eco} · {p.ago} · 💬 {p.comments}</div>
          </div>
        </div>
      ))}
    </div>
  );

  if (step === 2) return (
    <div style={{ background: '#0B1628', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden', display: 'flex', height: 320 }}>
      <div style={{ width: 160, borderRight: '1px solid rgba(255,255,255,.07)', padding: '12px 0' }}>
        <div style={{ padding: '0 12px 10px', borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00C853', boxShadow: '0 0 5px #00C853' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#EEF4FF' }}>Cobikin HQ</span>
          </div>
          <div style={{ fontSize: 10, color: '#6B93C4', marginTop: 2 }}>💻 Technology</div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#2E4D6E', padding: '0 12px 4px', textTransform: 'uppercase', letterSpacing: '.6px' }}>Channels</div>
        {['📢 announcements', '# projects', '# dev-log', '# general'].map((ch, i) => (
          <div key={ch} style={{ padding: '5px 12px', fontSize: 12, color: i === 0 ? '#EEF4FF' : '#7FA8D4', background: i === 0 ? 'rgba(27,110,243,.15)' : 'transparent' }}>{ch}</div>
        ))}
      </div>
      <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { initials: 'SR', name: 'Sarah Reynolds', role: 'HR Manager', msg: 'Morning team 👋 Q1 reviews due Friday 5PM.', time: '9:14 AM', grad: 'linear-gradient(135deg,#1B6EF3,#00B4D8)' },
          { initials: 'JT', name: 'James Tran', role: 'IT Support', msg: 'Server migration complete — zero downtime 🚀', time: '9:41 AM', grad: 'linear-gradient(135deg,#7C4DFF,#1B6EF3)' },
          { initials: 'RK', name: 'Raj Kumar', role: 'Operations', msg: 'Q1 deck ready — Revenue +34%, NPS +11pts 📊', time: '10:05 AM', grad: 'linear-gradient(135deg,#00C853,#00897B)' },
        ].map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: m.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{m.initials}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#EEF4FF' }}>{m.name}</span>
                <span style={{ fontSize: 10, color: '#6B93C4' }}>{m.time}</span>
              </div>
              <div style={{ fontSize: 13, color: '#7FA8D4' }}>{m.msg}</div>
            </div>
          </div>
        ))}
        <div style={{ fontSize: 11, color: '#2E4D6E', display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
          <span style={{ color: '#00C853' }}>🔒</span> End-to-end encrypted
        </div>
      </div>
    </div>
  );

  if (step === 3) return (
    <div style={{ background: 'rgba(6,13,26,.95)', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', padding: '32px', textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#EEF4FF', marginBottom: 6 }}>🎙️ Huddle Active — #announcements</div>
      <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: '#00C853', letterSpacing: 2, marginBottom: 28 }}>00:42</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { initials: 'SR', name: 'Sarah R.', speaking: true, grad: 'linear-gradient(135deg,#1B6EF3,#00B4D8)' },
          { initials: 'JT', name: 'James T.', speaking: false, grad: 'linear-gradient(135deg,#7C4DFF,#1B6EF3)' },
          { initials: 'YO', name: 'You', speaking: true, grad: 'linear-gradient(135deg,#7C4DFF,#F472B6)' },
        ].map(p => (
          <div key={p.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 72, height: 72, borderRadius: 14, background: p.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', border: p.speaking ? '3px solid #00C853' : '3px solid transparent', boxShadow: p.speaking ? '0 0 20px rgba(0,200,83,.4)' : 'none', position: 'relative' }}>
              {p.initials}
              <div style={{ position: 'absolute', bottom: -5, right: -5, width: 20, height: 20, borderRadius: '50%', background: p.speaking ? '#00C853' : '#EF5350', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, border: '2px solid #0B1628' }}>
                {p.speaking ? '🎙' : '🔇'}
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#7FA8D4' }}>{p.name}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        {['🎙️', '📹', '🖥️', '📵'].map((icon, i) => (
          <div key={i} style={{ width: 44, height: 44, borderRadius: '50%', background: i === 3 ? '#EF5350' : 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer' }}>{icon}</div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: '#2E4D6E', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <span style={{ color: '#00C853' }}>🔒</span> Voice & video end-to-end encrypted
      </div>
    </div>
  );

  if (step === 4) return (
    <div style={{ background: '#0B1628', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', padding: '20px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#EEF4FF', marginBottom: 16 }}>Connect your apps</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {INTEGRATIONS.map(app => (
          <div key={app.name} style={{ background: app.connected ? 'rgba(0,200,83,.06)' : 'rgba(255,255,255,.04)', border: `1px solid ${app.connected ? 'rgba(0,200,83,.25)' : 'rgba(255,255,255,.07)'}`, borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{app.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#EEF4FF', marginBottom: 4 }}>{app.name}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: app.connected ? '#00C853' : '#6B93C4' }}>{app.connected ? '✓ Connected' : '+ Connect'}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (step === 5) return (
    <div style={{ background: '#0B1628', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', padding: '20px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#EEF4FF', marginBottom: 4 }}>🤝 External · B2B Spaces</div>
      <div style={{ fontSize: 12, color: '#6B93C4', marginBottom: 16 }}>Cobikin HQ · 3 active external partners</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {B2B_SPACES.map(b => (
          <div key={b.name} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: b.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{b.initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#EEF4FF', marginBottom: 2 }}>{b.name}</div>
              <div style={{ fontSize: 11, color: '#6B93C4' }}>{b.channels.map(c => `#${c}`).join(' · ')}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#00B4D8', background: 'rgba(0,180,216,.1)', border: '1px solid rgba(0,180,216,.2)', borderRadius: 5, padding: '2px 8px' }}>{b.type}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(0,200,83,.05)', border: '1px solid rgba(0,200,83,.15)', borderRadius: 8, fontSize: 12, color: '#7FA8D4' }}>
        🔒 Each company only sees their own shared channels. Your internal team is never exposed.
      </div>
    </div>
  );

  if (step === 6) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
      {[
        { name: 'Free', price: '$0', period: 'forever', features: ['Browse 9 ecosystems', '3 posts/month', 'Unlimited commenting'], highlight: false },
        { name: 'Pro', price: '$7.99', period: '/user/mo', features: ['Unlimited posting', 'Private workspace', 'Voice huddles', 'E2E DMs'], highlight: true, badge: '⭐ Popular' },
        { name: 'Annual', price: '$6.40', period: '/user/mo · save 20%', features: ['Everything in Pro', '2 months free', '100 GB storage'], highlight: false, badge: '💚 Best value' },
        { name: 'Enterprise', price: '$14', period: '/user/mo', features: ['10 workspaces', 'SSO / SAML', 'Audit logs', '99.9% SLA'], highlight: false, badge: '🏢' },
      ].map(p => (
        <div key={p.name} style={{ background: p.highlight ? 'rgba(27,110,243,.1)' : 'rgba(255,255,255,.04)', border: p.highlight ? '1px solid rgba(27,110,243,.35)' : '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '14px' }}>
          {p.badge && <div style={{ fontSize: 10, fontWeight: 800, color: '#6AADFF', marginBottom: 6 }}>{p.badge}</div>}
          <div style={{ fontSize: 14, fontWeight: 800, color: '#EEF4FF' }}>{p.name}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#EEF4FF', marginTop: 4 }}>{p.price}<span style={{ fontSize: 11, fontWeight: 400, color: '#6B93C4' }}> {p.period}</span></div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {p.features.map(f => <div key={f} style={{ fontSize: 11, color: '#7FA8D4' }}>✓ {f}</div>)}
          </div>
        </div>
      ))}
    </div>
  );

  return null;
}

export default function Demo() {
  const { navigateToLogin } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setCurrentStep(s => s < STEPS.length ? s + 1 : s);
    }, 12000);
    return () => clearInterval(timer);
  }, [paused, currentStep]);

  const step = STEPS[currentStep - 1];
  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div style={{ background: 'linear-gradient(160deg,#071020 0%,#0B1628 50%,#0A1F1A 100%)', minHeight: '100vh', color: '#EEF4FF', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ height: 56, background: 'rgba(6,13,26,.95)', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <Link to="/home">
          <img src="https://media.base44.com/images/public/69ebbbf6d42430b1fdaa3ecc/5d21bc6b3_bbs_logo2-removebg-preview1.png" alt="BB" style={{ height: 36 }} />
        </Link>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#6AADFF' }}>🎬 Interactive Product Demo</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <Link to="/home" style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: '#7FA8D4', fontSize: 13, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>← Back to site</Link>
          <button onClick={() => navigateToLogin()} style={{ padding: '6px 16px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#1B6EF3,#0D5FDB)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Get started free</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 60px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32 }}>
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '20px', height: 'fit-content' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#6AADFF', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 16 }}>Demo Tour</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {STEPS.map(s => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                  borderRadius: 8, border: 'none', background: currentStep === s.id ? 'rgba(27,110,243,.15)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', transition: '.15s',
                  borderLeft: currentStep === s.id ? '3px solid #1B6EF3' : '3px solid transparent',
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: currentStep === s.id ? '#EEF4FF' : '#7FA8D4' }}>{s.subtitle}</div>
                  <div style={{ fontSize: 10, color: '#2E4D6E', marginTop: 1 }}>⏱ {s.duration}</div>
                </div>
                {currentStep > s.id && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#00C853' }}>✓</span>}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: '12px 0 0', borderTop: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B93C4', marginBottom: 6 }}>
              <span>Progress</span><span>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,.07)', borderRadius: 99 }}>
              <div style={{ height: '100%', borderRadius: 99, width: `${progress}%`, background: 'linear-gradient(90deg,#1B6EF3,#00B4D8)', transition: '.4s' }} />
            </div>
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#6AADFF', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 8 }}>
              Step {currentStep} of {STEPS.length}
            </div>
            <h1 style={{ fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 800, color: '#EEF4FF', letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: 10 }}>
              {step.icon} {step.title}
            </h1>
            <p style={{ fontSize: 15, color: '#7FA8D4', lineHeight: 1.65 }}>{step.desc}</p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <StepContent step={currentStep} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
              disabled={currentStep === 1}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: '#7FA8D4', fontSize: 13, fontWeight: 600, cursor: currentStep === 1 ? 'not-allowed' : 'pointer', opacity: currentStep === 1 ? .4 : 1 }}
            >
              <ChevronLeft style={{ width: 16, height: 16 }} /> Previous
            </button>

            <button
              onClick={() => setPaused(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: '#7FA8D4', fontSize: 13, cursor: 'pointer' }}
            >
              {paused ? <Play style={{ width: 14, height: 14 }} /> : <Pause style={{ width: 14, height: 14 }} />}
              {paused ? 'Resume' : 'Pause'}
            </button>

            {currentStep < STEPS.length ? (
              <button
                onClick={() => setCurrentStep(s => Math.min(STEPS.length, s + 1))}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#1B6EF3,#0D5FDB)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(27,110,243,.4)' }}
              >
                Next <ChevronRight style={{ width: 16, height: 16 }} />
              </button>
            ) : (
              <button
                onClick={() => navigateToLogin()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#00C853,#00897B)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,200,83,.4)' }}
              >
                🎉 Get started free
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
            {STEPS.map(s => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                style={{ width: currentStep === s.id ? 24 : 8, height: 8, borderRadius: 99, border: 'none', background: currentStep === s.id ? '#1B6EF3' : currentStep > s.id ? 'rgba(0,200,83,.5)' : 'rgba(255,255,255,.15)', cursor: 'pointer', transition: '.3s', padding: 0 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}