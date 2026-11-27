'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { formatNaira } from '@/lib/format';
import { OrderRecord } from '@/lib/db-store';

function HostedGatewayCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const provider = (searchParams.get('provider') || 'PAYSTACK').toUpperCase();
  const orderNumber = searchParams.get('order') || '';
  const reference = searchParams.get('reference') || '';
  const amountParam = Number(searchParams.get('amount') || 0);

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<'CARD' | 'TRANSFER' | 'USSD'>('CARD');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) {
      setLoading(false);
      return;
    }
    fetch(`/api/orders/${encodeURIComponent(orderNumber)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.order) setOrder(data.order);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderNumber]);

  const payableAmount = amountParam > 0 ? amountParam : order?.payableTodayAmount || 0;

  const handleCompleteTestPayment = async () => {
    setProcessingAction('SUCCESS');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_GATEWAY_CALLBACK',
          provider,
          orderNumber,
          reference,
          amount: payableAmount,
          currency: 'NGN',
          gatewayStatus: 'SUCCESS',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(
          `/checkout/success?order=${encodeURIComponent(
            orderNumber
          )}&payment=success&provider=${encodeURIComponent(
            provider
          )}&reference=${encodeURIComponent(reference)}`
        );
      } else {
        setErrorMsg(data.error || 'Payment verification failed.');
        setProcessingAction(null);
      }
    } catch {
      setErrorMsg('Network error verifying transaction.');
      setProcessingAction(null);
    }
  };

  const handleFailOrCancel = async (outcome: 'FAILED' | 'CANCELLED') => {
    setProcessingAction(outcome);
    setErrorMsg(null);
    try {
      await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_GATEWAY_CALLBACK',
          provider,
          orderNumber,
          reference,
          amount: payableAmount,
          currency: 'NGN',
          gatewayStatus: outcome,
        }),
      });
    } catch {
      // ignore
    }
    router.push(
      `/checkout/success?order=${encodeURIComponent(
        orderNumber
      )}&payment=${outcome.toLowerCase()}&provider=${encodeURIComponent(
        provider
      )}&reference=${encodeURIComponent(reference)}`
    );
  };

  const isPaystack = provider === 'PAYSTACK';
  const accentColor = isPaystack ? '#09A5DB' : '#F5A623';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 20%, #171717 0%, #070707 80%)',
        color: '#ffffff',
        padding: '3rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          background: '#111111',
          border: `1px solid ${accentColor}`,
          boxShadow: '0 28px 80px rgba(0,0,0,0.85)',
          padding: '2.25rem',
        }}
      >
        {/* Top Gateway Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            paddingBottom: '1.25rem',
            marginBottom: '1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <BrandLogo variant="auth" href={null} />
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '0.28rem 0.7rem',
                background: accentColor,
                color: '#050505',
                fontWeight: 800,
                fontSize: '0.7rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              {provider} Hosted Checkout
            </span>
            <div style={{ fontSize: '0.75rem', color: '#b8b3aa', marginTop: '0.35rem' }}>
              Ref: <strong>{reference || 'N/A'}</strong>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2.5rem 0', textAlign: 'center', color: '#b8b3aa' }}>
            Initializing secure {provider} payment session...
          </div>
        ) : !order ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>Order Session Not Found</h2>
            <Link href="/checkout" className="btn-gold">
              Return to Checkout
            </Link>
          </div>
        ) : (
          <>
            {/* Order & Amount Summary */}
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(212,175,55,0.35)',
                padding: '1.15rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: '#b8b3aa' }}>{order.customerEmail}</div>
                <strong style={{ fontSize: '0.95rem', color: '#f8f6f2' }}>
                  Order #{order.orderNumber} ({order.customerName})
                </strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <small style={{ display: 'block', fontSize: '0.68rem', color: '#d4af37', textTransform: 'uppercase' }}>
                  Pay Now (NGN)
                </small>
                <strong style={{ fontSize: '1.45rem', color: '#e6c762' }}>
                  {formatNaira(payableAmount)}
                </strong>
              </div>
            </div>

            {/* Channel Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              {(['CARD', 'TRANSFER', 'USSD'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setSelectedChannel(ch)}
                  style={{
                    padding: '0.65rem',
                    background: selectedChannel === ch ? accentColor : 'rgba(255,255,255,0.05)',
                    color: selectedChannel === ch ? '#050505' : '#ffffff',
                    border: '1px solid rgba(255,255,255,0.18)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  {ch === 'CARD' ? 'Debit Card' : ch === 'TRANSFER' ? 'Bank Transfer' : 'USSD'}
                </button>
              ))}
            </div>

            {/* Simulated Test Payment Method Info */}
            <div
              style={{
                background: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '1.15rem',
                marginBottom: '1.35rem',
                fontSize: '0.84rem',
                color: '#d6d3cd',
              }}
            >
              {selectedChannel === 'CARD' && (
                <div>
                  <div style={{ color: '#e6c762', fontWeight: 700, marginBottom: '0.35rem' }}>
                    {provider} Official Test Card Ready
                  </div>
                  <div>Card Number: <strong>4084 0840 8408 4084</strong></div>
                  <div>Expiry: <strong>12/30</strong> • CVV: <strong>408</strong> • Currency: <strong>NGN</strong></div>
                </div>
              )}
              {selectedChannel === 'TRANSFER' && (
                <div>
                  <div style={{ color: '#e6c762', fontWeight: 700, marginBottom: '0.35rem' }}>
                    {provider} Virtual NGN Transfer Account
                  </div>
                  <div>Account: <strong>0123456789 ({provider} Titan / Wema Virtual)</strong></div>
                  <div>Beneficiary: <strong>CAF Interior and Exterior Service</strong></div>
                </div>
              )}
              {selectedChannel === 'USSD' && (
                <div>
                  <div style={{ color: '#e6c762', fontWeight: 700, marginBottom: '0.35rem' }}>
                    {provider} Nigerian Bank USSD
                  </div>
                  <div>Dial <strong>*737*000*{reference.slice(-4)}#</strong> or authorize below.</div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="auth-error-banner" style={{ marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-gold"
                style={{ width: '100%' }}
                disabled={processingAction !== null}
                onClick={handleCompleteTestPayment}
              >
                {processingAction === 'SUCCESS'
                  ? `Verifying ${provider} Transaction Server-Side...`
                  : `Authorize & Pay ${formatNaira(payableAmount)} Now`}
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <button
                  type="button"
                  className="btn-outline-gold"
                  style={{ minHeight: '44px', fontSize: '0.74rem' }}
                  disabled={processingAction !== null}
                  onClick={() => handleFailOrCancel('FAILED')}
                >
                  {processingAction === 'FAILED' ? 'Recording...' : 'Simulate Failed Payment'}
                </button>
                <button
                  type="button"
                  className="btn-outline-gold"
                  style={{ minHeight: '44px', fontSize: '0.74rem' }}
                  disabled={processingAction !== null}
                  onClick={() => handleFailOrCancel('CANCELLED')}
                >
                  {processingAction === 'CANCELLED' ? 'Cancelling...' : 'Cancel & Return'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function HostedGatewayCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '6rem 2rem', textAlign: 'center', background: '#080808', color: '#fff', minHeight: '100vh' }}>
          Loading Hosted Payment Gateway...
        </div>
      }
    >
      <HostedGatewayCheckoutContent />
    </Suspense>
  );
}

