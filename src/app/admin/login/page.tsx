'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useMarketplace } from '@/context/MarketplaceContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { refreshUser, showToast } = useMarketplace();

  const [email, setEmail] = useState('admin@cafinteriors.ng');
  const [password, setPassword] = useState('CAFAdmin2026!');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      await refreshUser();
      showToast('Authenticated as CAF Interiors Administrator.');
      router.push('/admin');
    } catch {
      setErrorMsg('Network error during administrator sign in.');
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="auth-page-main">
        <div className="auth-card-container">
          <div className="auth-luxury-card">
            <span className="eyebrow">Executive Governance</span>
            <h1 className="auth-title">CAF Interiors Admin Sign In</h1>
            <p className="auth-sub">
              Restricted access for CAF Interior and Exterior Service administrators, finance
              officers, and project architects.
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
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Master Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Authenticating...' : 'Enter Executive Admin Command Center'}
              </button>
            </form>

            <p className="auth-switch-copy">
              <Link href="/admin" className="gold-text">
                Proceed Directly to Admin Command Center &rarr;
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

