'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { INTERIOR_DESIGN_SERVICES, PRODUCTS_CATALOG } from '@/lib/catalog-data';
import { formatNaira, getWhatsAppUrl } from '@/lib/format';
import { useMarketplace } from '@/context/MarketplaceContext';
import { InteriorDesignProjectRecord } from '@/lib/db-store';

export default function InteriorDesignPage() {
  const { user, showToast } = useMarketplace();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const filteredServices =
    categoryFilter === 'All'
      ? INTERIOR_DESIGN_SERVICES
      : INTERIOR_DESIGN_SERVICES.filter((s) => s.category === categoryFilter);

  // Consultation Booking Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceType, setServiceType] = useState(INTERIOR_DESIGN_SERVICES[0].title);
  const [propertyType, setPropertyType] = useState('5-Bedroom Detached Duplex / Villa');
  const [propertyLocation, setPropertyLocation] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('₦5,000,000 – ₦15,000,000');
  const [preferredConsultationDate, setPreferredConsultationDate] = useState('2026-12-05');
  const [projectDescription, setProjectDescription] = useState('');
  const [propertyPhotographs, setPropertyPhotographs] = useState<string[]>([
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
  ]);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Live Project Milestone Tracker State
  const [lookupProjectNumber, setLookupProjectNumber] = useState('CAF-PRJ-2026-701');
  const [trackedProject, setTrackedProject] = useState<InteriorDesignProjectRecord | null>(null);
  const [trackerLoading, setTrackerLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || user.name);
      setCustomerEmail((prev) => prev || user.email);
      setCustomerPhone((prev) => prev || user.phone);
      if (user.city || user.state) {
        setPropertyLocation((prev) => prev || `${user.city || 'Lekki'}, ${user.state || 'Lagos'}`);
      }
    }
  }, [user]);

  const loadProject = useCallback(
    async (prjNum: string) => {
      setTrackerLoading(true);
      try {
        const res = await fetch(
          `/api/projects?projectNumber=${encodeURIComponent(prjNum)}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (res.ok && data.project) {
          setTrackedProject(data.project);
        } else {
          showToast(data.error || 'Project not found.');
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
    loadProject('CAF-PRJ-2026-701');
  }, [loadProject]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).slice(0, 4).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPropertyPhotographs((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    showToast(`Attached ${files.length} property photograph(s).`);
  };

  const handleBookConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          serviceType,
          propertyType,
          propertyLocation,
          estimatedBudget,
          preferredConsultationDate,
          projectDescription,
          propertyPhotographs,
        }),
      });
      const data = await res.json();
      if (res.ok && data.project) {
        showToast(data.message);
        setLookupProjectNumber(data.project.projectNumber);
        setTrackedProject(data.project);
        setProjectDescription('');
        document.getElementById('milestone-portal')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        showToast(data.error || 'Could not submit project booking.');
      }
    } catch {
      showToast('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvanceMilestone = async (milestoneId: string, nextStatus: 'COMPLETED' | 'IN_PROGRESS') => {
    if (!trackedProject) return;
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_MILESTONE',
        projectId: trackedProject.id,
        milestoneId,
        status: nextStatus,
        completionPercent: nextStatus === 'COMPLETED' ? 100 : 50,
        deliverableNote:
          nextStatus === 'COMPLETED'
            ? `Verified & signed off on ${new Date().toLocaleDateString('en-NG')}.`
            : 'Active on-site execution underway.',
      }),
    });
    const data = await res.json();
    if (res.ok && data.project) {
      setTrackedProject(data.project);
      showToast('Project milestone updated!');
    }
  };

  return (
    <>
      <Navbar />

      <main className="interior-design-main">
        {/* Hero */}
        <section className="pss-hero-banner">
          <div className="container">
            <div className="hero-badge" style={{ marginBottom: '1.25rem' }}>
              <span className="hero-badge-dot" />
              <span>CAF Interior and Exterior Service • Turnkey Spatial Architecture</span>
              <span className="hero-badge-dot" />
            </div>
            <h1 className="hero-main-headline" style={{ fontSize: 'clamp(2.3rem, 5vw, 4.2rem)' }}>
              Interior Design &amp; <span className="gold-accent">Project Management</span>
            </h1>
            <p className="shop-hero-sub" style={{ maxWidth: '780px', fontSize: '1.06rem' }}>
              &ldquo;Luxury Begins Beneath.&rdquo; Explore our 13 specialized residential,
              commercial, hospitality, church, and acoustic interior services. Book a private
              consultation and monitor your approved project milestones in real time.
            </p>
          </div>
        </section>

        {/* ===================================================================
            SECTION 1: ALL 13 INTERIOR DESIGN SERVICES
           =================================================================== */}
        <section className="interior-services-section">
          <div className="container">
            <div className="section-header-split">
              <div>
                <div className="eyebrow left-align">13 Specialized Divisions</div>
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
                      className={`showcase-tab-btn ${categoryFilter === cat ? 'active' : ''}`}
                      onClick={() => setCategoryFilter(cat)}
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
                      <button
                        type="button"
                        className="service-link btn-reset"
                        onClick={() => {
                          setServiceType(srv.title);
                          document
                            .getElementById('booking-section')
                            ?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        Select &amp; Book &rarr;
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 1B: SHOP INTERIOR DESIGN DECOR & STYLING ACCENTS
           =================================================================== */}
        <section id="decor-shop" className="interior-decor-boutique-section">
          <div className="container">
            <div className="section-header-split">
              <div>
                <div className="eyebrow left-align">Instant Luxury Styling</div>
                <h2 className="section-heading">
                  Shop Curated <span className="gold-accent">Interior Design Decor</span>
                </h2>
              </div>
              <p className="section-subcopy">
                Purchase ready-to-deliver gallery wall art, hand-knotted rugs, sculptural vases,
                alabaster lamps, and coffee-table styling sets curated by our interior architects.
              </p>
            </div>

            <div className="products-grid-3col">
              {PRODUCTS_CATALOG.filter((p) => p.categorySlug === 'interior-design-decor').map(
                (decor) => (
                  <ProductCard key={decor.id} product={decor} />
                )
              )}
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 2: CONSULTATION BOOKING & LIVE PROJECT MILESTONE TRACKER
           =================================================================== */}
        <section id="booking-section" className="custom-order-section">
          <div className="container">
            <div className="pss-studio-grid">
              {/* Left Column: Consultation & Project Brief Booking Form */}
              <div className="checkout-panel">
                <span className="eyebrow left-align">Private Architectural Consultation</span>
                <h2 className="section-heading" style={{ fontSize: '2.1rem', marginBottom: '1.5rem' }}>
                  Book an Interior <span className="gold-accent">Design Project</span>
                </h2>

                <form onSubmit={handleBookConsultation}>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label dark-label">Client / Organization Name *</label>
                      <input
                        type="text"
                        className="checkout-input"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Chief Adebayo Ogunlesi / Grace Cathedral"
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
                      <label className="form-label dark-label">Select Interior Design Service *</label>
                      <select
                        className="checkout-input"
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value)}
                      >
                        {INTERIOR_DESIGN_SERVICES.map((s) => (
                          <option key={s.id} value={s.title}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label dark-label">Property Type *</label>
                      <select
                        className="checkout-input"
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                      >
                        <option value="5-Bedroom Detached Duplex / Villa">
                          5-Bedroom Detached Duplex / Villa
                        </option>
                        <option value="Luxury Penthouse / Apartment">
                          Luxury Penthouse / Apartment
                        </option>
                        <option value="Corporate Office / Headquarters">
                          Corporate Office / Headquarters
                        </option>
                        <option value="Hotel / Hospitality Suite">Hotel / Hospitality Suite</option>
                        <option value="Church Auditorium / Sanctuary">
                          Church Auditorium / Sanctuary
                        </option>
                        <option value="Commercial Showroom / Lounge">
                          Commercial Showroom / Lounge
                        </option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label dark-label">Estimated Project Budget (₦) *</label>
                      <select
                        className="checkout-input"
                        value={estimatedBudget}
                        onChange={(e) => setEstimatedBudget(e.target.value)}
                      >
                        <option value="₦1,500,000 – ₦3,500,000">₦1,500,000 – ₦3,500,000</option>
                        <option value="₦3,500,000 – ₦7,500,000">₦3,500,000 – ₦7,500,000</option>
                        <option value="₦7,500,000 – ₦15,000,000">₦7,500,000 – ₦15,000,000</option>
                        <option value="₦15,000,000 – ₦50,000,000+">₦15,000,000 – ₦50,000,000+</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label dark-label">Property Location (Address, City &amp; State) *</label>
                      <input
                        type="text"
                        className="checkout-input"
                        value={propertyLocation}
                        onChange={(e) => setPropertyLocation(e.target.value)}
                        placeholder="e.g. 14 Admiralty Way, Lekki Phase 1, Lagos"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label dark-label">Preferred Consultation / Site Visit Date</label>
                      <input
                        type="date"
                        className="checkout-input"
                        value={preferredConsultationDate}
                        onChange={(e) => setPreferredConsultationDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Property Photographs Upload */}
                  <div className="upload-block">
                    <label className="form-label dark-label">
                      Upload Current Property Photographs or Floorplans
                    </label>
                    <div className="upload-controls-row">
                      <label className="file-upload-btn">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                        />
                        <span>+ Upload Property Photo(s)</span>
                      </label>
                      <div className="url-append-box">
                        <input
                          type="text"
                          placeholder="Or paste photo URL..."
                          value={photoUrlInput}
                          onChange={(e) => setPhotoUrlInput(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (photoUrlInput.trim()) {
                              setPropertyPhotographs((prev) => [...prev, photoUrlInput.trim()]);
                              setPhotoUrlInput('');
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {propertyPhotographs.length > 0 && (
                      <div className="uploaded-thumbs-grid">
                        {propertyPhotographs.map((img, i) => (
                          <div key={i} className="uploaded-thumb-item">
                            <img src={img} alt={`Property ${i + 1}`} />
                            <button
                              type="button"
                              onClick={() =>
                                setPropertyPhotographs((prev) => prev.filter((_, idx) => idx !== i))
                              }
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label dark-label">Project Details &amp; Design Vision *</label>
                    <textarea
                      className="checkout-input"
                      rows={3}
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="Describe the spaces to be transformed, ceiling/lighting goals, soundproofing needs, or target completion date..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-gold"
                    style={{ width: '100%' }}
                    disabled={submitting}
                  >
                    {submitting
                      ? 'Scheduling Consultation & Creating Project Tracker...'
                      : 'Book Consultation & Launch Project Milestone Tracker'}
                  </button>
                </form>
              </div>

              {/* Right Column: Project Management & Milestone Monitoring Interface */}
              <div id="milestone-portal" className="pss-studio-output">
                <div className="pss-calculator-card">
                  <div className="pss-calc-header">
                    <span className="badge-pss">Live Project Management Interface</span>
                    <h3>Monitor Approved Project Milestones</h3>
                    <p style={{ fontSize: '0.84rem', color: '#b8b3aa' }}>
                      Enter your CAF Project Number below (pre-loaded with{' '}
                      <strong>CAF-PRJ-2026-701</strong>):
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (lookupProjectNumber.trim()) loadProject(lookupProjectNumber.trim());
                    }}
                    className="tracker-lookup-form"
                    style={{ marginBottom: '1.5rem' }}
                  >
                    <input
                      type="text"
                      style={{ flex: 1 }}
                      value={lookupProjectNumber}
                      onChange={(e) => setLookupProjectNumber(e.target.value)}
                      placeholder="Enter Project # (e.g. CAF-PRJ-2026-701)"
                    />
                    <button type="submit" className="btn-gold">
                      Track Project
                    </button>
                  </form>

                  {trackerLoading ? (
                    <p style={{ color: '#b8b3aa' }}>Loading project milestones...</p>
                  ) : !trackedProject ? (
                    <p style={{ color: '#b8b3aa' }}>No project loaded.</p>
                  ) : (
                    <div>
                      <div className="quotation-summary-banner">
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span className="badge-gold-outline">{trackedProject.projectNumber}</span>
                          <span className="badge-pss">{trackedProject.status.replace(/_/g, ' ')}</span>
                        </div>
                        <h4 style={{ fontSize: '1.35rem', margin: '0.6rem 0 0.25rem' }}>
                          {trackedProject.serviceType} — {trackedProject.propertyType}
                        </h4>
                        <p style={{ fontSize: '0.82rem', color: '#b8b3aa' }}>
                          <strong>Client:</strong> {trackedProject.customerName}
                          <br />
                          <strong>Property Location:</strong> {trackedProject.propertyLocation}
                          <br />
                          <strong>Lead Project Architect:</strong> {trackedProject.assignedArchitect}
                          <br />
                          <strong>Budget / Contract:</strong>{' '}
                          {trackedProject.approvedContractAmount > 0
                            ? `${formatNaira(trackedProject.approvedContractAmount)} (Verified Paid: ${formatNaira(
                              trackedProject.amountPaidVerified
                            )})`
                            : trackedProject.estimatedBudget}
                        </p>

                        {/* Overall Progress Bar */}
                        <div className="pss-progress-box" style={{ margin: '1rem 0 0' }}>
                          <div className="pss-progress-labels">
                            <span>Overall Project Execution</span>
                            <strong className="gold-text">
                              {trackedProject.overallProgressPercent}% Completed
                            </strong>
                          </div>
                          <div className="pss-progress-track">
                            <div
                              className="pss-progress-fill"
                              style={{ width: `${trackedProject.overallProgressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Milestone Timeline */}
                      <div className="milestone-timeline-list">
                        {trackedProject.milestones.map((ms) => (
                          <div
                            key={ms.id}
                            className={`milestone-step-card ${ms.status.toLowerCase()}`}
                          >
                            <div className="milestone-step-top">
                              <span className="ms-step-badge">
                                Phase 0{ms.stepNumber} • {ms.status.replace(/_/g, ' ')} (
                                {ms.completionPercent}%)
                              </span>
                              {ms.status !== 'COMPLETED' && (
                                <button
                                  type="button"
                                  className="btn-text-gold"
                                  onClick={() =>
                                    handleAdvanceMilestone(
                                      ms.id,
                                      ms.status === 'UPCOMING' ? 'IN_PROGRESS' : 'COMPLETED'
                                    )
                                  }
                                >
                                  {ms.status === 'UPCOMING'
                                    ? 'Start Phase (Admin)'
                                    : 'Mark Completed (Admin)'}
                                </button>
                              )}
                            </div>
                            <h5>{ms.title}</h5>
                            <p>{ms.description}</p>
                            <small className="gold-text">{ms.deliverableNote}</small>
                          </div>
                        ))}
                      </div>

                      <a
                        href={getWhatsAppUrl(
                          `Hello CAF Interiors, I am checking in on Interior Design Project ${trackedProject.projectNumber} (${trackedProject.serviceType} at ${trackedProject.propertyLocation}).`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline-gold"
                        style={{ width: '100%', textAlign: 'center', marginTop: '1.25rem' }}
                      >
                        Message Lead Project Architect on WhatsApp
                      </a>
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

