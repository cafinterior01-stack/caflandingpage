import { NextRequest, NextResponse } from 'next/server';
import { FURNITURE_CATEGORIES } from '@/lib/catalog-data';
import {
  readDb,
  saveDb,
  parseSessionToken,
  matchesProductCategory,
  computeCategoriesWithLiveCounts,
} from '@/lib/db-store';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search')?.toLowerCase().trim();
  const sort = searchParams.get('sort') || 'featured';
  const paySmallSmallOnly = searchParams.get('paySmallSmall') === 'true';
  const minPrice = Number(searchParams.get('minPrice') || 0);
  const maxPrice = Number(searchParams.get('maxPrice') || 0);

  const db = readDb();
  const allProducts = Array.isArray(db.products) ? db.products : [];
  const allCategories = computeCategoriesWithLiveCounts(
    Array.isArray(db.categories) ? db.categories : FURNITURE_CATEGORIES,
    allProducts
  );
  let results = [...allProducts];

  if (category && category !== 'all') {
    const matchedCatObj = allCategories.find(
      (c) =>
        c.slug.toLowerCase() === category.toLowerCase() ||
        c.id === category ||
        c.name.toLowerCase() === category.toLowerCase()
    );
    results = results.filter((p) =>
      matchedCatObj ? matchesProductCategory(p, matchedCatObj) : matchesProductCategory(p, category)
    );
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

  return NextResponse.json(
    {
      products: results,
      allProductsCount: allProducts.length,
      categories: allCategories,
      total: results.length,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
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
      categoryId,
      categorySlug,
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
      isFeatured = true,
      isBestSeller = true,
      isNewArrival = true,
    } = body;

    if (!name || price === undefined || price === null || Number(price) <= 0) {
      return NextResponse.json(
        { error: 'Product name and a valid price in Naira are required.' },
        { status: 400 }
      );
    }

    const db = readDb();
    const categories = Array.isArray(db.categories) ? db.categories : [...FURNITURE_CATEGORIES];
    const targetCatKey = String(categorySlug || categoryId || categoryName).trim().toLowerCase();
    let matchedCat = categories.find(
      (c) =>
        c.id === categoryId ||
        c.slug.toLowerCase() === targetCatKey ||
        c.name.toLowerCase() === String(categoryName).trim().toLowerCase()
    );

    // If the administrator enters/selects a new category name not yet in db.categories, create it automatically
    if (!matchedCat && categoryName) {
      const autoSlug = String(categoryName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      matchedCat = {
        id: `cat-${Date.now()}`,
        name: String(categoryName).trim(),
        slug: autoSlug,
        description: `Curated ${String(categoryName).trim()} collection by CAF Interiors.`,
        image:
          Array.isArray(images) && images[0]
            ? String(images[0])
            : 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80',
        productCount: 0,
        featured: false,
      };
      categories.push(matchedCat);
      db.categories = categories;
    }

    if (!matchedCat) {
      matchedCat = categories[0];
    }

    const uniqueSuffix = `${Date.now().toString().slice(-5)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const slug = `${String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${uniqueSuffix}`;

    const sanitizedImages = Array.isArray(images)
      ? images.map((img) => String(img).trim()).filter(Boolean)
      : [];

    const newProduct: Product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
      originalPrice: originalPrice && Number(originalPrice) > 0 ? Number(originalPrice) : undefined,
      images: sanitizedImages,
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
      isFeatured: Boolean(isFeatured),
      isBestSeller: Boolean(isBestSeller),
      isNewArrival: Boolean(isNewArrival),
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

    if (!Array.isArray(db.products)) {
      db.products = [];
    }
    // Merge any existing client-tracked custom products so serverless cold-start instances never drop previously uploaded products
    if (Array.isArray(body.existingCustomProducts)) {
      const currentIds = new Set(db.products.map((p) => p.id));
      for (const customProd of body.existingCustomProducts) {
        if (customProd && customProd.id && !currentIds.has(customProd.id)) {
          db.products.push(customProd);
          currentIds.add(customProd.id);
        }
      }
    }
    db.products.unshift(newProduct);
    saveDb(db);

    return NextResponse.json(
      {
        product: newProduct,
        products: db.products,
        categories: db.categories,
        message: `Product "${newProduct.name}" added to ${matchedCat.name}.`,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Unable to create product.' }, { status: 500 });
  }
}
