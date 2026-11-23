'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BrandLogo from '@/components/BrandLogo';
import { OrderRecord } from '@/lib/db-store';
import { formatNaira, getWhatsAppUrl } from '@/lib/format';
import { useMarketplace } from '@/context/MarketplaceContext';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderParam = searchParams.get('order') || 'CAF-2026-1042';
  const { showToast } = useMarketplace();

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingGateway, setVerifyingGateway] = useState(false);

  const loadOrder = useCallback(() => {
    fetch(`/api/orders/${encodeURIComponent(orderParam)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        setOrder(data.order || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderParam]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleSimulateGatewayWebhook = async () => {
    if (!order) return;
    setVerifyingGateway(true);
    try {
      const res = await fetch('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'charge.success',
          provider: order.paymentMethod === 'FLUTTERWAVE' ? 'FLUTTERWAVE' : 'PAYSTACK',
          sandboxSimulation: true,
          data: {
            reference: order.paymentReference,
            orderNumber: order.orderNumber,
            amount: order.payableTodayAmount,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
        showToast(data.message);
      } else {
        showToast(data.error || 'Webhook verification failed.');
      }
    } catch {
      showToast('Network error during gateway verification.');
    } finally {
      setVerifyingGateway(false);
    }
  };

  if (loading) {
    return (
      <div className="container loading-skeleton-screen">
        <BrandLogo variant="loading" href={null} />
        <p>Loading your official CAF Interiors order receipt...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <h1 className="section-heading">Order Receipt Not Found</h1>
        <Link href="/account" className="btn-gold">
          Go to My Account Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="receipt-card">
        <div className="receipt-header">
          <div className="dashboard-brand-title-group">
            <BrandLogo variant="receipt" />
            <div>
              <span className="eyebrow left-align">
                Official Order Confirmation &amp; Pro-Forma Receipt
              </span>
              <h1 className="receipt-title">Thank You, {order.customerName}</h1>
              <p className="receipt-sub">
                Your order <strong>{order.orderNumber}</strong> has been registered with{' '}
                <strong>CAF Interior and Exterior Service</strong>.
              </p>
            </div>
          </div>
          <div className="receipt-badges">
            <span className="badge-pss">Order #{order.orderNumber}</span>
            <span className="badge-dark">Payment: {order.paymentStatus.replace(/_/g, ' ')}</span>
            {order.hasPaySmallSmall && (
              <span className="badge-gold-outline">
                Instalment Plan: {order.instalmentApprovalStatus.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Live Payment Gateway Verification Banner when awaiting verification */}
        {order.paymentStatus === 'AWAITING_VERIFICATION' && (
          <div className="checkout-pss-notice" style={{ margin: '1.5rem 0' }}>
            <h4>Complete &amp; Verify Your {order.paymentMethod} Payment ({formatNaira(order.payableTodayAmount)})</h4>
            <p style={{ fontSize: '0.86rem', marginBottom: '1rem' }}>
              In accordance with CAF Interiors security policy, orders remain{' '}
              <strong>AWAITING VERIFICATION</strong> until confirmed via backend payment gateway
              webhook or administrator bank transfer confirmation.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-gold"
                onClick={handleSimulateGatewayWebhook}
                disabled={verifyingGateway}
              >
                {verifyingGateway
                  ? 'Verifying with Payment Gateway Webhook...'
                  : `Verify ${formatNaira(order.payableTodayAmount)} via ${
                      order.paymentMethod === 'BANK_TRANSFER' ? 'Admin Bank Webhook' : order.paymentMethod
                    } Now`}
              </button>
              <a
                href={getWhatsAppUrl(
                  `Hello CAF Interiors Finance Desk, please verify my ${order.paymentMethod} payment of ${formatNaira(
                    order.payableTodayAmount
                  )} for Order ${order.orderNumber} (Ref: ${order.paymentReference}).`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-gold"
              >
                Send Proof of Payment on WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Meta Info Grid */}
        <div className="receipt-info-grid">
          <div>
            <small>Client Details</small>
            <strong>{order.customerName}</strong>
            <span>{order.customerEmail}</span>
            <span>{order.customerPhone}</span>
          </div>
          <div>
            <small>White-Glove Delivery Destination</small>
            <strong>{order.deliveryAddress}</strong>
            <span>
              {order.city}, {order.state}, Nigeria
            </span>
          </div>
          <div>
            <small>Payment Channel &amp; Reference</small>
            <strong>{order.paymentMethod}</strong>
            <span>Ref: {order.paymentReference}</span>
            <span>Date: {new Date(order.createdAt).toLocaleDateString('en-NG')}</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="receipt-items-section">
          <h3>Commissioned Luxury Pieces</h3>
          <div className="compare-table-wrapper">
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Product &amp; Specification</th>
                  <th>Payment Plan</th>
                  <th>Qty</th>
                  <th>Full Value</th>
                  <th>Due Today</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={`${item.productId}-${idx}`}>
                    <td>
                      <strong>{item.name}</strong>
                      <div style={{ fontSize: '0.78rem', color: '#57534e' }}>
                        Size: {item.selectedSize} • Finish: {item.selectedColor}
                      </div>
                    </td>
                    <td>
                      {item.paymentPlan === 'PAY_SMALL_SMALL'
                        ? `Pay Small Small (${item.instalmentMonths} Months)`
                        : 'Outright Full Payment'}
                    </td>
                    <td>{item.quantity}</td>
                    <td>{formatNaira(item.unitPrice * item.quantity)}</td>
                    <td className="gold-text" style={{ fontWeight: 700 }}>
                      {formatNaira(
                        (item.paymentPlan === 'PAY_SMALL_SMALL' && item.initialDepositPerUnit
                          ? item.initialDepositPerUnit
                          : item.unitPrice) * item.quantity
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Breakdown & Pay Small Small Schedule */}
        <div className="receipt-bottom-split">
          {order.hasPaySmallSmall && order.instalmentSchedule.length > 0 ? (
            <div className="receipt-schedule-box">
              <h4>Your Pay Small Small Instalment Schedule</h4>
              <p style={{ fontSize: '0.8rem', color: '#57534e', marginBottom: '0.85rem' }}>
                Subject to CAF Interiors administration review and verified initial deposit confirmation.
              </p>
              <div className="pdp-pss-schedule-list">
                {order.instalmentSchedule.map((row) => (
                  <div key={row.instalmentNumber} className="pdp-pss-schedule-item">
                    <span>{row.dueDateLabel}</span>
                    <strong>{formatNaira(row.amount)}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="receipt-schedule-box">
              <h4>Delivery &amp; Quality Assurance</h4>
              <p style={{ fontSize: '0.88rem', color: '#57534e' }}>
                Once your payment reference <strong>{order.paymentReference}</strong> is verified,
                our dispatch concierge will schedule your white-glove delivery and on-site
                installation.
              </p>
            </div>
          )}

          <div className="receipt-totals-box">
            <div className="summary-row">
              <span>Items Full Value:</span>
              <strong>{formatNaira(order.subtotalFullValue)}</strong>
            </div>
            <div className="summary-row">
              <span>White-Glove Delivery ({order.state}):</span>
              <strong>{formatNaira(order.deliveryFee)}</strong>
            </div>
            {order.discountAmount > 0 && (
              <div className="summary-row discount">
                <span>Privilege Discount:</span>
                <strong>−{formatNaira(order.discountAmount)}</strong>
              </div>
            )}
            <div className="summary-row">
              <span>Total Contract Value:</span>
              <strong>{formatNaira(order.totalOrderValue)}</strong>
            </div>
            <div className="summary-row payable-today">
              <span>Initial Deposit / Payable Today:</span>
              <strong>{formatNaira(order.payableTodayAmount)}</strong>
            </div>
            <div className="summary-row" style={{ color: '#86efac' }}>
              <span>Verified Paid Amount:</span>
              <strong>{formatNaira(order.amountPaidVerified)}</strong>
            </div>
            {order.remainingBalance > 0 && (
              <div className="summary-row remaining-balance">
                <span>Remaining Instalment Balance:</span>
                <strong>{formatNaira(order.remainingBalance)}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="receipt-actions-bar">
          <a
            href={getWhatsAppUrl(
              `Hello CAF Interiors, I have placed Order ${order.orderNumber} (Total: ${formatNaira(
                order.totalOrderValue
              )}, Verified Paid: ${formatNaira(order.amountPaidVerified)}, Payment Method: ${
                order.paymentMethod
              }, Ref: ${order.paymentReference}).`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold"
          >
            Confirm &amp; Track Order on WhatsApp
          </a>

          <button type="button" className="btn-outline-dark" onClick={() => window.print()}>
            Print Official Receipt / Invoice
          </button>

          <Link href="/account" className="btn-outline-dark">
            Track in My Account Dashboard &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <>
      <Navbar />
      <main className="checkout-page-main">
        <Suspense fallback={<div style={{ padding: '6rem 2rem', textAlign: 'center' }}>Loading Order Receipt...</div>}>
          <OrderSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
