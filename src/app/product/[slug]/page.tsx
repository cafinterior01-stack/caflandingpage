'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { formatNaira, calculatePaySmallSmall, getWhatsAppUrl } from '@/lib/format';
import { useMarketplace } from '@/context/MarketplaceContext';
import { Product } from '@/types';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const {
    catalogProducts,
    catalogLoading,
    addToCart,
    setCartOpen,
    compareIds,
    toggleCompare,
    openCustomModal,
  } = useMarketplace();

  const contextProduct = catalogProducts.find(
    (p) => p.slug === params.slug || p.id === params.slug
  );

  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [fetching, setFetching] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  const product = fetchedProduct || contextProduct || null;

  const [activeImage, setActiveImage] = useState<string>('');
  const [imgError, setImgError] = useState<boolean>(false);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number>(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMode, setPaymentMode] = useState<'FULL_PAYMENT' | 'PAY_SMALL_SMALL'>('FULL_PAYMENT');
  const [instalmentMonths, setInstalmentMonths] = useState<number>(3);

  useEffect(() => {
    let active = true;
    setFetching(true);
    setNotFound(false);
    fetch(`/api/products/${encodeURIComponent(params.slug)}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (data.product) {
            setFetchedProduct(data.product);
            setNotFound(false);
          } else {
            setNotFound(true);
          }
        } else {
          setFetchedProduct(null);
          setNotFound(true);
        }
      })
      .catch(() => {
        if (active && !contextProduct) {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (active) setFetching(false);
      });
    return () => {
      active = false;
    };
  }, [params.slug, contextProduct]);

  useEffect(() => {
    if (product) {
      setActiveImage(product.images?.[0] || '');
      setImgError(false);
      setSelectedSizeIndex(0);
      setSelectedColorIndex(0);
      setPaymentMode(product.paySmallSmall.eligible ? 'PAY_SMALL_SMALL' : 'FULL_PAYMENT');
      setInstalmentMonths(product.paySmallSmall.allowedDurationsMonths?.[0] || 3);
    }
  }, [product?.id, product?.images]);

  if ((fetching || catalogLoading) && !product) {
    return (
      <>
        <Navbar />
        <main style={{ padding: '10rem 2rem 6rem', textAlign: 'center', minHeight: '70vh' }}>
          <div className="container">
            <span className="eyebrow">CAF Interiors Marketplace</span>
            <h1 className="section-heading">Loading Furniture Specifications...</h1>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (notFound || !product) {
    return (
      <>
        <Navbar />
        <main style={{ padding: '10rem 2rem 6rem', textAlign: 'center', minHeight: '70vh' }}>
          <div className="container">
            <span className="eyebrow">CAF Interiors Marketplace</span>
            <h1 className="section-heading">Product Not Found</h1>
            <p style={{ marginBottom: '2rem', color: '#57534e' }}>
              The luxury furniture piece you are looking for may have been removed or commissioned.
            </p>
            <Link href="/shop" className="btn-gold">
              Return to Furniture Marketplace
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const selectedSizeObj = product.sizes[selectedSizeIndex] || product.sizes[0];
  const selectedColorObj = product.colors[selectedColorIndex] || product.colors[0];

  const effectiveUnitPrice = product.price + (selectedSizeObj?.priceAdjustment || 0);
  const totalFullPrice = effectiveUnitPrice * quantity;

  const pssDetails = product.paySmallSmall.eligible
    ? calculatePaySmallSmall(
      totalFullPrice,
      instalmentMonths,
      product.paySmallSmall.depositPercentage,
      selectedSizeObj?.priceAdjustment === 0 && quantity === 1
        ? product.paySmallSmall.fixedDepositAmount
        : undefined
    )
    : null;

  const isCompared = compareIds.includes(product.id);
  const relatedProducts = catalogProducts
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 3);

  const handleAddToBag = (openDrawerAfter = false) => {
    addToCart(product, {
      quantity,
      selectedSize: selectedSizeObj.label,
      selectedColor: selectedColorObj.name,
      unitPrice: effectiveUnitPrice,
      paymentPlan: paymentMode,
      instalmentMonths: paymentMode === 'PAY_SMALL_SMALL' ? instalmentMonths : undefined,
    });
    if (openDrawerAfter) {
      setCartOpen(true);
    }
  };

  return (
    <>
      <Navbar />

      <main className="pdp-main">
        <div className="container">
          {/* Breadcrumbs */}
          <nav className="pdp-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/shop">Shop Marketplace</Link>
            <span>/</span>
            <Link href={`/shop?category=${product.categorySlug}`}>{product.categoryName}</Link>
            <span>/</span>
            <span className="current">{product.name}</span>
          </nav>

          {/* Main Product Split Layout */}
          <div className="pdp-grid">
            {/* Left Column: Multi-Image Gallery */}
            <div className="pdp-gallery">
              <div className="pdp-primary-image-box">
                {activeImage && !imgError ? (
                  <img
                    src={activeImage}
                    alt={product.name}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      minHeight: '380px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#141413',
                      color: '#d4af37',
                      padding: '2rem',
                      textAlign: 'center',
                    }}
                  >
                    <strong style={{ letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.82rem' }}>
                      CAF Interiors Studio Photograph Pending
                    </strong>
                    <span style={{ color: '#b8b3aa', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                      {product.name}
                    </span>
                  </div>
                )}
                {product.paySmallSmall.eligible && (
                  <span className="pdp-floating-badge">Pay Small Small Eligible</span>
                )}
              </div>

              {product.images.length > 0 && (
                <div className="pdp-thumbnails-row">
                  {product.images.map((imgUrl, idx) => (
                    <button
                      key={`${imgUrl}-${idx}`}
                      type="button"
                      className={`pdp-thumb-btn ${activeImage === imgUrl ? 'active' : ''}`}
                      onClick={() => {
                        setActiveImage(imgUrl);
                        setImgError(false);
                      }}
                    >
                      <img src={imgUrl} alt={`${product.name} view ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}

              {/* Material & Architectural Specifications Card */}
              <div className="pdp-specs-card">
                <h3>Material &amp; Craftsmanship Specifications</h3>
                <div className="pdp-specs-list">
                  <div className="pdp-spec-row">
                    <span>Structural Frame</span>
                    <strong>{product.materials.frame}</strong>
                  </div>
                  <div className="pdp-spec-row">
                    <span>Upholstery / Surface</span>
                    <strong>{product.materials.upholstery}</strong>
                  </div>
                  <div className="pdp-spec-row">
                    <span>Cushioning / Finishing</span>
                    <strong>{product.materials.foamOrFinish}</strong>
                  </div>
                  <div className="pdp-spec-row">
                    <span>Selected Dimensions</span>
                    <strong>{selectedSizeObj?.dimensions}</strong>
                  </div>
                  <div className="pdp-spec-row">
                    <span>Production &amp; Delivery</span>
                    <strong>{product.estimatedDelivery}</strong>
                  </div>
                  <div className="pdp-spec-row">
                    <span>Warranty Protection</span>
                    <strong>{product.warranty}</strong>
                  </div>
                  <div className="pdp-spec-row">
                    <span>Origin</span>
                    <strong>{product.materials.origin}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Configuration, Pricing & Pay Small Small Engine */}
            <div className="pdp-config-column">
              <div className="pdp-meta-bar">
                <span className="pdp-sku">SKU: {product.sku}</span>
                <span className="pdp-availability-tag">● {product.availabilityLabel}</span>
                <span className="pdp-rating">★ {product.rating.toFixed(1)} ({product.reviewCount} Reviews)</span>
              </div>

              <h1 className="pdp-title">{product.name}</h1>

              <div className="pdp-price-header">
                <span className="pdp-current-price">{formatNaira(totalFullPrice)}</span>
                {product.originalPrice && (
                  <span className="pdp-original-price">
                    {formatNaira((product.originalPrice + (selectedSizeObj?.priceAdjustment || 0)) * quantity)}
                  </span>
                )}
              </div>

              <p className="pdp-description">{product.description}</p>

              {/* 1. Size Selector */}
              <div className="pdp-option-block">
                <div className="pdp-option-label">
                  <span>1. Select Size &amp; Dimensions</span>
                  <strong>{selectedSizeObj?.dimensions}</strong>
                </div>
                <div className="pdp-size-pills">
                  {product.sizes.map((sz, idx) => (
                    <button
                      key={sz.label}
                      type="button"
                      className={`pdp-size-pill ${selectedSizeIndex === idx ? 'active' : ''}`}
                      onClick={() => setSelectedSizeIndex(idx)}
                    >
                      <span className="size-name">{sz.label}</span>
                      <span className="size-delta">
                        {sz.priceAdjustment === 0
                          ? 'Standard Price'
                          : sz.priceAdjustment > 0
                            ? `+${formatNaira(sz.priceAdjustment)}`
                            : `−${formatNaira(Math.abs(sz.priceAdjustment))}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Colour & Finish Selector */}
              <div className="pdp-option-block">
                <div className="pdp-option-label">
                  <span>2. Select Colour &amp; Finish</span>
                  <strong>{selectedColorObj?.name}</strong>
                </div>
                <div className="pdp-color-swatches">
                  {product.colors.map((clr, idx) => (
                    <button
                      key={clr.name}
                      type="button"
                      className={`pdp-color-pill ${selectedColorIndex === idx ? 'active' : ''}`}
                      onClick={() => setSelectedColorIndex(idx)}
                    >
                      <span className="swatch-circle" style={{ backgroundColor: clr.hex }} />
                      <span>{clr.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Payment Option Selector (Full Payment vs. Pay Small Small) */}
              <div className="pdp-payment-selector-box">
                <div className="pdp-option-label">
                  <span>3. Choose Payment Option</span>
                  <span className="gold-text">Paystack • Flutterwave • Bank Transfer</span>
                </div>

                <div className="pdp-payment-tabs">
                  <button
                    type="button"
                    className={`pdp-payment-tab ${paymentMode === 'FULL_PAYMENT' ? 'active' : ''}`}
                    onClick={() => setPaymentMode('FULL_PAYMENT')}
                  >
                    <strong>Outright Full Payment</strong>
                    <span>{formatNaira(totalFullPrice)} Today</span>
                  </button>

                  {product.paySmallSmall.eligible && pssDetails && (
                    <button
                      type="button"
                      className={`pdp-payment-tab ${paymentMode === 'PAY_SMALL_SMALL' ? 'active' : ''}`}
                      onClick={() => setPaymentMode('PAY_SMALL_SMALL')}
                    >
                      <strong>Pay Small Small Plan</strong>
                      <span>{formatNaira(pssDetails.initialDeposit)} Initial Deposit</span>
                    </button>
                  )}
                </div>

                {paymentMode === 'PAY_SMALL_SMALL' && product.paySmallSmall.eligible && pssDetails && (
                  <div className="pdp-pss-panel">
                    <div className="pdp-pss-duration-row">
                      <span>Select Instalment Duration:</span>
                      <div className="pss-duration-pills">
                        {product.paySmallSmall.allowedDurationsMonths.map((m) => (
                          <button
                            key={m}
                            type="button"
                            className={`pss-duration-pill ${instalmentMonths === m ? 'active' : ''}`}
                            onClick={() => setInstalmentMonths(m)}
                          >
                            {m} Months
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pdp-pss-breakdown-grid">
                      <div>
                        <small>Full Price</small>
                        <strong>{formatNaira(pssDetails.fullPrice)}</strong>
                      </div>
                      <div>
                        <small>Initial Deposit Today</small>
                        <strong className="gold-text">{formatNaira(pssDetails.initialDeposit)}</strong>
                      </div>
                      <div>
                        <small>Remaining Balance</small>
                        <strong>{formatNaira(pssDetails.remainingBalance)}</strong>
                      </div>
                      <div>
                        <small>Monthly Payment ({instalmentMonths}x)</small>
                        <strong>{formatNaira(pssDetails.monthlyInstalment)}/mo</strong>
                      </div>
                    </div>

                    <div className="pdp-pss-schedule-list">
                      {pssDetails.schedule.map((item) => (
                        <div key={item.instalmentNumber} className="pdp-pss-schedule-item">
                          <span>{item.dueDateLabel}</span>
                          <strong>{formatNaira(item.amount)}</strong>
                        </div>
                      ))}
                    </div>

                    <p className="pdp-pss-conditions">
                      <strong>Conditions:</strong> {product.paySmallSmall.conditions}
                    </p>
                  </div>
                )}
              </div>

              {/* 4. Quantity & Primary CTAs */}
              <div className="pdp-cta-row">
                <div className="pdp-qty-box">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                    −
                  </button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => q + 1)}>
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="btn-outline-dark pdp-add-btn"
                  onClick={() => handleAddToBag(false)}
                >
                  Add to Cart
                </button>

                <button
                  type="button"
                  className="btn-gold pdp-buy-btn"
                  onClick={() => handleAddToBag(true)}
                >
                  {paymentMode === 'PAY_SMALL_SMALL'
                    ? `Start Pay Small Small (${formatNaira(pssDetails?.initialDeposit || totalFullPrice)})`
                    : `Buy Now (${formatNaira(totalFullPrice)})`}
                </button>
              </div>

              {/* 5. Secondary Customisation, Compare & WhatsApp Concierge Buttons */}
              <div className="pdp-secondary-actions">
                <button
                  type="button"
                  className="pdp-sec-btn"
                  onClick={() => openCustomModal({ product })}
                >
                  ✦ Request Customisation
                </button>

                <button
                  type="button"
                  className={`pdp-sec-btn ${isCompared ? 'active' : ''}`}
                  onClick={() => toggleCompare(product.id)}
                >
                  ⇄ {isCompared ? 'In Comparison List' : 'Compare Product'}
                </button>

                <a
                  href={getWhatsAppUrl(
                    `Hello CAF Interiors, I am interested in "${product.name}" (Size: ${selectedSizeObj.label}, Finish: ${selectedColorObj.name}) priced at ${formatNaira(
                      totalFullPrice
                    )}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pdp-sec-btn whatsapp"
                >
                  WhatsApp Product Enquiry
                </a>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="pdp-related-section">
              <div className="eyebrow left-align">Complementary Pieces</div>
              <h2 className="section-heading">
                More From <span className="gold-accent">{product.categoryName}</span>
              </h2>
              <div className="products-grid-3col" style={{ marginTop: '2.5rem' }}>
                {relatedProducts.map((rel) => (
                  <ProductCard key={rel.id} product={rel} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

