'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useMarketplace } from '@/context/MarketplaceContext';
import { FURNITURE_CATEGORIES, PRODUCTS_CATALOG } from '@/lib/catalog-data';
import { formatNaira, getWhatsAppUrl } from '@/lib/format';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    user,
    cart,
    cartOpen,
    setCartOpen,
    removeFromCart,
    updateQuantity,
    cartCount,
    cartTotalFullValue,
    cartPayableToday,
    compareIds,
    compareOpen,
    setCompareOpen,
    comparedProducts,
    toggleCompare,
    clearCompare,
    customModalTarget,
    closeCustomModal,
    toastMessage,
    showToast,
  } = useMarketplace();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Customisation Modal Form State
  const [customCategory, setCustomCategory] = useState('Sofas and Sectionals');
  const [customDimensions, setCustomDimensions] = useState('');
  const [customMaterial, setCustomMaterial] = useState('Kiln-Dried Nigerian Mahogany & Italian Velvet');
  const [customColor, setCustomColor] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [customReferenceUrl, setCustomReferenceUrl] = useState('');

  useEffect(() => {
    if (customModalTarget?.product) {
      setCustomCategory(customModalTarget.product.categoryName);
      setCustomDimensions(customModalTarget.product.sizes[0]?.dimensions || '');
      setCustomColor(customModalTarget.product.colors[0]?.name || '');
      setCustomNotes(`Customisation inquiry for ${customModalTarget.product.name} (${customModalTarget.product.sku})`);
    } else if (customModalTarget?.defaultCategory) {
      setCustomCategory(customModalTarget.defaultCategory);
    }
  }, [customModalTarget]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setCatDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen || cartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, cartOpen]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const liveSearchResults =
    searchQuery.trim().length > 1
      ? PRODUCTS_CATALOG.filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5)
      : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    setMobileMenuOpen(false);
    router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = `Hello CAF Interiors (Bespoke Customisation Desk),
• Category: ${customCategory}
${customModalTarget?.product ? `• Reference Product: ${customModalTarget.product.name}` : ''}
• Preferred Dimensions: ${customDimensions || 'Need site measurement'}
• Material Preference: ${customMaterial}
• Colour & Finishing: ${customColor || 'To be advised'}
• Reference Photo/Concept Link: ${customReferenceUrl || 'Will attach in chat'}
• Delivery Location: ${customLocation}
• Requirements: ${customNotes}`;

    showToast('Custom furniture request prepared! Connecting with CAF Interiors...');
    closeCustomModal();
    window.open(getWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="announcement-bar">
        <div className="container announcement-inner">
          <span className="announcement-item">
            <strong className="gold-text">CAF Interior and Exterior Service</strong> — Luxury Begins Beneath.
          </span>
          <span className="announcement-divider">|</span>
          <span className="announcement-item hide-on-small-mobile">
            <strong>Pay Small Small:</strong> Flexible 2–6 Month Instalments
          </span>
          <span className="announcement-divider hide-on-small-mobile">|</span>
          <a
            href={getWhatsAppUrl('Hello CAF Interiors, I need assistance from your design concierge.')}
            target="_blank"
            rel="noopener noreferrer"
            className="announcement-link"
          >
            WhatsApp: +234 903 026 2160
          </a>
          <span className="announcement-divider">|</span>
          <Link href="/admin" className="announcement-link">
            Admin Portal
          </Link>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-inner">
          {/* Brand Logo */}
          <Link href="/" className="brand-logo" aria-label="CAF Interiors Home">
            <div className="brand-monogram" aria-hidden="true">
              CAF
            </div>
            <div className="brand-text">
              <span className="brand-name">CAF INTERIORS</span>
              <span className="brand-tagline">Your Comfortability Is Our Priority.</span>
            </div>
          </Link>

          {/* Main 9-Item Desktop Navigation */}
          <nav className="desktop-nav" aria-label="Primary Marketplace Navigation">
            <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
              Home
            </Link>
            <Link href="/shop" className={`nav-link ${pathname === '/shop' ? 'active' : ''}`}>
              Shop
            </Link>

            {/* Furniture Categories Mega Dropdown */}
            <div
              className="nav-dropdown-wrapper"
              onMouseEnter={() => setCatDropdownOpen(true)}
              onMouseLeave={() => setCatDropdownOpen(false)}
            >
              <button
                type="button"
                className="nav-link nav-dropdown-trigger"
                onClick={() => setCatDropdownOpen((prev) => !prev)}
                aria-expanded={catDropdownOpen}
                aria-haspopup="true"
              >
                <span>Categories</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {catDropdownOpen && (
                <div className="mega-dropdown">
                  <div className="mega-dropdown-header">
                    <div>
                      <span className="mega-eyebrow">{FURNITURE_CATEGORIES.length} Curated Departments</span>
                      <h4>CAF Luxury Furniture &amp; Decor Marketplace</h4>
                    </div>
                    <Link href="/shop" className="mega-view-all" onClick={() => setCatDropdownOpen(false)}>
                      View Full Catalog &rarr;
                    </Link>
                  </div>
                  <div className="mega-categories-grid">
                    {FURNITURE_CATEGORIES.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/shop?category=${cat.slug}`}
                        className="mega-cat-item"
                        onClick={() => setCatDropdownOpen(false)}
                      >
                        <img src={cat.image} alt={cat.name} className="mega-cat-thumb" loading="lazy" />
                        <div>
                          <div className="mega-cat-name">{cat.name}</div>
                          <div className="mega-cat-count">{cat.productCount} Pieces</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/interior-design"
              className={`nav-link ${pathname === '/interior-design' ? 'active' : ''}`}
            >
              Interior Design
            </Link>
            <Link
              href="/custom-furniture"
              className={`nav-link ${pathname === '/custom-furniture' ? 'active' : ''}`}
            >
              Custom Furniture
            </Link>
            <Link
              href="/pay-small-small"
              className={`nav-link nav-link-gold ${pathname === '/pay-small-small' ? 'active' : ''}`}
            >
              Pay Small Small
            </Link>
            <Link href="/about" className={`nav-link ${pathname === '/about' ? 'active' : ''}`}>
              About Us
            </Link>
            <Link href="/contact" className={`nav-link ${pathname === '/contact' ? 'active' : ''}`}>
              Contact
            </Link>
            <Link
              href="/account"
              className={`nav-link ${pathname?.startsWith('/account') ? 'active' : ''}`}
            >
              My Account
            </Link>
          </nav>

          {/* Utility Icons: Search, Compare, Account, Cart, Mobile Hamburger */}
          <div className="header-utilities">
            <button
              type="button"
              className={`utility-icon-btn ${searchOpen ? 'active' : ''}`}
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label="Search furniture and interior services"
              title="Search Marketplace"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>

            {compareIds.length > 0 && (
              <button
                type="button"
                className="utility-icon-btn"
                onClick={() => setCompareOpen(true)}
                aria-label="Compare selected products"
                title="Compare Products"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                </svg>
                <span className="utility-badge">{compareIds.length}</span>
              </button>
            )}

            <Link
              href="/account"
              className={`utility-icon-btn ${pathname?.startsWith('/account') ? 'active' : ''}`}
              aria-label="My Account"
              title={user ? `Signed in as ${user.name}` : 'My Account / Sign In'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {user && <span className="utility-online-dot" aria-hidden="true" />}
            </Link>

            <button
              type="button"
              className="utility-icon-btn cart-trigger-btn"
              onClick={() => setCartOpen(true)}
              aria-label={`Open shopping bag (${cartCount} items)`}
              title="Shopping Bag"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="utility-badge">{cartCount}</span>
            </button>

            <button
              type="button"
              className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              <div className="hamburger-lines">
                <span />
                <span />
                <span />
              </div>
            </button>
          </div>
        </div>

        {/* Prominent Expandable Search Bar */}
        {searchOpen && (
          <div className="header-search-panel">
            <div className="container">
              <form onSubmit={handleSearchSubmit} className="header-search-form">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 6x6 beds, sectionals, marble dining, wall art, rugs, TV consoles..."
                  className="header-search-input"
                  aria-label="Search CAF Interiors products"
                />
                <button type="submit" className="btn-gold header-search-submit">
                  Search
                </button>
                <button
                  type="button"
                  className="header-search-close"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search bar"
                >
                  ✕
                </button>
              </form>

              {liveSearchResults.length > 0 && (
                <div className="live-search-results">
                  {liveSearchResults.map((item) => (
                    <Link
                      key={item.id}
                      href={`/product/${item.slug}`}
                      className="live-search-item"
                      onClick={() => setSearchOpen(false)}
                    >
                      <img src={item.images[0]} alt={item.name} />
                      <div className="live-search-info">
                        <span className="live-search-name">{item.name}</span>
                        <span className="live-search-cat">{item.categoryName}</span>
                      </div>
                      <div className="live-search-price">
                        <span>{formatNaira(item.price)}</span>
                        {item.paySmallSmall.eligible && <small>Pay Small Small Eligible</small>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer */}
      <div
        className={`mobile-drawer-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />
      <aside className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`} aria-label="Mobile Navigation">
        <div className="mobile-drawer-top-bar">
          <div className="brand-logo">
            <div className="brand-monogram" aria-hidden="true">
              CAF
            </div>
            <div className="brand-text">
              <span className="brand-name">CAF INTERIORS</span>
              <span className="brand-tagline">Luxury Marketplace</span>
            </div>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="mobile-drawer-scroll-content">
          <form onSubmit={handleSearchSubmit} className="mobile-search-box">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search furniture & decor..."
              aria-label="Search furniture and decor"
            />
            <button type="submit">Search</button>
          </form>

          <nav className="mobile-nav-list">
            <Link href="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <span>Home</span>
              <span className="index">01</span>
            </Link>
            <Link href="/shop" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <span>Shop Marketplace</span>
              <span className="index">02</span>
            </Link>
            <Link
              href="/shop?category=interior-design-decor"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Interior Design Decor</span>
              <span className="index">03</span>
            </Link>
            <Link
              href="/interior-design"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Interior Design Services (13)</span>
              <span className="index">04</span>
            </Link>
            <Link
              href="/custom-furniture"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Custom Furniture Ordering</span>
              <span className="index">05</span>
            </Link>
            <Link
              href="/pay-small-small"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="gold-text">Pay Small Small Plans</span>
              <span className="index">06</span>
            </Link>
            <Link href="/about" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <span>About Us</span>
              <span className="index">07</span>
            </Link>
            <Link
              href="/contact"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Contact &amp; Concierge</span>
              <span className="index">08</span>
            </Link>
            <Link
              href="/account"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>{user ? `My Account (${user.name.split(' ')[0]})` : 'My Account / Sign In'}</span>
              <span className="index">09</span>
            </Link>
            <Link href="/admin" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <span className="gold-text">Admin Command Center</span>
              <span className="index">10</span>
            </Link>
          </nav>
        </div>

        <div className="mobile-drawer-footer">
          <p className="mobile-drawer-slogan">&ldquo;Your Comfortability Is Our Priority.&rdquo;</p>
          <p className="mobile-drawer-sub-slogan">Luxury Begins Beneath.</p>
          <a
            href={getWhatsAppUrl(
              'Hello CAF Interiors, I would like to inquire about your furniture and interior design services.'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-drawer-cta"
          >
            WhatsApp Concierge
          </a>
        </div>
      </aside>

      {/* Slide-Out Shopping Cart Drawer */}
      <div
        className={`mobile-drawer-backdrop ${cartOpen ? 'open' : ''}`}
        onClick={() => setCartOpen(false)}
        aria-hidden="true"
      />
      <aside className={`cart-drawer ${cartOpen ? 'open' : ''}`} aria-label="Shopping Bag">
        <div className="cart-drawer-header">
          <div>
            <h3>Your Luxury Selection ({cartCount})</h3>
            <p>CAF Interior and Exterior Service</p>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setCartOpen(false)}
            aria-label="Close shopping bag"
          >
            ✕
          </button>
        </div>

        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <p>Your shopping bag is currently empty.</p>
              <Link href="/shop" className="btn-gold" onClick={() => setCartOpen(false)}>
                Explore Marketplace
              </Link>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.productId}-${idx}`} className="cart-item-row">
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-details">
                  <Link
                    href={`/product/${item.slug}`}
                    className="cart-item-title"
                    onClick={() => setCartOpen(false)}
                  >
                    {item.name}
                  </Link>
                  <div className="cart-item-meta">
                    <span>Size: {item.selectedSize}</span> • <span>Finish: {item.selectedColor}</span>
                  </div>
                  {item.paymentPlan === 'PAY_SMALL_SMALL' ? (
                    <div className="cart-item-plan-badge">
                      Pay Small Small ({item.instalmentMonths} Months) — Deposit Today:{' '}
                      <strong>
                        {formatNaira((item.initialDepositPerUnit || item.unitPrice) * item.quantity)}
                      </strong>
                      <small>Full Price: {formatNaira(item.unitPrice * item.quantity)}</small>
                    </div>
                  ) : (
                    <div className="cart-item-price">{formatNaira(item.unitPrice * item.quantity)}</div>
                  )}

                  <div className="cart-item-actions">
                    <div className="qty-stepper">
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button type="button" className="cart-remove-btn" onClick={() => removeFromCart(idx)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-summary-line">
              <span>Total Order Value:</span>
              <span>{formatNaira(cartTotalFullValue)}</span>
            </div>
            <div className="cart-summary-line highlight">
              <span>Payable Today (Deposit / Full):</span>
              <span>{formatNaira(cartPayableToday)}</span>
            </div>
            <p className="cart-summary-note">
              Pay Small Small orders undergo quick verification by CAF Interiors prior to scheduled dispatch.
            </p>
            <div className="cart-footer-buttons">
              <Link
                href="/checkout"
                className="btn-gold"
                style={{ width: '100%', textAlign: 'center' }}
                onClick={() => setCartOpen(false)}
              >
                Proceed to Secure Checkout
              </Link>
              <Link
                href="/cart"
                className="btn-outline-gold"
                style={{ width: '100%', textAlign: 'center' }}
                onClick={() => setCartOpen(false)}
              >
                View Full Shopping Bag &amp; Plans
              </Link>
            </div>
          </div>
        )}
      </aside>

      {/* Product Comparison Modal */}
      {compareOpen && (
        <div className="luxury-modal-Overlay" onClick={() => setCompareOpen(false)}>
          <div className="luxury-modal-card compare-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="luxury-modal-header">
              <div>
                <span className="eyebrow left-align">Side-by-Side Comparison</span>
                <h3>Compare CAF Luxury Pieces ({comparedProducts.length}/4)</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn-text-gold" onClick={clearCompare}>
                  Clear All
                </button>
                <button type="button" className="drawer-close-btn" onClick={() => setCompareOpen(false)}>
                  ✕
                </button>
              </div>
            </div>

            {comparedProducts.length === 0 ? (
              <p style={{ padding: '2rem 0', color: '#b8b3aa' }}>
                Select up to 4 products using the &ldquo;Compare&rdquo; button on any product card.
              </p>
            ) : (
              <div className="compare-table-wrapper">
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th>Specification</th>
                      {comparedProducts.map((prod) => (
                        <th key={prod.id}>
                          <img src={prod.images[0]} alt={prod.name} className="compare-thumb" />
                          <Link href={`/product/${prod.slug}`} onClick={() => setCompareOpen(false)}>
                            {prod.name}
                          </Link>
                          <button
                            type="button"
                            className="compare-remove-tag"
                            onClick={() => toggleCompare(prod.id)}
                          >
                            Remove
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Full Price (₦)</td>
                      {comparedProducts.map((prod) => (
                        <td key={prod.id} className="gold-text" style={{ fontWeight: 700 }}>
                          {formatNaira(prod.price)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Pay Small Small</td>
                      {comparedProducts.map((prod) => (
                        <td key={prod.id}>
                          {prod.paySmallSmall.eligible
                            ? `Eligible (${
                                prod.paySmallSmall.fixedDepositAmount
                                  ? `${formatNaira(prod.paySmallSmall.fixedDepositAmount)} Deposit`
                                  : `${Math.round(prod.paySmallSmall.depositPercentage)}% Deposit`
                              } • Up to ${Math.max(...prod.paySmallSmall.allowedDurationsMonths)} Months)`
                            : 'Direct Purchase Only'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Category</td>
                      {comparedProducts.map((prod) => (
                        <td key={prod.id}>{prod.categoryName}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Frame &amp; Structure</td>
                      {comparedProducts.map((prod) => (
                        <td key={prod.id}>{prod.materials.frame}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Upholstery / Finish</td>
                      {comparedProducts.map((prod) => (
                        <td key={prod.id}>{prod.materials.upholstery}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Standard Size</td>
                      {comparedProducts.map((prod) => (
                        <td key={prod.id}>
                          {prod.sizes[0]?.label} ({prod.sizes[0]?.dimensions})
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Estimated Delivery</td>
                      {comparedProducts.map((prod) => (
                        <td key={prod.id}>{prod.estimatedDelivery}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Warranty</td>
                      {comparedProducts.map((prod) => (
                        <td key={prod.id}>{prod.warranty}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bespoke Customisation Request Modal */}
      {customModalTarget !== null && (
        <div className="luxury-modal-Overlay" onClick={closeCustomModal}>
          <div className="luxury-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="luxury-modal-header">
              <div>
                <span className="eyebrow left-align">Bespoke Commission Desk</span>
                <h3>
                  {customModalTarget.product
                    ? `Customise: ${customModalTarget.product.name}`
                    : 'Request Custom Furniture Quotation'}
                </h3>
              </div>
              <button type="button" className="drawer-close-btn" onClick={closeCustomModal}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="custom-modal-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Furniture Category</label>
                  <select
                    className="form-select"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  >
                    {FURNITURE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Measurements / Room Size</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 6x6ft, 360cm × 240cm, or Request Site Visit"
                    value={customDimensions}
                    onChange={(e) => setCustomDimensions(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Preferred Materials</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Nigerian Mahogany, Italian Bouclé, Carrara Marble"
                    value={customMaterial}
                    onChange={(e) => setCustomMaterial(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Colour &amp; Finishing</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Champagne Gold, Warm Ivory, Obsidian Matte"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Reference Picture / Sketch Link (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Paste Pinterest/Instagram link or attach in WhatsApp"
                    value={customReferenceUrl}
                    onChange={(e) => setCustomReferenceUrl(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Your City &amp; State (Nigeria)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Lekki Phase 1, Lagos / Maitama, Abuja"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Describe Your Custom Requirements</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe special storage, tufting style, fabric texture, or Pay Small Small preference..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-gold" style={{ width: '100%' }}>
                Submit Custom Specification for Quotation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="luxury-toast" role="status" aria-live="polite">
          <span className="toast-diamond" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
