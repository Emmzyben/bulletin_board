import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const TEAM = [
  { name: 'Engr. Cornell Sams Opara', role: 'CTO / COO & Co-founder', initials: 'CO', grad: 'linear-gradient(135deg,#7C4DFF,#1B6EF3)', bio: 'Engineer, technologist, and the architect behind Bulletin Board System. Co-founder of Cobikin Solutions LLC and the Founder & Developer of the Bulletin Board platform — building secure, professional-grade communication tools for the modern workforce.' },
  { name: 'Mr. Obinna Emukah', role: 'CEO & Co-founder', initials: 'OE', grad: 'linear-gradient(135deg,#00C853,#00897B)', bio: 'Visionary business leader and co-founder of Cobikin Solutions LLC. Drives the strategic direction, growth, and partnerships that power Bulletin Board\'s expansion across global professional ecosystems.' },
];

const VALUES = [
  { icon: '🔒', title: 'Privacy First', desc: 'Every workspace is end-to-end encrypted. We believe your team\'s conversations belong only to your team — never to us.' },
  { icon: '🌐', title: 'Open Community', desc: 'The GP Feed is free and public. We believe professionals deserve an open, ad-free space to learn and collaborate.' },
  { icon: '⚡', title: 'Built to Last', desc: 'We\'re building for the long game — simple pricing, no dark patterns, and infrastructure that scales with you.' },
  { icon: '🤝', title: 'B2B Trust', desc: 'We pioneered B2B collaboration spaces that let companies connect securely without risking internal data.' },
];

const MILESTONES = [
  { year: '2022', label: 'Founded', desc: 'Cobikin Solutions LLC founded in Houston, Texas, USA.' },
  { year: '2023', label: 'Beta launch', desc: 'Bulletin Board enters private beta with 200 invited professionals.' },
  { year: '2024', label: 'GP Feed goes public', desc: 'Public feed opens to all 9 professional ecosystems.' },
  { year: '2025', label: 'B2B Spaces', desc: 'B2B collaboration spaces ship — 400+ companies connected.' },
  { year: '2026', label: '2,400+ members', desc: 'Platform grows across 40+ countries with Pro and Enterprise plans.' },
];

export default function About() {
  const { navigateToLogin } = useAuth();
  
  return (
    <div style={{ background: 'linear-gradient(160deg,#071020 0%,#0B1628 35%,#0A1F1A 70%,#0D1408 100%)', minHeight: '100vh', color: '#EEF4FF', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>

      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(6,13,26,.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center' }}>
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 'auto' }}>
          <img src="https://media.base44.com/images/public/69ebbbf6d42430b1fdaa3ecc/5d21bc6b3_bbs_logo2-removebg-preview1.png" alt="Bulletin Board" style={{ height: 40, width: 'auto' }} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/home" style={{ fontSize: 14, color: '#7FA8D4', textDecoration: 'none', fontWeight: 500 }}>← Back to Home</Link>
          <button onClick={() => navigateToLogin()} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#1B6EF3,#0D5FDB)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Get Started Free
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 80px' }}>

        <section style={{ textAlign: 'center', padding: '80px 0 60px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(27,110,243,.1)', border: '1px solid rgba(27,110,243,.25)', borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: '#6AADFF', marginBottom: 24 }}>
            🏢 Cobikin Solutions LLC
          </div>
          <h1 style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 20 }}>
            We're building the professional<br />
            <span style={{ background: 'linear-gradient(135deg,#1B6EF3,#00B4D8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>community layer of the internet</span>
          </h1>
          <p style={{ fontSize: 18, color: '#7FA8D4', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
            Bulletin Board is our flagship product — a platform that combines an open professional feed with a private, end-to-end encrypted team workspace. Built by professionals, for professionals.
          </p>
        </section>

        <section style={{ background: 'rgba(27,110,243,.06)', border: '1px solid rgba(27,110,243,.2)', borderRadius: 20, padding: '40px 48px', marginBottom: 64, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#6AADFF', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 14 }}>Our Mission</div>
          <p style={{ fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 700, color: '#EEF4FF', lineHeight: 1.5, maxWidth: 700, margin: '0 auto' }}>
            "To give every professional a public voice and a private workspace — on a single platform they can actually trust."
          </p>
          <p style={{ fontSize: 13, color: '#6B93C4', marginTop: 16 }}>— Cobikin Solutions LLC, founded 2022</p>
        </section>

        <section style={{ marginBottom: 64 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#6AADFF', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 10 }}>What We Stand For</div>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 800, letterSpacing: '-0.5px' }}>Our core values</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 16 }}>
            {VALUES.map(v => (
              <div key={v.title} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: '28px 22px' }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{v.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#EEF4FF', marginBottom: 10 }}>{v.title}</h3>
                <p style={{ fontSize: 14, color: '#7FA8D4', lineHeight: 1.65 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 64 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#6AADFF', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 10 }}>The Team</div>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 800, letterSpacing: '-0.5px' }}>Meet the founders</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
            {TEAM.map(m => (
              <div key={m.name} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: '28px 24px' }}>
                <div style={{ width: 60, height: 60, borderRadius: 14, background: m.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,.3)' }}>
                  {m.initials}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#EEF4FF', marginBottom: 4 }}>{m.name}</h3>
                <p style={{ fontSize: 12, color: '#6AADFF', fontWeight: 700, marginBottom: 12 }}>{m.role}</p>
                <p style={{ fontSize: 14, color: '#7FA8D4', lineHeight: 1.65 }}>{m.bio}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 64 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#6AADFF', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 10 }}>Our Story</div>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 800, letterSpacing: '-0.5px' }}>The journey so far</h2>
          </div>
          <div style={{ position: 'relative', paddingLeft: 32 }}>
            <div style={{ position: 'absolute', left: 10, top: 8, bottom: 8, width: 2, background: 'rgba(27,110,243,.25)', borderRadius: 2 }} />
            {MILESTONES.map((m, i) => (
              <div key={m.year} style={{ position: 'relative', marginBottom: i < MILESTONES.length - 1 ? 32 : 0 }}>
                <div style={{ position: 'absolute', left: -27, top: 4, width: 12, height: 12, borderRadius: '50%', background: '#1B6EF3', border: '2px solid #0B1628', boxShadow: '0 0 8px rgba(27,110,243,.5)' }} />
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1B6EF3', minWidth: 36, marginTop: 1 }}>{m.year}</span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#EEF4FF', marginBottom: 4 }}>{m.label}</p>
                    <p style={{ fontSize: 13, color: '#7FA8D4' }}>{m.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: '40px 32px', marginBottom: 64 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 24, textAlign: 'center' }}>
            {[
              { value: '2,400+', label: 'Active members' },
              { value: '9', label: 'Industries served' },
              { value: '40+', label: 'Countries' },
              { value: '100%', label: 'E2E encrypted workspaces' },
              { value: '$7.99', label: 'Per user/month (Pro)' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 30, fontWeight: 900, color: '#EEF4FF', letterSpacing: '-1px', marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#6B93C4', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 14 }}>Get in touch</h2>
          <p style={{ fontSize: 16, color: '#7FA8D4', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
            We'd love to hear from you — whether you're a prospective customer, partner, or member of the press.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigateToLogin()} style={{ padding: '13px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1B6EF3,#0D5FDB)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(27,110,243,.4)' }}>
              Join Bulletin Board
            </button>
            <Link to="/support" style={{ padding: '13px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.04)', color: '#EEF4FF', fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
              Contact us
            </Link>
          </div>
          <p style={{ fontSize: 13, color: '#4A6A8A', marginTop: 20 }}>
            📍 Cobikin Solutions LLC · Houston, Texas, USA · hello@cobikin.com
          </p>
        </section>
      </div>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '28px 24px', textAlign: 'center', fontSize: 13, color: '#2E4D6E' }}>
        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 700, color: '#4A6A8A' }}>
          Bulletin Board is a product of <span style={{ color: '#6AADFF' }}>Cobikin Solutions LLC</span>
        </div>
        <div style={{ marginBottom: 12, fontSize: 12, color: '#2E4D6E' }}>
          📍 Houston, Texas, USA
        </div>
        © 2026 Cobikin Solutions LLC · All rights reserved ·{' '}
        <Link to="/support" style={{ color: '#6B93C4', textDecoration: 'none' }}>Support</Link> ·{' '}
        <Link to="/pricing" style={{ color: '#6B93C4', textDecoration: 'none' }}>Pricing</Link> ·{' '}
        <Link to="/about" style={{ color: '#6B93C4', textDecoration: 'none' }}>About</Link>
      </footer>
    </div>
  );
}