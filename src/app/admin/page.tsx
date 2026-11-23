'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useMarketplace } from '@/context/MarketplaceContext';
import { formatNaira, getWhatsAppUrl } from '@/lib/format';
import { Product, Category, Testimonial } from '@/types';
import {
  OrderRecord,
  InstalmentPaymentRecord,
  CustomFurnitureEnquiryRecord,
  QuotationRecord,
  InteriorDesignProjectRecord,
  PromoRecord,
} from '@/lib/db-store';

interface AdminAnalytics {
  totalSalesContractValue: number;
  totalOrdersCount: number;
  verifiedRevenueCollected: number;
  outstandingPayments: number;
  bestSellingProducts: Product[];
  newCustomersCount: number;
  activeProjectsCount: number;
  pendingInstalmentReviews: number;
  pendingCustomQuotations: number;
}

export default function AdminDashboardPage() {
  const { user, refreshUser, showToast } = useMarketplace();

  const [activeModule, setActiveModule] = useState<
    | 'analytics'
    | 'products'
    | 'categories'
    | 'orders'
    | 'payments'
    | 'custom'
    | 'projects'
    | 'marketing'
  >('analytics');

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [payments, setPayments] = useState<InstalmentPaymentRecord[]>([]);
  const [customEnquiries, setCustomEnquiries] = useState<CustomFurnitureEnquiryRecord[]>([]);
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [interiorProjects, setInteriorProjects] = useState<InteriorDesignProjectRecord[]>([]);
  const [customers, setCustomers] = useState<
    Array<{ id: string; name: string; email: string; role: string; phone: string; city?: string; state?: string }>
  >([]);
  const [promotions, setPromotions] = useState<PromoRecord[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [bannerText, setBannerText] = useState('');

  // New Product Form State
  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState('Living Room Furniture');
  const [prodPrice, setProdPrice] = useState(1250000);
  const [prodOriginalPrice, setProdOriginalPrice] = useState(1450000);
  const [prodShortDesc, setProdShortDesc] = useState('');
  const [prodImages, setProdImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80',
  ]);
  const [prodImageUrlInput, setProdImageUrlInput] = useState('');
  const [prodAvailability, setProdAvailability] = useState<'IN_STOCK' | 'MADE_TO_ORDER'>('IN_STOCK');
  const [prodPssEligible, setProdPssEligible] = useState(true);
  const [prodDepositPct, setProdDepositPct] = useState(33.33);
  const [prodDimensions, setProdDimensions] = useState('240cm × 110cm × 78cm');

  // Inline Edit Product State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdPrice, setEditProdPrice] = useState(0);
  const [editProdPss, setEditProdPss] = useState(true);

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Record Offline Payment State
  const [manualPayOrderNum, setManualPayOrderNum] = useState('CAF-2026-1042');
  const [manualPayAmount, setManualPayAmount] = useState(250000);
  const [manualPayRef, setManualPayRef] = useState('');

  // Custom Enquiry Quotation Sender State
  const [quotingEnquiry, setQuotingEnquiry] = useState<CustomFurnitureEnquiryRecord | null>(null);
  const [quoteItemDesc, setQuoteItemDesc] = useState('');
  const [quoteItemPrice, setQuoteItemPrice] = useState(1800000);
  const [quoteDeliveryFee, setQuoteDeliveryFee] = useState(75000);
  const [quoteLeadTime, setQuoteLeadTime] = useState('14 – 21 Business Days');

  // Marketing & Testimonials State
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoVal, setNewPromoVal] = useState(10);
  const [newTestClient, setNewTestClient] = useState('');
  const [newTestLocation, setNewTestLocation] = useState('Ikoyi, Lagos');
  const [newTestQuote, setNewTestQuote] = useState('');

  const loadAdminDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setAnalytics(data.analytics);
        setProducts(data.products || []);
        setCategories(data.categories || []);
        setOrders(data.orders || []);
        setPayments(data.payments || []);
        setCustomEnquiries(data.customEnquiries || []);
        setQuotations(data.quotations || []);
        setInteriorProjects(data.interiorProjects || []);
        setCustomers(data.customers || []);
        setPromotions(data.promotions || []);
        setTestimonials(data.testimonials || []);
        setBannerText(data.promotionalBanner || '');
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminDashboard();
  }, [loadAdminDashboard]);

  const handleQuickAdminAuth = async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cafinteriors.ng',
        password: 'CAFAdmin2026!',
      }),
    });
    if (res.ok) {
      await refreshUser();
      showToast('Signed in as CAF Interiors Administrator.');
    }
  };

  const handleProductPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).slice(0, 3).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setProdImages((prev) => [reader.result as string, ...prev]);
        }
      };
      reader.readAsDataURL(file);
    });
    showToast('Uploaded product photograph.');
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: prodName,
        categoryName: prodCat,
        price: prodPrice,
        originalPrice: prodOriginalPrice,
        shortDescription: prodShortDesc,
        images: prodImages,
        availability: prodAvailability,
        paySmallSmallEligible: prodPssEligible,
        depositPercentage: prodDepositPct,
        dimensions: prodDimensions,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message);
      setProdName('');
      setProdShortDesc('');
      await loadAdminDashboard();
    } else {
      showToast(data.error || 'Could not add product.');
    }
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const res = await fetch(`/api/products/${encodeURIComponent(editingProduct.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price: editProdPrice,
        paySmallSmallEligible: editProdPss,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message);
      setEditingProduct(null);
      await loadAdminDashboard();
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      showToast('Product removed from marketplace.');
      await loadAdminDashboard();
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADD_CATEGORY',
        name: newCatName,
        description: newCatDesc,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message);
      setNewCatName('');
      setNewCatDesc('');
      await loadAdminDashboard();
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    updates: { orderStatus?: string; instalmentApprovalStatus?: string }
  ) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_ORDER_STATUS',
        orderId,
        ...updates,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message);
      await loadAdminDashboard();
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    const res = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'VERIFY_PAYMENT',
        paymentId,
        verifySecret: 'CAF_ADMIN_VERIFY',
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message);
      await loadAdminDashboard();
    }
  };

  const handleRecordAndVerifyOfflinePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const subRes = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SUBMIT_INSTALMENT_PAYMENT',
        orderNumber: manualPayOrderNum,
        instalmentNumber: 1,
        label: 'Administrator Recorded Bank Transfer',
        amount: manualPayAmount,
        paymentMethod: 'BANK_TRANSFER',
        paymentReference: manualPayRef || `ADMIN-BNK-${Date.now().toString().slice(-5)}`,
      }),
    });
    const subData = await subRes.json();
    if (subRes.ok && subData.payment) {
      await handleVerifyPayment(subData.payment.id);
      setManualPayRef('');
    } else {
      showToast(subData.error || 'Could not record offline payment.');
    }
  };

  const handleSendQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotingEnquiry) return;
    const res = await fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enquiryId: quotingEnquiry.id,
        items: [
          {
            description: quoteItemDesc || `Bespoke ${quotingEnquiry.category} Commission`,
            quantity: 1,
            unitPrice: Number(quoteItemPrice),
            total: Number(quoteItemPrice),
          },
        ],
        deliveryAndInstallationFee: Number(quoteDeliveryFee),
        paySmallSmallEligible: true,
        estimatedLeadTime: quoteLeadTime,
        adminOverride: true,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message);
      setQuotingEnquiry(null);
      await loadAdminDashboard();
    }
  };

  const handleUpdateProjectMilestone = async (
    projectId: string,
    milestoneId: string,
    status: 'IN_PROGRESS' | 'COMPLETED'
  ) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_MILESTONE',
        projectId,
        milestoneId,
        status,
        completionPercent: status === 'COMPLETED' ? 100 : 50,
        deliverableNote:
          status === 'COMPLETED'
            ? `Completed & verified by CAF Admin on ${new Date().toLocaleDateString('en-NG')}.`
            : 'In active execution.',
      }),
    });
    if (res.ok) {
      showToast('Project milestone updated.');
      await loadAdminDashboard();
    }
  };

  const handleAddPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADD_PROMOTION',
        code: newPromoCode,
        value: newPromoVal,
      }),
    });
    if (res.ok) {
      showToast(`Promo code ${newPromoCode} created.`);
      setNewPromoCode('');
      await loadAdminDashboard();
    }
  };

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADD_TESTIMONIAL',
        clientName: newTestClient,
        location: newTestLocation,
        quote: newTestQuote,
      }),
    });
    if (res.ok) {
      showToast('Customer testimonial published.');
      setNewTestClient('');
      setNewTestQuote('');
      await loadAdminDashboard();
    }
  };

  return (
    <>
      <Navbar />

      <main className="admin-dashboard-main">
        <div className="container">
          {/* Executive Header */}
          <div className="account-header-card">
            <div>
              <span className="eyebrow left-align">
                CAF Interior and Exterior Service • Executive Command Center
              </span>
              <h1>Administrator Dashboard</h1>
              <p>
                Manage products, 14 categories, orders, Pay Small Small approvals, payment
                verification, custom quotations, and interior design project milestones.
              </p>
            </div>
            <div className="account-header-actions">
              {user?.role !== 'ADMIN' && (
                <button type="button" className="btn-gold" onClick={handleQuickAdminAuth}>
                  Activate Admin Session (admin@cafinteriors.ng)
                </button>
              )}
              <Link href="/shop" className="btn-outline-gold">
                View Live Storefront
              </Link>
            </div>
          </div>

          {/* 7-Metric Business Analytics Bar */}
          {analytics && (
            <div className="admin-kpi-grid">
              <div className="account-kpi-card">
                <small>1. Total Sales (Contract Value)</small>
                <strong>{formatNaira(analytics.totalSalesContractValue)}</strong>
              </div>
              <div className="account-kpi-card">
                <small>2. Total Orders</small>
                <strong>{analytics.totalOrdersCount}</strong>
              </div>
              <div className="account-kpi-card">
                <small>3. Verified Revenue Collected</small>
                <strong style={{ color: '#15803d' }}>
                  {formatNaira(analytics.verifiedRevenueCollected)}
                </strong>
              </div>
              <div className="account-kpi-card">
                <small>4. Outstanding Payments</small>
                <strong className="gold-text">{formatNaira(analytics.outstandingPayments)}</strong>
              </div>
              <div className="account-kpi-card">
                <small>5. Best-Selling Catalog Items</small>
                <strong>{analytics.bestSellingProducts.length} Flagships</strong>
              </div>
              <div className="account-kpi-card">
                <small>6. Registered Customers</small>
                <strong>{analytics.newCustomersCount} Clients</strong>
              </div>
              <div className="account-kpi-card">
                <small>7. Active Interior Projects</small>
                <strong>{analytics.activeProjectsCount} Sites</strong>
              </div>
              <div className="account-kpi-card">
                <small>Pending Quotations &amp; Credit</small>
                <strong>
                  {analytics.pendingInstalmentReviews + analytics.pendingCustomQuotations} Queued
                </strong>
              </div>
            </div>
          )}

          {/* 8-Module Navigation Tabs */}
          <div className="showcase-tabs" style={{ marginBottom: '2rem' }}>
            <button
              type="button"
              className={`showcase-tab-btn ${activeModule === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveModule('analytics')}
            >
              1. Sales Reports &amp; Analytics
            </button>
            <button
              type="button"
              className={`showcase-tab-btn ${activeModule === 'products' ? 'active' : ''}`}
              onClick={() => setActiveModule('products')}
            >
              2. Products &amp; Inventory ({products.length})
            </button>
            <button
              type="button"
              className={`showcase-tab-btn ${activeModule === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveModule('categories')}
            >
              3. Categories ({categories.length})
            </button>
            <button
              type="button"
              className={`showcase-tab-btn ${activeModule === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveModule('orders')}
            >
              4. Orders, Deliveries &amp; Credit ({orders.length})
            </button>
            <button
              type="button"
              className={`showcase-tab-btn ${activeModule === 'payments' ? 'active' : ''}`}
              onClick={() => setActiveModule('payments')}
            >
              5. Payment Verification &amp; Receipts ({payments.length})
            </button>
            <button
              type="button"
              className={`showcase-tab-btn ${activeModule === 'custom' ? 'active' : ''}`}
              onClick={() => setActiveModule('custom')}
            >
              6. Custom Requests &amp; Quotations ({customEnquiries.length})
            </button>
            <button
              type="button"
              className={`showcase-tab-btn ${activeModule === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveModule('projects')}
            >
              7. Interior Projects &amp; Milestones ({interiorProjects.length})
            </button>
            <button
              type="button"
              className={`showcase-tab-btn ${activeModule === 'marketing' ? 'active' : ''}`}
              onClick={() => setActiveModule('marketing')}
            >
              8. Customers, Testimonials &amp; Promos
            </button>
          </div>

          {loading ? (
            <p>Loading Executive Command Center...</p>
          ) : (
            <>
              {/* MODULE 1: ANALYTICS & SALES REPORTS */}
              {activeModule === 'analytics' && analytics && (
                <div className="pss-studio-grid">
                  <div className="checkout-panel">
                    <h3>Financial &amp; Instalment Revenue Report</h3>
                    <div className="pdp-specs-list">
                      <div className="pdp-spec-row">
                        <span>Gross Contract Sales Volume</span>
                        <strong>{formatNaira(analytics.totalSalesContractValue)}</strong>
                      </div>
                      <div className="pdp-spec-row">
                        <span>Verified Cash &amp; Deposit Inflow</span>
                        <strong style={{ color: '#15803d' }}>
                          {formatNaira(analytics.verifiedRevenueCollected)}
                        </strong>
                      </div>
                      <div className="pdp-spec-row">
                        <span>Receivables (Pay Small Small Balances)</span>
                        <strong className="gold-text">
                          {formatNaira(analytics.outstandingPayments)}
                        </strong>
                      </div>
                      <div className="pdp-spec-row">
                        <span>Active Interior Design Contract Value</span>
                        <strong>
                          {formatNaira(
                            interiorProjects.reduce((s, p) => s + p.approvedContractAmount, 0)
                          )}
                        </strong>
                      </div>
                      <div className="pdp-spec-row">
                        <span>Issued Custom Furniture Quotations</span>
                        <strong>
                          {formatNaira(
                            quotations.reduce((s, q) => s + q.totalQuotedAmount, 0)
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="checkout-panel">
                    <h3>Best-Selling Luxury Products</h3>
                    <div className="pdp-specs-list">
                      {analytics.bestSellingProducts.map((bp) => (
                        <div key={bp.id} className="pdp-spec-row">
                          <span>
                            <strong>{bp.name}</strong> ({bp.categoryName})
                          </span>
                          <strong>{formatNaira(bp.price)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 2: PRODUCTS, PHOTOGRAPHS, PRICES & INVENTORY CRUD */}
              {activeModule === 'products' && (
                <div className="pss-studio-grid">
                  {/* Left: Add New Product Form */}
                  <div className="checkout-panel">
                    <h3>Add New Luxury Furniture Product</h3>
                    <form onSubmit={handleAddProduct}>
                      <div className="form-group">
                        <label className="form-label dark-label">Product Name *</label>
                        <input
                          type="text"
                          className="checkout-input"
                          value={prodName}
                          onChange={(e) => setProdName(e.target.value)}
                          placeholder="e.g. Presidential 7x7 Tufted Velvet Emperor Bed"
                          required
                        />
                      </div>

                      <div className="form-row-2">
                        <div className="form-group">
                          <label className="form-label dark-label">Category *</label>
                          <select
                            className="checkout-input"
                            value={prodCat}
                            onChange={(e) => setProdCat(e.target.value)}
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label dark-label">Inventory Status</label>
                          <select
                            className="checkout-input"
                            value={prodAvailability}
                            onChange={(e) =>
                              setProdAvailability(e.target.value as 'IN_STOCK' | 'MADE_TO_ORDER')
                            }
                          >
                            <option value="IN_STOCK">In Stock</option>
                            <option value="MADE_TO_ORDER">Made to Order</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-row-2">
                        <div className="form-group">
                          <label className="form-label dark-label">Selling Price (₦) *</label>
                          <input
                            type="number"
                            className="checkout-input"
                            value={prodPrice}
                            onChange={(e) => setProdPrice(Number(e.target.value))}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label dark-label">Original Price (₦)</label>
                          <input
                            type="number"
                            className="checkout-input"
                            value={prodOriginalPrice}
                            onChange={(e) => setProdOriginalPrice(Number(e.target.value))}
                          />
                        </div>
                      </div>

                      {/* Upload Product Photographs */}
                      <div className="upload-block">
                        <label className="form-label dark-label">Upload Product Photographs</label>
                        <div className="upload-controls-row">
                          <label className="file-upload-btn">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleProductPhotoUpload}
                            />
                            <span>+ Upload Product Photo</span>
                          </label>
                          <div className="url-append-box">
                            <input
                              type="text"
                              placeholder="Or paste image URL..."
                              value={prodImageUrlInput}
                              onChange={(e) => setProdImageUrlInput(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (prodImageUrlInput.trim()) {
                                  setProdImages((prev) => [prodImageUrlInput.trim(), ...prev]);
                                  setProdImageUrlInput('');
                                }
                              }}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                        <div className="uploaded-thumbs-grid">
                          {prodImages.map((img, i) => (
                            <div key={i} className="uploaded-thumb-item">
                              <img src={img} alt="Product" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="form-row-2">
                        <div className="form-group">
                          <label className="form-label dark-label">Standard Dimensions</label>
                          <input
                            type="text"
                            className="checkout-input"
                            value={prodDimensions}
                            onChange={(e) => setProdDimensions(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label dark-label">Pay Small Small Deposit (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="checkout-input"
                            value={prodDepositPct}
                            onChange={(e) => setProdDepositPct(Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label dark-label">Product Summary Description</label>
                        <textarea
                          className="checkout-input"
                          rows={2}
                          value={prodShortDesc}
                          onChange={(e) => setProdShortDesc(e.target.value)}
                          placeholder="Describe materials, comfort, and craftsmanship..."
                        />
                      </div>

                      <label className="checkout-terms-check" style={{ marginBottom: '1rem' }}>
                        <input
                          type="checkbox"
                          checked={prodPssEligible}
                          onChange={(e) => setProdPssEligible(e.target.checked)}
                        />
                        <span>Qualifies for Pay Small Small Instalments</span>
                      </label>

                      <button type="submit" className="btn-gold" style={{ width: '100%' }}>
                        + Publish Product to Marketplace
                      </button>
                    </form>
                  </div>

                  {/* Right: Catalog Inventory Table with Edit & Delete */}
                  <div className="checkout-panel">
                    <h3>Manage Catalog Products ({products.length})</h3>
                    {editingProduct && (
                      <form
                        onSubmit={handleSaveProductEdit}
                        className="checkout-pss-notice"
                        style={{ marginBottom: '1.25rem' }}
                      >
                        <h4>Editing: {editingProduct.name}</h4>
                        <div className="form-row-2" style={{ marginTop: '0.75rem' }}>
                          <div>
                            <label className="form-label">Price (₦)</label>
                            <input
                              type="number"
                              className="form-input"
                              value={editProdPrice}
                              onChange={(e) => setEditProdPrice(Number(e.target.value))}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', paddingTop: '1.2rem' }}>
                            <label className="checkout-terms-check">
                              <input
                                type="checkbox"
                                checked={editProdPss}
                                onChange={(e) => setEditProdPss(e.target.checked)}
                              />
                              <span>Pay Small Small Eligible</span>
                            </label>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
                          <button type="submit" className="btn-gold">
                            Save Changes
                          </button>
                          <button
                            type="button"
                            className="btn-outline-gold"
                            onClick={() => setEditingProduct(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="admin-scroll-list">
                      {products.map((p) => (
                        <div key={p.id} className="admin-list-item">
                          <img src={p.images[0]} alt={p.name} className="admin-item-thumb" />
                          <div style={{ flex: 1 }}>
                            <strong>{p.name}</strong>
                            <div style={{ fontSize: '0.78rem', color: '#57534e' }}>
                              {p.categoryName} • {formatNaira(p.price)} •{' '}
                              {p.paySmallSmall.eligible ? 'Pay Small Small' : 'Outright Only'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.45rem' }}>
                            <button
                              type="button"
                              className="btn-outline-dark"
                              style={{ minHeight: '34px', padding: '0.3rem 0.7rem', fontSize: '0.7rem' }}
                              onClick={() => {
                                setEditingProduct(p);
                                setEditProdPrice(p.price);
                                setEditProdPss(p.paySmallSmall.eligible);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="compare-remove-tag"
                              onClick={() => handleDeleteProduct(p.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 3: CATEGORIES MANAGER */}
              {activeModule === 'categories' && (
                <div className="pss-studio-grid">
                  <div className="checkout-panel">
                    <h3>Add New Furniture Category</h3>
                    <form onSubmit={handleAddCategory}>
                      <div className="form-group">
                        <label className="form-label dark-label">Category Name *</label>
                        <input
                          type="text"
                          className="checkout-input"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="e.g. Home Cinema & Acoustic Loungers"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label dark-label">Description</label>
                        <textarea
                          className="checkout-input"
                          rows={2}
                          value={newCatDesc}
                          onChange={(e) => setNewCatDesc(e.target.value)}
                          placeholder="Describe this furniture department..."
                        />
                      </div>
                      <button type="submit" className="btn-gold">
                        + Create Category
                      </button>
                    </form>
                  </div>

                  <div className="checkout-panel">
                    <h3>Active Marketplace Categories ({categories.length})</h3>
                    <div className="admin-scroll-list">
                      {categories.map((cat) => (
                        <div key={cat.id} className="admin-list-item">
                          <img src={cat.image} alt={cat.name} className="admin-item-thumb" />
                          <div style={{ flex: 1 }}>
                            <strong>{cat.name}</strong>
                            <div style={{ fontSize: '0.78rem', color: '#57534e' }}>
                              Slug: /{cat.slug} • {cat.productCount} Pieces
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 4: ORDERS, DELIVERIES & INSTALMENT APPROVALS */}
              {activeModule === 'orders' && (
                <div className="account-orders-list">
                  {orders.map((ord) => (
                    <article key={ord.id} className="account-order-card">
                      <div className="account-order-top">
                        <div>
                          <span className="badge-pss">{ord.orderNumber}</span>
                          <strong style={{ marginLeft: '0.75rem' }}>
                            {ord.customerName} ({ord.customerPhone})
                          </strong>
                          <span className="order-date">
                            • {ord.deliveryAddress}, {ord.city}, {ord.state}
                          </span>
                        </div>
                        <div className="account-order-statuses">
                          <span className="badge-dark">Order: {ord.orderStatus}</span>
                          <span className="badge-ivory">Payment: {ord.paymentStatus}</span>
                          {ord.hasPaySmallSmall && (
                            <span className="badge-gold-outline">
                              Credit: {ord.instalmentApprovalStatus}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="account-order-footer" style={{ marginTop: '1rem' }}>
                        <div className="account-order-totals">
                          <span>Contract: <strong>{formatNaira(ord.totalOrderValue)}</strong></span>
                          <span>Verified Paid: <strong style={{ color: '#15803d' }}>{formatNaira(ord.amountPaidVerified)}</strong></span>
                          <span>Balance: <strong className="gold-text">{formatNaira(ord.remainingBalance)}</strong></span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          {ord.hasPaySmallSmall && (
                            <>
                              <button
                                type="button"
                                className="btn-gold"
                                style={{ minHeight: '36px', padding: '0.4rem 0.9rem', fontSize: '0.72rem' }}
                                onClick={() =>
                                  handleUpdateOrderStatus(ord.id, {
                                    instalmentApprovalStatus: 'APPROVED',
                                  })
                                }
                              >
                                ✓ Approve Instalment
                              </button>
                              <button
                                type="button"
                                className="compare-remove-tag"
                                onClick={() =>
                                  handleUpdateOrderStatus(ord.id, {
                                    instalmentApprovalStatus: 'REJECTED',
                                  })
                                }
                              >
                                Reject Credit
                              </button>
                            </>
                          )}

                          <select
                            className="shop-select"
                            value={ord.orderStatus}
                            onChange={(e) =>
                              handleUpdateOrderStatus(ord.id, { orderStatus: e.target.value })
                            }
                          >
                            <option value="PENDING_VERIFICATION">Pending Verification</option>
                            <option value="IN_PRODUCTION">In Workshop Production</option>
                            <option value="READY_FOR_DELIVERY">Ready for Delivery</option>
                            <option value="DELIVERED">Delivered &amp; Installed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>

                          <Link
                            href={`/checkout/success?order=${encodeURIComponent(ord.orderNumber)}`}
                            className="btn-outline-dark"
                            style={{ minHeight: '36px', padding: '0.4rem 0.9rem', fontSize: '0.72rem' }}
                          >
                            Invoice / Receipt
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* MODULE 5: PAYMENT VERIFICATION & RECEIPT GENERATOR */}
              {activeModule === 'payments' && (
                <div className="pss-studio-grid">
                  <div className="checkout-panel">
                    <h3>Record &amp; Verify Offline Corporate Bank Transfer</h3>
                    <form onSubmit={handleRecordAndVerifyOfflinePayment}>
                      <div className="form-group">
                        <label className="form-label dark-label">Order Number *</label>
                        <input
                          type="text"
                          className="checkout-input"
                          value={manualPayOrderNum}
                          onChange={(e) => setManualPayOrderNum(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label dark-label">Verified Amount Received (₦) *</label>
                        <input
                          type="number"
                          className="checkout-input"
                          value={manualPayAmount}
                          onChange={(e) => setManualPayAmount(Number(e.target.value))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label dark-label">Bank NIP Session ID / Reference</label>
                        <input
                          type="text"
                          className="checkout-input"
                          value={manualPayRef}
                          onChange={(e) => setManualPayRef(e.target.value)}
                          placeholder="e.g. 000014261123094821"
                        />
                      </div>
                      <button type="submit" className="btn-gold" style={{ width: '100%' }}>
                        Record, Verify &amp; Issue Official Receipt
                      </button>
                    </form>
                  </div>

                  <div className="checkout-panel">
                    <h3>All Payment Submissions ({payments.length})</h3>
                    <div className="admin-scroll-list">
                      {payments.map((pay) => (
                        <div key={pay.id} className="admin-list-item">
                          <div style={{ flex: 1 }}>
                            <strong>
                              {pay.orderNumber} — {formatNaira(pay.amount)}
                            </strong>
                            <div style={{ fontSize: '0.78rem', color: '#57534e' }}>
                              {pay.label} • {pay.paymentMethod} • Ref: {pay.paymentReference}
                              {pay.receiptNumber ? ` • Receipt: ${pay.receiptNumber}` : ''}
                            </div>
                          </div>
                          <div>
                            {pay.status === 'VERIFIED' ? (
                              <span className="badge-pss">VERIFIED</span>
                            ) : (
                              <button
                                type="button"
                                className="btn-gold"
                                style={{ minHeight: '34px', padding: '0.35rem 0.85rem', fontSize: '0.72rem' }}
                                onClick={() => handleVerifyPayment(pay.id)}
                              >
                                ✓ Verify &amp; Issue Receipt
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 6: CUSTOM FURNITURE REQUESTS & QUOTATION SENDER */}
              {activeModule === 'custom' && (
                <div className="account-orders-list">
                  {quotingEnquiry && (
                    <form onSubmit={handleSendQuotation} className="checkout-pss-notice">
                      <h4>
                        Send Official Quotation to {quotingEnquiry.customerName} (
                        {quotingEnquiry.enquiryNumber})
                      </h4>
                      <div className="form-row-2" style={{ marginTop: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label">Specification Line Item</label>
                          <input
                            type="text"
                            className="form-input"
                            value={quoteItemDesc}
                            onChange={(e) => setQuoteItemDesc(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Quoted Price (₦)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={quoteItemPrice}
                            onChange={(e) => setQuoteItemPrice(Number(e.target.value))}
                            required
                          />
                        </div>
                      </div>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label className="form-label">White-Glove Delivery Fee (₦)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={quoteDeliveryFee}
                            onChange={(e) => setQuoteDeliveryFee(Number(e.target.value))}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Estimated Lead Time</label>
                          <input
                            type="text"
                            className="form-input"
                            value={quoteLeadTime}
                            onChange={(e) => setQuoteLeadTime(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="submit" className="btn-gold">
                          Transmit Quotation to Customer Dashboard
                        </button>
                        <button
                          type="button"
                          className="btn-outline-gold"
                          onClick={() => setQuotingEnquiry(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {customEnquiries.map((enq) => (
                    <article key={enq.id} className="account-order-card">
                      <div className="account-order-top">
                        <div>
                          <span className="badge-pss">{enq.enquiryNumber}</span>
                          <strong style={{ marginLeft: '0.75rem' }}>
                            {enq.category} — {enq.customerName} ({enq.customerPhone})
                          </strong>
                        </div>
                        <span className="badge-dark">{enq.status.replace(/_/g, ' ')}</span>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: '#57534e', margin: '0.75rem 0' }}>
                        <strong>Measurements:</strong> {enq.measurements} |{' '}
                        <strong>Materials:</strong> {enq.preferredMaterials} |{' '}
                        <strong>Finish:</strong> {enq.colorsAndFinishing} |{' '}
                        <strong>Location:</strong> {enq.location}
                        <br />
                        <strong>Brief:</strong> {enq.requirementsDescription}
                      </p>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          type="button"
                          className="btn-gold"
                          onClick={() => {
                            setQuotingEnquiry(enq);
                            setQuoteItemDesc(
                              `Bespoke ${enq.category} (${enq.measurements} • ${enq.preferredMaterials})`
                            );
                          }}
                        >
                          Prepare &amp; Send Official Quotation
                        </button>
                        <a
                          href={getWhatsAppUrl(
                            `Hello ${enq.customerName}, this is CAF Interiors regarding your Custom Furniture Request ${enq.enquiryNumber}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline-dark"
                        >
                          WhatsApp Client
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* MODULE 7: INTERIOR DESIGN PROJECTS & MILESTONES */}
              {activeModule === 'projects' && (
                <div className="account-orders-list">
                  {interiorProjects.map((prj) => (
                    <article key={prj.id} className="account-order-card">
                      <div className="account-order-top">
                        <div>
                          <span className="badge-pss">{prj.projectNumber}</span>
                          <strong style={{ marginLeft: '0.75rem' }}>
                            {prj.serviceType} — {prj.customerName} ({prj.propertyLocation})
                          </strong>
                        </div>
                        <span className="badge-dark">
                          Progress: {prj.overallProgressPercent}% • {prj.status}
                        </span>
                      </div>

                      <div className="pdp-pss-schedule-list" style={{ marginTop: '1rem' }}>
                        {prj.milestones.map((m) => (
                          <div key={m.id} className="pdp-pss-schedule-item" style={{ alignItems: 'center' }}>
                            <span>
                              <strong>0{m.stepNumber}. {m.title}</strong> ({m.status} • {m.completionPercent}%)
                            </span>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                type="button"
                                className="btn-outline-dark"
                                style={{ minHeight: '30px', padding: '0.2rem 0.6rem', fontSize: '0.68rem' }}
                                onClick={() =>
                                  handleUpdateProjectMilestone(prj.id, m.id, 'IN_PROGRESS')
                                }
                              >
                                In Progress
                              </button>
                              <button
                                type="button"
                                className="btn-gold"
                                style={{ minHeight: '30px', padding: '0.2rem 0.6rem', fontSize: '0.68rem' }}
                                onClick={() =>
                                  handleUpdateProjectMilestone(prj.id, m.id, 'COMPLETED')
                                }
                              >
                                ✓ Complete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* MODULE 8: CUSTOMERS, TESTIMONIALS & PROMOTIONAL BANNERS */}
              {activeModule === 'marketing' && (
                <div className="pss-studio-grid">
                  <div className="checkout-panel">
                    <h3>Registered Customer Accounts ({customers.length})</h3>
                    <div className="pdp-specs-list" style={{ marginBottom: '2rem' }}>
                      {customers.map((c) => (
                        <div key={c.id} className="pdp-spec-row">
                          <span>
                            <strong>{c.name}</strong> ({c.email} • {c.phone})
                          </span>
                          <strong>{c.role}</strong>
                        </div>
                      ))}
                    </div>

                    <h3>Create Promotional Discount Code</h3>
                    <form onSubmit={handleAddPromo}>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label className="form-label dark-label">Promo Code</label>
                          <input
                            type="text"
                            className="checkout-input"
                            value={newPromoCode}
                            onChange={(e) => setNewPromoCode(e.target.value)}
                            placeholder="e.g. LAGOSLUXE10"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label dark-label">Discount (%)</label>
                          <input
                            type="number"
                            className="checkout-input"
                            value={newPromoVal}
                            onChange={(e) => setNewPromoVal(Number(e.target.value))}
                            required
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn-gold">
                        + Activate Promo Code
                      </button>
                    </form>
                  </div>

                  <div className="checkout-panel">
                    <h3>Publish Customer Testimonial &amp; Banner</h3>
                    <form onSubmit={handleAddTestimonial} style={{ marginBottom: '2rem' }}>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label className="form-label dark-label">Client Name *</label>
                          <input
                            type="text"
                            className="checkout-input"
                            value={newTestClient}
                            onChange={(e) => setNewTestClient(e.target.value)}
                            placeholder="e.g. Alhaji & Hajiya Bello"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label dark-label">Location</label>
                          <input
                            type="text"
                            className="checkout-input"
                            value={newTestLocation}
                            onChange={(e) => setNewTestLocation(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label dark-label">Client Endorsement Quote *</label>
                        <textarea
                          className="checkout-input"
                          rows={2}
                          value={newTestQuote}
                          onChange={(e) => setNewTestQuote(e.target.value)}
                          required
                        />
                      </div>
                      <button type="submit" className="btn-gold">
                        + Publish Testimonial
                      </button>
                    </form>

                    <h4>Active Testimonials ({testimonials.length})</h4>
                    <div className="pdp-specs-list">
                      {testimonials.map((t) => (
                        <div key={t.id} className="pdp-spec-row">
                          <span>&ldquo;{t.quote.slice(0, 70)}...&rdquo;</span>
                          <strong>{t.clientName}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

