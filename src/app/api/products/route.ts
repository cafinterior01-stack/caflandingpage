import { NextRequest, NextResponse } from 'next/server';
import { PRODUCTS_CATALOG, FURNITURE_CATEGORIES } from '@/lib/catalog-data';
import { readDb, saveDb, parseSessionToken } from '@/lib/db-store';
import { Product } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search')?.toLowerCase().trim();
  const sort = searchParams.get('sort') || 'featured';
  const paySmallSmallOnly = searchParams.get('paySmallSmall') === 'true';
  const minPrice = Number(searchParams.get('minPrice') || 0);
  const maxPrice = Number(searchParams.get('maxPrice') || 0);

  const db = readDb();
  let results = [...(db.products || PRODUCTS_CATALOG)];

  if (category && category !== 'all') {
    results = results.filter((p) => p.categorySlug === category || p.categoryId === category);
  }

  if (paySmallSmallOnly) {
    results = results.filter((p) => p.paySmallSmall.eligible);
  }

  if (minPrice > 0) {
    results = results.filter((p) => p.price >= minPrice);
  }

  if (maxPrice > 0) {
    results = results.filter((p) => p.price <= maxPrice);
  }

  if (search) {
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.shortDescription.toLowerCase().includes(search) ||
        p.categoryName.toLowerCase().includes(search) ||
        p.materials.frame.toLowerCase().includes(search) ||
        p.materials.upholstery.toLowerCase().includes(search)
    );
  }

  if (sort === 'price-asc') {
    results.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    results.sort((a, b) => b.price - a.price);
  } else if (sort === 'newest') {
    results.sort((a, b) => Number(b.isNewArrival) - Number(a.isNewArrival));
  } else if (sort === 'bestselling') {
    results.sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller));
  } else {
    results.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  }

  return NextResponse.json({
    products: results,
    categories: db.categories || FURNITURE_CATEGORIES,
    total: results.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('caf_session')?.value;
    const session = parseSessionToken(token);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Only authorised CAF Interiors administrators can add products.' },
        { status: session ? 403 : 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      categoryName = 'Living Room Furniture',
      price,
      originalPrice,
      shortDescription,
      description,
      images = [],
      availability = 'IN_STOCK',
      estimatedDelivery = '7 – 12 Business Days',
      paySmallSmallEligible = true,
      depositPercentage = 33.33,
      frameMaterial = 'Kiln-Dried Seasoned Nigerian Mahogany',
      upholsteryMaterial = 'Italian Performance Velvet / Bouclé',
      dimensions = 'Standard Luxury Specification',
    } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Product name and price in Naira are required.' },
        { status: 400 }
      );
    }

    const db = readDb();
    const categories = db.categories || FURNITURE_CATEGORIES;
    const matchedCat =
      categories.find((c) => c.name === categoryName || c.slug === categoryName) ||
      categories[0];

    const slug = `${String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: String(name).trim(),
      slug,
      categoryId: matchedCat.id,
      categoryName: matchedCat.name,
      categorySlug: matchedCat.slug,
      shortDescription:
        shortDescription || `Handcrafted ${name} by CAF Interior and Exterior Service.`,
      description:
        description ||
        shortDescription ||
        `Engineered for supreme comfort and architectural luxury. Built by CAF Interiors Master Artisans.`,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      images:
        Array.isArray(images) && images.length > 0
          ? images
          : [
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85',
          ],
      sizes: [
        {
          label: 'Standard Specification',
          dimensions: String(dimensions),
          priceAdjustment: 0,
        },
      ],
      colors: [
        { name: 'Champagne Ivory', hex: '#F3EFEA' },
        { name: 'Obsidian Noir', hex: '#161616' },
        { name: 'Warm Sand Beige', hex: '#C8B9A6' },
      ],
      materials: {
        frame: String(frameMaterial),
        upholstery: String(upholsteryMaterial),
        foamOrFinish: 'High-Resilience Orthopaedic Foam & Brushed Brass Accents',
        origin: 'CAF Interiors Manufacturing Atelier, Nigeria',
      },
      availability,
      availabilityLabel:
        availability === 'IN_STOCK' ? 'In Stock' : 'Made to Measure',
      estimatedDelivery: String(estimatedDelivery),
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      isExclusiveOffer: Boolean(originalPrice && Number(originalPrice) > Number(price)),
      paySmallSmall: {
        eligible: Boolean(paySmallSmallEligible),
        depositPercentage: Number(depositPercentage),
        allowedDurationsMonths: [2, 3, 4, 6],
        conditions: `${Math.round(Number(depositPercentage))}% initial deposit required; balance spread across 2–6 months upon CAF Interiors approval.`,
      },
      rating: 5.0,
      reviewCount: 1,
      warranty: '5-Year Structural Warranty',
      sku: `CAF-${matchedCat.slug.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    };

    if (!db.products) {
      db.products = [...PRODUCTS_CATALOG];
    }
    db.products.unshift(newProduct);
    saveDb(db);

    return NextResponse.json(
      { product: newProduct, message: `Product "${newProduct.name}" added to marketplace.` },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Unable to create product.' }, { status: 500 });
  }
}
