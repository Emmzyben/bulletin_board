import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { usePricingPlans } from '@/hooks/usePricingPlans';
import { getPlanBillingDescription, getPlanPriceLabel } from '@/lib/pricing';
import { Cpu, Stethoscope, Building2, GraduationCap, Building, Home, Hotel, Briefcase, Music, Globe, Handshake, Mic, BarChart3, Wrench, Clipboard, Lock, MapPin, MessageSquare, Newspaper, Megaphone } from 'lucide-react';

const S = {
  page: {
    background: 'linear-gradient(160deg,#071020 0%,#0B1628 35%,#0A1F1A 70%,#0D1408 100%)',
    minHeight: '100vh',
    color: '#EEF4FF',
    fontFamily: 'Inter, sans-serif',
    overflowX: 'hidden',
  },
};

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Ecosystems', href: '#ecosystems' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Demo', to: '/demo' },
  { label: 'About', to: '/about' },
];

const ECOSYSTEMS = [
  { icon: Cpu, label: 'Technology', members: '847', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop' },
  { icon: Stethoscope, label: 'Healthcare', members: '634', img: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&auto=format&fit=crop' },
  { icon: Building2, label: 'Corporate', members: '521', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&auto=format&fit=crop' },
  { icon: GraduationCap, label: 'Education', members: '412', img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&auto=format&fit=crop' },
  { icon: Building, label: 'Government', members: '289', img: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=400&auto=format&fit=crop' },
  { icon: Home, label: 'Real Estate', members: '367', img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&auto=format&fit=crop' },
  { icon: Hotel, label: 'Hospitality', members: '198', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop' },
  { icon: Briefcase, label: 'Careers', members: '756', img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&auto=format&fit=crop' },
  { icon: Music, label: 'Entertainment', members: '234', img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop' },
];

const TESTIMONIALS = [
  { name: 'Sarah Reynolds', role: 'HR Manager · Houston, TX', text: 'Finally a platform that understands professional community. The GP Feed drives real inbound — I\'ve had three client enquiries from posts I made in the first week.', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop' },
  { name: 'Raj Kumar', role: 'Operations Director · Cobikin Solutions', text: 'The B2B spaces are a game changer. We manage three client relationships and two investors inside one workspace. Everything is encrypted and properly separated.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop' },
  { name: 'James Tran', role: 'IT Director · Tech Startup', text: 'We moved our entire team to Bulletin Board and the savings are significant. E2E encryption, B2B chat, the GP Feed, voice huddles — everything we need at a fraction of what we paid before.', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop' },
];

function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const { navigateToLogin } = useAuth();
  
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(6,13,26,.97)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,.07)' : 'none',
      transition: '.3s', padding: '0 24px', height: 62,
      display: 'flex', alignItems: 'center', gap: 0,
    }}>
      <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 'auto' }}>
        <img
          src="/bbs_logo.png"
          alt="Bulletin Board"
          style={{ height: 40, width: 'auto', filter: 'drop-shadow(0 2px 8px rgba(27,110,243,.4))' }}
        />
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {NAV_LINKS.map(link => (
          link.to ? (
            <Link key={link.label} to={link.to} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#7FA8D4', textDecoration: 'none', transition: '.15s' }}
              onMouseOver={e => { e.currentTarget.style.color = '#EEF4FF'; e.currentTarget.style.background = 'rgba(255,255,255,.06)'; }}
              onMouseOut={e => { e.currentTarget.style.color = '#7FA8D4'; e.currentTarget.style.background = 'transparent'; }}
            >{link.label}</Link>
          ) : (
            <a key={link.label} href={link.href} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#7FA8D4', textDecoration: 'none', transition: '.15s' }}
              onMouseOver={e => { e.currentTarget.style.color = '#EEF4FF'; e.currentTarget.style.background = 'rgba(255,255,255,.06)'; }}
              onMouseOut={e => { e.currentTarget.style.color = '#7FA8D4'; e.currentTarget.style.background = 'transparent'; }}
            >{link.label}</a>
          )
        ))}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.1)', margin: '0 8px' }} />
        <Link to="/" style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,.15)', background: 'transparent', color: '#EEF4FF', fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', transition: '.15s' }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.07)'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >Go to Feed →</Link>
        <Link
          to="/signup"
          style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#1B6EF3,#0D5FDB)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginLeft: 6, boxShadow: '0 2px 12px rgba(27,110,243,.4)', transition: '.15s', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
          onMouseOver={e => e.currentTarget.style.opacity = '.9'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >Get Started Free</Link>
      </div>
    </nav>
  );
}

function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const count = 55;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.5 + 0.15,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(107,180,255,${p.alpha})`;
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(27,110,243,${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }} />;
}

const CYCLING_WORDS = ['public feed', 'professional network', 'community hub', 'industry voice', 'career launchpad'];

function TypewriterWord() {
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const target = CYCLING_WORDS[wordIdx];
    let timeout;
    if (!deleting && displayed.length < target.length) {
      timeout = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 65);
    } else if (!deleting && displayed.length === target.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setWordIdx(i => (i + 1) % CYCLING_WORDS.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, wordIdx]);

  return (
    <span style={{ background: 'linear-gradient(135deg,#1B6EF3,#00B4D8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block', minWidth: 10 }}>
      {displayed}<span style={{ opacity: 0.7, WebkitTextFillColor: '#6AADFF', animation: 'blink 1s step-end infinite' }}>|</span>
    </span>
  );
}

export default function Landing() {
  const { navigateToLogin } = useAuth();
  const navigate = useNavigate();
  const { plans, isLoading: pricingLoading, isError: pricingError } = usePricingPlans();
  const proPlan = plans.find(plan => plan.id === 'pro');
  const freePlan = plans.find(plan => plan.id === 'free');
  const [blobT, setBlobT] = useState(0);
  useEffect(() => {
    let frame;
    const tick = (t) => { setBlobT(t / 1000); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const blob1X = 8 + Math.sin(blobT * 0.4) * 4;
  const blob1Y = 18 + Math.cos(blobT * 0.3) * 5;
  const blob2X = 72 + Math.sin(blobT * 0.35 + 1) * 4;
  const blob2Y = 55 + Math.cos(blobT * 0.28 + 2) * 5;
  const blob3X = 45 + Math.sin(blobT * 0.25 + 3) * 6;
  const blob3Y = 70 + Math.cos(blobT * 0.32 + 1) * 4;

  return (
    <div style={S.page}>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}} @keyframes floatA{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-14px) rotate(-2deg)}} @keyframes floatB{0%,100%{transform:translateY(0) rotate(4deg)}50%{transform:translateY(-10px) rotate(6deg)}} @keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <NavBar />

      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&auto=format&fit=crop&q=80"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.22 }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,rgba(7,16,32,.97) 0%,rgba(11,22,40,.82) 40%,rgba(10,31,26,.88) 75%,rgba(7,16,32,.97) 100%)' }} />
        </div>

        <ParticleCanvas />

        <div style={{ position: 'absolute', left: `${blob1X}%`, top: `${blob1Y}%`, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle,rgba(27,110,243,.18),transparent 70%)', pointerEvents: 'none', zIndex: 1, transition: 'left .05s,top .05s', filter: 'blur(2px)' }} />
        <div style={{ position: 'absolute', left: `${blob2X}%`, top: `${blob2Y}%`, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,200,83,.12),transparent 70%)', pointerEvents: 'none', zIndex: 1, filter: 'blur(2px)' }} />
        <div style={{ position: 'absolute', left: `${blob3X}%`, top: `${blob3Y}%`, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,77,255,.12),transparent 70%)', pointerEvents: 'none', zIndex: 1, filter: 'blur(2px)' }} />

       
        <div style={{ position: 'relative', zIndex: 3, animation: 'fadeInUp .8s ease both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(27,110,243,.1)', border: '1px solid rgba(27,110,243,.25)', borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: '#6AADFF', marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00C853', display: 'inline-block', boxShadow: '0 0 6px #00C853', animation: 'blink 2s step-end infinite' }} />
            Now live — Join 2,400+ professionals
          </div>

          <h1 style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.08, maxWidth: 900, marginBottom: 24, color: '#EEF4FF' }}>
            The professional community<br />
            with a <TypewriterWord /><br />
            and private workspace
          </h1>

          <p style={{ fontSize: 'clamp(15px,2vw,20px)', color: '#7FA8D4', maxWidth: 640, lineHeight: 1.65, marginBottom: 40,textAlign: 'center' }}>
            Bulletin Board uniquely combines a public professional community feed with a private, encrypted team workspace — in one platform built for professionals. 9 industry ecosystems. E2E encrypted. Flat pricing.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
            <Link to="/signup" style={{ padding: '14px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1B6EF3,#0D5FDB)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(27,110,243,.5)', transition: '.2s', textDecoration: 'none' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(27,110,243,.7)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(27,110,243,.5)'; }}
            >
              Get Started Free — no card needed
            </Link>
            <Link to="/" style={{ padding: '14px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.06)', color: '#EEF4FF', fontSize: 16, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: '.2s', backdropFilter: 'blur(8px)' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
            >
              Browse Feed →
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
            <div style={{ display: 'flex' }}>
              {[
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop',
                'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop',
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
              ].map((src, i) => (
                <img key={i} src={src} alt="" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #0B1628', marginLeft: i > 0 ? -10 : 0, objectFit: 'cover' }} />
              ))}
            </div>
            <span style={{ fontSize: 13, color: '#6B93C4' }}>Joined by <strong style={{ color: '#EEF4FF' }}>2,400+</strong> professionals across 9 industries</span>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
          {[
            { value: '9', label: 'Professional ecosystems' },
            { value: '2,400+', label: 'Active professionals' },
            { value: '3 plans', label: 'Free, Pro, and Pro Annual' },
            { value: '100%', label: 'E2E encrypted workspaces' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#EEF4FF', letterSpacing: '-1px', marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#6B93C4', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

    
      <section id="features" style={{ padding: '80px 24px', background: 'rgba(0,0,0,.15)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#6AADFF', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>How it works</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: '#EEF4FF', letterSpacing: '-1px' }}>Two layers. One platform.</h2>
            <p style={{ fontSize: 16, color: '#7FA8D4', marginTop: 12, maxWidth: 560, margin: '12px auto 0' }}>
              The only professional platform that combines a public community feed with a private, encrypted team workspace — seamlessly connected.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {[
              { step: '01', icon: Globe, title: 'Discover on the GP Feed', desc: 'Browse posts, polls, and insights across 9 professional ecosystems — no account needed. Upvote, comment, and build your professional reputation publicly.' },
              { step: '02', icon: Building2, title: 'Collaborate in your Workspace', desc: 'Create or join a private, E2E encrypted workspace for your team. Channels, DMs, voice huddles, file sharing, and app integrations — all in one place.' },
              { step: '03', icon: Handshake, title: 'Connect B2B across companies', desc: 'Invite clients, partners, and investors into shared B2B spaces within your workspace. Each company gets their own private area — fully isolated.' },
            ].map(s => {
              const StepIcon = s.icon;
              return (
              <div key={s.step} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: '28px 24px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#2E4D6E', marginBottom: 12, letterSpacing: '.8px' }}>Step {s.step}</div>
                <div style={{ fontSize: 32, marginBottom: 14 }}><StepIcon size={32} /></div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#EEF4FF', marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#7FA8D4', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#6AADFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}><Globe size={14} style={{display: 'inline-block', marginRight: 6}} /> Public GP Feed</div>
            <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, color: '#EEF4FF', letterSpacing: '-0.5px', marginBottom: 16, lineHeight: 1.2 }}>A professional community that works for you 24/7</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                '✓ Post flairs — Discussion, News, Job, Poll, Insight, Resource',
                '✓ Interactive polls with real-time vote bars',
                '✓ Karma system — build your professional reputation',
                '✓ Unlimited GP Feed posting on every plan',
                '✓ Public profiles, comments, upvotes & awards',
              ].map(f => (
                <div key={f} style={{ fontSize: 14, color: '#7FA8D4', lineHeight: 1.5 }}>{f}</div>
              ))}
            </div>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 24, padding: '10px 22px', borderRadius: 8, border: '1px solid rgba(27,110,243,.35)', background: 'rgba(27,110,243,.1)', color: '#6AADFF', fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: '.15s' }}>
              Browse the feed →
            </Link>
          </div>
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, overflow: 'hidden' }}>
            {[
              { score: 247, flairIcon: MessageSquare, flairLabel: 'Discussion', title: 'The rise of agentic AI in enterprise workflows — are teams ready?', ecoIcon: Cpu, ecoLabel: 'Technology', ago: '2h ago' },
              { score: 89, flairIcon: Briefcase, flairLabel: 'Job', title: '[Hiring] Senior Full-Stack Engineer · Remote · $140K–$180K', ecoIcon: Briefcase, ecoLabel: 'Careers', ago: '3h ago' },
              { score: 34, flairIcon: Newspaper, flairLabel: 'News', title: 'Healthcare AI diagnostics receive FDA clearance for clinical use', ecoIcon: Stethoscope, ecoLabel: 'Healthcare', ago: '4h ago' },
            ].map((p, i) => {
              const FlairIcon = p.flairIcon;
              const EcoIcon = p.ecoIcon;
              return (
              <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: '#6B93C4' }}>▲</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1B6EF3' }}>{p.score}</span>
                  <span style={{ fontSize: 10, color: '#6B93C4' }}>▼</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#6AADFF', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><FlairIcon size={12} /> {p.flairLabel}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#EEF4FF', lineHeight: 1.4, marginBottom: 4 }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: '#6B93C4', display: 'flex', alignItems: 'center', gap: 4 }}><EcoIcon size={12} /> {p.ecoLabel} · {p.ago}</div>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 24px', background: 'rgba(0,0,0,.15)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div style={{ background: '#0B1628', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C853', boxShadow: '0 0 6px #00C853' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#EEF4FF' }}>Cobikin HQ</span>
              <span style={{ fontSize: 11, color: '#6B93C4', marginLeft: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Cpu size={12} /> Technology · Private</span>
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ width: 120, borderRight: '1px solid rgba(255,255,255,.07)', padding: '10px 0' }}>
                {[
                  { icon: Megaphone, label: 'announcements' },
                  { icon: null, label: 'general' },
                  { icon: null, label: 'dev-log' },
                ].map(ch => {
                  const ChannelIcon = ch.icon;
                  return (
                  <div key={ch.label} style={{ padding: '5px 12px', fontSize: 12, color: '#7FA8D4', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {ch.icon ? <ChannelIcon size={12} /> : '#'} {ch.label}
                  </div>
                );
                })}
              </div>
              <div style={{ flex: 1, padding: '12px' }}>
                {[
                  { initials: 'SR', name: 'Sarah R.', msg: 'Q1 reviews due Friday 5PM 👋', grad: 'linear-gradient(135deg,#1B6EF3,#00B4D8)' },
                  { initials: 'JT', name: 'James T.', msg: 'Server migration complete 🚀', grad: 'linear-gradient(135deg,#7C4DFF,#1B6EF3)' },
                  { initials: 'RK', name: 'Raj K.', msg: 'Q1 deck ready — Revenue +34%', grad: 'linear-gradient(135deg,#00C853,#00897B)' },
                ].map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: m.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{m.initials}</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#EEF4FF', marginBottom: 2 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: '#7FA8D4' }}>{m.msg}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,.07)', background: 'rgba(0,0,0,.2)', fontSize: 11, color: '#2E4D6E', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Lock size={14} style={{color: '#00C853'}} /> End-to-end encrypted
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#6AADFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}><Building2 size={14} style={{display: 'inline-block', marginRight: 6}} /> Private Workspace</div>
            <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, color: '#EEF4FF', letterSpacing: '-0.5px', marginBottom: 16, lineHeight: 1.2 }}>Everything your team needs — in one encrypted space</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: Mic, text: 'Voice & video huddles — E2E encrypted, no Zoom needed' },
                { icon: BarChart3, text: 'In-channel polls — make team decisions fast' },
                { icon: Wrench, text: 'App integrations — Google Drive, Asana, GitHub & more' },
                { icon: Clipboard, text: 'Management directory — team profiles, roles, and status' },
                { icon: Handshake, text: 'B2B spaces — invite clients & partners securely' },
              ].map((f, i) => {
                const FeatureIcon = f.icon;
                return (
                <div key={i} style={{ fontSize: 14, color: '#7FA8D4', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <FeatureIcon size={16} style={{marginTop: 2, flexShrink: 0}} />
                  <span>{f.text}</span>
                </div>
              );
              })}
            </div>
            <button onClick={() => navigateToLogin()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 24, padding: '10px 22px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#1B6EF3,#0D5FDB)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 12px rgba(27,110,243,.4)' }}>
              Create your workspace →
            </button>
          </div>
        </div>
      </section>

      <section id="ecosystems" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#6AADFF', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>9 Professional Ecosystems</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: '#EEF4FF', letterSpacing: '-1px' }}>Find your industry community</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
            {ECOSYSTEMS.map(eco => (
              <Link key={eco.label} to="/" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, textAlign: 'center', textDecoration: 'none', transition: '.2s', display: 'block', overflow: 'hidden' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(27,110,243,.4)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,.5)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ height: 90, overflow: 'hidden', position: 'relative' }}>
                  <img src={eco.img} alt={eco.label} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: '.3s' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(6,13,26,.9))' }} />
                  <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, fontSize: 22, display: 'flex', justifyContent: 'center' }}>{(() => { const Icon = eco.icon; return <Icon size={22} />; })()}</div>
                </div>
                <div style={{ padding: '10px 12px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#EEF4FF', marginBottom: 3 }}>{eco.label}</div>
                  <div style={{ fontSize: 11, color: '#6B93C4' }}>{eco.members} active members</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 24px', background: 'rgba(0,0,0,.15)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: '#EEF4FF', letterSpacing: '-0.5px' }}>Built for people who get things done</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: '24px', transition: '.2s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(27,110,243,.3)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ fontSize: 13, color: '#FFB300', marginBottom: 12 }}>★★★★★</div>
                <p style={{ fontSize: 14, color: '#7FA8D4', lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={t.img} alt={t.name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(27,110,243,.3)' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#6B93C4' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#6AADFF', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>Simple pricing</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: '#EEF4FF', letterSpacing: '-1px' }}>The right plan for every team</h2>
            <p style={{ fontSize: 15, color: '#7FA8D4', marginTop: 10 }}>Start free. Upgrade when you're ready. Clear per-user pricing.</p>
          </div>
          {(pricingLoading || pricingError || plans.length === 0) && (
            <p style={{ textAlign: 'center', fontSize: 13, color: '#6B93C4', marginTop: 16 }}>
              {pricingLoading ? 'Loading pricing…' : 'Pricing is temporarily unavailable.'}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
            {plans.map(plan => (
              <div key={plan.name} style={{
                background: plan.id === 'pro' ? 'linear-gradient(160deg,rgba(27,110,243,.12),rgba(0,180,216,.06))' : 'rgba(255,255,255,.04)',
                border: plan.id === 'pro' ? '1px solid rgba(27,110,243,.4)' : '1px solid rgba(255,255,255,.07)',
                borderRadius: 16, padding: '24px', position: 'relative',
                boxShadow: plan.id === 'pro' ? '0 0 40px rgba(27,110,243,.12)' : 'none',
              }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#EEF4FF', marginBottom: 8 }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#EEF4FF', letterSpacing: '-1px' }}>{getPlanPriceLabel(plan)}</span>
                </div>
                <div style={{ fontSize: 12, color: '#6B93C4', marginBottom: 20 }}>{getPlanBillingDescription(plan)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ fontSize: 13, color: '#7FA8D4', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{ color: '#00C853', flexShrink: 0 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => ['annual', 'pro_multi', 'annual_multi'].includes(plan.id) ? navigate('/pricing') : navigateToLogin()}
                  style={{
                    width: '100%', padding: '11px 0', borderRadius: 8, border: plan.id === 'pro' ? 'none' : '1px solid rgba(255,255,255,.15)',
                    background: plan.id === 'pro' ? 'linear-gradient(135deg,#1B6EF3,#0D5FDB)' : 'transparent',
                    color: '#EEF4FF', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    boxShadow: plan.id === 'pro' ? '0 2px 12px rgba(27,110,243,.4)' : 'none',
                  }}
                >{plan.id === 'pro' ? `Start ${plan.trial_days}-day free trial` : ['annual', 'pro_multi', 'annual_multi'].includes(plan.id) ? 'Choose plan' : 'Get started free'}</button>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#6B93C4', marginTop: 24 }}>
            {proPlan?.trial_days ? `Pro includes a ${proPlan.trial_days}-day free trial · ` : ''}{freePlan ? `${freePlan.name} is ${getPlanPriceLabel(freePlan)} forever` : ''}
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 24px 120px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, color: '#EEF4FF', letterSpacing: '-1px', marginBottom: 16 }}>
            Ready to bring your team<br />to Bulletin Board?
          </h2>
          <p style={{ fontSize: 16, color: '#7FA8D4', marginBottom: 36 }}>
            Start free. Set up your workspace in 2 minutes. Invite your team. No credit card, no commitment.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" style={{ padding: '14px 36px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1B6EF3,#0D5FDB)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(27,110,243,.5)', textDecoration: 'none' }}>
              Get Started Free
            </Link>
            <Link to="/support" style={{ padding: '14px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.04)', color: '#EEF4FF', fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
              Talk to sales
            </Link>
          </div>
          <p style={{ fontSize: 13, color: '#2E4D6E', marginTop: 20 }}>Free forever · Pro monthly and annual plans available</p>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '28px 24px', textAlign: 'center', fontSize: 13, color: '#2E4D6E' }}>
        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 700, color: '#4A6A8A' }}>
          Bulletin Board is a product of <span style={{ color: '#6AADFF' }}>Cobikin Solutions LLC</span>
        </div>
        <div style={{ marginBottom: 12, fontSize: 12, color: '#2E4D6E', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <MapPin size={14} /> Houston, Texas, USA
        </div>
        © 2026 Cobikin Solutions LLC · All rights reserved ·{' '}
        <Link to="/support" style={{ color: '#6B93C4', textDecoration: 'none' }}>Support</Link> ·{' '}
        <Link to="/pricing" style={{ color: '#6B93C4', textDecoration: 'none' }}>Pricing</Link> ·{' '}
        <Link to="/about" style={{ color: '#6B93C4', textDecoration: 'none' }}>About</Link>
      </footer>
    </div>
  );
}