'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useMarketplace } from '@/context/MarketplaceContext';
import { PRODUCTS_CATALOG } from '@/lib/catalog-data';
import { formatNaira, getWhatsAppUrl } from '@/lib/format';

export default function CartPage() {
  const {
    catalogProducts,
    cart,
    removeFromCart,
    updateQuantity,
    updateCartItemPlan,
    clearCart,
    cartTotalFullValue,
    cartPayableToday,
    cartRemainingBalance,
    showToast,
  } = useMarketplace();

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    description: string;
    discountAmount: number;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, subtotal: cartTotalFullValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Invalid promotional code.');
      } else {
        setAppliedPromo({
          code: data.promo.code,
          description: data.promo.description,
          discountAmount: data.discountAmount,
        });
        showToast(data.message);
      }
    } catch {
      showToast('Could not validate code.');
    } finally {
      setPromoLoading(false);
    }
  };

  const discount = appliedPromo?.discountAmount || 0;
  const finalTotalValue = Math.max(0, cartTotalFullValue - discount);
  const finalPayableToday = Math.max(0, cartPayableToday - discount);

  return (
    <>
      <Navbar />

      <main className="cart-page-main">
        <div className="container">
          <div className="eyebrow left-align">CAF Interior and Exterior Service</div>
          <div className="cart-page-header">
            <h1 className="section-heading">Your Luxury Shopping Bag</h1>
            {cart.length > 0 && (
              <button type="button" className="btn-text-gold" onClick={clearCart}>
                Empty Shopping Bag
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="shop-empty-box" style={{ margin: '2rem 0 4rem' }}>
              <h3>Your shopping bag is currently empty</h3>
              <p style={{ margin: '0.75rem 0 1.75rem', color: '#57534e' }}>
                Explore our 14 luxury furniture collections and choose between outright purchase or
                flexible Pay Small Small instalments.
              </p>
              <Link href="/shop" className="btn-gold">
                Explore Furniture Marketplace
              </Link>
            </div>
          ) : (
            <div className="cart-page-grid">
              {/* Left Column: Cart Items with Live Payment Plan Switcher */}
              <div className="cart-items-column">
                {cart.map((item, idx) => {
                  const catalogProduct =
                    catalogProducts.find((p) => p.id === item.productId) ||
                    PRODUCTS_CATALOG.find((p) => p.id === item.productId);
                  const isEligible = catalogProduct?.paySmallSmall.eligible ?? item.paymentPlan === 'PAY_SMALL_SMALL';
                  const allowedMonths = catalogProduct?.paySmallSmall.allowedDurationsMonths || [2, 3, 4, 6];

                  const lineFullPrice = item.unitPrice * item.quantity;
                  const linePayableToday =
                    (item.paymentPlan === 'PAY_SMALL_SMALL' && item.initialDepositPerUnit
                      ? item.initialDepositPerUnit
                      : item.unitPrice) * item.quantity;
                  const lineBalance = Math.max(0, lineFullPrice - linePayableToday);

                  return (
                    <article key={`${item.productId}-${idx}`} className="cart-full-card">
                      <img src={item.image} alt={item.name} className="cart-full-img" />

                      <div className="cart-full-info">
                        <div className="cart-full-top">
                          <div>
                            <Link href={`/product/${item.slug}`} className="cart-full-title">
                              {item.name}
                            </Link>
                            <div className="cart-full-specs">
                              <span>Size: <strong>{item.selectedSize}</strong></span>
                              <span>•</span>
                              <span>Finish: <strong>{item.selectedColor}</strong></span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="cart-remove-btn"
                            onClick={() => removeFromCart(idx)}
                          >
                            ✕ Remove
                          </button>
                        </div>

                        {/* Interactive Payment Plan Switcher per Item */}
                        <div className="cart-plan-switcher-box">
                          <div className="cart-plan-radios">
                            <label className={`plan-radio-pill ${item.paymentPlan === 'FULL_PAYMENT' ? 'active' : ''}`}>
                              <input
                                type="radio"
                                name={`plan-${idx}`}
                                checked={item.paymentPlan === 'FULL_PAYMENT'}
                                onChange={() => updateCartItemPlan(idx, 'FULL_PAYMENT')}
                              />
                              <span>Outright Full Payment ({formatNaira(lineFullPrice)})</span>
                            </label>

                            {isEligible && (
                              <label className={`plan-radio-pill ${item.paymentPlan === 'PAY_SMALL_SMALL' ? 'active' : ''}`}>
                                <input
                                  type="radio"
                                  name={`plan-${idx}`}
                                  checked={item.paymentPlan === 'PAY_SMALL_SMALL'}
                                  onChange={() =>
                                    updateCartItemPlan(idx, 'PAY_SMALL_SMALL', item.instalmentMonths || allowedMonths[0])
                                  }
                                />
                                <span>Pay Small Small (Initial Deposit: {formatNaira(linePayableToday)})</span>
                              </label>
                            )}
                          </div>

                          {item.paymentPlan === 'PAY_SMALL_SMALL' && isEligible && (
                            <div className="cart-plan-duration-bar">
                              <span>Instalment Duration:</span>
                              <div className="pss-duration-pills">
                                {allowedMonths.map((m) => (
                                  <button
                                    key={m}
                                    type="button"
                                    className={`pss-duration-pill ${item.instalmentMonths === m ? 'active' : ''}`}
                                    onClick={() => updateCartItemPlan(idx, 'PAY_SMALL_SMALL', m)}
                                  >
                                    {m} Months
                                  </button>
                                ))}
                              </div>
                              <span className="cart-balance-pill">
                                Remaining Balance: <strong>{formatNaira(lineBalance)}</strong> ({formatNaira(Math.round(lineBalance / (item.instalmentMonths || 3)))}/mo)
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="cart-full-bottom">
                          <div className="qty-stepper dark">
                            <button type="button" onClick={() => updateQuantity(idx, item.quantity - 1)}>
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(idx, item.quantity + 1)}>
                              +
                            </button>
                          </div>

                          <div className="cart-line-totals">
                            <div>
                              <small>Full Item Price:</small> <strong>{formatNaira(lineFullPrice)}</strong>
                            </div>
                            <div className="gold-text">
                              <small>Due Today:</small> <strong>{formatNaira(linePayableToday)}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Right Column: Financial Summary & Promo Code */}
              <aside className="cart-summary-sidebar">
                <div className="cart-summary-card">
                  <h3>Order &amp; Instalment Summary</h3>

                  <form onSubmit={handleApplyPromo} className="promo-code-form">
                    <input
                      type="text"
                      placeholder="Promo code (e.g. CAFLUXURY5)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <button type="submit" disabled={promoLoading}>
                      {promoLoading ? '...' : 'Apply'}
                    </button>
                  </form>
                  {appliedPromo && (
                    <div className="promo-applied-badge">
                      ✓ {appliedPromo.code}: −{formatNaira(appliedPromo.discountAmount)}
                    </div>
                  )}

                  <div className="summary-rows">
                    <div className="summary-row">
                      <span>Full Order Subtotal</span>
                      <strong>{formatNaira(cartTotalFullValue)}</strong>
                    </div>
                    {discount > 0 && (
                      <div className="summary-row discount">
                        <span>Privilege Discount ({appliedPromo?.code})</span>
                        <strong>−{formatNaira(discount)}</strong>
                      </div>
                    )}
                    <div className="summary-row">
                      <span>Total Contract Value</span>
                      <strong>{formatNaira(finalTotalValue)}</strong>
                    </div>
                    <div className="summary-row payable-today">
                      <span>Payable Today (Deposit / Outright)</span>
                      <strong>{formatNaira(finalPayableToday)}</strong>
                    </div>
                    {cartRemainingBalance > 0 && (
                      <div className="summary-row remaining-balance">
                        <span>Remaining Pay Small Small Balance</span>
                        <strong>{formatNaira(cartRemainingBalance)}</strong>
                      </div>
                    )}
                  </div>

                  <p className="summary-legal-note">
                    White-glove delivery &amp; on-site assembly fees are calculated by Nigerian State
                    on the next step. Pay Small Small plans are reviewed and confirmed by CAF
                    Interiors.
                  </p>

                  <Link
                    href={`/checkout${appliedPromo ? `?promo=${appliedPromo.code}` : ''}`}
                    className="btn-gold"
                    style={{ width: '100%', textAlign: 'center', marginBottom: '0.75rem' }}
                  >
                    Proceed to Secure Checkout &rarr;
                  </Link>

                  <a
                    href={getWhatsAppUrl(
                      `Hello CAF Interiors, I have ${cart.length} item(s) in my shopping bag totaling ${formatNaira(
                        finalTotalValue
                      )} and would like assistance before checkout.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline-gold"
                    style={{ width: '100%', textAlign: 'center' }}
                  >
                    Discuss Bag on WhatsApp
                  </a>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

