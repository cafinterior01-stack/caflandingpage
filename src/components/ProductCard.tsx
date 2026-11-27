'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { formatNaira, calculatePaySmallSmall } from '@/lib/format';
import { useMarketplace } from '@/context/MarketplaceContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, setCartOpen, compareIds, toggleCompare, openCustomModal } = useMarketplace();
  const isCompared = compareIds.includes(product.id);
  const [primaryImgError, setPrimaryImgError] = useState(false);
  const [secondaryImgError, setSecondaryImgError] = useState(false);

  const defaultMonths = product.paySmallSmall.allowedDurationsMonths[0] || 3;
  const instalmentPreview = product.paySmallSmall.eligible
    ? calculatePaySmallSmall(
      product.price,
      defaultMonths,
      product.paySmallSmall.depositPercentage,
      product.paySmallSmall.fixedDepositAmount
    )
    : null;

  const handleBuyNow = () => {
    addToCart(product, { paymentPlan: 'FULL_PAYMENT' });
    setCartOpen(true);
  };

  const handlePaySmallSmallAdd = () => {
    addToCart(product, {
      paymentPlan: 'PAY_SMALL_SMALL',
      instalmentMonths: defaultMonths,
    });
    setCartOpen(true);
  };

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <article className="luxury-product-card">
      <div className="product-card-media">
        <Link href={`/product/${product.slug}`} className="product-card-img-link">
          {product.images?.[0] && !primaryImgError ? (
            <>
              <img
                src={product.images[0]}
                alt={product.name}
                loading="lazy"
                className="product-img-primary"
                onError={() => setPrimaryImgError(true)}
              />
              {product.images[1] && !secondaryImgError && (
                <img
                  src={product.images[1]}
                  alt={`${product.name} alternate view`}
                  loading="lazy"
                  className="product-img-secondary"
                  onError={() => setSecondaryImgError(true)}
                />
              )}
            </>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                minHeight: '260px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(145deg, #161615 0%, #22211e 100%)',
                color: '#d4af37',
                padding: '1.5rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                CAF Interiors Atelier
              </span>
              <strong style={{ color: '#f5f2eb', fontSize: '0.88rem', marginTop: '0.35rem' }}>
                {product.name}
              </strong>
            </div>
          )}
        </Link>

        {/* Top Badges */}
        <div className="product-card-badges">
          {product.paySmallSmall.eligible && (
            <span className="badge-pss">Pay Small Small</span>
          )}
          {discountPercent > 0 && (
            <span className="badge-dark">Save {discountPercent}%</span>
          )}
          {product.isBestSeller && <span className="badge-ivory">Best Seller</span>}
          {product.isNewArrival && !product.isBestSeller && (
            <span className="badge-ivory">New Arrival</span>
          )}
        </div>

        {/* Compare Button */}
        <button
          type="button"
          className={`product-compare-btn ${isCompared ? 'active' : ''}`}
          onClick={() => toggleCompare(product.id)}
          title={isCompared ? 'Remove from comparison' : 'Compare product'}
          aria-label={isCompared ? 'Remove from comparison' : 'Compare product'}
          aria-pressed={isCompared}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
          </svg>
        </button>
      </div>

      <div className="product-card-body">
        <div className="product-card-meta-top">
          <Link href={`/shop?category=${product.categorySlug}`} className="product-card-category">
            {product.categoryName}
          </Link>
          <span className="product-card-rating" aria-label={`Rated ${product.rating} out of 5`}>
            ★ {product.rating.toFixed(1)} ({product.reviewCount})
          </span>
        </div>

        <Link href={`/product/${product.slug}`} className="product-card-title-link">
          <h3 className="product-card-title">{product.name}</h3>
        </Link>

        <p className="product-card-desc">{product.shortDescription}</p>

        {/* Swatches & Availability */}
        <div className="product-card-specs">
          <div className="swatch-row" title="Available Finishes">
            {product.colors.map((c) => (
              <span
                key={c.name}
                className="color-dot"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
            <span className="swatch-count">{product.sizes.length} Sizes</span>
          </div>
          <span className="delivery-pill">● {product.availabilityLabel.split('—')[0]}</span>
        </div>

        {/* Pricing & Pay Small Small Preview Box */}
        <div className="product-card-pricing-box">
          <div className="price-main-row">
            <span className="price-current">{formatNaira(product.price)}</span>
            {product.originalPrice && (
              <span className="price-original">{formatNaira(product.originalPrice)}</span>
            )}
          </div>

          {instalmentPreview ? (
            <div className="pss-mini-breakdown">
              <span>
                Deposit: <strong>{formatNaira(instalmentPreview.initialDeposit)}</strong>
              </span>
              <span>•</span>
              <span>
                Balance: {formatNaira(instalmentPreview.remainingBalance)} (up to{' '}
                {Math.max(...product.paySmallSmall.allowedDurationsMonths)} mos)
              </span>
            </div>
          ) : (
            <div className="pss-mini-breakdown muted">Direct Outright Purchase Item</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="product-card-actions">
          <button
            type="button"
            className="btn-card-primary"
            onClick={() => addToCart(product, { paymentPlan: 'FULL_PAYMENT' })}
          >
            Add to Cart
          </button>
          {product.paySmallSmall.eligible ? (
            <button
              type="button"
              className="btn-card-gold"
              onClick={handlePaySmallSmallAdd}
              title="Order with Pay Small Small Instalment Plan"
            >
              Pay Small Small
            </button>
          ) : (
            <button type="button" className="btn-card-gold" onClick={handleBuyNow}>
              Buy Now
            </button>
          )}
        </div>

        <div className="product-card-subactions">
          <Link href={`/product/${product.slug}`} className="subaction-link">
            View Specs &amp; Gallery
          </Link>
          <button
            type="button"
            className="subaction-link btn-reset"
            onClick={() => openCustomModal({ product })}
          >
            ✦ Customise Piece
          </button>
        </div>
      </div>
    </article>
  );
}
