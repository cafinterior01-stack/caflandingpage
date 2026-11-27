'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { useMarketplace } from '@/context/MarketplaceContext';
import { getWhatsAppUrl } from '@/lib/format';

const WHATSAPP_CHANNELS = [
  {
    label: '1. Product Enquiries',
    sub: 'Specs, dimensions & availability',
    msg: 'Hello CAF Interiors (Product Concierge), I would like to enquire about a furniture piece on your marketplace.',
  },
  {
    label: '2. Custom Furniture Quotations',
    sub: 'Bespoke dimensions, fabrics & woods',
    msg: 'Hello CAF Interiors (Bespoke Customisation Desk), I would like to request a quotation for custom-made furniture.',
  },
  {
    label: '3. Interior Design Consultations',
    sub: 'Homes, hotels, offices & churches',
    msg: 'Hello CAF Interiors (Architectural & Interior Design Desk), I would like to book an interior design consultation.',
  },
  {
    label: '4. Order & Delivery Support',
    sub: 'Track fabrication & white-glove dispatch',
    msg: 'Hello CAF Interiors (Order Support Desk), I would like an update on my order status and delivery schedule.',
  },
  {
    label: '5. Pay Small Small & Payment Enquiries',
    sub: 'Instalment schedules & payment verification',
    msg: 'Hello CAF Interiors (Finance & Pay Small Small Desk), I have a question regarding an instalment payment plan.',
  },
];

export default function Footer() {
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const { catalogCategories } = useMarketplace();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top-4col">
          {/* Column 1: Brand Identity */}
          <div>
            <BrandLogo variant="footer" />
            <p className="footer-brand-slogan">&ldquo;Your Comfortability Is Our Priority.&rdquo;</p>
            <p className="footer-secondary-slogan">Luxury Begins Beneath.</p>
            <p className="footer-brand-desc">
              Nigeria&apos;s premier luxury interior design studio, bespoke furniture manufacturer,
              and flexible <strong>Pay Small Small</strong> home improvement marketplace.
            </p>
          </div>

          {/* Column 2: Marketplace Categories */}
          <div>
            <h3 className="footer-col-title">Furniture Marketplace</h3>
            <nav className="footer-links" aria-label="Furniture Categories">
              {catalogCategories.slice(0, 7).map((cat) => (
                <Link key={cat.id} href={`/shop?category=${cat.slug}`}>
                  {cat.name}
                </Link>
              ))}
              <Link href="/shop" className="gold-text">
                View All {catalogCategories.length} Categories &rarr;
              </Link>
            </nav>
          </div>

          {/* Column 3: Services & Financing */}
          <div>
            <h3 className="footer-col-title">Bespoke &amp; Financing</h3>
            <nav className="footer-links" aria-label="Services and Financing">
              <Link href="/pay-small-small">Pay Small Small Instalments</Link>
              <Link href="/interior-design">Residential &amp; Commercial Design</Link>
              <Link href="/interior-design">Hotel &amp; Church Interior Design</Link>
              <Link href="/custom-furniture">Custom Furniture Ordering</Link>
              <Link href="/about">About CAF Interiors</Link>
              <Link href="/contact">Contact &amp; Showrooms</Link>
              <Link href="/account">Customer &amp; Project Dashboard</Link>
            </nav>
          </div>

          {/* Column 4: Direct Concierge */}
          <div>
            <h3 className="footer-col-title">Private Concierge</h3>
            <div className="footer-links">
              <a
                href={getWhatsAppUrl('Hello CAF Interiors, I would like to speak with your sales and interior design team.')}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp: +234 903 026 2160
              </a>
              <a href="tel:+2349030262160">Direct Line: +234 903 026 2160</a>
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
          <div>
            © 2026 <strong>CAF Interiors</strong> (CAF Interior and Exterior Service). All Rights
            Reserved.
          </div>
          <div className="footer-coming-soon">
            Paystack • Flutterwave • Verified Bank Transfer • Nationwide Delivery Across Nigeria
          </div>
        </div>
      </div>

      {/* Contextual 5-Channel WhatsApp Concierge Widget */}
      {conciergeOpen && (
        <div className="whatsapp-concierge-popup">
          <div className="wa-popup-header">
            <div>
              <span className="wa-eyebrow">CAF Interior and Exterior Service</span>
              <h4>WhatsApp Luxury Concierge</h4>
            </div>
            <button
              type="button"
              className="wa-close-btn"
              onClick={() => setConciergeOpen(false)}
              aria-label="Close WhatsApp concierge menu"
            >
              ✕
            </button>
          </div>
          <p className="wa-popup-sub">
            Select a department below to connect directly with our team on WhatsApp (+234 903 026
            2160):
          </p>
          <div className="wa-channels-list">
            {WHATSAPP_CHANNELS.map((ch) => (
              <a
                key={ch.label}
                href={getWhatsAppUrl(ch.msg)}
                target="_blank"
                rel="noopener noreferrer"
                className="wa-channel-item"
                onClick={() => setConciergeOpen(false)}
              >
                <div>
                  <strong>{ch.label}</strong>
                  <span>{ch.sub}</span>
                </div>
                <span className="wa-arrow">&rarr;</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className="floating-whatsapp-btn"
        onClick={() => setConciergeOpen((prev) => !prev)}
        aria-expanded={conciergeOpen}
        aria-label="Open CAF Interiors WhatsApp Concierge"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        <span>{conciergeOpen ? 'Close Concierge' : 'WhatsApp Concierge (5 Desks)'}</span>
      </button>
    </footer>
  );
}
