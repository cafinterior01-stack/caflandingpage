'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [clientName, setClientName] = useState('');
  const [serviceType, setServiceType] = useState('Bespoke Furniture Solutions');
  const [projectNote, setProjectNote] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const elements = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const greeting = clientName.trim()
      ? `Hello CAF Interiors, my name is ${clientName.trim()}.`
      : 'Hello CAF Interiors,';
    const body = `${greeting} I am interested in ${serviceType}.${
      projectNote.trim() ? ` Project details: ${projectNote.trim()}` : ''
    }`;
    const whatsappUrl = `https://wa.me/2349030262160?text=${encodeURIComponent(body)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* =====================================================================
          HEADER & NAVIGATION
         ===================================================================== */}
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-inner">
          <Link href="#home" className="brand-logo" onClick={closeMenu}>
            <div className="brand-monogram" aria-hidden="true">
              CAF
            </div>
            <div className="brand-text">
              <span className="brand-name">CAF INTERIORS</span>
              <span className="brand-tagline">Your Comfortability Is Our Priority.</span>
            </div>
          </Link>

          <nav className="desktop-nav" aria-label="Primary Navigation">
            <Link href="#home" className="nav-link">
              Home
            </Link>
            <Link href="#about" className="nav-link">
              About Us
            </Link>
            <Link href="#services" className="nav-link">
              Services
            </Link>
            <Link href="#mission" className="nav-link">
              Our Mission
            </Link>
            <Link href="#vision" className="nav-link">
              Our Vision
            </Link>
            <Link href="#contact" className="nav-link">
              Contact
            </Link>
          </nav>

          <div className="header-actions">
            <a
              href="https://wa.me/2349030262160"
              target="_blank"
              rel="noopener noreferrer"
              className="header-cta"
            >
              <span>Inquire Now</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <button
            type="button"
            className={`mobile-menu-toggle ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            <div className="hamburger-lines">
              <span />
              <span />
              <span />
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div
        className={`mobile-drawer-backdrop ${menuOpen ? 'open' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />
      <aside className={`mobile-drawer ${menuOpen ? 'open' : ''}`} aria-label="Mobile Navigation">
        <nav className="mobile-nav-list">
          <Link href="#home" className="mobile-nav-link" onClick={closeMenu}>
            <span>Home</span>
            <span className="index">01</span>
          </Link>
          <Link href="#about" className="mobile-nav-link" onClick={closeMenu}>
            <span>About Us</span>
            <span className="index">02</span>
          </Link>
          <Link href="#services" className="mobile-nav-link" onClick={closeMenu}>
            <span>Services</span>
            <span className="index">03</span>
          </Link>
          <Link href="#mission" className="mobile-nav-link" onClick={closeMenu}>
            <span>Our Mission</span>
            <span className="index">04</span>
          </Link>
          <Link href="#vision" className="mobile-nav-link" onClick={closeMenu}>
            <span>Our Vision</span>
            <span className="index">05</span>
          </Link>
          <Link href="#contact" className="mobile-nav-link" onClick={closeMenu}>
            <span>Contact</span>
            <span className="index">06</span>
          </Link>
        </nav>

        <div className="mobile-drawer-footer">
          <p className="mobile-drawer-slogan">&ldquo;Your Comfortability Is Our Priority.&rdquo;</p>
          <a
            href="https://wa.me/2349030262160"
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-drawer-cta"
            onClick={closeMenu}
          >
            Chat on WhatsApp
          </a>
        </div>
      </aside>

      <main>
        {/* ===================================================================
            HERO SECTION
           =================================================================== */}
        <section id="home" className="hero-section">
          <div className="hero-bg" aria-hidden="true" />
          <div className="hero-overlay" aria-hidden="true" />
          <div className="hero-frame" aria-hidden="true" />

          <div className="hero-container">
            <div className="hero-badge reveal visible">
              <span className="hero-badge-dot" />
              <span>Luxury Interior Design &amp; Bespoke Furniture</span>
              <span className="hero-badge-dot" />
            </div>

            <h1 className="hero-brand-title reveal visible reveal-delay-1">CAF INTERIORS</h1>

            <h2 className="hero-slogan reveal visible reveal-delay-1">
              &ldquo;Your Comfortability Is Our Priority.&rdquo;
            </h2>

            <div className="hero-divider reveal visible reveal-delay-2" aria-hidden="true">
              <span className="hero-divider-line" />
              <span className="hero-divider-diamond" />
              <span className="hero-divider-line" />
            </div>

            <p className="hero-description reveal visible reveal-delay-2">
              We create beautiful, functional, and inspiring spaces through exceptional furniture,
              thoughtful interior design, and quality craftsmanship.
            </p>

            <div className="hero-cta-group reveal visible reveal-delay-3">
              <Link href="#services" className="btn-gold">
                <span>Explore Our Services</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="#contact" className="btn-outline-gold">
                <span>Contact Us</span>
              </Link>
            </div>

            <div className="hero-highlights reveal visible reveal-delay-3">
              <div className="hero-highlight-item">
                <span className="hero-highlight-title">Bespoke Craftsmanship</span>
                <span className="hero-highlight-sub">Tailored Luxury Furniture</span>
              </div>
              <div className="hero-highlight-item">
                <span className="hero-highlight-title">Signature Interiors</span>
                <span className="hero-highlight-sub">Residential &amp; Commercial</span>
              </div>
              <div className="hero-highlight-item">
                <span className="hero-highlight-title">Unrivalled Comfort</span>
                <span className="hero-highlight-sub">Designed Around Your Lifestyle</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            ABOUT US SECTION
           =================================================================== */}
        <section id="about" className="about-section">
          <div className="container">
            <div className="about-grid">
              <div className="about-visual reveal">
                <div className="about-image-main">
                  <img
                    src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85"
                    alt="Luxury living room interior curated by CAF Interiors"
                    loading="lazy"
                  />
                </div>
                <div className="about-image-secondary">
                  <img
                    src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80"
                    alt="Bespoke handcrafted furniture details"
                    loading="lazy"
                  />
                </div>
                <div className="about-floating-badge">
                  <div className="badge-title">CAF Interiors</div>
                  <div className="badge-sub">Excellence in Every Detail</div>
                </div>
              </div>

              <div className="about-content reveal reveal-delay-1">
                <div className="eyebrow left-align">01 / Our Heritage &amp; Story</div>
                <h2 className="section-heading">
                  About <span className="gold-accent">CAF Interiors</span>
                </h2>

                <p className="lead-paragraph">
                  CAF Interiors is a furniture and interior design brand committed to transforming
                  spaces through creativity, craftsmanship, and thoughtful design.
                </p>

                <p>
                  We specialize in furniture solutions, interior decoration, and customized designs
                  that combine beauty, comfort, and functionality.
                </p>

                <p>
                  Our goal is to help individuals and businesses create spaces that reflect their
                  personality, lifestyle, and aspirations.
                </p>

                <div className="about-quote-box">
                  <p className="about-quote-text">&ldquo;Your Comfortability Is Our Priority.&rdquo;</p>
                </div>

                <div className="about-pillars">
                  <div className="about-pillar">
                    <span className="about-pillar-num">01</span>
                    <span className="about-pillar-label">Bespoke Design</span>
                  </div>
                  <div className="about-pillar">
                    <span className="about-pillar-num">02</span>
                    <span className="about-pillar-label">Master Craftsmanship</span>
                  </div>
                  <div className="about-pillar">
                    <span className="about-pillar-num">03</span>
                    <span className="about-pillar-label">Absolute Comfort</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SIGNATURE SERVICES SECTION
           =================================================================== */}
        <section id="services" className="services-section">
          <div className="container">
            <div className="services-header reveal">
              <div className="eyebrow">02 / What We Do</div>
              <h2 className="section-heading light">
                Signature <span className="gold-accent">Luxury Services</span>
              </h2>
              <p className="services-subtitle">
                Every CAF Interiors commission blends architectural harmony, sumptuous materials,
                and uncompromising comfort tailored to your space.
              </p>
            </div>

            <div className="services-grid">
              <article className="service-card reveal">
                <div className="service-image-wrap">
                  <img
                    src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80"
                    alt="Bespoke luxury furniture craftsmanship"
                    loading="lazy"
                  />
                  <span className="service-number">01</span>
                </div>
                <div className="service-body">
                  <h3 className="service-title">Bespoke Furniture Solutions</h3>
                  <p className="service-desc">
                    Statement sofas, sculptural dining sets, executive suites, and custom cabinetry
                    handcrafted with finest woods, sumptuous fabrics, and enduring finishes.
                  </p>
                  <a
                    href="https://wa.me/2349030262160"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="service-link"
                  >
                    <span>Request Commission</span>
                    <span>&rarr;</span>
                  </a>
                </div>
              </article>

              <article className="service-card reveal reveal-delay-1">
                <div className="service-image-wrap">
                  <img
                    src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80"
                    alt="Luxury interior decoration and styling"
                    loading="lazy"
                  />
                  <span className="service-number">02</span>
                </div>
                <div className="service-body">
                  <h3 className="service-title">Luxury Interior Decoration</h3>
                  <p className="service-desc">
                    Curated lighting, textures, color palettes, drapery, and artisanal decor that
                    elevate residences, penthouses, and hospitality spaces into timeless sanctuaries.
                  </p>
                  <a
                    href="https://wa.me/2349030262160"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="service-link"
                  >
                    <span>Book Styling Consultation</span>
                    <span>&rarr;</span>
                  </a>
                </div>
              </article>

              <article className="service-card reveal reveal-delay-2">
                <div className="service-image-wrap">
                  <img
                    src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80"
                    alt="Customized spatial interior design"
                    loading="lazy"
                  />
                  <span className="service-number">03</span>
                </div>
                <div className="service-body">
                  <h3 className="service-title">Customized Spatial Design</h3>
                  <p className="service-desc">
                    End-to-end spatial planning and turnkey interior transformation designed around
                    your personality, lifestyle, business identity, and comfort.
                  </p>
                  <a
                    href="https://wa.me/2349030262160"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="service-link"
                  >
                    <span>Start Your Project</span>
                    <span>&rarr;</span>
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ===================================================================
            MISSION & VISION SECTIONS
           =================================================================== */}
        <div className="philosophy-wrapper">
          <div className="container">
            <div className="philosophy-header reveal">
              <div className="eyebrow">03 / Purpose &amp; Direction</div>
              <h2 className="section-heading">
                Driven by <span className="gold-accent">Excellence &amp; Comfort</span>
              </h2>
            </div>

            <div className="philosophy-grid">
              {/* Mission */}
              <section id="mission" className="philosophy-card reveal">
                <div className="philosophy-icon" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div className="eyebrow left-align">Our Purpose</div>
                <h2 className="section-title">Our Mission</h2>
                <p>
                  To transform everyday spaces into beautiful, functional, and inspiring
                  environments by delivering quality furniture, creative interior solutions, and
                  exceptional customer experiences.
                </p>
                <span className="philosophy-watermark" aria-hidden="true">
                  01
                </span>
              </section>

              {/* Vision */}
              <section id="vision" className="philosophy-card dark-variant reveal reveal-delay-1">
                <div className="philosophy-icon" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <div className="eyebrow left-align">Our Future</div>
                <h2 className="section-title">Our Vision</h2>
                <p>
                  To become a trusted and recognized brand in furniture and interior design, known
                  for innovation, outstanding craftsmanship, timeless aesthetics, and our ability to
                  transform the way people experience their spaces, and to become a globally
                  recognized name in the luxury interior design world.
                </p>
                <span className="philosophy-watermark" aria-hidden="true">
                  02
                </span>
              </section>
            </div>
          </div>
        </div>

        {/* ===================================================================
            UNDER CONSTRUCTION SECTION
           =================================================================== */}
        <section id="construction" className="construction-section">
          <div className="construction-bg-glow" aria-hidden="true" />
          <div className="container">
            <div className="construction-box reveal">
              <div className="orbital-loader" role="status" aria-label="Digital showroom in progress">
                <div className="orbital-ring-outer" />
                <div className="orbital-ring-inner" />
                <div className="orbital-core" />
              </div>

              <div className="eyebrow">Digital Showroom Expansion</div>

              <h2 className="construction-title">
                OUR NEW WEBSITE
                <br />
                IS UNDER CONSTRUCTION
              </h2>

              <div className="construction-text-group">
                <p className="highlight">We&apos;re building something beautiful!</p>
                <p>
                  Our full website is currently under development and will be launching soon.
                </p>
                <p>
                  We&apos;re working hard to bring you a better online experience where you can
                  discover our furniture collections, explore our interior design services, and
                  connect with CAF Interiors more easily.
                </p>
                <p className="highlight">Stay connected. Something beautiful is coming!</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            CONTACT SECTION
           =================================================================== */}
        <section id="contact" className="contact-section">
          <div className="container">
            <div className="contact-header reveal">
              <div className="eyebrow">04 / Private Consultation</div>
              <h2 className="section-heading">
                Let&apos;s Create Something <span className="gold-accent">Beautiful Together.</span>
              </h2>
              <p className="contact-intro">
                Have a furniture enquiry or an interior design project in mind? We&apos;d love to
                hear from you.
              </p>
            </div>

            <div className="contact-layout">
              <div className="contact-channels-panel reveal">
                <div className="contact-channels-grid">
                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/2349030262160"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-card"
                  >
                    <div className="contact-card-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                    </div>
                    <div className="contact-card-info">
                      <span className="contact-card-label">WhatsApp Concierge</span>
                      <span className="contact-card-value">+234 903 026 2160</span>
                    </div>
                  </a>

                  {/* Phone */}
                  <a href="tel:+2349030262160" className="contact-card">
                    <div className="contact-card-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <div className="contact-card-info">
                      <span className="contact-card-label">Direct Line</span>
                      <span className="contact-card-value">Phone Call</span>
                    </div>
                  </a>

                  {/* Email */}
                  <a href="mailto:cafinterior01@gmail.com" className="contact-card full-span">
                    <div className="contact-card-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                    <div className="contact-card-info">
                      <span className="contact-card-label">Official Email</span>
                      <span className="contact-card-value">cafinterior01@gmail.com</span>
                    </div>
                  </a>

                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/caf_interior_?vrfl=aGMwZXA5NGdlYXps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-card"
                  >
                    <div className="contact-card-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </div>
                    <div className="contact-card-info">
                      <span className="contact-card-label">Instagram</span>
                      <span className="contact-card-value">@caf_interior_</span>
                    </div>
                  </a>

                  {/* Facebook */}
                  <a
                    href="https://www.facebook.com/share/1JoobLxXsi/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-card"
                  >
                    <div className="contact-card-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                      </svg>
                    </div>
                    <div className="contact-card-info">
                      <span className="contact-card-label">Facebook</span>
                      <span className="contact-card-value">CAF Interiors</span>
                    </div>
                  </a>
                </div>

                <div className="about-quote-box" style={{ margin: 0 }}>
                  <p className="about-quote-text">
                    &ldquo;Your Comfortability Is Our Priority.&rdquo;
                  </p>
                </div>
              </div>

              {/* Interactive Direct Consultation Form */}
              <div className="enquiry-form-card reveal reveal-delay-1">
                <div>
                  <h3 className="enquiry-form-title">Begin Your Consultation</h3>
                  <p className="enquiry-form-sub">
                    Share your vision below to connect directly with our design concierge on
                    WhatsApp.
                  </p>
                </div>

                <form onSubmit={handleEnquirySubmit}>
                  <div className="form-group">
                    <label htmlFor="clientName" className="form-label">
                      Your Name
                    </label>
                    <input
                      id="clientName"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Adebayo Williams"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="serviceType" className="form-label">
                      Service of Interest
                    </label>
                    <select
                      id="serviceType"
                      className="form-select"
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                    >
                      <option value="Bespoke Furniture Solutions">Bespoke Furniture Solutions</option>
                      <option value="Luxury Interior Decoration">Luxury Interior Decoration</option>
                      <option value="Customized Spatial Design">Customized Spatial Design</option>
                      <option value="Commercial / Corporate Interior Project">
                        Commercial / Corporate Interior Project
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="projectNote" className="form-label">
                      Project Brief or Enquiry
                    </label>
                    <textarea
                      id="projectNote"
                      className="form-textarea"
                      placeholder="Tell us about the space or furniture piece you have in mind..."
                      value={projectNote}
                      onChange={(e) => setProjectNote(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn-gold form-submit-btn">
                    <span>Send Enquiry via WhatsApp</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================================
          FOOTER
         ===================================================================== */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-top">
            <div>
              <Link href="#home" className="brand-logo">
                <div className="brand-monogram" aria-hidden="true">
                  CAF
                </div>
                <div className="brand-text">
                  <span className="brand-name">CAF INTERIORS</span>
                  <span className="brand-tagline">Luxury Interior &amp; Bespoke Furniture</span>
                </div>
              </Link>
              <p className="footer-brand-slogan">
                &ldquo;Your Comfortability Is Our Priority.&rdquo;
              </p>
              <p className="footer-brand-desc">
                Transforming everyday spaces into timeless sanctuaries through exceptional
                furniture, thoughtful interior design, and uncompromising craftsmanship.
              </p>
            </div>

            <div>
              <h3 className="footer-col-title">Navigation</h3>
              <nav className="footer-links" aria-label="Footer Navigation">
                <Link href="#home">Home</Link>
                <Link href="#about">About Us</Link>
                <Link href="#services">Services</Link>
                <Link href="#mission">Mission</Link>
                <Link href="#vision">Vision</Link>
                <Link href="#contact">Contact</Link>
              </nav>
            </div>

            <div>
              <h3 className="footer-col-title">Direct Connect</h3>
              <div className="footer-links">
                <a href="https://wa.me/2349030262160" target="_blank" rel="noopener noreferrer">
                  WhatsApp: +234 903 026 2160
                </a>
                <a href="tel:+2349030262160">Phone: +234 903 026 2160</a>
                <a href="mailto:cafinterior01@gmail.com">cafinterior01@gmail.com</a>
                <a
                  href="https://www.instagram.com/caf_interior_?vrfl=aGMwZXA5NGdlYXps"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram: @caf_interior_
                </a>
                <a
                  href="https://www.facebook.com/share/1JoobLxXsi/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook: CAF Interiors
                </a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© 2026 CAF Interiors. All Rights Reserved.</div>
            <div className="footer-coming-soon">Our full website is coming soon.</div>
          </div>
        </div>
      </footer>
    </>
  );
}
