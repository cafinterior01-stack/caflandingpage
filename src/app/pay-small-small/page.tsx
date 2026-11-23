'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { PRODUCTS_CATALOG } from '@/lib/catalog-data';
import { formatNaira, calculatePaySmallSmall, getWhatsAppUrl } from '@/lib/format';
import { useMarketplace } from '@/context/MarketplaceContext';
import {
  OrderRecord,
  InstalmentPaymentRecord,
  OrderNotificationRecord,
  PaySmallSmallConfig,
} from '@/lib/db-store';

export default function PaySmallSmallPage() {
  const router = useRouter();
  const { user, addToCart, showToast } = useMarketplace();

  // 1. Calculator State (Defaults to Luxury 6x6 Upholstered Bed @ ₦1,500,000)
  const [selectedProductId, setSelectedProductId] = useState<string>('prod-1');
  const selectedProduct =
    PRODUCTS_CATALOG.find((p) => p.id === selectedProductId) || PRODUCTS_CATALOG[0];
  const [selectedSizeIdx, setSelectedSizeIdx] = useState<number>(0);
  const [selectedDuration, setSelectedDuration] = useState<number>(4);

  const sizeOption = selectedProduct.sizes[selectedSizeIdx] || selectedProduct.sizes[0];
  const currentFullPrice = selectedProduct.price + (sizeOption?.priceAdjustment || 0);

  const calculation = selectedProduct.paySmallSmall.eligible
    ? calculatePaySmallSmall(
        currentFullPrice,
        selectedDuration,
        selectedProduct.paySmallSmall.depositPercentage,
        sizeOption?.priceAdjustment === 0
          ? selectedProduct.paySmallSmall.fixedDepositAmount
          : undefined
      )
    : null;

  // 2. Live Order & Instalment Tracker State
  const [lookupOrderNumber, setLookupOrderNumber] = useState<string>('CAF-2026-1042');
  const [trackedOrder, setTrackedOrder] = useState<OrderRecord | null>(null);
  const [paymentLedger, setPaymentLedger] = useState<InstalmentPaymentRecord[]>([]);
  const [notifications, setNotifications] = useState<OrderNotificationRecord[]>([]);
  const [pssConfig, setPssConfig] = useState<PaySmallSmallConfig | null>(null);
  const [lookupLoading, setLookupLoading] = useState<boolean>(true);

  // 3. Make an Instalment Payment Form State
  const [payInstalmentNum, setPayInstalmentNum] = useState<number>(1);
  const [payAmount, setPayAmount] = useState<number>(250000);
  const [payMethod, setPayMethod] = useState<'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER'>('PAYSTACK');
  const [payReference, setPayReference] = useState<string>('');
  const [paySubmitting, setPaySubmitting] = useState<boolean>(false);

  // 4. Admin Config Editor State
  const [adminMinPrice, setAdminMinPrice] = useState<number>(450000);
  const [adminDefaultDeposit, setAdminDefaultDeposit] = useState<number>(33.33);
  const [adminDurationsText, setAdminDurationsText] = useState<string>('2, 3, 4, 6');

  const fetchOrderTracking = useCallback(
    async (ordNum: string) => {
      setLookupLoading(true);
      try {
        const res = await fetch(
          `/api/payments/verify?orderNumber=${encodeURIComponent(ordNum)}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (res.ok && data.order) {
          setTrackedOrder(data.order);
          setPaymentLedger(data.payments || []);
          setNotifications(data.notifications || []);
          if (data.config) {
            setPssConfig(data.config);
            setAdminMinPrice(data.config.minQualifyingPrice);
            setAdminDefaultDeposit(data.config.defaultDepositPercentage);
            setAdminDurationsText(data.config.allowedDurationsMonths.join(', '));
          }
          // Default payment amount to next scheduled monthly instalment
          const nextSched = data.order.instalmentSchedule?.find(
            (s: { instalmentNumber: number }) => s.instalmentNumber >= 1
          );
          if (nextSched) {
            setPayInstalmentNum(nextSched.instalmentNumber);
            setPayAmount(nextSched.amount);
          }
        } else {
          showToast(data.error || 'Could not find that order number.');
        }
      } catch {
        // ignore
      } finally {
        setLookupLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchOrderTracking('CAF-2026-1042');
  }, [fetchOrderTracking]);

  const handleApplyForPlan = () => {
    if (!selectedProduct.paySmallSmall.eligible) return;
    addToCart(selectedProduct, {
      quantity: 1,
      selectedSize: sizeOption.label,
      selectedColor: selectedProduct.colors[0]?.name || 'Standard Finish',
      unitPrice: currentFullPrice,
      paymentPlan: 'PAY_SMALL_SMALL',
      instalmentMonths: selectedDuration,
    });
    router.push('/checkout');
  };

  const handleMakeInstalmentPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackedOrder) return;
    setPaySubmitting(true);
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBMIT_INSTALMENT_PAYMENT',
          orderNumber: trackedOrder.orderNumber,
          instalmentNumber: payInstalmentNum,
          label:
            payInstalmentNum === 0
              ? 'Initial Deposit Payment'
              : `Month ${payInstalmentNum} Instalment Payment`,
          amount: payAmount,
          paymentMethod: payMethod,
          paymentReference: payReference,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        setPayReference('');
        await fetchOrderTracking(trackedOrder.orderNumber);
      } else {
        showToast(data.error || 'Payment submission failed.');
      }
    } catch {
      showToast('Network error submitting payment.');
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleVerifyPendingPayment = async (paymentId: string) => {
    if (!trackedOrder) return;
    const res = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'VERIFY_PAYMENT',
        paymentId,
        verifySecret: 'CAF_ADMIN_VERIFY',
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message);
      await fetchOrderTracking(trackedOrder.orderNumber);
    } else {
      showToast(data.error || 'Verification failed.');
    }
  };

  const handleAdminConfigSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const durations = adminDurationsText
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => n > 0);
    const res = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_PSS_CONFIG',
        minQualifyingPrice: adminMinPrice,
        defaultDepositPercentage: adminDefaultDeposit,
        allowedDurationsMonths: durations.length > 0 ? durations : [2, 3, 4, 6],
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setPssConfig(data.config);
      showToast('Administrator Pay Small Small configuration updated.');
    } else {
      showToast(data.error || 'Only Administrators can update global rules.');
    }
  };

  const progressPercentage =
    trackedOrder && trackedOrder.totalOrderValue > 0
      ? Math.min(100, Math.round((trackedOrder.amountPaidVerified / trackedOrder.totalOrderValue) * 100))
      : 0;

  const eligibleProducts = PRODUCTS_CATALOG.filter((p) => p.paySmallSmall.eligible);

  return (
    <>
      <Navbar />

      <main className="pss-page-main">
        {/* Hero Header */}
        <section className="pss-hero-banner">
          <div className="container">
            <div className="hero-badge" style={{ marginBottom: '1.25rem' }}>
              <span className="hero-badge-dot" />
              <span>CAF Interior and Exterior Service • Flexible Luxury Financing</span>
              <span className="hero-badge-dot" />
            </div>
            <h1 className="hero-main-headline" style={{ fontSize: 'clamp(2.3rem, 5vw, 4.2rem)' }}>
              CAF Interiors <span className="gold-accent">Pay Small Small</span>
            </h1>
            <p className="shop-hero-sub" style={{ maxWidth: '760px', fontSize: '1.08rem' }}>
              &ldquo;Your Comfortability Is Our Priority.&rdquo; Select your dream luxury furniture,
              lock in today&apos;s Naira price with an approved initial deposit, and spread your
              remaining balance across 2 to 6 months with transparent milestone tracking.
            </p>
          </div>
        </section>

        {/* ===================================================================
            SECTION 1: INTERACTIVE PAY SMALL SMALL PLANNER (STEPS 1 TO 6)
           =================================================================== */}
        <section className="pss-planner-section">
          <div className="container">
            <div className="section-header-split">
              <div>
                <div className="eyebrow left-align">Step-by-Step Instalment Planner</div>
                <h2 className="section-heading">
                  1. Configure Your <span className="gold-accent">Instalment Schedule</span>
                </h2>
              </div>
              <p className="section-subcopy">
                Test any product in our catalog below—including our flagship{' '}
                <strong>Luxury 6x6 Upholstered Bed (₦1,500,000)</strong> with a{' '}
                <strong>₦500,000 initial deposit</strong> and <strong>₦1,000,000 balance</strong>.
              </p>
            </div>

            <div className="pss-studio-grid">
              {/* Left Column: Product, Size & Duration Selector */}
              <div className="pss-studio-controls">
                <div className="pss-step-card">
                  <span className="pss-step-tag">Step 1 &amp; 2 • Select Product &amp; View Full Price</span>
                  <label htmlFor="studioProduct" className="form-label dark-label">
                    Choose Furniture Piece from Catalog
                  </label>
                  <select
                    id="studioProduct"
                    className="checkout-input"
                    value={selectedProduct.id}
                    onChange={(e) => {
                      const next = PRODUCTS_CATALOG.find((p) => p.id === e.target.value);
                      setSelectedProductId(e.target.value);
                      setSelectedSizeIdx(0);
                      if (
                        next &&
                        next.paySmallSmall.eligible &&
                        !next.paySmallSmall.allowedDurationsMonths.includes(selectedDuration)
                      ) {
                        setSelectedDuration(next.paySmallSmall.allowedDurationsMonths[0]);
                      }
                    }}
                  >
                    {PRODUCTS_CATALOG.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatNaira(p.price)}{' '}
                        {p.paySmallSmall.eligible ? '(✓ Pay Small Small Eligible)' : '(Direct Purchase Only)'}
                      </option>
                    ))}
                  </select>

                  <div className="pss-selected-preview">
                    <img src={selectedProduct.images[0]} alt={selectedProduct.name} />
                    <div>
                      <h4>{selectedProduct.name}</h4>
                      <span className="gold-text" style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                        Full Price: {formatNaira(currentFullPrice)}
                      </span>
                      <p>{selectedProduct.shortDescription}</p>
                    </div>
                  </div>

                  {/* Size selector */}
                  <div style={{ marginTop: '1rem' }}>
                    <label className="form-label dark-label">Select Size Specification</label>
                    <div className="pdp-size-pills">
                      {selectedProduct.sizes.map((sz, idx) => (
                        <button
                          key={sz.label}
                          type="button"
                          className={`pdp-size-pill ${selectedSizeIdx === idx ? 'active' : ''}`}
                          onClick={() => setSelectedSizeIdx(idx)}
                        >
                          <span className="size-name">{sz.label}</span>
                          <span className="size-delta">
                            {formatNaira(selectedProduct.price + sz.priceAdjustment)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Eligibility Check & Duration Selector */}
                {!selectedProduct.paySmallSmall.eligible ? (
                  <div className="pss-ineligible-alert">
                    <h4>Direct Outright Purchase Item</h4>
                    <p>
                      Not every product qualifies for instalment financing.{' '}
                      <strong>{selectedProduct.name}</strong> ({formatNaira(currentFullPrice)}) is below
                      the Pay Small Small threshold of{' '}
                      <strong>{formatNaira(pssConfig?.minQualifyingPrice || 450000)}</strong> and is
                      available for outright purchase.
                    </p>
                    <Link href={`/product/${selectedProduct.slug}`} className="btn-outline-dark" style={{ marginTop: '1rem' }}>
                      Purchase Outright &rarr;
                    </Link>
                  </div>
                ) : (
                  <div className="pss-step-card">
                    <span className="pss-step-tag">Step 3 • Choose Approved Instalment Duration</span>
                    <p style={{ fontSize: '0.86rem', color: '#57534e', marginBottom: '0.85rem' }}>
                      Select your preferred repayment window. Instalments are automatically
                      calculated:
                    </p>
                    <div className="pss-duration-pills">
                      {selectedProduct.paySmallSmall.allowedDurationsMonths.map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={`pss-duration-pill dark-pill ${selectedDuration === m ? 'active' : ''}`}
                          onClick={() => setSelectedDuration(m)}
                        >
                          {m} Months Plan
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Governance & Payment Conditions Box */}
                <div className="pss-conditions-card">
                  <h4>Official Pay Small Small Terms &amp; Conditions</h4>
                  <ul>
                    {(pssConfig?.conditions || [
                      'Not every product qualifies for Pay Small Small.',
                      'Customers are not automatically approved for credit; CAF Interiors reviews and approves every instalment arrangement.',
                      'Payments are never marked completed without verified gateway or administrator confirmation.',
                    ]).map((cond, i) => (
                      <li key={i}>✦ {cond}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: Live Financial Breakdown & Generated Payment Schedule */}
              <div className="pss-studio-output">
                {selectedProduct.paySmallSmall.eligible && calculation ? (
                  <div className="pss-calculator-card">
                    <div className="pss-calc-header">
                      <span className="badge-pss">Steps 4, 5 &amp; 6 • Live Schedule Breakdown</span>
                      <h3>{selectedProduct.name}</h3>
                      <p style={{ fontSize: '0.84rem', color: '#b8b3aa' }}>
                        Size: {sizeOption?.label} ({sizeOption?.dimensions})
                      </p>
                    </div>

                    <div className="pss-calc-summary-grid">
                      <div className="pss-calc-stat">
                        <span className="stat-label">Full Product Price</span>
                        <span className="stat-value">{formatNaira(calculation.fullPrice)}</span>
                      </div>
                      <div className="pss-calc-stat gold-box">
                        <span className="stat-label">
                          Required Initial Deposit ({calculation.depositPercentage}%)
                        </span>
                        <span className="stat-value">{formatNaira(calculation.initialDeposit)}</span>
                      </div>
                      <div className="pss-calc-stat">
                        <span className="stat-label">Remaining Balance</span>
                        <span className="stat-value">{formatNaira(calculation.remainingBalance)}</span>
                      </div>
                      <div className="pss-calc-stat">
                        <span className="stat-label">
                          Monthly Instalment ({calculation.durationMonths} Months)
                        </span>
                        <span className="stat-value gold-text">
                          {formatNaira(calculation.monthlyInstalment)}/mo
                        </span>
                      </div>
                    </div>

                    <div className="pss-schedule-box">
                      <div className="pss-schedule-title">
                        Auto-Calculated Payment Schedule ({calculation.durationMonths} Months)
                      </div>
                      <div className="pss-schedule-rows" style={{ maxHeight: '260px' }}>
                        {calculation.schedule.map((item) => (
                          <div key={item.instalmentNumber} className="pss-schedule-row">
                            <div>
                              <strong>
                                {item.instalmentNumber === 0
                                  ? 'Initial Deposit'
                                  : `Instalment #${item.instalmentNumber}`}
                              </strong>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#b8b3aa' }}>
                                {item.dueDateLabel}
                              </span>
                            </div>
                            <strong className={item.instalmentNumber === 0 ? 'gold-text' : ''}>
                              {formatNaira(item.amount)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: '#b8b3aa', marginBottom: '1.25rem' }}>
                      <strong>Product Policy:</strong> {selectedProduct.paySmallSmall.conditions}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <button type="button" className="btn-gold" onClick={handleApplyForPlan}>
                        Apply for This Pay Small Small Plan ({formatNaira(calculation.initialDeposit)} Deposit)
                      </button>
                      <a
                        href={getWhatsAppUrl(
                          `Hello CAF Interiors, I would like to apply for the ${calculation.durationMonths}-Month Pay Small Small plan on "${selectedProduct.name}" (Full Price: ${formatNaira(
                            calculation.fullPrice
                          )}, Initial Deposit: ${formatNaira(
                            calculation.initialDeposit
                          )}, Remaining Balance: ${formatNaira(calculation.remainingBalance)}).`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline-gold"
                        style={{ textAlign: 'center' }}
                      >
                        Discuss Plan with CAF Finance Concierge on WhatsApp
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="pss-calculator-card">
                    <h3>Select an Eligible Product</h3>
                    <p style={{ color: '#b8b3aa', marginTop: '0.5rem' }}>
                      Please choose a Pay Small Small eligible product on the left to generate an
                      instalment schedule.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 2: MAKE PAYMENTS, TRACK PROGRESS, REMINDERS & ORDER UPDATES
           =================================================================== */}
        <section id="tracker" className="pss-tracker-section">
          <div className="container">
            <div className="section-header-split">
              <div>
                <div className="eyebrow left-align">Steps 7, 8, 9 &amp; 10 • Active Plan Management</div>
                <h2 className="section-heading light">
                  Track Progress, <span className="gold-accent">Make Payments &amp; View Reminders</span>
                </h2>
              </div>

              {/* Order Number Lookup Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (lookupOrderNumber.trim()) fetchOrderTracking(lookupOrderNumber.trim());
                }}
                className="tracker-lookup-form"
              >
                <input
                  type="text"
                  value={lookupOrderNumber}
                  onChange={(e) => setLookupOrderNumber(e.target.value)}
                  placeholder="Enter Order # (e.g. CAF-2026-1042)"
                />
                <button type="submit" className="btn-gold">
                  Load Plan
                </button>
              </form>
            </div>

            {lookupLoading ? (
              <p style={{ color: '#b8b3aa', padding: '2rem 0' }}>Loading instalment tracker...</p>
            ) : !trackedOrder ? (
              <div className="pss-calculator-card">
                <p>No order loaded. Enter order number <strong>CAF-2026-1042</strong> above to preview.</p>
              </div>
            ) : (
              <div className="tracker-dashboard-grid">
                {/* Left Column: Progress Bar, Schedule Status & Make Payment Form */}
                <div className="tracker-main-card">
                  <div className="tracker-order-header">
                    <div>
                      <span className="badge-pss">Order #{trackedOrder.orderNumber}</span>
                      <h3>{trackedOrder.items[0]?.name || 'CAF Luxury Furniture Order'}</h3>
                      <p>
                        Client: <strong>{trackedOrder.customerName}</strong> • Delivery:{' '}
                        {trackedOrder.city}, {trackedOrder.state}
                      </p>
                    </div>
                    <div className="tracker-status-badges">
                      <span className="badge-gold-outline">
                        Credit Review: {trackedOrder.instalmentApprovalStatus.replace(/_/g, ' ')}
                      </span>
                      <span className="badge-dark">
                        Order Status: {trackedOrder.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Step 8: Visual Payment Progress Bar */}
                  <div className="pss-progress-box">
                    <div className="pss-progress-labels">
                      <span>
                        Verified Paid: <strong className="gold-text">{formatNaira(trackedOrder.amountPaidVerified)}</strong> of{' '}
                        <strong>{formatNaira(trackedOrder.totalOrderValue)}</strong>
                      </span>
                      <span>
                        <strong>{progressPercentage}% Completed</strong> • Remaining Balance:{' '}
                        <strong>{formatNaira(trackedOrder.remainingBalance)}</strong>
                      </span>
                    </div>
                    <div className="pss-progress-track">
                      <div
                        className="pss-progress-fill"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Step 7: Make Next Instalment Payment Form */}
                  <div className="make-payment-box">
                    <h4>Make an Instalment Payment</h4>
                    <p style={{ fontSize: '0.82rem', color: '#b8b3aa', marginBottom: '1rem' }}>
                      Submit your next scheduled instalment via Paystack, Flutterwave, or Corporate
                      Bank Transfer. Note: Payments remain <strong>PENDING VERIFICATION</strong> until
                      confirmed.
                    </p>

                    <form onSubmit={handleMakeInstalmentPayment}>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label className="form-label">Select Instalment Milestone</label>
                          <select
                            className="form-select"
                            value={payInstalmentNum}
                            onChange={(e) => {
                              const num = Number(e.target.value);
                              setPayInstalmentNum(num);
                              const found = trackedOrder.instalmentSchedule.find(
                                (s) => s.instalmentNumber === num
                              );
                              if (found) setPayAmount(found.amount);
                            }}
                          >
                            {trackedOrder.instalmentSchedule.map((s) => (
                              <option key={s.instalmentNumber} value={s.instalmentNumber}>
                                {s.instalmentNumber === 0
                                  ? `Initial Deposit — ${formatNaira(s.amount)}`
                                  : `Month ${s.instalmentNumber} Instalment — ${formatNaira(s.amount)}`}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Amount to Pay (₦)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={payAmount}
                            onChange={(e) => setPayAmount(Number(e.target.value))}
                            min={10000}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-row-2">
                        <div className="form-group">
                          <label className="form-label">Payment Gateway / Method</label>
                          <select
                            className="form-select"
                            value={payMethod}
                            onChange={(e) =>
                              setPayMethod(
                                e.target.value as 'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER'
                              )
                            }
                          >
                            <option value="PAYSTACK">Paystack (Card / Bank / USSD)</option>
                            <option value="FLUTTERWAVE">Flutterwave (Card / Bank)</option>
                            <option value="BANK_TRANSFER">Direct Corporate Bank Transfer</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Transaction / Transfer Reference</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Enter ref or leave blank to auto-generate"
                            value={payReference}
                            onChange={(e) => setPayReference(e.target.value)}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn-gold"
                        style={{ width: '100%' }}
                        disabled={paySubmitting || trackedOrder.remainingBalance === 0}
                      >
                        {trackedOrder.remainingBalance === 0
                          ? '✓ All Instalments Fully Paid & Verified'
                          : paySubmitting
                          ? 'Recording Payment Submission...'
                          : `Submit ${formatNaira(payAmount)} Instalment Payment`}
                      </button>
                    </form>
                  </div>

                  {/* Payment Ledger & Verification Table */}
                  <div className="payment-ledger-box">
                    <h4>Verified &amp; Pending Payment Ledger ({paymentLedger.length})</h4>
                    <div className="ledger-rows">
                      {paymentLedger.map((pay) => (
                        <div key={pay.id} className="ledger-row">
                          <div>
                            <strong>
                              {pay.label} — {formatNaira(pay.amount)}
                            </strong>
                            <span className="ledger-meta">
                              {pay.paymentMethod} • Ref: {pay.paymentReference} •{' '}
                              {new Date(pay.submittedAt).toLocaleDateString('en-NG')}
                              {pay.receiptNumber ? ` • Receipt: ${pay.receiptNumber}` : ''}
                            </span>
                          </div>

                          <div className="ledger-actions">
                            <span
                              className={`ledger-status-pill ${
                                pay.status === 'VERIFIED' ? 'verified' : 'pending'
                              }`}
                            >
                              {pay.status.replace(/_/g, ' ')}
                            </span>

                            {user?.role === 'ADMIN' && pay.status === 'PENDING_VERIFICATION' && (
                              <button
                                type="button"
                                className="btn-text-gold"
                                onClick={() => handleVerifyPendingPayment(pay.id)}
                              >
                                Verify Payment
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Steps 9 & 10 — Payment Reminders & Order Updates */}
                <div className="tracker-side-column">
                  <div className="reminders-feed-card">
                    <span className="badge-pss">Steps 9 &amp; 10 • Live Alerts</span>
                    <h3>Payment Reminders &amp; Order Updates</h3>
                    <p style={{ fontSize: '0.82rem', color: '#b8b3aa', marginBottom: '1.25rem' }}>
                      Automated reminders and workshop milestone updates for Order{' '}
                      <strong>{trackedOrder.orderNumber}</strong>:
                    </p>

                    <div className="notifications-timeline">
                      {notifications.map((n) => (
                        <div key={n.id} className={`notif-item ${n.type.toLowerCase()}`}>
                          <div className="notif-top">
                            <span className="notif-type-tag">{n.type.replace(/_/g, ' ')}</span>
                            <span className="notif-channel">{n.channel}</span>
                          </div>
                          <h5>{n.title}</h5>
                          <p>{n.message}</p>
                          <small>{new Date(n.createdAt).toLocaleDateString('en-NG')}</small>
                        </div>
                      ))}
                    </div>

                    <a
                      href={getWhatsAppUrl(
                        `Hello CAF Interiors, please subscribe my WhatsApp number to automated Pay Small Small reminders and workshop updates for Order ${trackedOrder.orderNumber}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline-gold"
                      style={{ width: '100%', textAlign: 'center', marginTop: '1.25rem' }}
                    >
                      Get Reminders on WhatsApp
                    </a>
                  </div>

                  {/* Instalment Policy Summary Panel */}
                  {user?.role === 'ADMIN' && (
                    <div className="admin-config-preview-card">
                      <span className="eyebrow left-align">Administrator Governance</span>
                      <h4>Configurable Instalment Rules</h4>
                      <form onSubmit={handleAdminConfigSave}>
                        <div className="form-group">
                          <label className="form-label">Minimum Qualifying Price (₦)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={adminMinPrice}
                            onChange={(e) => setAdminMinPrice(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Default Deposit Percentage (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={adminDefaultDeposit}
                            onChange={(e) => setAdminDefaultDeposit(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Approved Durations (Months)</label>
                          <input
                            type="text"
                            className="form-input"
                            value={adminDurationsText}
                            onChange={(e) => setAdminDurationsText(e.target.value)}
                          />
                        </div>
                        <button type="submit" className="btn-gold" style={{ width: '100%' }}>
                          Save Global Pay Small Small Rules
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ===================================================================
            SECTION 3: QUALIFYING PAY SMALL SMALL CATALOG
           =================================================================== */}
        <section className="marketplace-showcase-section">
          <div className="container">
            <div className="section-header-split">
              <div>
                <div className="eyebrow left-align">Eligible Luxury Collection</div>
                <h2 className="section-heading">
                  Shop <span className="gold-accent">Pay Small Small</span> Eligible Furniture
                </h2>
              </div>
              <Link href="/shop" className="btn-outline-dark">
                View Full 14-Category Catalog &rarr;
              </Link>
            </div>

            <div className="products-grid-3col">
              {eligibleProducts.slice(0, 6).map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

