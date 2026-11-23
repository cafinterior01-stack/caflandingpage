'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BrandLogo from '@/components/BrandLogo';
import { useMarketplace } from '@/context/MarketplaceContext';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';
  const { refreshUser, showToast } = useMarketplace();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid credentials.');
        setLoading(false);
        return;
      }
      await refreshUser();
      showToast(`Welcome back, ${data.user.name}!`);
      router.push(redirectUrl);
    } catch {
      setErrorMsg('Unable to sign in right now.');
      setLoading(false);
    }
  };

  const fillDemoClient = () => {
    setEmail('client@cafinteriors.ng');
    setPassword('Luxury2026!');
  };

  const fillDemoAdmin = () => {
    setEmail('admin@cafinteriors.ng');
    setPassword('CAFAdmin2026!');
  };

  return (
    <div className="auth-card-container">
      <div className="auth-luxury-card">
        <div className="auth-logo-header">
          <BrandLogo variant="auth" />
        </div>
        <span className="eyebrow">CAF Interior and Exterior Service</span>
        <h1 className="auth-title">Client Account Sign In</h1>
        <p className="auth-sub">
          Access your orders, Pay Small Small schedules, custom furniture quotations, and interior
          project milestones.
        </p>

        {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In to My Account'}
          </button>
        </form>

        <p className="auth-switch-copy">
          New to CAF Interiors?{' '}
          <Link href="/account/register" className="gold-text">
            Create a Luxury Client Account &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="auth-page-main">
        <Suspense fallback={<div style={{ padding: '6rem 2rem', textAlign: 'center' }}>Loading Sign In...</div>}>
          <LoginContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

