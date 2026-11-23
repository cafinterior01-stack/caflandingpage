'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BrandLogo from '@/components/BrandLogo';
import { useMarketplace } from '@/context/MarketplaceContext';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const { refreshUser, showToast } = useMarketplace();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(
    urlError === 'access_denied'
      ? 'Access Denied: Only authorised CAF Interiors administrators may access the Executive Command Center.'
      : ''
  );

  const handleAdminLogin = async (e: React.FormEvent) => {
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
        setErrorMsg(data.error || 'Authentication failed.');
        setLoading(false);
        return;
      }

      if (!data.user || data.user.role !== 'ADMIN') {
        await fetch('/api/auth/logout', { method: 'POST' });
        await refreshUser();
        setErrorMsg(
          'Access Denied: Your account does not have CAF Interiors administrator authorisation.'
        );
        setLoading(false);
        return;
      }

      await refreshUser();
      showToast('Authenticated as CAF Interiors Administrator.');
      router.push('/admin');
    } catch {
      setErrorMsg('Network error during administrator sign in.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-card-container">
      <div className="auth-luxury-card">
        <div className="auth-logo-header">
          <BrandLogo variant="auth" />
        </div>
        <span className="eyebrow">Restricted Executive Access</span>
        <h1 className="auth-title">Administrator Sign In</h1>
        <p className="auth-sub">
          Authorised access only. Enter your CAF Interiors administrator credentials to continue.
        </p>

        {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}

        <form onSubmit={handleAdminLogin}>
          <div className="form-group">
            <label className="form-label">Administrator Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter administrator email"
              autoComplete="username"
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
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Verifying Authorisation...' : 'Sign In to Administrator Portal'}
          </button>
        </form>

        <p className="auth-switch-copy">
          <Link href="/" className="gold-text">
            &larr; Return to CAF Interiors Public Storefront
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <>
      <Navbar />
      <main className="auth-page-main">
        <Suspense fallback={<div style={{ padding: '6rem 2rem', textAlign: 'center' }}>Loading...</div>}>
          <AdminLoginContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
