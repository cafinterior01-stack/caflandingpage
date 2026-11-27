'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import BrandLogo from '@/components/BrandLogo';
import { useMarketplace } from '@/context/MarketplaceContext';
import { Category, Product } from '@/types';

function matchesDepartment(product: Product, category: Category | undefined, selectedSlug: string): boolean {
  if (selectedSlug === 'all') return true;
  const normalizedTarget = selectedSlug.toLowerCase().trim();
  if (category) {
    return (
      product.categorySlug?.toLowerCase().trim() === category.slug.toLowerCase().trim() ||
      product.categoryId === category.id ||
      product.categoryName?.toLowerCase().trim() === category.name.toLowerCase().trim()
    );
  }
  return (
    product.categorySlug?.toLowerCase().trim() === normalizedTarget ||
    product.categoryId === selectedSlug ||
    product.categoryName?.toLowerCase().trim() === normalizedTarget
  );
}

function ShopMarketplaceContent() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get('category') || 'all';
  const initialQuery = searchParams.get('search') || '';

  const {
    catalogProducts,
    catalogCategories,
    catalogLoading,
    refreshCatalog,
    wishlistIds,
    compareIds,
    setCompareOpen,
    openCustomModal,
  } = useMarketplace();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [paySmallSmallOnly, setPaySmallSmallOnly] = useState<boolean>(false);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [savedOnly, setSavedOnly] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<string>('all');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  useEffect(() => {
    const catParam = searchParams.get('category');
    const qParam = searchParams.get('search');
    if (catParam) setSelectedCategory(catParam);
    else setSelectedCategory('all');
    if (qParam !== null) setSearchQuery(qParam);
  }, [searchParams]);

  const activeCategoryObj = catalogCategories.find(
    (c) =>
      c.slug.toLowerCase() === selectedCategory.toLowerCase() ||
      c.id === selectedCategory ||
      c.name.toLowerCase() === selectedCategory.toLowerCase()
  );

  const filteredProducts = catalogProducts.filter((p) => {
    if (selectedCategory !== 'all' && !matchesDepartment(p, activeCategoryObj, selectedCategory)) {
      return false;
    }
    if (paySmallSmallOnly && !p.paySmallSmall.eligible) {
      return false;
    }
    if (inStockOnly && p.availability !== 'IN_STOCK') {
      return false;
    }
    if (savedOnly && !wishlistIds.includes(p.id)) {
      return false;
    }
    if (priceRange === 'under-1m' && p.price >= 1000000) {
      return false;
    }
    if (priceRange === '1m-2.5m' && (p.price < 1000000 || p.price > 2500000)) {
      return false;
    }
    if (priceRange === 'above-2.5m' && p.price <= 2500000) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.materials.frame.toLowerCase().includes(q) ||
        p.materials.upholstery.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'newest') return Number(b.isNewArrival) - Number(a.isNewArrival);
    if (sortBy === 'bestselling') return Number(b.isBestSeller) - Number(a.isBestSeller);
    return Number(b.isFeatured) - Number(a.isFeatured);
  });

  const getDepartmentLiveCount = (cat: Category) =>
    catalogProducts.filter((p) => matchesDepartment(p, cat, cat.slug)).length;

  return (
    <main className="shop-page-main">
      {/* Shop Hero Banner */}
      <section className="shop-hero-banner">
        <div className="container">
          <div className="eyebrow">CAF Interior and Exterior Service • Official Marketplace</div>
          <h1 className="shop-hero-title">
            {activeCategoryObj ? activeCategoryObj.name : 'Luxury Furniture & Decor Marketplace'}
          </h1>
          <p className="shop-hero-sub">
            {activeCategoryObj
              ? activeCategoryObj.description
              : `Explore our ${catalogCategories.length} handcrafted furniture and interior design decor departments. Pay outright or spread your investment with Pay Small Small.`}
          </p>
        </div>
      </section>

      <section className="shop-body-section">
        <div className="container">
          {/* Mobile Horizontal Quick-Category Pill Scroller */}
          <div className="mobile-category-scroller" aria-label="Quick category filter">
            <button
              type="button"
              className={`cat-scroll-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All ({catalogProducts.length})
            </button>
            {catalogCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`cat-scroll-pill ${selectedCategory === cat.slug ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.slug)}
              >
                {cat.name} ({getDepartmentLiveCount(cat)})
              </button>
            ))}
          </div>

          {/* Top Search & Filter Control Bar */}
          <div className="shop-controls-bar">
            <div className="shop-search-input-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name, material (mahogany, bouclé, marble), or category..."
                aria-label="Filter products by keyword"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="shop-filters-group">
              <button
                type="button"
                className="mobile-sidebar-toggle-btn"
                onClick={() => setMobileSidebarOpen((prev) => !prev)}
                aria-expanded={mobileSidebarOpen}
              >
                ☰ {mobileSidebarOpen ? 'Hide Departments' : `All ${catalogCategories.length} Departments`}
              </button>

              <label className="pss-filter-toggle">
                <input
                  type="checkbox"
                  checked={paySmallSmallOnly}
                  onChange={(e) => setPaySmallSmallOnly(e.target.checked)}
                />
                <span>Pay Small Small Eligible</span>
              </label>

              <label className="pss-filter-toggle" style={{ background: 'transparent' }}>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                <span>In Stock Now</span>
              </label>

              {wishlistIds.length > 0 && (
                <label className="pss-filter-toggle" style={{ background: 'transparent' }}>
                  <input
                    type="checkbox"
                    checked={savedOnly}
                    onChange={(e) => setSavedOnly(e.target.checked)}
                  />
                  <span>♥ Saved Wishlist ({wishlistIds.length})</span>
                </label>
              )}

              <select
                className="shop-select"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                aria-label="Filter by price range"
              >
                <option value="all">All Prices (₦)</option>
                <option value="under-1m">Under ₦1,000,000</option>
                <option value="1m-2.5m">₦1,000,000 – ₦2,500,000</option>
                <option value="above-2.5m">Above ₦2,500,000</option>
              </select>

              <select
                className="shop-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort products"
              >
                <option value="featured">Sort: Featured Pieces</option>
                <option value="bestselling">Sort: Best-Selling</option>
                <option value="newest">Sort: New Arrivals</option>
                <option value="price-asc">Sort: Price (Low to High)</option>
                <option value="price-desc">Sort: Price (High to Low)</option>
              </select>
            </div>
          </div>

          <div className="shop-layout-grid">
            {/* Sidebar: All Categories (Collapsible on mobile/tablet) */}
            <aside
              id="categories"
              className={`shop-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}
            >
              <div className="sidebar-box">
                <h3 className="sidebar-title">
                  Departments ({catalogCategories.length})
                </h3>
                <div className="sidebar-cat-list">
                  <button
                    type="button"
                    className={`sidebar-cat-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory('all');
                      setMobileSidebarOpen(false);
                    }}
                  >
                    <span>All Luxury Collections</span>
                    <span className="count">{catalogProducts.length}</span>
                  </button>

                  {catalogCategories.map((cat) => {
                    const count = getDepartmentLiveCount(cat);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`sidebar-cat-btn ${selectedCategory === cat.slug ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedCategory(cat.slug);
                          setMobileSidebarOpen(false);
                        }}
                      >
                        <span>{cat.name}</span>
                        <span className="count">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="sidebar-bespoke-box">
                <span className="badge-pss">Bespoke Studio</span>
                <h4>Need Custom Dimensions or Fabric?</h4>
                <p>
                  Every CAF Interiors design can be built to your exact room measurements and colour
                  palette.
                </p>
                <button
                  type="button"
                  className="btn-gold"
                  style={{ width: '100%' }}
                  onClick={() => openCustomModal({ defaultCategory: activeCategoryObj?.name })}
                >
                  Request Custom Furniture
                </button>
              </div>
            </aside>

            {/* Main Catalog Grid */}
            <div className="shop-results-area">
              <div className="shop-results-toolbar">
                <span>
                  Showing <strong>{filteredProducts.length}</strong> luxury{' '}
                  {filteredProducts.length === 1 ? 'piece' : 'pieces'}
                  {activeCategoryObj ? ` in ${activeCategoryObj.name}` : ''}
                </span>

                {compareIds.length > 0 && (
                  <button
                    type="button"
                    className="compare-launch-pill"
                    onClick={() => setCompareOpen(true)}
                  >
                    Compare Selected ({compareIds.length}/4) &rarr;
                  </button>
                )}
              </div>

              {catalogLoading ? (
                <div className="shop-empty-box">
                  <h3>Loading CAF Interiors Catalog...</h3>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="shop-empty-box">
                  <h3>
                    {activeCategoryObj
                      ? `No published products currently in ${activeCategoryObj.name}`
                      : 'No matching furniture pieces found'}
                  </h3>
                  <p style={{ marginTop: '0.5rem', color: '#57534e' }}>
                    {catalogProducts.length === 0
                      ? 'The catalog currently has no published products, or all items have been removed by the administrator. You can still commission a custom furniture piece below.'
                      : 'Try viewing all departments, resetting your search filters, or commissioning our bespoke workshop to craft your exact specification.'}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      marginTop: '1.5rem',
                    }}
                  >
                    <button
                      type="button"
                      className="btn-gold"
                      onClick={() => {
                        setSelectedCategory('all');
                        setSearchQuery('');
                        setPaySmallSmallOnly(false);
                        setInStockOnly(false);
                        setSavedOnly(false);
                        setPriceRange('all');
                      }}
                    >
                      Reset All Filters
                    </button>
                    <button
                      type="button"
                      className="btn-outline-dark"
                      onClick={() => openCustomModal()}
                    >
                      Order Custom Piece
                    </button>
                  </div>
                </div>
              ) : (
                <div className="products-grid-2col-shop">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ShopPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="loading-skeleton-screen">
            <BrandLogo variant="loading" href={null} />
            <p>Loading CAF Interiors Luxury Marketplace...</p>
          </div>
        }
      >
        <ShopMarketplaceContent />
      </Suspense>
      <Footer />
    </>
  );
}
