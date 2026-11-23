import { NextRequest, NextResponse } from 'next/server';
import { readDb, saveDb, parseSessionToken } from '@/lib/db-store';
import { PRODUCTS_CATALOG, FURNITURE_CATEGORIES, CUSTOMER_TESTIMONIALS } from '@/lib/catalog-data';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('caf_session')?.value;
  const session = parseSessionToken(token);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  if (session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Access denied. Administrator authorisation required.' },
      { status: 403 }
    );
  }

  const db = readDb();
  const products = db.products || PRODUCTS_CATALOG;
  const categories = db.categories || FURNITURE_CATEGORIES;
  const testimonials = db.testimonials || CUSTOMER_TESTIMONIALS;

  const totalSalesContractValue = db.orders.reduce((sum, o) => sum + o.totalOrderValue, 0);
  const totalOrdersCount = db.orders.length;
  const verifiedRevenueCollected = db.orders.reduce((sum, o) => sum + o.amountPaidVerified, 0);
  const outstandingPayments = db.orders.reduce((sum, o) => sum + o.remainingBalance, 0);
  const bestSellingProducts = products.filter((p) => p.isBestSeller).slice(0, 5);
  const customerAccounts = db.users.map(({ passwordHash: _ph, ...u }) => u);
  const activeProjectsCount = db.interiorProjects.length;

  return NextResponse.json({
    analytics: {
      totalSalesContractValue,
      totalOrdersCount,
      verifiedRevenueCollected,
      outstandingPayments,
      bestSellingProducts,
      newCustomersCount: customerAccounts.filter((u) => u.role === 'CUSTOMER').length,
      activeProjectsCount,
      pendingInstalmentReviews: db.orders.filter(
        (o) => o.instalmentApprovalStatus === 'PENDING_ADMIN_REVIEW'
      ).length,
      pendingCustomQuotations: db.customEnquiries.filter(
        (e) => e.status === 'SUBMITTED_FOR_REVIEW'
      ).length,
    },
    products,
    categories,
    orders: db.orders,
    payments: db.instalmentPayments,
    customEnquiries: db.customEnquiries,
    quotations: db.quotations,
    interiorProjects: db.interiorProjects,
    customers: customerAccounts,
    promotions: db.promotions,
    testimonials,
    promotionalBanner: db.promotionalBanner,
    paySmallSmallConfig: db.paySmallSmallConfig,
  });
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('caf_session')?.value;
    const session = parseSessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Administrator authorisation required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;
    const db = readDb();

    // 1. Update Order / Delivery status
    if (action === 'UPDATE_ORDER_STATUS') {
      const { orderId, orderStatus, instalmentApprovalStatus } = body;
      const idx = db.orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
      if (idx === -1) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      if (orderStatus) db.orders[idx].orderStatus = orderStatus;
      if (instalmentApprovalStatus) {
        db.orders[idx].instalmentApprovalStatus = instalmentApprovalStatus;
      }
      db.orders[idx].updatedAt = new Date().toISOString();
      saveDb(db);
      return NextResponse.json({
        order: db.orders[idx],
        message: `Updated Order ${db.orders[idx].orderNumber}.`,
      });
    }

    // 2. Add or update Category
    if (action === 'ADD_CATEGORY') {
      const { name, description, image } = body;
      if (!name) {
        return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
      }
      if (!db.categories) db.categories = [...FURNITURE_CATEGORIES];
      const slug = String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const newCat = {
        id: `cat-${Date.now()}`,
        name: String(name).trim(),
        slug,
        description: description || `Curated ${name} collection by CAF Interiors.`,
        image:
          image ||
          'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80',
        productCount: 1,
        featured: false,
      };
      db.categories.push(newCat);
      saveDb(db);
      return NextResponse.json({ category: newCat, message: `Category "${newCat.name}" added.` });
    }

    // 3. Add Promotional Code or Update Banner
    if (action === 'ADD_PROMOTION') {
      const { code, description, type = 'PERCENTAGE', value = 5, minOrderAmount = 500000 } = body;
      if (!code) {
        return NextResponse.json({ error: 'Promo code is required' }, { status: 400 });
      }
      db.promotions.push({
        code: String(code).trim().toUpperCase(),
        description: description || `${value}% Privilege Discount`,
        type,
        value: Number(value),
        minOrderAmount: Number(minOrderAmount),
        active: true,
      });
      saveDb(db);
      return NextResponse.json({ promotions: db.promotions, message: `Promotion ${code} added.` });
    }

    if (action === 'UPDATE_BANNER') {
      const { bannerText } = body;
      db.promotionalBanner = String(bannerText || '');
      saveDb(db);
      return NextResponse.json({
        promotionalBanner: db.promotionalBanner,
        message: 'Promotional banner updated.',
      });
    }

    // 4. Add Customer Testimonial
    if (action === 'ADD_TESTIMONIAL') {
      const { clientName, clientRole, location, quote, projectOrProduct } = body;
      if (!clientName || !quote) {
        return NextResponse.json({ error: 'Client name and quote are required' }, { status: 400 });
      }
      if (!db.testimonials) db.testimonials = [...CUSTOMER_TESTIMONIALS];
      const newTest = {
        id: `test-${Date.now()}`,
        clientName: String(clientName).trim(),
        clientRole: String(clientRole || 'Luxury Homeowner').trim(),
        location: String(location || 'Lagos, Nigeria').trim(),
        quote: String(quote).trim(),
        rating: 5,
        projectOrProduct: String(projectOrProduct || 'Bespoke Furniture Commission').trim(),
      };
      db.testimonials.unshift(newTest);
      saveDb(db);
      return NextResponse.json({
        testimonial: newTest,
        message: 'Customer testimonial published.',
      });
    }

    return NextResponse.json({ error: 'Invalid admin action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed to execute admin operation' }, { status: 500 });
  }
}

