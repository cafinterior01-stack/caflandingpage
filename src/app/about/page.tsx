'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { COMPLETED_PROJECTS, CUSTOMER_TESTIMONIALS } from '@/lib/catalog-data';

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main>
        <section className="pss-hero-banner">
          <div className="container">
            <div className="hero-badge" style={{ marginBottom: '1.25rem' }}>
              <span className="hero-badge-dot" />
              <span>CAF Interior and Exterior Service • Our Heritage</span>
              <span className="hero-badge-dot" />
            </div>
            <h1 className="hero-main-headline" style={{ fontSize: 'clamp(2.3rem, 5vw, 4.2rem)' }}>
              About <span className="gold-accent">CAF Interiors</span>
            </h1>
            <p className="hero-slogan" style={{ marginBottom: '0.5rem' }}>
              &ldquo;Your Comfortability Is Our Priority.&rdquo; —{' '}
              <span className="hero-sub-slogan">Luxury Begins Beneath.</span>
            </p>
          </div>
        </section>

        <section className="about-section">
          <div className="container">
            <div className="about-grid">
              <div className="about-visual">
                <div className="about-image-main">
                  <img
                    src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85"
                    alt="Luxury living room interior curated by CAF Interiors"
                  />
                </div>
                <div className="about-image-secondary">
                  <img
                    src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80"
                    alt="Bespoke handcrafted furniture details"
                  />
                </div>
                <div className="about-floating-badge">
                  <div className="badge-title">CAF Interiors</div>
                  <div className="badge-sub">CAF Interior &amp; Exterior Service</div>
                </div>
              </div>

              <div className="about-content">
                <div className="eyebrow left-align">Our Identity &amp; Philosophy</div>
                <h2 className="section-heading">
                  Crafting Timeless <span className="gold-accent">African &amp; Global Luxury</span>
                </h2>

                <p className="lead-paragraph">
                  CAF Interiors (<strong>CAF Interior and Exterior Service</strong>) is a premier
                  furniture manufacturing, bespoke interior design, and home improvement brand
                  committed to transforming spaces through creativity, craftsmanship, and thoughtful
                  design.
                </p>

                <p>
                  We specialize in furniture solutions, interior decoration, acoustic panelling, and
                  customized architectural designs that combine beauty, comfort, and functionality
                  for homeowners, property developers, hotels, churches, corporate offices, and real
                  estate investors across Nigeria.
                </p>

                <p>
                  Through our customer-friendly <strong>Pay Small Small</strong> instalment platform,
                  we make world-class luxury furniture accessible through structured, transparent
                  Naira payment plans.
                </p>

                <div className="about-quote-box">
                  <p className="about-quote-text">&ldquo;Your Comfortability Is Our Priority.&rdquo;</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                  <Link href="/shop" className="btn-gold">
                    Explore Furniture Marketplace
                  </Link>
                  <Link href="/interior-design" className="btn-outline-dark">
                    View 13 Interior Design Services
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="why-choose-section">
          <div className="container">
            <div className="philosophy-grid">
              <div className="philosophy-card dark-variant">
                <div className="eyebrow left-align">Our Mission</div>
                <h2>Transforming Everyday Spaces</h2>
                <p>
                  To transform everyday spaces into beautiful, functional, and inspiring
                  environments by delivering quality furniture, creative interior solutions, and
                  exceptional customer experiences.
                </p>
              </div>
              <div className="philosophy-card dark-variant">
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

        <section className="completed-projects-section">
          <div className="container">
            <div className="services-header">
              <div className="eyebrow">Featured Landmarks</div>
              <h2 className="section-heading">
                Completed <span className="gold-accent">Projects Across Nigeria</span>
              </h2>
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

        <section className="testimonials-section">
          <div className="container">
            <div className="services-header">
              <div className="eyebrow">Client Voices</div>
              <h2 className="section-heading">
                What Our <span className="gold-accent">Clients Say</span>
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
      </main>

      <Footer />
    </>
  );
}

