'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FURNITURE_CATEGORIES } from '@/lib/catalog-data';
import { formatNaira, getWhatsAppUrl } from '@/lib/format';
import { useMarketplace } from '@/context/MarketplaceContext';
import { CustomFurnitureEnquiryRecord, QuotationRecord } from '@/lib/db-store';

const MATERIAL_PRESETS = [
  'Kiln-Dried Seasoned Nigerian Mahogany & Italian Performance Velvet',
  'Solid Iroko Timber Frame & French Textured Bouclé',
  'Natural Carrara / Nero Marquina Marble & 304 PVD Brushed Champagne Brass',
  'Moisture-Proof Marine HDF, Fluted American Walnut & Sintered Quartz',
  'Top-Grain Hand-Stitched Saddle Leather & Solid Hardwood',
  'All-Weather Plantation Teak & Marine-Grade Woven Rope',
];

export default function CustomFurniturePage() {
  const { user, showToast } = useMarketplace();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [category, setCategory] = useState('Sofas and Sectionals');
  const [measurements, setMeasurements] = useState('');
  const [preferredMaterials, setPreferredMaterials] = useState(MATERIAL_PRESETS[0]);
  const [colorsAndFinishing, setColorsAndFinishing] = useState('');
  const [location, setLocation] = useState('');
  const [requirementsDescription, setRequirementsDescription] = useState('');
  const [paySmallSmallRequested, setPaySmallSmallRequested] = useState(true);

  // Uploaded Reference Pictures & Sketches (Base64 data URLs or external URLs)
  const [referencePictures, setReferencePictures] = useState<string[]>([
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
  ]);
  const [refUrlInput, setRefUrlInput] = useState('');
  const [sketchImages, setSketchImages] = useState<string[]>([]);
  const [sketchUrlInput, setSketchUrlInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quotation Tracker State
  const [lookupEnquiryNum, setLookupEnquiryNum] = useState('CAF-CUS-2026-401');
  const [trackedEnquiry, setTrackedEnquiry] = useState<CustomFurnitureEnquiryRecord | null>(null);
  const [trackedQuotation, setTrackedQuotation] = useState<QuotationRecord | null>(null);
  const [trackerLoading, setTrackerLoading] = useState(true);
  const [customerFeedback, setCustomerFeedback] = useState('');

  // Admin Quick Quotation Builder (for demoing Admin -> Customer quotation loop)
  const [adminQuoteDesc, setAdminQuoteDesc] = useState('Bespoke Handcrafted Commission Piece');
  const [adminQuotePrice, setAdminQuotePrice] = useState(1850000);
  const [adminQuoteDelivery, setAdminQuoteDelivery] = useState(75000);
  const [adminQuoteLeadTime, setAdminQuoteLeadTime] = useState('14 – 18 Business Days');

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || user.name);
      setCustomerEmail((prev) => prev || user.email);
      setCustomerPhone((prev) => prev || user.phone);
      if (user.city || user.state) {
        setLocation((prev) => prev || `${user.city || 'Lekki'}, ${user.state || 'Lagos'}`);
      }
    }
  }, [user]);

  const loadEnquiry = useCallback(
    async (num: string) => {
      setTrackerLoading(true);
      try {
        const res = await fetch(
          `/api/custom-enquiry?enquiryNumber=${encodeURIComponent(num)}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (res.ok && data.enquiry) {
          setTrackedEnquiry(data.enquiry);
          setTrackedQuotation(data.quotation || null);
          setAdminQuoteDesc(`Bespoke ${data.enquiry.category} (${data.enquiry.measurements})`);
        } else {
          showToast(data.error || 'Enquiry not found.');
        }
      } catch {
        // ignore
      } finally {
        setTrackerLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadEnquiry('CAF-CUS-2026-401');
  }, [loadEnquiry]);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    targetSetter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).slice(0, 4).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          targetSetter((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    showToast(`Added ${files.length} image(s) to your bespoke specification.`);
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/custom-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          category,
          referencePictures,
          sketchImages,
          measurements,
          preferredMaterials,
          colorsAndFinishing,
          requirementsDescription,
          location,
          paySmallSmallRequested,
        }),
      });
      const data = await res.json();
      if (res.ok && data.enquiry) {
        showToast(data.message);
        setLookupEnquiryNum(data.enquiry.enquiryNumber);
        setTrackedEnquiry(data.enquiry);
        setTrackedQuotation(null);
        setMeasurements('');
        setColorsAndFinishing('');
        setRequirementsDescription('');
        document.getElementById('quotation-desk')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        showToast(data.error || 'Could not submit request.');
      }
    } catch {
      showToast('Network error submitting custom request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuotationDecision = async (decision: 'ACCEPTED' | 'REVISION_REQUESTED') => {
    if (!trackedEnquiry) return;
    const res = await fetch(`/api/custom-enquiry/${encodeURIComponent(trackedEnquiry.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        customerFeedback,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setTrackedEnquiry(data.enquiry);
      setTrackedQuotation(data.quotation);
      showToast(data.message);
    }
  };

  const handleIssueQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackedEnquiry) return;
    const res = await fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enquiryId: trackedEnquiry.id,
        items: [
          {
            description: adminQuoteDesc,
            quantity: 1,
            unitPrice: Number(adminQuotePrice),
            total: Number(adminQuotePrice),
          },
        ],
        deliveryAndInstallationFee: Number(adminQuoteDelivery),
        paySmallSmallEligible: true,
        estimatedLeadTime: adminQuoteLeadTime,
        adminOverride: true,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setTrackedEnquiry(data.enquiry);
      setTrackedQuotation(data.quotation);
      showToast(data.message);
    }
  };

  return (
    <>
      <Navbar />

      <main className="custom-furniture-main">
        {/* Hero */}
        <section className="pss-hero-banner">
          <div className="container">
            <div className="hero-badge" style={{ marginBottom: '1.25rem' }}>
              <span className="hero-badge-dot" />
              <span>CAF Interior and Exterior Service • Bespoke Manufacturing</span>
              <span className="hero-badge-dot" />
            </div>
            <h1 className="hero-main-headline" style={{ fontSize: 'clamp(2.3rem, 5vw, 4.2rem)' }}>
              Bespoke <span className="gold-accent">Custom Furniture Ordering</span>
            </h1>
            <p className="shop-hero-sub" style={{ maxWidth: '760px', fontSize: '1.06rem' }}>
              Upload your reference photographs, architectural sketches, exact measurements, and
              material preferences. Receive an official itemised Naira quotation in your dashboard
              with optional <strong>Pay Small Small</strong> instalment financing.
            </p>
          </div>
        </section>

        {/* ===================================================================
            SECTION 1: CUSTOM FURNITURE REQUEST FORM (ALL 9 REQUIREMENTS)
           =================================================================== */}
        <section className="custom-order-section">
          <div className="container">
            <div className="pss-studio-grid">
              {/* Left Form */}
              <div className="checkout-panel">
                <span className="eyebrow left-align">Bespoke Commission Specification</span>
                <h2 className="section-heading" style={{ fontSize: '2.1rem', marginBottom: '1.5rem' }}>
                  Submit Your <span className="gold-accent">Custom Furniture Request</span>
                </h2>

                <form onSubmit={handleSubmitEnquiry}>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label dark-label">Your Full Name *</label>
                      <input
                        type="text"
                        className="checkout-input"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Chief Adebayo Ogunlesi"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label dark-label">Email Address *</label>
                      <input
                        type="email"
                        className="checkout-input"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="client@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label dark-label">Phone / WhatsApp Number *</label>
                      <input
                        type="tel"
                        className="checkout-input"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+234 803 000 0000"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label dark-label">1. Select Furniture Category *</label>
                      <select
                        className="checkout-input"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {FURNITURE_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 2. Upload Reference Pictures */}
                  <div className="upload-block">
                    <label className="form-label dark-label">
                      2. Upload Reference Pictures (Device Upload or Image URL)
                    </label>
                    <div className="upload-controls-row">
                      <label className="file-upload-btn">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleFileUpload(e, setReferencePictures)}
                        />
                        <span>+ Upload Reference Photo(s)</span>
                      </label>
                      <div className="url-append-box">
                        <input
                          type="text"
                          placeholder="Or paste image URL..."
                          value={refUrlInput}
                          onChange={(e) => setRefUrlInput(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (refUrlInput.trim()) {
                              setReferencePictures((prev) => [...prev, refUrlInput.trim()]);
                              setRefUrlInput('');
                            }
                          }}
                        >
                          Add URL
                        </button>
                      </div>
                    </div>

                    {referencePictures.length > 0 && (
                      <div className="uploaded-thumbs-grid">
                        {referencePictures.map((img, i) => (
                          <div key={i} className="uploaded-thumb-item">
                            <img src={img} alt={`Reference ${i + 1}`} />
                            <button
                              type="button"
                              onClick={() =>
                                setReferencePictures((prev) => prev.filter((_, idx) => idx !== i))
                              }
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Upload Sketches or Design Concepts */}
                  <div className="upload-block">
                    <label className="form-label dark-label">
                      3. Upload Architectural Sketches or Design Concepts (Optional)
                    </label>
                    <div className="upload-controls-row">
                      <label className="file-upload-btn">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleFileUpload(e, setSketchImages)}
                        />
                        <span>+ Upload Sketch / Floorplan</span>
                      </label>
                      <div className="url-append-box">
                        <input
                          type="text"
                          placeholder="Or paste sketch URL..."
                          value={sketchUrlInput}
                          onChange={(e) => setSketchUrlInput(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (sketchUrlInput.trim()) {
                              setSketchImages((prev) => [...prev, sketchUrlInput.trim()]);
                              setSketchUrlInput('');
                            }
                          }}
                        >
                          Add URL
                        </button>
                      </div>
                    </div>

                    {sketchImages.length > 0 && (
                      <div className="uploaded-thumbs-grid">
                        {sketchImages.map((img, i) => (
                          <div key={i} className="uploaded-thumb-item">
                            <img src={img} alt={`Sketch ${i + 1}`} />
                            <button
                              type="button"
                              onClick={() =>
                                setSketchImages((prev) => prev.filter((_, idx) => idx !== i))
                              }
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Measurements & 5. Preferred Materials */}
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label dark-label">4. Enter Measurements (L × W × H) *</label>
                      <input
                        type="text"
                        className="checkout-input"
                        value={measurements}
                        onChange={(e) => setMeasurements(e.target.value)}
                        placeholder="e.g. 320cm × 120cm × 76cm or Request Site Measure"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label dark-label">5. Select Preferred Materials *</label>
                      <select
                        className="checkout-input"
                        value={preferredMaterials}
                        onChange={(e) => setPreferredMaterials(e.target.value)}
                      >
                        {MATERIAL_PRESETS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 6. Colours & Finishing & 8. Location */}
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label dark-label">6. Choose Colours &amp; Finishing *</label>
                      <input
                        type="text"
                        className="checkout-input"
                        value={colorsAndFinishing}
                        onChange={(e) => setColorsAndFinishing(e.target.value)}
                        placeholder="e.g. Champagne Ivory Bouclé with Brushed Gold Inlay"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label dark-label">8. Delivery Location (City &amp; State) *</label>
                      <input
                        type="text"
                        className="checkout-input"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Lekki Phase 1, Lagos / Maitama, Abuja"
                        required
                      />
                    </div>
                  </div>

                  {/* 7. Detailed Requirements */}
                  <div className="form-group">
                    <label className="form-label dark-label">7. Describe Your Requirements *</label>
                    <textarea
                      className="checkout-input"
                      rows={3}
                      value={requirementsDescription}
                      onChange={(e) => setRequirementsDescription(e.target.value)}
                      placeholder="Specify drawer configuration, foam firmness, tufting pattern, LED lighting, or timeline..."
                      required
                    />
                  </div>

                  <label className="checkout-terms-check" style={{ marginBottom: '1.25rem' }}>
                    <input
                      type="checkbox"
                      checked={paySmallSmallRequested}
                      onChange={(e) => setPaySmallSmallRequested(e.target.checked)}
                    />
                    <span>
                      Include a <strong>Pay Small Small Instalment Schedule Option</strong> in my
                      official quotation.
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="btn-gold"
                    style={{ width: '100%' }}
                    disabled={submitting}
                  >
                    {submitting
                      ? 'Submitting Custom Furniture Request...'
                      : '9. Submit Custom Request for Official Quotation'}
                  </button>
                </form>
              </div>

              {/* Right Column: Live Quotation Review & Customer Acceptance Portal */}
              <div id="quotation-desk" className="pss-studio-output">
                <div className="pss-calculator-card">
                  <div className="pss-calc-header">
                    <span className="badge-pss">Quotation &amp; Approval Desk</span>
                    <h3>Review &amp; Accept Your Official Quotation</h3>
                    <p style={{ fontSize: '0.84rem', color: '#b8b3aa' }}>
                      Look up your Custom Enquiry ID below (pre-loaded with{' '}
                      <strong>CAF-CUS-2026-401</strong>):
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (lookupEnquiryNum.trim()) loadEnquiry(lookupEnquiryNum.trim());
                    }}
                    className="tracker-lookup-form"
                    style={{ marginBottom: '1.5rem' }}
                  >
                    <input
                      type="text"
                      style={{ flex: 1 }}
                      value={lookupEnquiryNum}
                      onChange={(e) => setLookupEnquiryNum(e.target.value)}
                      placeholder="Enter Enquiry # (e.g. CAF-CUS-2026-401)"
                    />
                    <button type="submit" className="btn-gold">
                      Lookup
                    </button>
                  </form>

                  {trackerLoading ? (
                    <p style={{ color: '#b8b3aa' }}>Loading custom enquiry...</p>
                  ) : !trackedEnquiry ? (
                    <p style={{ color: '#b8b3aa' }}>No enquiry loaded.</p>
                  ) : (
                    <div>
                      <div className="quotation-summary-banner">
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span className="badge-gold-outline">{trackedEnquiry.enquiryNumber}</span>
                          <span className="badge-pss">{trackedEnquiry.status.replace(/_/g, ' ')}</span>
                        </div>
                        <h4 style={{ fontSize: '1.35rem', margin: '0.6rem 0 0.25rem' }}>
                          {trackedEnquiry.category} — {trackedEnquiry.customerName}
                        </h4>
                        <p style={{ fontSize: '0.82rem', color: '#b8b3aa' }}>
                          <strong>Measurements:</strong> {trackedEnquiry.measurements}
                          <br />
                          <strong>Materials:</strong> {trackedEnquiry.preferredMaterials}
                          <br />
                          <strong>Finishing:</strong> {trackedEnquiry.colorsAndFinishing}
                          <br />
                          <strong>Location:</strong> {trackedEnquiry.location}
                        </p>

                        {trackedEnquiry.referencePictures.length > 0 && (
                          <div className="uploaded-thumbs-grid" style={{ marginTop: '0.75rem' }}>
                            {trackedEnquiry.referencePictures.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt="Reference"
                                style={{ width: '64px', height: '64px', objectFit: 'cover', border: '1px solid #d4af37' }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Official Quotation Card if sent */}
                      {trackedQuotation ? (
                        <div className="official-quotation-box">
                          <div className="qtn-top-bar">
                            <span>Official Quotation #{trackedQuotation.quotationNumber}</span>
                            <span>Valid Until: {trackedQuotation.validUntil}</span>
                          </div>

                          <div className="qtn-items-list">
                            {trackedQuotation.items.map((it, i) => (
                              <div key={i} className="qtn-item-row">
                                <div>
                                  <strong>{it.description}</strong>
                                  <small style={{ display: 'block', color: '#b8b3aa' }}>
                                    Qty: {it.quantity} × {formatNaira(it.unitPrice)}
                                  </small>
                                </div>
                                <strong>{formatNaira(it.total)}</strong>
                              </div>
                            ))}
                          </div>

                          <div className="pss-calc-summary-grid">
                            <div className="pss-calc-stat">
                              <span className="stat-label">Total Quoted Price</span>
                              <span className="stat-value">
                                {formatNaira(trackedQuotation.totalQuotedAmount)}
                              </span>
                            </div>
                            <div className="pss-calc-stat gold-box">
                              <span className="stat-label">Required Mobilization Deposit</span>
                              <span className="stat-value">
                                {formatNaira(trackedQuotation.requiredDepositAmount)}
                              </span>
                            </div>
                          </div>

                          <p style={{ fontSize: '0.8rem', color: '#b8b3aa', marginBottom: '1rem' }}>
                            <strong>Lead Time:</strong> {trackedQuotation.estimatedLeadTime}
                            <br />
                            <strong>Architect Note:</strong> {trackedQuotation.adminNotes}
                          </p>

                          <div className="qtn-decision-box">
                            <div style={{ marginBottom: '0.75rem' }}>
                              Customer Decision Status:{' '}
                              <strong className="gold-text">
                                {trackedQuotation.customerDecision.replace(/_/g, ' ')}
                              </strong>
                            </div>

                            {trackedQuotation.customerDecision !== 'ACCEPTED' ? (
                              <>
                                <input
                                  type="text"
                                  className="form-input"
                                  style={{ marginBottom: '0.75rem' }}
                                  placeholder="Optional note or revision feedback..."
                                  value={customerFeedback}
                                  onChange={(e) => setCustomerFeedback(e.target.value)}
                                />
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    className="btn-gold"
                                    style={{ flex: 1 }}
                                    onClick={() => handleQuotationDecision('ACCEPTED')}
                                  >
                                    ✓ Accept Official Quotation
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-outline-gold"
                                    onClick={() => handleQuotationDecision('REVISION_REQUESTED')}
                                  >
                                    Request Revision
                                  </button>
                                </div>
                              </>
                            ) : (
                              <a
                                href={getWhatsAppUrl(
                                  `Hello CAF Interiors, I have accepted Quotation ${trackedQuotation.quotationNumber} (${formatNaira(
                                    trackedQuotation.totalQuotedAmount
                                  )}) for Custom Request ${trackedEnquiry.enquiryNumber} and am ready to pay the ${formatNaira(
                                    trackedQuotation.requiredDepositAmount
                                  )} deposit.`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-gold"
                                style={{ width: '100%', textAlign: 'center' }}
                              >
                                Proceed with Mobilization Deposit via Concierge
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="official-quotation-box">
                          <h4 style={{ color: '#e6c762', marginBottom: '0.5rem' }}>
                            Under Review by CAF Interiors Bespoke Desk
                          </h4>
                          <p style={{ fontSize: '0.84rem', color: '#b8b3aa', marginBottom: '1rem' }}>
                            Your custom furniture specification has been received and queued for
                            costing by our master craftsmen. Once your official quotation is issued,
                            it will appear here and in your client account dashboard for acceptance.
                          </p>
                          <a
                            href={getWhatsAppUrl(
                              `Hello CAF Interiors, I am following up on my Custom Furniture Request ${trackedEnquiry.enquiryNumber}.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-outline-gold"
                            style={{ display: 'block', textAlign: 'center' }}
                          >
                            Inquire with Bespoke Desk on WhatsApp
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

