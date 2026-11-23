'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { INTERIOR_DESIGN_SERVICES } from '@/lib/catalog-data';
import { getWhatsAppUrl } from '@/lib/format';
import { useMarketplace } from '@/context/MarketplaceContext';

export default function ContactPage() {
  const { showToast } = useMarketplace();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('Product Enquiry');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Hello CAF Interiors (${topic}),
• Name: ${name}
• Phone: ${phone}
• Location: ${location}
• Enquiry: ${message}`;
    showToast('Connecting you with CAF Interiors Concierge...');
    window.open(getWhatsAppUrl(text), '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <Navbar />

      <main>
        <section className="pss-hero-banner">
          <div className="container">
            <div className="hero-badge" style={{ marginBottom: '1.25rem' }}>
              <span className="hero-badge-dot" />
              <span>CAF Interior and Exterior Service • Concierge &amp; Showrooms</span>
              <span className="hero-badge-dot" />
            </div>
            <h1 className="hero-main-headline" style={{ fontSize: 'clamp(2.3rem, 5vw, 4.2rem)' }}>
              Contact <span className="gold-accent">CAF Interiors</span>
            </h1>
            <p className="shop-hero-sub" style={{ maxWidth: '720px', fontSize: '1.06rem' }}>
              Speak directly with our furniture specialists, interior architects, or Pay Small Small
              finance concierge.
            </p>
          </div>
        </section>

        <section className="contact-section">
          <div className="container">
            <div className="contact-layout">
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

                <div className="about-quote-box" style={{ margin: 0 }}>
                  <p className="about-quote-text">&ldquo;Your Comfortability Is Our Priority.&rdquo;</p>
                </div>
              </div>

              <div className="enquiry-form-card">
                <div>
                  <h3 className="enquiry-form-title">Send a Direct Message</h3>
                  <p className="enquiry-form-sub">
                    Our dedicated desk responds promptly to product, customisation, and project
                    enquiries.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">Your Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone / WhatsApp *</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">Enquiry Department</label>
                      <select
                        className="form-select"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      >
                        <option value="Product Enquiry">Product Enquiry</option>
                        <option value="Custom Furniture Quotation">Custom Furniture Quotation</option>
                        <option value="Pay Small Small Instalment Plan">
                          Pay Small Small Instalment Plan
                        </option>
                        <option value="Order & Delivery Support">Order &amp; Delivery Support</option>
                        {INTERIOR_DESIGN_SERVICES.map((s) => (
                          <option key={s.id} value={`Interior Design: ${s.title}`}>
                            Interior Design: {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">City &amp; State *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Lekki, Lagos"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">How Can We Assist You? *</label>
                    <textarea
                      className="form-textarea"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-gold form-submit-btn">
                    Connect with CAF Interiors Desk
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

