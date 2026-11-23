'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useMarketplace } from '@/context/MarketplaceContext';
import { formatNaira } from '@/lib/format';

const NIGERIAN_STATE_DELIVERY_FEES: Record<string, number> = {
  Lagos: 45000,
  'Abuja (FCT)': 75000,
  Rivers: 70000,
  Ogun: 50000,
  Oyo: 55000,
  Delta: 65000,
  Edo: 65000,
  Enugu: 70000,
  Anambra: 70000,
  'Akwa Ibom': 75000,
  Kano: 85000,
  Kaduna: 80000,
  'Other Nigerian State': 85000,
};

function CheckoutFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPromo = searchParams.get('promo') || '';

  const {
    user,
    cart,
    clearCart,
    cartTotalFullValue,
    cartPayableToday,
    cartRemainingBalance,
    showToast,
  } = useMarketplace();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [city, setCity] = useState('Lekki Phase 1');
  const [state, setState] = useState('Lagos');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER'>('PAYSTACK');
  const [paymentReference, setPaymentReference] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoCode] = useState(initialPromo);

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || user.name);
      setCustomerEmail((prev) => prev || user.email);
      setCustomerPhone((prev) => prev || user.phone);
      setDeliveryAddress((prev) => prev || user.address || '');
      setCity((prev) => prev || user.city || 'Lekki');
      setState((prev) => prev || user.state || 'Lagos');
    }
  }, [user]);

  useEffect(() => {
    if (initialPromo && cartTotalFullValue > 0) {
      fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: initialPromo, subtotal: cartTotalFullValue }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.discountAmount) setDiscountAmount(d.discountAmount);
        })
        .catch(() => {});
    }
  }, [initialPromo, cartTotalFullValue]);

  const deliveryFee = NIGERIAN_STATE_DELIVERY_FEES[state] ?? 75000;
  const totalOrderValue = Math.max(0, cartTotalFullValue + deliveryFee - discountAmount);
  const payableToday = Math.max(0, cartPayableToday + deliveryFee - discountAmount);
  const hasPaySmallSmall = cart.some((item) => item.paymentPlan === 'PAY_SMALL_SMALL');

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Your shopping bag is empty.');
      return;
    }
    if (!acceptedTerms) {
      showToast('Please accept the CAF Interiors order & instalment terms.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          deliveryAddress,
          city,
          state,
          deliveryNotes,
          items: cart,
          deliveryFee,
          discountAmount,
          promoCode: promoCode || undefined,
          paymentMethod,
          paymentReference: paymentReference.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Could not complete order.');
        setSubmitting(false);
        return;
      }

      clearCart();
      showToast(`Order ${data.order.orderNumber} submitted!`);
      router.push(`/checkout/success?order=${encodeURIComponent(data.order.orderNumber)}`);
    } catch {
      showToast('Network error while placing order.');
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <span className="eyebrow">CAF Interiors Checkout</span>
        <h1 className="section-heading">Your Shopping Bag Is Empty</h1>
        <p style={{ marginBottom: '2rem', color: '#57534e' }}>
          Add luxury furniture pieces to your bag before proceeding to checkout.
        </p>
        <Link href="/shop" className="btn-gold">
          Browse Furniture Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="eyebrow left-align">Secure Luxury Checkout</div>
      <h1 className="section-heading" style={{ marginBottom: '2rem' }}>
        Complete Your <span className="gold-accent">CAF Interiors Order</span>
      </h1>

      {!user && (
        <div className="checkout-login-prompt">
          <span>Already have a CAF Interiors account?</span>
          <Link href="/account/login?redirect=/checkout" className="gold-text">
            Sign in for one-click profile autofill &amp; dashboard tracking &rarr;
          </Link>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="checkout-grid">
        {/* Left Column: Customer, Delivery & Payment Method */}
        <div className="checkout-main-col">
          {/* 1. Customer & Delivery Details */}
          <div className="checkout-panel">
            <h3>1. Client &amp; White-Glove Delivery Information</h3>
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label dark-label">Full Name *</label>
                <input
                  type="text"
                  className="checkout-input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Chief Adebayo Ogunlesi"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label dark-label">Email Address (For Receipt &amp; Schedule) *</label>
                <input
                  type="email"
                  className="checkout-input"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="client@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label dark-label">Phone / WhatsApp Number *</label>
                <input
                  type="tel"
                  className="checkout-input"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+234 803 000 0000"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label dark-label">Delivery State (Nigeria) *</label>
                <select
                  className="checkout-input"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  {Object.keys(NIGERIAN_STATE_DELIVERY_FEES).map((st) => (
                    <option key={st} value={st}>
                      {st} — Delivery &amp; Assembly: {formatNaira(NIGERIAN_STATE_DELIVERY_FEES[st])}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label dark-label">City / District *</label>
                <input
                  type="text"
                  className="checkout-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lekki Phase 1, Ikoyi, Maitama, GRA"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label dark-label">Street Address / Estate *</label>
                <input
                  type="text"
                  className="checkout-input"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="House number, street name, and estate landmark"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label dark-label">Delivery &amp; Installation Notes (Optional)</label>
              <textarea
                className="checkout-input"
                rows={2}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Staircase/elevator access notes, preferred delivery day, or security gate instructions..."
              />
            </div>
          </div>

          {/* 2. Nigerian Payment Gateway Selection */}
          <div className="checkout-panel">
            <h3>2. Select Nigerian Payment Gateway</h3>
            <p className="checkout-subnote">
              All transactions are verified through backend webhooks or administrator confirmation
              before payment status is marked completed.
            </p>

            <div className="gateway-cards-grid">
              <label className={`gateway-option-card ${paymentMethod === 'PAYSTACK' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="gateway"
                  checked={paymentMethod === 'PAYSTACK'}
                  onChange={() => setPaymentMethod('PAYSTACK')}
                />
                <div className="gateway-title">Paystack Checkout</div>
                <div className="gateway-desc">
                  Pay securely with Nigerian Debit Cards, Instant Bank Transfer, or USSD.
                </div>
              </label>

              <label className={`gateway-option-card ${paymentMethod === 'FLUTTERWAVE' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="gateway"
                  checked={paymentMethod === 'FLUTTERWAVE'}
                  onChange={() => setPaymentMethod('FLUTTERWAVE')}
                />
                <div className="gateway-title">Flutterwave Checkout</div>
                <div className="gateway-desc">
                  Supports Naira Cards, Bank Transfers, and Corporate Payment Channels.
                </div>
              </label>

              <label className={`gateway-option-card ${paymentMethod === 'BANK_TRANSFER' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="gateway"
                  checked={paymentMethod === 'BANK_TRANSFER'}
                  onChange={() => setPaymentMethod('BANK_TRANSFER')}
                />
                <div className="gateway-title">Direct Corporate Bank Transfer</div>
                <div className="gateway-desc">
                  Transfer directly to CAF Interior and Exterior Service and submit your session ID
                  for admin verification.
                </div>
              </label>
            </div>

            {paymentMethod === 'BANK_TRANSFER' && (
              <div className="bank-transfer-instructions">
                <h4>Official Corporate Bank Account Details</h4>
                <p><strong>Account Name:</strong> CAF Interior and Exterior Service</p>
                <p><strong>Amount to Transfer Today:</strong> <span className="gold-text">{formatNaira(payableToday)}</span></p>
                <p><strong>Narration:</strong> Your Full Name + Phone Number</p>
                <div className="form-group" style={{ marginTop: '0.85rem', marginBottom: 0 }}>
                  <label className="form-label">Transfer Reference / NIP Session ID (Optional if paying after invoice)</label>
                  <input
                    type="text"
                    className="checkout-input"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Enter 12-30 digit bank transfer reference or leave blank to pay on invoice"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Pay Small Small Governance Notice */}
          {hasPaySmallSmall && (
            <div className="checkout-pss-notice">
              <h4>Pay Small Small Instalment Agreement &amp; Verification Policy</h4>
              <ul>
                <li>
                  • Your initial deposit today (incl. white-glove delivery) is{' '}
                  <strong>{formatNaira(payableToday)}</strong>.
                </li>
                <li>
                  • Your remaining balance of <strong>{formatNaira(cartRemainingBalance)}</strong>{' '}
                  will be scheduled according to your selected duration.
                </li>
                <li>
                  • Instalment applications are reviewed and approved by CAF Interiors
                  administration. Payments are credited upon verified gateway or bank confirmation.
                </li>
              </ul>
            </div>
          )}

          <label className="checkout-terms-check">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <span>
              I agree to the CAF Interiors Terms of Sale, Custom Production Lead Times, and Pay
              Small Small Verification Conditions.
            </span>
          </label>
        </div>

        {/* Right Column: Order Summary & Submit */}
        <aside className="checkout-sidebar">
          <div className="cart-summary-card">
            <h3>Your Order Summary ({cart.length})</h3>

            <div className="checkout-mini-items">
              {cart.map((item, i) => (
                <div key={`${item.productId}-${i}`} className="checkout-mini-item">
                  <img src={item.image} alt={item.name} />
                  <div>
                    <div className="mini-name">{item.name}</div>
                    <div className="mini-meta">
                      Qty: {item.quantity} • {item.selectedSize}
                    </div>
                    <div className="mini-plan">
                      {item.paymentPlan === 'PAY_SMALL_SMALL'
                        ? `Pay Small Small (${item.instalmentMonths} mos)`
                        : 'Full Payment'}
                    </div>
                  </div>
                  <strong>{formatNaira(item.unitPrice * item.quantity)}</strong>
                </div>
              ))}
            </div>

            <div className="summary-rows">
              <div className="summary-row">
                <span>Items Full Value</span>
                <strong>{formatNaira(cartTotalFullValue)}</strong>
              </div>
              <div className="summary-row">
                <span>White-Glove Delivery ({state})</span>
                <strong>{formatNaira(deliveryFee)}</strong>
              </div>
              {discountAmount > 0 && (
                <div className="summary-row discount">
                  <span>Privilege Discount</span>
                  <strong>−{formatNaira(discountAmount)}</strong>
                </div>
              )}
              <div className="summary-row">
                <span>Total Order Value</span>
                <strong>{formatNaira(totalOrderValue)}</strong>
              </div>
              <div className="summary-row payable-today">
                <span>Amount Payable Today</span>
                <strong>{formatNaira(payableToday)}</strong>
              </div>
              {cartRemainingBalance > 0 && (
                <div className="summary-row remaining-balance">
                  <span>Remaining Instalment Balance</span>
                  <strong>{formatNaira(cartRemainingBalance)}</strong>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn-gold"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={submitting}
            >
              {submitting
                ? 'Processing Your Luxury Order...'
                : `Confirm Order (${formatNaira(payableToday)} Due Today)`}
            </button>

            <Link
              href="/cart"
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: '0.85rem',
                fontSize: '0.78rem',
                color: '#d4af37',
              }}
            >
              &larr; Return to Shopping Bag
            </Link>
          </div>
        </aside>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <main className="checkout-page-main">
        <Suspense fallback={<div style={{ padding: '6rem 2rem', textAlign: 'center' }}>Loading Secure Checkout...</div>}>
          <CheckoutFormContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

