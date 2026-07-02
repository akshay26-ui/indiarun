'use client';

import React, { useEffect, useRef, useState } from 'react';
import Prism from './Prism';
import CardNav from './CardNav';
import StickyCardStack from './StickyCardStack';
import TiltedCard from './TiltedCard';
import { Package, Cpu, Target, ShoppingCart } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS — single source of truth for the colour/type system
   ═══════════════════════════════════════════════════════════════════════════ */
const T = {
  bg:          '#030508',     // Deep Obsidian
  primaryMuted:'rgba(79,70,229,0.7)', // Deep Indigo (muted)
  violetMuted: '#9B51E0',     // Neon Amethyst (muted)
  primary:     '#4F46E5',     // Premium Indigo
  indigoMid:   '#818CF8',     // Mid-tone indigo for accents
  violetLight: '#C4B5FD',     // Soft lavender for highlights
  amber:       '#FF3366',     // Neon Pink
  fog92:       'rgba(255,255,255,0.92)',
  fog58:       'rgba(255,255,255,0.70)',
  fog38:       'rgba(255,255,255,0.45)',
  fog25:       'rgba(255,255,255,0.25)',
  fog12:       'rgba(255,255,255,0.12)',
  fog06:       'rgba(255,255,255,0.06)',
  fontDisplay: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
  fontBody:    "'Inter', 'Hanken Grotesk', system-ui, sans-serif",
  fontMono:    "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════════════════ */
function useInViewReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!els.length) return;
    // Mark already-visible on load
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.88 && r.bottom > 0) {
        el.setAttribute('data-reveal-state', 'in');
      }
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).setAttribute('data-reveal-state', 'in');
            io.unobserve(e.target);
          }
        }
      },
      { root: null, threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}



/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER — counts up when in view
   ═══════════════════════════════════════════════════════════════════════════ */
function AnimatedStat({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          const duration = 1400;
          const start = performance.now();
          const animate = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const ease = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.round(value * ease));
            if (t < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <div className="text-center">
      <span ref={ref} className="block text-[40px] md:text-[52px] font-bold leading-none" style={{ fontFamily: T.fontMono, color: T.primary }}>
        {display}{suffix}
      </span>
      <span className="mt-2 block text-[13px] tracking-[0.08em] uppercase" style={{ fontFamily: T.fontBody, color: T.fog38 }}>
        {label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TILT HANDLER — reusable mouse-move 3D tilt for glass cards
   ═══════════════════════════════════════════════════════════════════════════ */
const handleCardTilt = (e: React.MouseEvent<HTMLDivElement>) => {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  el.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-4px)`;
};
const handleCardTiltLeave = (e: React.MouseEvent<HTMLDivElement>) => {
  e.currentTarget.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateY(0px)';
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPageClient() {
  useInViewReveal();
  const lastScrollY    = useRef(0);
  const lastScrollTime = useRef(0);
  const [scrolled, setScrolled] = useState(false);

  // ── Scroll-state tracking ────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.backgroundColor = T.bg;

    const handleScroll = () => {
      lastScrollY.current    = window.scrollY;
      lastScrollTime.current = performance.now();
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Pipeline',  href: '#pipeline'  },
    { label: 'Features',  href: '#features'  },
    { label: 'Industry',  href: '#industry'  },
    { label: 'Pricing',   href: '#pricing'   },
  ];

  return (
    <div className="relative selection:bg-[#818CF8]/20" style={{ fontFamily: T.fontBody, color: T.fog92 }}>

      {/* ────────────────────────────────────────────────────────────────────
           GLOBAL STYLES — reveal animations + custom scrollbar
           ──────────────────────────────────────────────────────────────────── */}
      <style>{`
        /* Scroll reveal */
        [data-reveal]{
          opacity:0;
          transform:translateY(18px);
          transition:opacity 800ms cubic-bezier(0.22,1,0.36,1), transform 800ms cubic-bezier(0.22,1,0.36,1);
          will-change:opacity,transform;
        }
        [data-reveal][data-reveal-state="in"]{
          opacity:1;
          transform:translateY(0);
        }
        /* Stagger children */
        [data-reveal-stagger] > *:nth-child(1){ transition-delay:0ms; }
        [data-reveal-stagger] > *:nth-child(2){ transition-delay:80ms; }
        [data-reveal-stagger] > *:nth-child(3){ transition-delay:160ms; }
        [data-reveal-stagger] > *:nth-child(4){ transition-delay:240ms; }
        [data-reveal-stagger] > *:nth-child(5){ transition-delay:320ms; }
        [data-reveal-stagger] > *:nth-child(6){ transition-delay:400ms; }

        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }

        /* Smooth scroll */
        html { scroll-behavior: smooth; }

        /* Glass card hover lift */
        .glass-lift { transition: transform 400ms cubic-bezier(0.22,1,0.36,1), box-shadow 400ms ease; }
        .glass-lift:hover { transform: translateY(-4px); box-shadow: 0 24px 60px rgba(0,0,0,0.35); }

        /* Gradient text */
        .gradient-text {
          background-image: linear-gradient(135deg, #818CF8 0%, #A78BFA 40%, #C4B5FD 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradient-shift 6s ease-in-out infinite;
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* Glow pulse for CTA */
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(79,70,229,0.30), 0 0 60px rgba(79,70,229,0.15); }
          50% { box-shadow: 0 0 50px rgba(79,70,229,0.45), 0 0 90px rgba(79,70,229,0.25); }
        }
        .glow-cta { animation: glow-pulse 3s ease-in-out infinite; }

        /* Orbit ring */
        @keyframes orbit { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .orbit-ring { animation: orbit 20s linear infinite; }

        /* Timeline pulse */
        @keyframes timeline-pulse {
          0% { left: 0%; }
          100% { left: 100%; }
        }
        .timeline-dot {
          animation: timeline-pulse 4s ease-in-out infinite alternate;
        }

        /* Step circle pulse */
        @keyframes step-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .step-circle-pulse {
          animation: step-pulse 2.5s ease-in-out infinite;
        }

        /* Tilt card interaction */
        .tilt-card {
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
          will-change: transform;
        }
      `}</style>

      {/* ────────────────────────────────────────────────────────────────────
           FIXED PRISM BACKGROUND — visible through transparent sections
           The z-index is -10, content above is intentionally transparent
           ──────────────────────────────────────────────────────────────────── */}
      <div className="fixed inset-0" style={{ zIndex: -10, background: T.bg }}>
        <Prism
          animationType="rotate"
          timeScale={0}
          height={3.5}
          baseWidth={5.1}
          scale={2.7}
          hueShift={0}
          colorFrequency={0.6}
          noise={0.15}
          glow={1.0}
          bloom={1.0}
        />
        {/* Subtle bottom vignette so text stays readable */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, transparent 60%, ${T.bg} 100%)`,
          }}
        />
      </div>

      {/* ────────────────────────────────────────────────────────────────────
           NAVBAR — CardNav layout with liquid glass styling
           ──────────────────────────────────────────────────────────────────── */}
      <CardNav
        logo={
          <div className="flex items-center gap-2.5 select-none">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: T.primary, boxShadow: `0 0 10px ${T.primary}ee` }}
            />
            <span
              className="font-bold text-[16px] tracking-tight"
              style={{ fontFamily: T.fontDisplay, color: T.fog92 }}
            >
              Aura Agent
            </span>
          </div>
        }
        items={[
          {
            label: "Features",
            bgColor: "rgba(3, 5, 8, 0.8)",
            textColor: T.fog92,
            links: [
              { label: "Product Pipeline", href: "#pipeline", ariaLabel: "Explore pipeline" },
              { label: "Bento Features", href: "#features", ariaLabel: "Agent features" }
            ]
          },
          {
            label: "Pricing",
            bgColor: "rgba(10, 15, 25, 0.8)",
            textColor: T.fog92,
            links: [
              { label: "Subscription Plans", href: "#pricing", ariaLabel: "View plans" },
              { label: "Enterprise Custom", href: "#pricing", ariaLabel: "Get in touch" }
            ]
          },
          {
            label: "Telemetry",
            bgColor: "rgba(3, 5, 8, 0.8)",
            textColor: T.fog92,
            links: [
              { label: "Telemetry Live", href: "#telemetry", ariaLabel: "View telemetry" },
              { label: "Case Studies", href: "#industry", ariaLabel: "Read cases" }
            ]
          }
        ]}
        baseColor="rgba(255, 255, 255, 0.04)"
        menuColor={T.fog92}
        buttonBgColor={T.primary}
        buttonTextColor={T.bg}
      />

      {/* ══════════════════════════════════════════════════════════════════
           PAGE CONTENT
           ══════════════════════════════════════════════════════════════════ */}
      <main>

        {/* ────────────────────────────────────────────────────────────────
             HERO — transparent bg so Prism shows through
             ──────────────────────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20">
          {/* The hero has NO opaque background — the prism bleeds through */}

          {/* Eyebrow badge */}
          <div
            className="mb-8 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full animate-fade-in"
            style={{
              border: `1px solid rgba(79,70,229,0.25)`,
              background: 'rgba(3, 5, 8, 0.65)',
              backdropFilter: 'blur(16px)',
              boxShadow: 'inset 0 0 0 1px rgba(79,70,229,0.12), 0 4px 20px rgba(0,0,0,0.3)',
            }}
            data-reveal
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: T.primary }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: T.primary }} />
            </span>
            <span
              className="text-[11px] font-semibold tracking-[0.16em] uppercase"
              style={{ fontFamily: T.fontBody, color: T.indigoMid }}
            >
              Autonomous Product PM
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-[clamp(2.5rem,6vw,5.5rem)] font-extrabold tracking-[-0.04em] leading-[1.02] mb-6 max-w-4xl"
            style={{ fontFamily: T.fontDisplay, color: T.fog92 }}
            data-reveal
          >
            Autonomous product engineering <br />
            <span style={{ color: T.indigoMid }}>powered by AI agents.</span>
          </h1>

          {/* Sub copy */}
          <p
            className="text-[16px] md:text-[18px] leading-[1.7] max-w-2xl mb-10"
            style={{ fontFamily: T.fontBody, color: T.fog58 }}
            data-reveal
          >
            Define your concept. Aura Agent automatically conducts market research, compiles 
            specifications, designs interfaces, and generates functional prototypes — while 
            you direct the workflow.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4" data-reveal>
            <a
              href="/signup"
              className="px-8 py-4 font-semibold text-[15px] rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                fontFamily: T.fontBody,
                background: T.primary,
                color: T.bg,
                boxShadow: `0 0 30px rgba(79,70,229,0.30)`
              }}
            >
              Get started free →
            </a>
            <a
              href="#pipeline"
              className="px-8 py-4 text-[15px] rounded-2xl transition-all duration-200"
              style={{
                fontFamily: T.fontBody,
                color: T.fog58,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.04)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = T.fog92; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = T.fog58; }}
            >
              Explore the pipeline
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" data-reveal>
            <span className="text-[11px] tracking-[0.1em] uppercase" style={{ color: T.fog25, fontFamily: T.fontMono }}>scroll</span>
            <div className="w-px h-8" style={{ background: `linear-gradient(to bottom, ${T.fog25}, transparent)` }} />
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────────────
             METRICS BAR — social proof strip
             ──────────────────────────────────────────────────────────────── */}
        <section className="relative py-20 px-6" data-reveal>
          <div
            className="max-w-5xl mx-auto rounded-3xl p-10 md:p-14"
            style={{
              background: 'rgba(12,15,20,0.65)',
              backdropFilter: 'blur(40px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 0 80px rgba(0,0,0,0.3)',
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
              <AnimatedStat value={12}  suffix="x"  label="Faster time-to-market" />
              <AnimatedStat value={94}  suffix="%"  label="Decision accuracy" />
              <AnimatedStat value={340} suffix="+"  label="Products launched" />
              <AnimatedStat value={50}  suffix="ms" label="Avg response time" />
            </div>
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────────────
             PIPELINE — scroll-stacked cards
             ──────────────────────────────────────────────────────────────── */}
        <section id="pipeline">
          {/* Section header */}
          <div className="text-center px-6 pt-28 pb-8" data-reveal>
            <span
              className="text-[11px] font-medium tracking-[0.18em] uppercase"
              style={{ fontFamily: T.fontBody, color: T.primary }}
            >
              The Pipeline
            </span>
            <h2
              className="mt-4 text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight"
              style={{ fontFamily: T.fontDisplay, color: T.fog92 }}
            >
              Six stages. Zero busywork.
            </h2>
            <p className="mt-3 text-[15px] max-w-lg mx-auto" style={{ color: T.fog38, fontFamily: T.fontBody }}>
              Each card is a decision gate. Scroll to step through the autonomous product lifecycle.
            </p>
          </div>

          {/* StickyCardStack — GSAP-powered card pinning and stacking */}
          <div className="px-6 pb-0">
            <StickyCardStack>
              {([
                {
                  title: 'Whitespace Discovery',
                  tag: 'Stage 01 — Research',
                  body: 'Aura scans competitor landscapes, psychographic signals, and market gaps to surface opportunities you\'d miss with manual research. Every finding is citation-backed and verifiable.',
                  accent: 'cyan' as const,
                  stat: '2.4k',
                  statLabel: 'signals analyzed per brief',
                },
                {
                  title: 'Roadmap & PRD Generation',
                  tag: 'Stage 02 — Planning',
                  body: 'Whitespace insights auto-generate a prioritised feature list, user personas, and a complete product requirements document. Every decision is traceable back to discovery data.',
                  accent: 'violet' as const,
                  stat: '94%',
                  statLabel: 'spec completeness score',
                },
                {
                  title: 'Prototype Assembly',
                  tag: 'Stage 03 — Build',
                  body: 'From the spec, Aura assembles a working clickable prototype — whether software screens or physical packaging blueprints. Iteration happens in hours, not weeks.',
                  accent: 'cyan' as const,
                  stat: '< 4h',
                  statLabel: 'avg prototype turnaround',
                },
                {
                  title: 'GTM Planning',
                  tag: 'Stage 04 — Launch',
                  body: 'Unit economics, acquisition channels, and launch campaigns — all populated from your discovery data. Every number is auditable.',
                  accent: 'violet' as const,
                  stat: '3.2x',
                  statLabel: 'avg ROI improvement',
                },
                {
                  title: 'Closed Feedback Loop',
                  tag: 'Stage 05 — Learn',
                  body: 'Post-launch telemetry re-enters the pipeline. Aura continuously re-optimises recommendations based on real user behaviour and market shifts.',
                  accent: 'cyan' as const,
                  stat: '↻ 24h',
                  statLabel: 'feedback cycle time',
                },
                {
                  title: 'Human-in-the-Loop',
                  tag: 'Stage 06 — Control',
                  body: 'Approval gates at every critical milestone. You review, approve, or redirect. The agent handles execution; you maintain strategic control.',
                  accent: 'violet' as const,
                  stat: '100%',
                  statLabel: 'decisions under your control',
                },
              ]).map((c, idx) => {
                const accentColor = c.accent === 'cyan' ? T.primary : T.violetMuted;
                return (
                  <div
                    key={c.title}
                    className="w-full h-full rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between text-left select-none gap-6 md:gap-8 border"
                    style={{
                      background: 'rgba(3, 5, 8, 0.45)',
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(30px) saturate(180%)',
                      boxShadow: `inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.15), inset 0 -30px 100px -40px ${accentColor}22, 0 24px 60px rgba(0, 0, 0, 0.65)`,
                    }}
                  >
                    {/* Left Column: Eyebrow + title + body */}
                    <div className="flex-1 flex flex-col justify-center h-full">
                      {/* Eyebrow */}
                      <div className="flex items-center gap-2.5 mb-4">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: accentColor, boxShadow: `0 0 15px ${accentColor}66` }}
                        />
                        <span className="text-[12px] md:text-[13px] font-bold tracking-[0.16em] uppercase" style={{ fontFamily: T.fontBody, color: T.fog38 }}>
                          {c.tag}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-[24px] md:text-[32px] font-bold tracking-tight leading-[1.12] mb-4" style={{ fontFamily: T.fontDisplay, color: T.fog92 }}>
                        {c.title}
                      </h3>

                      {/* Body */}
                      <p className="text-[15px] md:text-[16px] leading-[1.7] max-w-md" style={{ fontFamily: T.fontBody, color: T.fog58 }}>
                        {c.body}
                      </p>
                    </div>

                    {/* Desktop Divider */}
                    <div className="w-px h-2/3 bg-white/10 hidden md:block shrink-0" />

                    {/* Right Column: Stat values */}
                    <div className="flex flex-col items-center justify-center shrink-0 min-w-[160px] text-center">
                      <span className="text-[48px] md:text-[60px] font-bold leading-none tracking-tight" style={{ fontFamily: T.fontMono, color: accentColor }}>
                        {c.stat}
                      </span>
                      <span className="text-[12px] md:text-[14px] mt-2 font-medium" style={{ fontFamily: T.fontBody, color: T.fog38 }}>
                        {c.statLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </StickyCardStack>
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────────────
             FEATURES — asymmetric bento grid
             ──────────────────────────────────────────────────────────────── */}
        <section id="features" className="px-6 pt-12 pb-28 max-w-7xl mx-auto">
          <div className="text-center mb-16" data-reveal>
            <span className="text-[11px] font-medium tracking-[0.18em] uppercase" style={{ fontFamily: T.fontBody, color: T.primary }}>
              Capabilities
            </span>
            <h2 className="mt-4 text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight" style={{ fontFamily: T.fontDisplay, color: T.fog92 }}>
              What makes Aura different.
            </h2>
          </div>

          <div className="grid md:grid-cols-12 gap-5" data-reveal data-reveal-stagger="">
            {/* Large feature card — spans 7 cols */}
            <div
              className="md:col-span-7 rounded-[28px] p-8 md:p-10 tilt-card"
              onMouseMove={handleCardTilt}
              onMouseLeave={handleCardTiltLeave}
              style={{
                background: 'rgba(3, 5, 8, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(30px) saturate(180%)',
                boxShadow: `inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.15), inset 0 -30px 100px -40px ${T.primary}22, 0 24px 60px rgba(0, 0, 0, 0.65)`,
              }}
            >
              <div className="flex items-center gap-2.5 mb-6">
                <span className="w-2 h-2 rounded-full" style={{ background: T.primary, boxShadow: `0 0 12px ${T.primary}55` }} />
                <span className="text-[11px] tracking-[0.14em] uppercase" style={{ fontFamily: T.fontBody, color: T.fog38 }}>
                  Intelligence Engine
                </span>
              </div>
              <h3 className="text-[24px] md:text-[28px] font-bold tracking-tight mb-3" style={{ fontFamily: T.fontDisplay, color: T.fog92 }}>
                Autonomous research at scale
              </h3>
              <p className="text-[14px] leading-[1.7] max-w-md" style={{ fontFamily: T.fontBody, color: T.fog58 }}>
                Aura doesn't summarise — it investigates. Cross-referencing thousands of signals across competitor
                landscapes, patent filings, social sentiment, and market data to surface opportunities with citation-level traceability.
              </p>
              {/* Decorative data row */}
              <div className="mt-8 flex flex-wrap gap-3">
                {['Patent analysis', 'Social sentiment', 'Price signals', 'Trend velocity'].map(tag => (
                  <span
                    key={tag}
                    className="text-[11px] px-3 py-1.5 rounded-full"
                    style={{ fontFamily: T.fontMono, color: T.primary, background: `${T.primary}0c`, border: `1px solid ${T.primary}18` }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="md:col-span-5 rounded-[28px] p-8 tilt-card flex flex-col justify-between"
              onMouseMove={handleCardTilt}
              onMouseLeave={handleCardTiltLeave}
              style={{
                background: 'rgba(3, 5, 8, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(30px) saturate(180%)',
                boxShadow: `inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.15), inset 0 -30px 100px -40px ${T.violetMuted}22, 0 24px 60px rgba(0, 0, 0, 0.65)`,
              }}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="w-2 h-2 rounded-full" style={{ background: T.violetMuted, boxShadow: `0 0 12px ${T.violetMuted}55` }} />
                  <span className="text-[11px] tracking-[0.14em] uppercase" style={{ fontFamily: T.fontBody, color: T.fog38 }}>
                    Decision Gates
                  </span>
                </div>
                <h3 className="text-[22px] font-bold tracking-tight mb-3" style={{ fontFamily: T.fontDisplay, color: T.fog92 }}>
                  You approve. Aura executes.
                </h3>
                <p className="text-[14px] leading-[1.7]" style={{ fontFamily: T.fontBody, color: T.fog58 }}>
                  Every stage has a checkpoint. Aura presents its work, you review, and either approve or redirect. No black boxes.
                </p>
              </div>

              {/* Approval mockup */}
              <div className="mt-8 flex items-center gap-3 w-full">
                <button
                  className="px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
                  style={{ background: T.primary, color: T.bg }}
                >
                  ✓ Approve
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-[12px] font-medium"
                  style={{ color: T.fog38, border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  ← Redirect
                </button>
                <span className="text-[11px] ml-auto" style={{ fontFamily: T.fontMono, color: T.amber }}>
                  ⚠ 2 items flagged
                </span>
              </div>
            </div>

            {/* Row 2: three equal cards */}
            {[
              {
                icon: '◈',
                label: 'Artifact System',
                title: 'Everything is a real deliverable',
                body: 'Briefs, PRDs, prototypes — not chat messages. Every output is a structured artifact you can version, diff, and hand off.',
                accent: T.primary,
              },
              {
                icon: '⟁',
                label: 'Telemetry Loop',
                title: 'Post-launch data feeds back in',
                body: 'Live metrics re-enter the pipeline. Your next product iteration is informed by real-world performance, not guesswork.',
                accent: T.violetMuted,
              },
              {
                icon: '⧫',
                label: 'Multi-Modal',
                title: 'Software, hardware, packaging',
                body: 'Whether you\'re shipping an app or a physical product, Aura adapts its pipeline to your domain and output format.',
                accent: T.primary,
              },
            ].map(f => (
              <div
                key={f.title}
                className="md:col-span-4 rounded-[28px] p-7 tilt-card border"
                onMouseMove={handleCardTilt}
                onMouseLeave={handleCardTiltLeave}
                style={{
                  background: 'rgba(3, 5, 8, 0.45)',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(30px) saturate(180%)',
                  boxShadow: `inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.15), inset 0 -30px 100px -40px ${f.accent}22, 0 24px 60px rgba(0, 0, 0, 0.65)`,
                }}
              >
                <span className="text-[24px] leading-none block mb-5" style={{ color: f.accent }}>{f.icon}</span>
                <span className="text-[11px] tracking-[0.14em] uppercase block mb-3" style={{ fontFamily: T.fontBody, color: T.fog38 }}>
                  {f.label}
                </span>
                <h3 className="text-[18px] font-bold tracking-tight mb-2" style={{ fontFamily: T.fontDisplay, color: T.fog92 }}>
                  {f.title}
                </h3>
                <p className="text-[13px] leading-[1.7]" style={{ fontFamily: T.fontBody, color: T.fog58 }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────────────
             INDUSTRY — horizontal scroll pills + grid
             ──────────────────────────────────────────────────────────────── */}
        <section id="industry" className="px-6 py-28">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16" data-reveal>
              <span className="text-[11px] font-medium tracking-[0.18em] uppercase" style={{ fontFamily: T.fontBody, color: T.violetMuted }}>
                Industries
              </span>
              <h2 className="mt-4 text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight" style={{ fontFamily: T.fontDisplay, color: T.fog92 }}>
                Built for product teams who ship.
              </h2>
              <p className="mt-3 text-[15px] max-w-lg mx-auto" style={{ color: T.fog38, fontFamily: T.fontBody }}>
                Whether you're launching FMCG, SaaS, or D2C — Aura adapts its intelligence pipeline to your vertical.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5" data-reveal data-reveal-stagger="">
              {([
                { name: 'FMCG & CPG', desc: 'Packaging, shelf strategy, competitive benchmarking', iconName: 'Package' },
                { name: 'SaaS & Tech', desc: 'Feature prioritization, user research, PLG loops', iconName: 'Cpu' },
                { name: 'D2C Brands', desc: 'Brand positioning, influencer mapping, CAC optimization', iconName: 'Target' },
                { name: 'Retail & Commerce', desc: 'Assortment planning, pricing intelligence, channel strategy', iconName: 'ShoppingCart' },
              ] as const).map((ind, idx) => {
                const LucideIcon = { Package, Cpu, Target, ShoppingCart }[ind.iconName];
                const accent = idx % 2 === 0 ? T.primary : T.violetMuted;
                return (
                  <TiltedCard
                    key={ind.name}
                    imageSrc="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                    altText={ind.name}
                    containerHeight="240px"
                    containerWidth="100%"
                    imageHeight="240px"
                    imageWidth="100%"
                    rotateAmplitude={12}
                    scaleOnHover={1.06}
                    showMobileWarning={false}
                    showTooltip={false}
                    displayOverlayContent={true}
                    overlayContent={
                      <div
                        className="w-full h-full rounded-[24px] p-7 flex flex-col justify-start items-center text-center border select-none"
                        style={{
                          background: 'rgba(3, 5, 8, 0.45)',
                          borderColor: 'rgba(255, 255, 255, 0.08)',
                          backdropFilter: 'blur(30px) saturate(180%)',
                          boxShadow: `inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.15), inset 0 -30px 100px -40px ${accent}22, 0 20px 50px rgba(0, 0, 0, 0.6)`,
                        }}
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 mx-auto"
                          style={{ background: `${accent}14`, border: `1px solid ${accent}22` }}
                        >
                          <LucideIcon size={22} strokeWidth={1.5} style={{ color: accent }} />
                        </div>
                        <h3 className="text-[16px] font-bold tracking-tight mb-2" style={{ fontFamily: T.fontDisplay, color: T.fog92 }}>
                          {ind.name}
                        </h3>
                        <p className="text-[13px] leading-[1.6]" style={{ fontFamily: T.fontBody, color: T.fog58 }}>
                          {ind.desc}
                        </p>
                      </div>
                    }
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────────────
             HOW IT WORKS — 3-step horizontal timeline
             ──────────────────────────────────────────────────────────────── */}
        <section className="px-6 py-28">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16" data-reveal>
              <span className="text-[11px] font-medium tracking-[0.18em] uppercase" style={{ fontFamily: T.fontBody, color: T.primary }}>
                How It Works
              </span>
              <h2 className="mt-4 text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight" style={{ fontFamily: T.fontDisplay, color: T.fog92 }}>
                Three moves. Ship faster.
              </h2>
            </div>

            <div 
              className="grid md:grid-cols-3 gap-0 relative p-8 md:p-12 rounded-[32px] mx-4 md:mx-0" 
              data-reveal 
              data-reveal-stagger=""
              style={{
                background: 'rgba(3, 5, 8, 0.45)',
                borderColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(30px) saturate(180%)',
                boxShadow: `inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.15), inset 0 -30px 100px -40px ${T.primary}22, 0 32px 80px rgba(0,0,0,0.6)`,
              }}
            >
              {/* Connection line — centered on circles */}
              <div className="hidden md:block absolute top-[100px] left-[16.66%] right-[16.66%] h-px" style={{ background: `linear-gradient(90deg, ${T.primary}33, ${T.violetMuted}33, ${T.primary}33)` }}>
                {/* Pulsing dot travels along the line */}
                <div
                  className="timeline-dot absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                  style={{
                    background: T.indigoMid,
                    boxShadow: `0 0 12px ${T.indigoMid}, 0 0 24px ${T.indigoMid}66`,
                  }}
                />
              </div>

              {[
                { step: '01', title: 'Define your brief', body: 'Drop in a product idea, category, or competitive context. Aura asks clarifying questions and builds a structured intake.', color: T.primary },
                { step: '02', title: 'Aura investigates', body: 'The pipeline runs: whitespace analysis → roadmap → prototype → GTM. Each stage produces a reviewable artifact.', color: T.violetMuted },
                { step: '03', title: 'Review & launch', body: 'Approve or redirect at each gate. When you\'re ready, your launch plan is already built — pricing, channels, creative briefs included.', color: T.primary },
              ].map(s => (
                <div key={s.step} className="text-center px-4 py-6">
                  {/* Step circle with pulse */}
                  <div className="relative mx-auto mb-6 step-circle-pulse" style={{ width: 56, height: 56 }}>
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        border: `2px solid ${s.color}33`,
                        background: `${s.color}0a`,
                      }}
                    />
                    <span
                      className="absolute inset-0 flex items-center justify-center text-[14px] font-bold"
                      style={{ fontFamily: T.fontMono, color: s.color }}
                    >
                      {s.step}
                    </span>
                  </div>
                  <h3 className="text-[18px] font-bold tracking-tight mb-3" style={{ fontFamily: T.fontDisplay, color: T.fog92 }}>
                    {s.title}
                  </h3>
                  <p className="text-[13px] leading-[1.7] max-w-[280px] mx-auto" style={{ fontFamily: T.fontBody, color: T.fog58 }}>
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────────────
             PRICING
             ──────────────────────────────────────────────────────────────── */}
        <section id="pricing" className="px-6 py-28">
          <div className="text-center mb-16" data-reveal>
            <span className="text-[11px] font-medium tracking-[0.18em] uppercase" style={{ fontFamily: T.fontBody, color: T.primary }}>
              Pricing
            </span>
            <h2 className="mt-4 text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight" style={{ fontFamily: T.fontDisplay, color: T.fog92 }}>
              Simple. Transparent. No surprise bills.
            </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-6 max-w-3xl mx-auto" data-reveal data-reveal-stagger="">
            {[
              {
                tier: 'Starter',
                price: 'Free',
                sub: 'For solo founders',
                features: ['5 product briefs / month', 'Whitespace analysis', 'Roadmap drafts', 'Community support', 'Basic exports'],
                primary: false,
              },
              {
                tier: 'Pro',
                price: '$49',
                sub: 'per month',
                features: ['Unlimited briefs', 'Full 6-stage pipeline', 'Prototype generation', 'GTM planning', 'Live feedback loop', 'Priority support'],
                primary: true,
              },
              {
                tier: 'Enterprise',
                price: 'Custom',
                sub: 'for teams of 10+',
                features: ['Everything in Pro', 'Custom integrations', 'SSO & RBAC', 'Dedicated CSM', 'SLA guarantees', 'On-prem option'],
                primary: false,
              },
            ].map(plan => (
              <div
                key={plan.tier}
                className="flex-1 rounded-[28px] p-8 flex flex-col glass-lift border"
                style={{
                  borderColor: plan.primary ? `${T.primary}55` : 'rgba(255, 255, 255, 0.08)',
                  background: 'rgba(3, 5, 8, 0.45)',
                  backdropFilter: 'blur(30px) saturate(180%)',
                  boxShadow: plan.primary
                    ? `inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.15), inset 0 -30px 100px -40px ${T.primary}22, 0 24px 60px rgba(0, 0, 0, 0.65)`
                    : 'inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.12), 0 24px 60px rgba(0, 0, 0, 0.65)',
                }}
              >
                {plan.primary && (
                  <span
                    className="text-[10px] font-semibold tracking-[0.16em] uppercase px-3 py-1 rounded-full self-start mb-4"
                    style={{ background: `${T.primary}18`, color: T.primary, border: `1px solid ${T.primary}22`, fontFamily: T.fontBody }}
                  >
                    Most Popular
                  </span>
                )}
                <span className="text-[12px] tracking-[0.14em] uppercase" style={{ fontFamily: T.fontBody, color: T.fog38 }}>
                  {plan.tier}
                </span>
                <span className="text-[40px] font-bold mt-2 leading-none" style={{ fontFamily: T.fontDisplay, color: T.fog92 }}>
                  {plan.price}
                </span>
                <span className="text-[13px] mt-1 mb-8" style={{ color: T.fog38, fontFamily: T.fontBody }}>{plan.sub}</span>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="text-[13px] flex items-center gap-2.5" style={{ color: T.fog58, fontFamily: T.fontBody }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: plan.primary ? T.primary : T.fog25 }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="/signup"
                  className="w-full py-3 text-center font-semibold text-[13px] rounded-xl transition-all block"
                  style={{
                    fontFamily: T.fontBody,
                    background: plan.primary ? T.primary : 'rgba(255,255,255,0.06)',
                    color: plan.primary ? T.bg : T.fog58,
                    boxShadow: plan.primary ? `0 0 20px ${T.primary}22` : 'none',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = plan.primary ? T.primaryMuted : 'rgba(255,255,255,0.10)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = plan.primary ? T.primary : 'rgba(255,255,255,0.06)'; }}
                >
                  {plan.primary ? 'Start free trial' : plan.tier === 'Enterprise' ? 'Contact sales' : 'Get started'}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────────────
             CTA BANNER — final conversion
             ──────────────────────────────────────────────────────────────── */}
        <section className="px-6 py-28" data-reveal>
          <div
            className="max-w-4xl mx-auto rounded-[32px] p-12 md:p-16 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, rgba(79,184,199,0.12) 0%, rgba(108,97,201,0.08) 50%, rgba(12,15,20,0.9) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(32px)',
            }}
          >
            {/* Decorative orbit */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
              <div className="orbit-ring w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full border border-dashed opacity-[0.04]" style={{ borderColor: T.primary }} />
            </div>

            <h2 className="text-[clamp(1.6rem,4vw,2.8rem)] font-bold tracking-tight mb-4 relative" style={{ fontFamily: T.fontDisplay, color: T.fog92 }}>
              Ready to ship faster?
            </h2>
            <p className="text-[15px] mb-10 max-w-md mx-auto relative" style={{ fontFamily: T.fontBody, color: T.fog58 }}>
              Start with a free brief. See what Aura discovers about your market before you commit.
            </p>
            <a
              href="/signup"
              className="glow-cta inline-block px-10 py-4 font-semibold text-[15px] rounded-2xl transition-all relative"
              style={{ fontFamily: T.fontBody, background: T.primary, color: T.bg }}
              onMouseEnter={e => { e.currentTarget.style.background = T.primaryMuted; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.primary; }}
            >
              Get started free →
            </a>
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────────────
             FOOTER
             ──────────────────────────────────────────────────────────────── */}
        <footer className="px-6 py-12" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full" style={{ background: T.primary }} />
                <span className="font-bold text-[14px]" style={{ fontFamily: T.fontDisplay, color: T.fog92 }}>
                  Aura Agent
                </span>
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                {['Pipeline', 'Features', 'Industry', 'Pricing', 'Privacy', 'Terms'].map(link => (
                  <a
                    key={link}
                    href={`#${link.toLowerCase()}`}
                    className="text-[13px] transition-colors duration-200"
                    style={{ fontFamily: T.fontBody, color: T.fog38 }}
                    onMouseEnter={e => { e.currentTarget.style.color = T.fog58; }}
                    onMouseLeave={e => { e.currentTarget.style.color = T.fog38; }}
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[12px]" style={{ color: T.fog25, fontFamily: T.fontBody }}>
                © 2025 Aura Agent. All rights reserved.
              </p>
              <p className="text-[11px]" style={{ color: T.fog12, fontFamily: T.fontMono }}>
                v2.6 · Mumbai, India
              </p>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
