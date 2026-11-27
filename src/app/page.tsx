'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import {
  INTERIOR_DESIGN_SERVICES,
  COMPLETED_PROJECTS,
  CUSTOMER_TESTIMONIALS,
} from '@/lib/catalog-data';
import { formatNaira, calculatePaySmallSmall, getWhatsAppUrl } from '@/lib/format';
import { useMarketplace } from '@/context/MarketplaceContext';

export default function HomePage() {
  const {
    catalogProducts,
    catalogCategories,
    addToCart,
    setCartOpen,
    openCustomModal,
    showToast,
  } = useMarketplace();

  // Homepage Product Showcase Tabs
  const [activeProductTab, setActiveProductTab] = useState<'bestsellers' | 'new' | 'offers'>('bestsellers');

  // Interactive Pay Small Small Simulator State
  const eligibleProducts = catalogProducts.filter((p) => p.paySmallSmall.eligible);
  const [selectedPssProductId, setSelectedPssProductId] = useState<string>('prod-1');
  const selectedPssProduct =
    eligibleProducts.find((p) => p.id === selectedPssProductId) || eligibleProducts[0] || null;
  const [selectedPssMonths, setSelectedPssMonths] = useState<number>(4);

  const pssCalculation = selectedPssProduct
    ? calculatePaySmallSmall(
        selectedPssProduct.price,
        selectedPssMonths,
        selectedPssProduct.paySmallSmall.depositPercentage,
        selectedPssProduct.paySmallSmall.fixedDepositAmount
      )
    : calculatePaySmallSmall(1500000, selectedPssMonths, 33.3333, 500000);

  // Interior Design Service Category Filter
  const [serviceFilter, setServiceFilter] = useState<string>('All');
  const filteredServices =
    serviceFilter === 'All'
      ? INTERIOR_DESIGN_SERVICES
      : INTERIOR_DESIGN_SERVICES.filter((s) => s.category === serviceFilter);

  // Consultation Form State
  const [consultName, setConsultName] = useState('');
  const [consultPhone, setConsultPhone] = useState('');
  const [consultService, setConsultService] = useState('Residential Interior Design');
  const [consultLocation, setConsultLocation] = useState('');
  const [consultBudget, setConsultBudget] = useState('₦2,500,000 – ₦5,000,000');
  const [consultNotes, setConsultNotes] = useState('');

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const nonDecorProducts = catalogProducts.filter(
    (p) => p.categorySlug !== 'interior-design-decor'
  );
  const tabFilteredProducts = nonDecorProducts.filter((p) => {
    if (activeProductTab === 'bestsellers') return p.isBestSeller;
    if (activeProductTab === 'new') return p.isNewArrival;
    return p.isExclusiveOffer;
  });
  const displayedTabProducts = (
    tabFilteredProducts.length > 0 ? tabFilteredProducts : nonDecorProducts
  ).slice(0, 6);

  const interiorDecorProducts = catalogProducts.filter(
    (p) => p.categorySlug === 'interior-design-decor' || p.categorySlug === 'mirrors-and-lighting'
  );

  const handleConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = `Hello CAF Interiors (Interior Design Consultation Desk),
• Client Name: ${consultName}
• Phone Number: ${consultPhone}
• Service Required: ${consultService}
• Property Location: ${consultLocation}
• Estimated Budget: ${consultBudget}
• Project Brief: ${consultNotes}`;
    showToast('Consultation request ready! Opening WhatsApp Concierge...');
    window.open(getWhatsAppUrl(msg), '_blank', 'noopener,noreferrer');
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubscribed(true);
    showToast('Welcome to the CAF Interiors Private Privilege List.');
    setNewsletterEmail('');
  };

  return (
    <>
      <Navbar />

      <main>
        {/* ===================================================================
            1. FULL-SCREEN LUXURY HERO SECTION
           =================================================================== */}
        <section id="home" className="hero-section">
          <div className="hero-bg" aria-hidden="true" />
          <div className="hero-overlay" aria-hidden="true" />
          <div className="hero-frame" aria-hidden="true" />

          <div className="hero-container">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              <span>CAF Interior and Exterior Service • Nigeria&apos;s Luxury Marketplace</span>
              <span className="hero-badge-dot" />
            </div>

            <h1 className="hero-main-headline">
              Transform Your Space.
              <br />
              <span className="gold-accent">Experience Luxury.</span>
            </h1>

            <p className="hero-slogan">
              &ldquo;Your Comfortability Is Our Priority.&rdquo; —{' '}
              <span className="hero-sub-slogan">Luxury Begins Beneath.</span>
            </p>

            <div className="hero-divider" aria-hidden="true">
              <span className="hero-divider-line" />
              <span className="hero-divider-diamond" />
              <span className="hero-divider-line" />
            </div>

            <p className="hero-description">
              Discover handcrafted Nigerian &amp; Italian-inspired luxury furniture, flexible{' '}
              <strong>Pay Small Small</strong> instalment plans, bespoke furniture manufacturing, and
              turnkey interior architecture for homes, hotels, churches, and corporate spaces.
            </p>

            <div className="hero-cta-group">
              <Link href="/shop" className="btn-gold">
                <span>Shop Now</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="#contact" className="btn-outline-gold">
                <span>Book a Consultation</span>
              </Link>
            </div>

            {/* Hero Trust & Business Model Bar */}
            <div className="hero-highlights-4col">
              <div className="hero-highlight-item">
                <span className="hero-highlight-title">14 Luxury Categories</span>
                <span className="hero-highlight-sub">Ready-Made &amp; Bespoke Pieces</span>
              </div>
              <div className="hero-highlight-item">
                <span className="hero-highlight-title">Pay Small Small</span>
                <span className="hero-highlight-sub">0% Hidden Fee Structured Plans</span>
              </div>
              <div className="hero-highlight-item">
                <span className="hero-highlight-title">13 Interior Services</span>
                <span className="hero-highlight-sub">Homes, Hotels, Offices &amp; Churches</span>
              </div>
              <div className="hero-highlight-item">
                <span className="hero-highlight-title">Nationwide Delivery</span>
                <span className="hero-highlight-sub">White-Glove Installation Across Nigeria</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            2. FEATURED FURNITURE COLLECTIONS (ALL 14 CATEGORIES)
           =================================================================== */}
        <section id="categories" className="categories-section">
          <div className="container">
            <div className="section-header-split">
              <div>
                <div className="eyebrow left-align">01 / Curated Departments</div>
                <h2 className="section-heading">
                  Explore Our <span className="gold-accent">Furniture Collections</span>
                </h2>
              </div>
              <div className="section-header-actions">
                <p className="section-subcopy">
                  Browse 14 specialized departments crafted for homeowners, developers, hotels,
                  offices, and places of worship across Nigeria.
                </p>
                <Link href="/shop" className="btn-outline-dark">
                  Open Full Marketplace &rarr;
                </Link>
              </div>
            </div>

            <div className="categories-bento-grid">
              {catalogCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className={`category-bento-card ${cat.featured ? 'featured' : ''}`}
                >
                  <img src={cat.image} alt={cat.name} loading="lazy" />
                  <div className="category-bento-overlay">
                    <span className="category-bento-count">
                      {cat.productCount} {cat.productCount === 1 ? 'Design' : 'Designs'}
                    </span>
                    <h3 className="category-bento-title">{cat.name}</h3>
                    <p className="category-bento-desc">{cat.description}</p>
                    <span className="category-bento-cta">Explore Collection &rarr;</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================================
            3. BEST-SELLERS, NEW ARRIVALS & EXCLUSIVE OFFERS
           =================================================================== */}
        <section className="marketplace-showcase-section">
          <div className="container">
            <div className="showcase-header">
              <div>
                <div className="eyebrow left-align">02 / The CAF Marketplace</div>
                <h2 className="section-heading">
                  Handcrafted <span className="gold-accent">Signature Pieces</span>
                </h2>
              </div>

              <div className="showcase-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeProductTab === 'bestsellers'}
                  className={`showcase-tab-btn ${activeProductTab === 'bestsellers' ? 'active' : ''}`}
                  onClick={() => setActiveProductTab('bestsellers')}
                >
                  Best-Selling Products
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeProductTab === 'new'}
                  className={`showcase-tab-btn ${activeProductTab === 'new' ? 'active' : ''}`}
                  onClick={() => setActiveProductTab('new')}
                >
                  New Arrivals
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeProductTab === 'offers'}
                  className={`showcase-tab-btn ${activeProductTab === 'offers' ? 'active' : ''}`}
                  onClick={() => setActiveProductTab('offers')}
                >
                  Exclusive Offers
                </button>
              </div>
            </div>

            {displayedTabProducts.length === 0 ? (
              <div className="shop-empty-box" style={{ margin: '1.5rem 0' }}>
                <h3>No signature furniture pieces currently published</h3>
                <p style={{ marginTop: '0.5rem', color: '#57534e' }}>
                  New handcrafted pieces added in the CAF Interiors Administration Portal will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="products-grid-3col">
                {displayedTabProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            <div className="showcase-footer-cta">
              <Link href="/shop" className="btn-gold">
                View All Products, Filter &amp; Compare Side-by-Side
              </Link>
            </div>
          </div>
        </section>

        {/* ===================================================================
            3B. INTERIOR DESIGN DECOR & FINISHING ACCENTS BOUTIQUE
           =================================================================== */}
        <section id="interior-decor" className="interior-decor-boutique-section">
          <div className="container">
            <div className="section-header-split">
              <div>
                <div className="eyebrow left-align">Curated Home Styling &amp; Accents</div>
                <h2 className="section-heading">
                  Shop Interior <span className="gold-accent">Design Decor &amp; Accents</span>
                </h2>
              </div>
              <div className="section-header-actions">
                <p className="section-subcopy">
                  Elevate every corner with our ready-to-ship 24K gold-leaf wall art, hand-knotted
                  silk &amp; wool area rugs, carved travertine vases, alabaster table lamps,crystal
                  chandeliers, and designer throw cushions.
                </p>
                <Link href="/shop?category=interior-design-decor" className="btn-gold">
                  Shop All Interior Decor &rarr;
                </Link>
              </div>
            </div>

            {/* Decor Category Highlights Strip */}
            <div className="decor-highlights-strip">
              <Link href="/shop?category=interior-design-decor" className="decor-pill-tag">
                ✦ 24K Gold-Leaf Wall Art
              </Link>
              <Link href="/shop?category=interior-design-decor" className="decor-pill-tag">
                ✦ Hand-Knotted Silk &amp; Wool Rugs
              </Link>
              <Link href="/shop?category=interior-design-decor" className="decor-pill-tag">
                ✦ Travertine &amp; Brass Vases
              </Link>
              <Link href="/shop?category=interior-design-decor" className="decor-pill-tag">
                ✦ Spanish Alabaster Table Lamps
              </Link>
              <Link href="/shop?category=mirrors-and-lighting" className="decor-pill-tag">
                ✦ Crystal Chandeliers &amp; Gilded Mirrors
              </Link>
              <Link href="/shop?category=interior-design-decor" className="decor-pill-tag">
                ✦ Centre-Table Styling Trays &amp; Oud Diffusers
              </Link>
              <Link href="/shop?category=interior-design-decor" className="decor-pill-tag">
                ✦ Bouclé &amp; Velvet Throw Cushions
              </Link>
            </div>

            <div className="products-grid-3col">
              {interiorDecorProducts.slice(0, 6).map((decorItem) => (
                <ProductCard key={decorItem.id} product={decorItem} />
              ))}
            </div>

            <div className="showcase-footer-cta">
              <Link href="/shop?category=interior-design-decor" className="btn-outline-dark">
                Explore Full Interior Design Decor Boutique ({interiorDecorProducts.length} Pieces) &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* ===================================================================
            4. PAY SMALL SMALL PROMOTIONAL SECTION & LIVE CALCULATOR
           =================================================================== */}
        <section id="pay-small-small" className="pss-promo-section">
          <div className="container">
            <div className="pss-promo-grid">
              {/* Left Narrative & How It Works */}
              <div className="pss-promo-narrative">
                <div className="eyebrow left-align">03 / Flexible Luxury Ownership</div>
                <h2 className="section-heading light">
                  Furnish With Ease Using{' '}
                  <span className="gold-accent">Pay Small Small</span>
                </h2>
                <p className="pss-lead">
                  Own heirloom-grade CAF Interiors furniture through structured, transparent
                  Nigerian Naira instalment plans tailored around your cashflow.
                </p>

                <div className="pss-steps-list">
                  <div className="pss-step-item">
                    <span className="pss-step-num">01</span>
                    <div>
                      <h4>Select an Eligible Luxury Piece</h4>
                      <p>
                        Look for the gold <strong>Pay Small Small</strong> badge on beds, sectionals,
                        dining suites, wardrobes, and kitchen cabinets.
                      </p>
                    </div>
                  </div>

                  <div className="pss-step-item">
                    <span className="pss-step-num">02</span>
                    <div>
                      <h4>Choose Your Instalment Duration &amp; Deposit</h4>
                      <p>
                        View your exact initial deposit (e.g. ₦500,000 on our ₦1,500,000 Luxury 6x6
                        Upholstered Bed) and spread the remaining ₦1,000,000 balance over 2 to 6
                        months.
                      </p>
                    </div>
                  </div>

                  <div className="pss-step-item">
                    <span className="pss-step-num">03</span>
                    <div>
                      <h4>CAF Interiors Review, Verification &amp; Tracking</h4>
                      <p>
                        Our administration reviews and approves your instalment schedule. Track every
                        verified payment, balance, and delivery milestone in your dashboard.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pss-policy-banner">
                  <strong>Important Terms:</strong> Payment durations and deposit percentages are
                  configured per product. Instalment arrangements are subject to CAF Interiors
                  review and approval, and payments are only credited upon verified gateway or bank
                  confirmation.
                </div>
              </div>

              {/* Right Interactive Pay Small Small Calculator */}
              <div className="pss-calculator-card">
                <div className="pss-calc-header">
                  <span className="badge-pss">Interactive Instalment Planner</span>
                  <h3>Calculate Your Pay Small Small Schedule</h3>
                </div>

                <div className="form-group">
                  <label htmlFor="pssProductSelect" className="form-label">
                    1. Select Eligible Product
                  </label>
                  {selectedPssProduct ? (
                    <select
                      id="pssProductSelect"
                      className="form-select"
                      value={selectedPssProduct.id}
                      onChange={(e) => {
                        const nextProd = eligibleProducts.find((p) => p.id === e.target.value);
                        setSelectedPssProductId(e.target.value);
                        if (
                          nextProd &&
                          !nextProd.paySmallSmall.allowedDurationsMonths.includes(selectedPssMonths)
                        ) {
                          setSelectedPssMonths(nextProd.paySmallSmall.allowedDurationsMonths[0]);
                        }
                      }}
                    >
                      {eligibleProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatNaira(p.price)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="form-select" style={{ opacity: 0.85 }}>
                      Reference Plan — ₦1,500,000 Luxury Furniture Suite
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">2. Choose Approved Duration</label>
                  <div className="pss-duration-pills">
                    {(selectedPssProduct?.paySmallSmall.allowedDurationsMonths || [2, 3, 4, 6]).map((months) => (
                      <button
                        key={months}
                        type="button"
                        className={`pss-duration-pill ${selectedPssMonths === months ? 'active' : ''}`}
                        onClick={() => setSelectedPssMonths(months)}
                      >
                        {months} Months
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pss-calc-summary-grid">
                  <div className="pss-calc-stat">
                    <span className="stat-label">Full Product Price</span>
                    <span className="stat-value">{formatNaira(pssCalculation.fullPrice)}</span>
                  </div>
                  <div className="pss-calc-stat gold-box">
                    <span className="stat-label">Required Initial Deposit</span>
                    <span className="stat-value">{formatNaira(pssCalculation.initialDeposit)}</span>
                  </div>
                  <div className="pss-calc-stat">
                    <span className="stat-label">Remaining Balance</span>
                    <span className="stat-value">{formatNaira(pssCalculation.remainingBalance)}</span>
                  </div>
                  <div className="pss-calc-stat">
                    <span className="stat-label">Monthly Instalment ({selectedPssMonths}x)</span>
                    <span className="stat-value gold-text">
                      {formatNaira(pssCalculation.monthlyInstalment)}/mo
                    </span>
                  </div>
                </div>

                {/* Generated Payment Schedule Table */}
                <div className="pss-schedule-box">
                  <div className="pss-schedule-title">Projected Payment Schedule</div>
                  <div className="pss-schedule-rows">
                    {pssCalculation.schedule.map((row) => (
                      <div key={row.instalmentNumber} className="pss-schedule-row">
                        <span>{row.dueDateLabel}</span>
                        <strong>{formatNaira(row.amount)}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pss-calc-actions">
                  {selectedPssProduct ? (
                    <>
                      <button
                        type="button"
                        className="btn-gold"
                        style={{ width: '100%' }}
                        onClick={() => {
                          addToCart(selectedPssProduct, {
                            paymentPlan: 'PAY_SMALL_SMALL',
                            instalmentMonths: selectedPssMonths,
                          });
                          setCartOpen(true);
                        }}
                      >
                        Apply for This Plan ({formatNaira(pssCalculation.initialDeposit)} Initial Deposit)
                      </button>
                      <Link
                        href={`/product/${selectedPssProduct.slug}`}
                        className="pss-view-product-link"
                      >
                        Inspect Full Product Details &rarr;
                      </Link>
                    </>
                  ) : (
                    <Link href="/pay-small-small" className="btn-gold" style={{ width: '100%', textAlign: 'center' }}>
                      Explore Pay Small Small Financing &rarr;
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            5. OUR INTERIOR DESIGN SERVICES (ALL 13 SERVICES)
           =================================================================== */}
        <section id="interior-design" className="interior-services-section">
          <div className="container">
            <div className="section-header-split">
              <div>
                <div className="eyebrow left-align">04 / Architectural &amp; Interior Mastery</div>
                <h2 className="section-heading">
                  Our Interior &amp; Exterior <span className="gold-accent">Design Services</span>
                </h2>
              </div>

              <div className="showcase-tabs">
                {['All', 'Residential', 'Commercial & Institutional', 'Specialist Finishes'].map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`showcase-tab-btn ${serviceFilter === cat ? 'active' : ''}`}
                      onClick={() => setServiceFilter(cat)}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="interior-services-grid">
              {filteredServices.map((srv, idx) => (
                <article key={srv.id} className="interior-service-card">
                  <div className="interior-service-img">
                    <img src={srv.image} alt={srv.title} loading="lazy" />
                    <span className="interior-service-tag">{srv.category}</span>
                    <span className="service-number">{String(idx + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="interior-service-body">
                    <h3>{srv.title}</h3>
                    <p>{srv.shortDescription}</p>
                    <ul className="interior-service-features">
                      {srv.features.map((f) => (
                        <li key={f}>✦ {f}</li>
                      ))}
                    </ul>
                    <div className="interior-service-footer">
                      <span className="estimate-badge">{srv.startingEstimate}</span>
                      <a
                        href={getWhatsAppUrl(
                          `Hello CAF Interiors, I would like to book a consultation for ${srv.title}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="service-link"
                      >
                        Book Service &rarr;
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================================
            6. BESPOKE CUSTOM FURNITURE COMMISSION BANNER
           =================================================================== */}
        <section id="custom-furniture" className="custom-commission-banner">
          <div className="container">
            <div className="custom-commission-card">
              <div className="custom-commission-content">
                <div className="eyebrow left-align">05 / Bespoke Manufacturing Studio</div>
                <h2 className="section-heading light">
                  Have a Unique Design Concept?{' '}
                  <span className="gold-accent">We Build Custom Furniture to Measure.</span>
                </h2>
                <p>
                  Submit your reference pictures, architectural sketches, exact room measurements,
                  preferred hardwood or marble materials, and finishing palette. Our master makers
                  fabricate bespoke furniture for villas, estates, hotels, churches, and offices.
                </p>
                <div className="hero-cta-group" style={{ justifyContent: 'flex-start', marginBottom: 0 }}>
                  <button
                    type="button"
                    className="btn-gold"
                    onClick={() => openCustomModal({ defaultCategory: 'Custom Furniture' })}
                  >
                    Launch Custom Furniture Order Form
                  </button>
                  <a
                    href={getWhatsAppUrl(
                      'Hello CAF Interiors, I have reference pictures for a custom furniture commission and would like a quotation.'
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline-gold"
                  >
                    Send Photos via WhatsApp
                  </a>
                </div>
              </div>

              <div className="custom-commission-steps">
                <div className="commission-mini-card">
                  <span>Step 01</span>
                  <h4>Upload Reference &amp; Dimensions</h4>
                  <p>Share photos, sketches, and room measurements.</p>
                </div>
                <div className="commission-mini-card">
                  <span>Step 02</span>
                  <h4>Receive Official Quotation</h4>
                  <p>Review itemised pricing &amp; Pay Small Small options.</p>
                </div>
                <div className="commission-mini-card">
                  <span>Step 03</span>
                  <h4>Workshop Fabrication &amp; Delivery</h4>
                  <p>Track production milestones through to white-glove installation.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            7. FEATURED COMPLETED PROJECTS
           =================================================================== */}
        <section id="projects" className="completed-projects-section">
          <div className="container">
            <div className="services-header">
              <div className="eyebrow">06 / Portfolio of Excellence</div>
              <h2 className="section-heading">
                Featured <span className="gold-accent">Completed Projects</span>
              </h2>
              <p className="services-subtitle" style={{ color: '#57534e' }}>
                A glimpse into residences, cathedrals, and hospitality landmarks transformed by CAF
                Interior and Exterior Service across Nigeria.
              </p>
            </div>

            <div className="projects-grid-2col">
              {COMPLETED_PROJECTS.map((project) => (
                <article key={project.id} className="project-showcase-card">
                  <div className="project-showcase-img">
                    <img src={project.image} alt={project.title} loading="lazy" />
                    <span className="project-location-badge">
                      {project.location} • {project.completionYear}
                    </span>
                  </div>
                  <div className="project-showcase-body">
                    <span className="project-category-label">{project.category}</span>
                    <h3>{project.title}</h3>
                    <p className="project-scope">
                      <strong>Scope:</strong> {project.scope}
                    </p>
                    <p className="project-summary">{project.summary}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================================
            8. WHY CHOOSE CAF INTERIORS & BRAND STORY (ABOUT, MISSION, VISION)
           =================================================================== */}
        <section id="about" className="why-choose-section">
          <div className="container">
            <div className="services-header">
              <div className="eyebrow">07 / The CAF Standard</div>
              <h2 className="section-heading light">
                Why Discerning Nigerians Choose{' '}
                <span className="gold-accent">CAF Interiors</span>
              </h2>
              <p className="services-subtitle">
                &ldquo;Your Comfortability Is Our Priority.&rdquo; — Luxury Begins Beneath.
              </p>
            </div>

            <div className="why-grid-3col">
              <div className="why-card">
                <span className="why-num">01</span>
                <h3>Master Nigerian &amp; Global Craftsmanship</h3>
                <p>
                  Kiln-dried seasoned mahogany, stain-repellent European bouclé and velvets, natural
                  stone slabs, and brushed PVD brass engineered for generational durability.
                </p>
              </div>
              <div className="why-card">
                <span className="why-num">02</span>
                <h3>Transparent Pay Small Small Financing</h3>
                <p>
                  Lock in factory-direct luxury pricing with clear deposit requirements, automated
                  payment schedules, and zero hidden charges.
                </p>
              </div>
              <div className="why-card">
                <span className="why-num">03</span>
                <h3>End-to-End Interior &amp; Exterior Mastery</h3>
                <p>
                  From single bespoke beds to 1,500-seat church acoustic projects, hotels, and duplex
                  transformations managed under one roof.
                </p>
              </div>
            </div>

            {/* Preserved Brand Heritage, Mission & Vision */}
            <div className="philosophy-grid" style={{ marginTop: '3.5rem' }}>
              <div id="mission" className="philosophy-card dark-variant">
                <div className="eyebrow left-align">Our Mission</div>
                <h2>Transforming Everyday Spaces</h2>
                <p>
                  To transform everyday spaces into beautiful, functional, and inspiring
                  environments by delivering quality furniture, creative interior solutions, and
                  exceptional customer experiences.
                </p>
              </div>
              <div id="vision" className="philosophy-card dark-variant">
                <div className="eyebrow left-align">Our Vision</div>
                <h2>Global Luxury Recognition</h2>
                <p>
                  To become a trusted and recognized brand in furniture and interior design, known
                  for innovation, outstanding craftsmanship, timeless aesthetics, and our ability to
                  transform the way people experience their spaces, and to become a globally
                  recognized name in the luxury interior design world.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            9. CUSTOMER TESTIMONIALS
           =================================================================== */}
        <section className="testimonials-section">
          <div className="container">
            <div className="services-header">
              <div className="eyebrow">08 / Client Endorsements</div>
              <h2 className="section-heading">
                Trusted by Homeowners, <span className="gold-accent">Developers &amp; Leaders</span>
              </h2>
            </div>

            <div className="testimonials-grid">
              {CUSTOMER_TESTIMONIALS.map((t) => (
                <blockquote key={t.id} className="testimonial-card">
                  <div className="testimonial-stars">{'★'.repeat(t.rating)}</div>
                  <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                  <footer className="testimonial-author">
                    <strong>{t.clientName}</strong>
                    <span>
                      {t.clientRole} • {t.location}
                    </span>
                    <small className="gold-text">{t.projectOrProduct}</small>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================================
            10. CUSTOMER ACCOUNT & PROJECT TRACKER PREVIEW + CONSULTATION BOOKING
           =================================================================== */}
        <section id="contact" className="contact-section">
          <div className="container">
            <div className="contact-header">
              <div className="eyebrow">09 / Book a Consultation &amp; Direct Support</div>
              <h2 className="section-heading">
                Let&apos;s Create Something <span className="gold-accent">Beautiful Together.</span>
              </h2>
              <p className="contact-intro">
                Book an interior design consultation, inquire about a Pay Small Small plan, or speak
                directly with our project architects.
              </p>
            </div>

            <div className="contact-layout">
              {/* Left: Direct Channels & Account Portal Preview */}
              <div className="contact-channels-panel">
                <div className="contact-channels-grid">
                  <a
                    href="https://wa.me/2349030262160"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-card"
                  >
                    <div className="contact-card-icon">WA</div>
                    <div className="contact-card-info">
                      <span className="contact-card-label">WhatsApp Concierge</span>
                      <span className="contact-card-value">+234 903 026 2160</span>
                    </div>
                  </a>

                  <a href="tel:+2349030262160" className="contact-card">
                    <div className="contact-card-icon">TEL</div>
                    <div className="contact-card-info">
                      <span className="contact-card-label">Direct Line</span>
                      <span className="contact-card-value">+234 903 026 2160</span>
                    </div>
                  </a>

                  <a href="mailto:cafinterior01@gmail.com" className="contact-card full-span">
                    <div className="contact-card-icon">✉</div>
                    <div className="contact-card-info">
                      <span className="contact-card-label">Official Email</span>
                      <span className="contact-card-value">cafinterior01@gmail.com</span>
                    </div>
                  </a>

                  <a
                    href="https://www.instagram.com/caf_interior_?vrfl=aGMwZXA5NGdlYXps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-card"
                  >
                    <div className="contact-card-icon">IG</div>
                    <div className="contact-card-info">
                      <span className="contact-card-label">Instagram</span>
                      <span className="contact-card-value">@caf_interior_</span>
                    </div>
                  </a>

                  <a
                    href="https://www.facebook.com/share/1JoobLxXsi/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-card"
                  >
                    <div className="contact-card-icon">FB</div>
                    <div className="contact-card-info">
                      <span className="contact-card-label">Facebook</span>
                      <span className="contact-card-value">CAF Interiors</span>
                    </div>
                  </a>
                </div>

                <div id="account" className="account-preview-banner">
                  <span className="badge-pss">My Account &amp; Project Portal</span>
                  <h4>Track Orders, Instalments &amp; Interior Milestones</h4>
                  <p>
                    Existing clients can monitor their Pay Small Small balance, download official
                    receipts, review custom furniture quotations, and track ongoing site milestones.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <Link href="/shop" className="btn-gold">
                      Browse Marketplace
                    </Link>
                    <button
                      type="button"
                      className="btn-outline-gold"
                      onClick={() => openCustomModal({ defaultCategory: 'Custom Furniture' })}
                    >
                      Submit Custom Request
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Interior Design Project & Consultation Booking Form */}
              <div className="enquiry-form-card">
                <div>
                  <h3 className="enquiry-form-title">Book an Interior Design Consultation</h3>
                  <p className="enquiry-form-sub">
                    Submit your project details, budget, and property location to schedule a private
                    design session.
                  </p>
                </div>

                <form onSubmit={handleConsultationSubmit}>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Chief Adebayo Williams"
                        value={consultName}
                        onChange={(e) => setConsultName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone / WhatsApp Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="e.g. 0803 000 0000"
                        value={consultPhone}
                        onChange={(e) => setConsultPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">Interior Design Service</label>
                      <select
                        className="form-select"
                        value={consultService}
                        onChange={(e) => setConsultService(e.target.value)}
                      >
                        {INTERIOR_DESIGN_SERVICES.map((s) => (
                          <option key={s.id} value={s.title}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Estimated Project Budget (₦)</label>
                      <select
                        className="form-select"
                        value={consultBudget}
                        onChange={(e) => setConsultBudget(e.target.value)}
                      >
                        <option value="₦1,000,000 – ₦2,500,000">₦1,000,000 – ₦2,500,000</option>
                        <option value="₦2,500,000 – ₦5,000,000">₦2,500,000 – ₦5,000,000</option>
                        <option value="₦5,000,000 – ₦15,000,000">₦5,000,000 – ₦15,000,000</option>
                        <option value="₦15,000,000+ (Full Villa / Commercial)">
                          ₦15,000,000+ (Full Villa / Commercial)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Property Location (City &amp; State)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ikoyi, Lagos / Asokoro, Abuja / GRA, Port Harcourt"
                      value={consultLocation}
                      onChange={(e) => setConsultLocation(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Project Scope &amp; Timeline</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Describe the rooms, property type, or upload reference photos in our chat..."
                      value={consultNotes}
                      onChange={(e) => setConsultNotes(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-gold form-submit-btn">
                    Schedule Consultation with CAF Interiors
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            11. NEWSLETTER SUBSCRIPTION
           =================================================================== */}
        <section className="newsletter-section">
          <div className="container">
            <div className="newsletter-box">
              <div>
                <span className="eyebrow left-align">Private Privilege List</span>
                <h3>Subscribe to the CAF Interiors Journal</h3>
                <p>
                  Receive early access to new bespoke collections, seasonal exclusive offers, and
                  Pay Small Small priority slots.
                </p>
              </div>

              {newsletterSubscribed ? (
                <div className="newsletter-success">
                  ✓ Thank you for subscribing. You are now on the CAF Interiors Private List.
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
                  <input
                    type="email"
                    placeholder="Enter your email address..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn-gold">
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
