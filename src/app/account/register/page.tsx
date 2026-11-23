'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useMarketplace } from '@/context/MarketplaceContext';

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser, showToast } = useMarketplace();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Lagos');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, address, city, state }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not create account.');
        setLoading(false);
        return;
      }
      await refreshUser();
      showToast('Account created! Welcome to CAF Interiors.');
      router.push('/account');
    } catch {
      setErrorMsg('Network error during registration.');
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="auth-page-main">
        <div className="auth-card-container">
          <div className="auth-luxury-card" style={{ maxWidth: '620px' }}>
            <span className="eyebrow">CAF Interior and Exterior Service</span>
            <h1 className="auth-title">Create Your Client Account</h1>
            <p className="auth-sub">
              Register to apply for Pay Small Small plans, track furniture deliveries, and monitor
              your interior design projects.
            </p>

            {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}

            <form onSubmit={handleRegister}>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Chief / Mrs. Full Name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone / WhatsApp Number *</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 803 000 0000"
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
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
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">City / District</label>
                  <input
                    type="text"
                    className="form-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lekki Phase 1, Maitama"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State (Nigeria)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Lagos"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Primary Delivery Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House number, street, and estate"
                />
              </div>

              <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Luxury Account'}
              </button>
            </form>

            <p className="auth-switch-copy">
              Already registered?{' '}
              <Link href="/account/login" className="gold-text">
                Sign In Here &rarr;
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

