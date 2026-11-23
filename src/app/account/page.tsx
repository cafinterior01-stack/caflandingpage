'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useMarketplace } from '@/context/MarketplaceContext';
import {
  OrderRecord,
  InstalmentPaymentRecord,
  OrderNotificationRecord,
  CustomFurnitureEnquiryRecord,
  QuotationRecord,
  InteriorDesignProjectRecord,
} from '@/lib/db-store';
import { formatNaira, getWhatsAppUrl } from '@/lib/format';

export default function CustomerAccountPage() {
  const { user, authLoading, logout, refreshUser, showToast } = useMarketplace();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [payments, setPayments] = useState<InstalmentPaymentRecord[]>([]);
  const [notifications, setNotifications] = useState<OrderNotificationRecord[]>([]);
  const [customEnquiries, setCustomEnquiries] = useState<CustomFurnitureEnquiryRecord[]>([]);
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [interiorProjects, setInteriorProjects] = useState<InteriorDesignProjectRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'orders' | 'instalments' | 'custom' | 'projects' | 'reminders' | 'profile'
  >('orders');

  // Quick Instalment Payment State inside Dashboard
  const [payingOrder, setPayingOrder] = useState<OrderRecord | null>(null);
  const [payAmount, setPayAmount] = useState<number>(250000);
  const [payMethod, setPayMethod] = useState<'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER'>('PAYSTACK');
  const [payRef, setPayRef] = useState<string>('');
  const [paySubmitting, setPaySubmitting] = useState<boolean>(false);

  // Profile Edit State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');

  const loadAccountData = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const [ordRes, verRes, enqRes, prjRes] = await Promise.all([
        fetch('/api/orders', { cache: 'no-store' }),
        fetch('/api/payments/verify', { cache: 'no-store' }),
        fetch('/api/custom-enquiry', { cache: 'no-store' }),
        fetch('/api/projects', { cache: 'no-store' }),
      ]);
      const ordData = await ordRes.json();
      const verData = await verRes.json();
      const enqData = await enqRes.json();
      const prjData = await prjRes.json();

      const userOrders: OrderRecord[] = ordData.orders || [];
      setOrders(userOrders);

      const orderIds = new Set(userOrders.map((o) => o.id));
      setPayments(
        (verData.payments || []).filter((p: InstalmentPaymentRecord) => orderIds.has(p.orderId))
      );
      setNotifications(
        (verData.notifications || []).filter((n: OrderNotificationRecord) => orderIds.has(n.orderId))
      );
      setCustomEnquiries(enqData.enquiries || []);
      setQuotations(enqData.quotations || []);
      setInteriorProjects(prjData.projects || []);
    } catch {
      // ignore
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone);
      setEditAddress(user.address || '');
      setEditCity(user.city || '');
      setEditState(user.state || 'Lagos');
      loadAccountData();
    } else if (!authLoading) {
      setOrdersLoading(false);
    }
  }, [user, authLoading, loadAccountData]);

  const handleDashboardPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingOrder) return;
    setPaySubmitting(true);
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBMIT_INSTALMENT_PAYMENT',
          orderNumber: payingOrder.orderNumber,
          instalmentNumber: 1,
          label: `Instalment Payment for ${payingOrder.orderNumber}`,
          amount: payAmount,
          paymentMethod: payMethod,
          paymentReference: payRef,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        setPayingOrder(null);
        setPayRef('');
        await loadAccountData();
      } else {
        showToast(data.error || 'Could not submit payment.');
      }
    } catch {
      showToast('Network error.');
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleAcceptQuotation = async (enquiryId: string, decision: 'ACCEPTED' | 'REVISION_REQUESTED') => {
    const res = await fetch(`/api/custom-enquiry/${encodeURIComponent(enquiryId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message);
      await loadAccountData();
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        phone: editPhone,
        address: editAddress,
        city: editCity,
        state: editState,
      }),
    });
    if (res.ok) {
      await refreshUser();
      showToast('Your CAF Interiors client profile has been updated.');
    }
  };

  if (authLoading) {
    return (
      <>
        <Navbar />
        <main style={{ padding: '8rem 2rem', textAlign: 'center', minHeight: '70vh' }}>
          Loading your CAF Interiors account...
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="auth-page-main">
          <div className="container" style={{ maxWidth: '680px', textAlign: 'center' }}>
            <div className="auth-luxury-card">
              <span className="eyebrow">My Account Portal</span>
              <h1 className="auth-title">Welcome to Your CAF Interiors Concierge</h1>
              <p className="auth-sub">
                Sign in or create an account to view your orders, track Pay Small Small balances,
                download official receipts, and manage bespoke furniture &amp; interior projects.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/account/login" className="btn-gold">
                  Sign In to My Account
                </Link>
                <Link href="/account/register" className="btn-outline-gold">
                  Create Client Account
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const totalOutstandingBalance = orders.reduce((sum, o) => sum + o.remainingBalance, 0);
  const totalVerifiedPaid = orders.reduce((sum, o) => sum + o.amountPaidVerified, 0);
  const instalmentOrders = orders.filter((o) => o.hasPaySmallSmall);

  return (
    <>
      <Navbar />

      <main className="account-dashboard-main">
        <div className="container">
          {/* Top Greeting & KPI Strip */}
          <div className="account-header-card">
            <div>
              <span className="eyebrow left-align">
                {user.role === 'ADMIN' ? 'CAF Interiors Executive Account' : 'Verified Luxury Client Account'}
              </span>
              <h1>Welcome, {user.name}</h1>
              <p>
                {user.email} • {user.phone} • {user.city || 'Lekki'}, {user.state || 'Lagos'}
              </p>
            </div>
            <div className="account-header-actions">
              <Link href="/custom-furniture" className="btn-gold">
                + Custom Furniture Order
              </Link>
              <Link href="/interior-design" className="btn-outline-gold">
                + Book Interior Project
              </Link>
              <button type="button" className="btn-outline-gold" onClick={logout}>
                Sign Out
              </button>
            </div>
          </div>

          <div className="account-kpi-grid account-kpi-grid-4">
            <div className="account-kpi-card">
              <small>Orders &amp; Commissions</small>
              <strong>{orders.length + customEnquiries.length}</strong>
            </div>
            <div className="account-kpi-card">
              <small>Active Interior Projects</small>
              <strong>{interiorProjects.length}</strong>
            </div>
            <div className="account-kpi-card">
              <small>Total Verified Paid</small>
              <strong style={{ color: '#15803d' }}>{formatNaira(totalVerifiedPaid)}</strong>
            </div>
            <div className="account-kpi-card gold-border">
              <small>Outstanding Instalment Balance</small>
              <strong className="gold-text">{formatNaira(totalOutstandingBalance)}</strong>
            </div>
          </div>

          {/* Mobile-Friendly Horizontal Scrollable Tabs */}
          <div className="dashboard-tabs-scroll-wrap">
            <div className="showcase-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'orders'}
                className={`showcase-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                Orders &amp; Receipts ({orders.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'instalments'}
                className={`showcase-tab-btn ${activeTab === 'instalments' ? 'active' : ''}`}
                onClick={() => setActiveTab('instalments')}
              >
                Pay Small Small ({instalmentOrders.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'custom'}
                className={`showcase-tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
                onClick={() => setActiveTab('custom')}
              >
                Custom Quotations ({customEnquiries.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'projects'}
                className={`showcase-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
                onClick={() => setActiveTab('projects')}
              >
                Interior Projects ({interiorProjects.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'reminders'}
                className={`showcase-tab-btn ${activeTab === 'reminders' ? 'active' : ''}`}
                onClick={() => setActiveTab('reminders')}
              >
                Reminders &amp; Alerts ({notifications.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'profile'}
                className={`showcase-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Profile Settings
              </button>
            </div>
          </div>

          {/* Tab 1: Orders */}
          {activeTab === 'orders' && (
            <div className="account-orders-list">
              {ordersLoading ? (
                <p>Loading your orders...</p>
              ) : orders.length === 0 ? (
                <div className="shop-empty-box">
                  <h3>You have not placed any orders yet</h3>
                  <Link href="/shop" className="btn-gold">
                    Browse Marketplace
                  </Link>
                </div>
              ) : (
                orders.map((ord) => (
                  <article key={ord.id} className="account-order-card">
                    <div className="account-order-top">
                      <div>
                        <span className="badge-pss">{ord.orderNumber}</span>
                        <span className="order-date">
                          Placed on {new Date(ord.createdAt).toLocaleDateString('en-NG')}
                        </span>
                      </div>
                      <div className="account-order-statuses">
                        <span className="badge-dark">Order: {ord.orderStatus.replace(/_/g, ' ')}</span>
                        <span className="badge-ivory">Payment: {ord.paymentStatus.replace(/_/g, ' ')}</span>
                      </div>
                    </div>

                    <div className="account-order-items">
                      {ord.items.map((item, idx) => (
                        <div key={`${item.productId}-${idx}`} className="account-order-item-row">
                          <img src={item.image} alt={item.name} />
                          <div>
                            <strong>{item.name}</strong>
                            <div>
                              Qty: {item.quantity} • {item.selectedSize} • {item.selectedColor}
                            </div>
                          </div>
                          <span>{formatNaira(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="account-order-footer">
                      <div className="account-order-totals">
                        <span>Total Contract: <strong>{formatNaira(ord.totalOrderValue)}</strong></span>
                        <span>Verified Paid: <strong className="gold-text">{formatNaira(ord.amountPaidVerified)}</strong></span>
                        {ord.remainingBalance > 0 && (
                          <span>Outstanding Balance: <strong>{formatNaira(ord.remainingBalance)}</strong></span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <Link
                          href={`/checkout/success?order=${encodeURIComponent(ord.orderNumber)}`}
                          className="btn-outline-dark"
                        >
                          View &amp; Print Official Receipt
                        </Link>
                        <a
                          href={getWhatsAppUrl(
                            `Hello CAF Interiors, I am inquiring about my Order ${ord.orderNumber}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-gold"
                        >
                          Order Support
                        </a>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Pay Small Small Schedules */}
          {activeTab === 'instalments' && (
            <div className="account-orders-list">
              {instalmentOrders.map((ord) => {
                const pct =
                  ord.totalOrderValue > 0
                    ? Math.min(100, Math.round((ord.amountPaidVerified / ord.totalOrderValue) * 100))
                    : 0;
                const ordPayments = payments.filter((p) => p.orderId === ord.id);

                return (
                  <article key={ord.id} className="account-order-card">
                    <div className="account-order-top">
                      <div>
                        <span className="badge-pss">Instalment Plan • {ord.orderNumber}</span>
                        <strong style={{ marginLeft: '0.75rem' }}>{ord.items[0]?.name}</strong>
                      </div>
                      <span className="badge-dark">
                        Approval Status: {ord.instalmentApprovalStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="pss-progress-box light-mode" style={{ margin: '1.25rem 0' }}>
                      <div className="pss-progress-labels">
                        <span>
                          Verified Paid: <strong>{formatNaira(ord.amountPaidVerified)}</strong> of{' '}
                          <strong>{formatNaira(ord.totalOrderValue)}</strong>
                        </span>
                        <span>
                          <strong>{pct}% Paid</strong> • Remaining:{' '}
                          <strong className="gold-text">{formatNaira(ord.remainingBalance)}</strong>
                        </span>
                      </div>
                      <div className="pss-progress-track">
                        <div className="pss-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="pdp-pss-schedule-list">
                      {ord.instalmentSchedule.map((s) => (
                        <div key={s.instalmentNumber} className="pdp-pss-schedule-item">
                          <span>{s.dueDateLabel}</span>
                          <strong>{formatNaira(s.amount)}</strong>
                        </div>
                      ))}
                    </div>

                    {ordPayments.length > 0 && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                        <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Payment History</h4>
                        {ordPayments.map((p) => (
                          <div
                            key={p.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.82rem',
                              padding: '0.35rem 0',
                            }}
                          >
                            <span>
                              {p.label} ({p.paymentMethod} • Ref: {p.paymentReference})
                            </span>
                            <strong>
                              {formatNaira(p.amount)} — {p.status.replace(/_/g, ' ')}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {ord.remainingBalance > 0 && (
                        <button
                          type="button"
                          className="btn-gold"
                          onClick={() => {
                            setPayingOrder(ord);
                            const nextMonth = ord.instalmentSchedule.find((s) => s.instalmentNumber >= 1);
                            setPayAmount(nextMonth ? nextMonth.amount : ord.remainingBalance);
                          }}
                        >
                          Make Next Instalment Payment
                        </button>
                      )}
                      <Link href="/pay-small-small#tracker" className="btn-outline-dark">
                        Open Full Instalment Tracker &rarr;
                      </Link>
                    </div>
                  </article>
                );
              })}

              {payingOrder && (
                <div className="luxury-modal-Overlay" onClick={() => setPayingOrder(null)}>
                  <div className="luxury-modal-card" onClick={(e) => e.stopPropagation()}>
                    <div className="luxury-modal-header">
                      <div>
                        <span className="eyebrow left-align">Pay Small Small Instalment</span>
                        <h3>Make Payment for {payingOrder.orderNumber}</h3>
                      </div>
                      <button type="button" className="drawer-close-btn" onClick={() => setPayingOrder(null)}>
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleDashboardPaymentSubmit}>
                      <div className="form-group">
                        <label className="form-label">Amount to Pay (₦)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={payAmount}
                          onChange={(e) => setPayAmount(Number(e.target.value))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Payment Method</label>
                        <select
                          className="form-select"
                          value={payMethod}
                          onChange={(e) =>
                            setPayMethod(e.target.value as 'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER')
                          }
                        >
                          <option value="PAYSTACK">Paystack</option>
                          <option value="FLUTTERWAVE">Flutterwave</option>
                          <option value="BANK_TRANSFER">Corporate Bank Transfer</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Payment Reference</label>
                        <input
                          type="text"
                          className="form-input"
                          value={payRef}
                          onChange={(e) => setPayRef(e.target.value)}
                          placeholder="Enter transfer/transaction reference"
                        />
                      </div>
                      <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={paySubmitting}>
                        {paySubmitting ? 'Submitting...' : `Submit ${formatNaira(payAmount)} for Verification`}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Custom Furniture Requests & Quotations */}
          {activeTab === 'custom' && (
            <div className="account-orders-list">
              {customEnquiries.length === 0 ? (
                <div className="shop-empty-box">
                  <h3>No Custom Furniture Requests Submitted</h3>
                  <Link href="/custom-furniture" className="btn-gold" style={{ marginTop: '1rem' }}>
                    Submit Custom Furniture Request
                  </Link>
                </div>
              ) : (
                customEnquiries.map((enq) => {
                  const qtn = quotations.find(
                    (q) => q.enquiryId === enq.id || q.id === enq.quotationId
                  );
                  return (
                    <article key={enq.id} className="account-order-card">
                      <div className="account-order-top">
                        <div>
                          <span className="badge-pss">{enq.enquiryNumber}</span>
                          <strong style={{ marginLeft: '0.75rem' }}>{enq.category}</strong>
                        </div>
                        <span className="badge-dark">{enq.status.replace(/_/g, ' ')}</span>
                      </div>

                      <div style={{ padding: '1rem 0', fontSize: '0.9rem', color: '#57534e' }}>
                        <p><strong>Measurements:</strong> {enq.measurements}</p>
                        <p><strong>Materials:</strong> {enq.preferredMaterials}</p>
                        <p><strong>Colours &amp; Finishing:</strong> {enq.colorsAndFinishing}</p>
                        <p><strong>Location:</strong> {enq.location}</p>
                        <p><strong>Requirements:</strong> {enq.requirementsDescription}</p>
                      </div>

                      {qtn && (
                        <div className="checkout-pss-notice" style={{ marginTop: '0.75rem' }}>
                          <h4>
                            Official Quotation #{qtn.quotationNumber} — Total:{' '}
                            {formatNaira(qtn.totalQuotedAmount)} (Required Deposit:{' '}
                            {formatNaira(qtn.requiredDepositAmount)})
                          </h4>
                          <p style={{ fontSize: '0.84rem', marginBottom: '0.75rem' }}>
                            Lead Time: {qtn.estimatedLeadTime} • Decision:{' '}
                            <strong className="gold-text">
                              {qtn.customerDecision.replace(/_/g, ' ')}
                            </strong>
                          </p>
                          {qtn.customerDecision !== 'ACCEPTED' && (
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              <button
                                type="button"
                                className="btn-gold"
                                onClick={() => handleAcceptQuotation(enq.id, 'ACCEPTED')}
                              >
                                ✓ Accept Quotation
                              </button>
                              <button
                                type="button"
                                className="btn-outline-gold"
                                onClick={() => handleAcceptQuotation(enq.id, 'REVISION_REQUESTED')}
                              >
                                Request Revision
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 4: Interior Design Projects & Milestones */}
          {activeTab === 'projects' && (
            <div className="account-orders-list">
              {interiorProjects.length === 0 ? (
                <div className="shop-empty-box">
                  <h3>No Active Interior Design Projects</h3>
                  <Link href="/interior-design" className="btn-gold" style={{ marginTop: '1rem' }}>
                    Book an Interior Design Consultation
                  </Link>
                </div>
              ) : (
                interiorProjects.map((prj) => (
                  <article key={prj.id} className="account-order-card">
                    <div className="account-order-top">
                      <div>
                        <span className="badge-pss">{prj.projectNumber}</span>
                        <strong style={{ marginLeft: '0.75rem' }}>
                          {prj.serviceType} ({prj.propertyType})
                        </strong>
                      </div>
                      <span className="badge-dark">{prj.status.replace(/_/g, ' ')}</span>
                    </div>

                    <p style={{ margin: '0.85rem 0', fontSize: '0.88rem', color: '#57534e' }}>
                      <strong>Location:</strong> {prj.propertyLocation} •{' '}
                      <strong>Architect:</strong> {prj.assignedArchitect}
                    </p>

                    <div className="pss-progress-box light-mode" style={{ margin: '1rem 0' }}>
                      <div className="pss-progress-labels">
                        <span>Overall Project Milestone Completion</span>
                        <strong className="gold-text">{prj.overallProgressPercent}% Completed</strong>
                      </div>
                      <div className="pss-progress-track">
                        <div
                          className="pss-progress-fill"
                          style={{ width: `${prj.overallProgressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="pdp-pss-schedule-list">
                      {prj.milestones.map((m) => (
                        <div key={m.id} className="pdp-pss-schedule-item">
                          <span>
                            <strong>0{m.stepNumber}. {m.title}</strong> — {m.deliverableNote}
                          </span>
                          <strong>{m.status.replace(/_/g, ' ')} ({m.completionPercent}%)</strong>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      <Link href="/interior-design#milestone-portal" className="btn-outline-dark">
                        Open Full Project Management Interface &rarr;
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {/* Tab 5: Payment Reminders & Order Updates */}
          {activeTab === 'reminders' && (
            <div className="account-orders-list">
              {notifications.map((n) => (
                <article key={n.id} className="account-order-card">
                  <div className="account-order-top">
                    <span className="badge-pss">{n.type.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: '0.8rem', color: '#57534e' }}>
                      Order #{n.orderNumber} • {new Date(n.createdAt).toLocaleDateString('en-NG')} • Via {n.channel}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.35rem', margin: '0.75rem 0 0.35rem' }}>{n.title}</h3>
                  <p style={{ color: '#57534e', fontSize: '0.92rem' }}>{n.message}</p>
                </article>
              ))}
            </div>
          )}

          {/* Tab 6: Profile Edit */}
          {activeTab === 'profile' && (
            <div className="checkout-panel" style={{ maxWidth: '680px' }}>
              <h3>Update Client Profile &amp; White-Glove Delivery Address</h3>
              <form onSubmit={handleProfileSave}>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label dark-label">Full Name</label>
                    <input
                      type="text"
                      className="checkout-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label dark-label">Phone / WhatsApp Number</label>
                    <input
                      type="tel"
                      className="checkout-input"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label dark-label">City</label>
                    <input
                      type="text"
                      className="checkout-input"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label dark-label">State</label>
                    <input
                      type="text"
                      className="checkout-input"
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label dark-label">Delivery Street Address</label>
                  <input
                    type="text"
                    className="checkout-input"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-gold">
                  Save Profile Changes
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
