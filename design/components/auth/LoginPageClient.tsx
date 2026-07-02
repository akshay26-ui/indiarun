'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';
import SpotlightCard from './SpotlightCard';

const Lightfall = dynamic(() => import('../landing/Lightfall'), { ssr: false });

/* ─── Tokens tuned to match the Lightfall indigo-violet palette ─── */
const T = {
  bg:          '#020410',
  primary:     '#4F46E5',
  violet:      '#7C3AED',
  indigo:      '#818CF8',
  violetLight: '#C4B5FD',
  text:        'rgba(255,255,255,0.95)',
  textMuted:   'rgba(220,225,255,0.70)',
  textDim:     'rgba(200,210,255,0.40)',
  border:      'rgba(255, 255, 255, 0.08)', // Thin bevel border
  borderFocus: 'rgba(129, 140, 248, 0.50)',
  inputBg:     'rgba(255, 255, 255, 0.03)',
  cardBg:      'rgba(10, 12, 30, 0.40)', // Rich dark liquid glass
  fontDisplay: "'Cabinet Grotesk','Plus Jakarta Sans',system-ui,sans-serif",
  fontBody:    "'Hanken Grotesk','Inter',system-ui,sans-serif",
  fontMono:    "'JetBrains Mono','SF Mono',monospace",
} as const;

/* ─── Eye icon ── */
const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ─── Styled input ── */
function AuthInput({
  id, label, type, value, onChange, placeholder, autoComplete, error, rightEl,
}: {
  id: string; label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  autoComplete?: string; error?: boolean; rightEl?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ width: '100%' }}>
      <label
        htmlFor={id}
        style={{
          display: 'block', marginBottom: 9,
          fontFamily: T.fontBody, fontSize: 11,
          fontWeight: 600, letterSpacing: '0.09em',
          textTransform: 'uppercase', color: T.textMuted,
          textAlign: 'center'
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          id={id} type={type} value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          style={{
            width: '100%',
            padding: rightEl ? '13px 44px 13px 14px' : '13px 14px',
            borderRadius: 12,
            border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : focused ? T.borderFocus : T.border}`,
            background: focused ? 'rgba(255,255,255,0.06)' : T.inputBg,
            color: T.text,
            fontFamily: T.fontBody,
            fontSize: 14,
            outline: 'none',
            textAlign: 'center',
            transition: 'border-color 180ms ease, box-shadow 180ms ease, background 180ms ease',
            boxShadow: focused ? `0 0 0 3px ${error ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)'}` : 'none',
            boxSizing: 'border-box',
          }}
        />
        {rightEl && (
          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
            {rightEl}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LOGIN PAGE CLIENT
   ═══════════════════════════════════════════════ */
export default function LoginPageClient() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: T.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes lf-appear {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes lf-shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-5px); }
          40%     { transform: translateX(5px); }
          60%     { transform: translateX(-3px); }
          80%     { transform: translateX(3px); }
        }
        .lf-card-appear { animation: lf-appear 700ms cubic-bezier(0.16,1,0.3,1) both; }
        .lf-shake        { animation: lf-shake 380ms ease; }
        input::placeholder { color: rgba(200,210,255,0.25) !important; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #040618 inset !important;
          -webkit-text-fill-color: rgba(255,255,255,0.95) !important;
        }
      `}</style>

      {/* Lightfall background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Lightfall
          colors={['#818CF8', '#4F46E5', '#9B51E0', '#C4B5FD', '#A6C8FF']}
          backgroundColor="#080721"
          speed={0.5}
          streakCount={3}
          streakWidth={1.2}
          streakLength={1.4}
          glow={1.4}
          density={0.12}
          twinkle={0.4}
          zoom={2.5}
          backgroundGlow={0.65}
          opacity={1}
          mouseInteraction={true}
          mouseStrength={0.45}
          mouseRadius={0.65}
          mouseDampening={0.16}
        />
      </div>

      {/* Overlay */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'radial-gradient(circle at center, rgba(2,4,16,0.25) 0%, rgba(2,4,16,0.6) 100%)',
        }}
      />

      {/* Spotlight Card Wrapper */}
      <SpotlightCard
        className={`${mounted ? 'lf-card-appear' : ''}`}
        spotlightColor="rgba(255, 255, 255, 0.12)"
        style={{
          position: 'relative', zIndex: 2,
          width: '100%', maxWidth: 430,
          margin: '0 16px',
          background: T.cardBg,
          border: `1px solid ${T.border}`,
          borderRadius: 24,
          backdropFilter: 'blur(50px) saturate(240%)',
          WebkitBackdropFilter: 'blur(50px) saturate(240%)',
          padding: '48px 36px 40px',
          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.18), inset 0 -1px 0 0 rgba(0, 0, 0, 0.4), 0 24px 48px -12px rgba(0, 0, 0, 0.65)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36, justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3.5, flexShrink: 0 }}>
              <div style={{ width: 5, height: 2, borderRadius: 1, background: T.indigo, opacity: 0.5, boxShadow: `0 0 2px ${T.indigo}` }} />
              <div style={{ width: 10, height: 2, borderRadius: 1, background: T.indigo, opacity: 0.8, boxShadow: `0 0 4px ${T.indigo}` }} />
              <div style={{ width: 16, height: 2, borderRadius: 1, background: T.indigo, boxShadow: `0 0 6px ${T.indigo}` }} />
            </div>
            <span style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>
              Aura Agent
            </span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: T.fontDisplay,
              fontSize: 26, fontWeight: 800,
              letterSpacing: '-0.025em',
              color: T.text,
              marginBottom: 10,
              textAlign: 'center'
            }}
          >
            Welcome back
          </h1>
          <p style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textMuted, marginBottom: 36, textAlign: 'center', lineHeight: 1.5 }}>
            Sign in to your workspace
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22, width: '100%', alignItems: 'center' }}>

            <AuthInput
              id="email" label="Email" type="email"
              value={email} onChange={setEmail}
              placeholder="you@company.com"
              autoComplete="email" error={!!error}
            />

            <AuthInput
              id="password" label="Password"
              type={showPwd ? 'text' : 'password'}
              value={password} onChange={setPassword}
              placeholder="••••••••"
              autoComplete="current-password" error={!!error}
              rightEl={
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: T.textDim, display: 'flex' }}
                >
                  <EyeIcon open={showPwd} />
                </button>
              }
            />

            {/* Forgot password */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: -4 }}>
              <button
                type="button"
                title="Coming soon"
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  fontFamily: T.fontBody, fontSize: 12,
                  color: T.indigo, opacity: 0.8,
                  fontWeight: 500
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div
                className="lf-shake"
                style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', justifyContent: 'center'
                }}
              >
                <span style={{ fontSize: 13 }}>⚠</span>
                <span style={{ fontFamily: T.fontBody, fontSize: 12, color: 'rgba(252,165,165,0.95)' }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: 6,
                padding: '14px 0',
                borderRadius: 13,
                border: 'none',
                background: loading
                  ? 'rgba(79,70,229,0.45)'
                  : `linear-gradient(135deg, ${T.primary} 0%, ${T.violet} 100%)`,
                color: 'rgba(255,255,255,0.96)',
                fontFamily: T.fontBody,
                fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 200ms ease, transform 120ms ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Signing in…
                </>
              ) : 'Sign in →'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '6px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontFamily: T.fontMono, fontSize: 10, letterSpacing: '0.1em', color: T.textDim }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Switch to sign up */}
            <p style={{ textAlign: 'center', fontFamily: T.fontBody, fontSize: 13, color: T.textMuted, margin: 0 }}>
              No account?{' '}
              <Link
                href="/signup"
                style={{ color: T.indigo, fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = T.violetLight; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = T.indigo; }}
              >
                Create one free
              </Link>
            </p>

          </form>
        </div>
      </SpotlightCard>
    </div>
  );
}
