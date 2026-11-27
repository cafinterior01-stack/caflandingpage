import { NextRequest, NextResponse } from 'next/server';
import { FURNITURE_CATEGORIES } from '@/lib/catalog-data';
import { readDb, saveDb, parseSessionToken } from '@/lib/db-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = readDb();
  const catalog = Array.isArray(db.products) ? db.products : [];
  const product = catalog.find(
    (p) => p.id === params.id || p.slug === params.id
  );

  if (!product) {
    return NextResponse.json(
      { error: 'Product not found' },
      { status: 404 }
    );
  }

  const related = catalog
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 4);

  return NextResponse.json(
    { product, related },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('caf_session')?.value;
    const session = parseSessionToken(token);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Administrator authorisation required.' },
        { status: session ? 403 : 401 }
      );
    }

    const updates = await request.json();
    const db = readDb();
    if (!Array.isArray(db.products)) db.products = [];

    const idx = db.products.findIndex(
      (p) => p.id === params.id || p.slug === params.id
    );
    if (idx === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const current = db.products[idx];
    if (updates.name !== undefined && String(updates.name).trim()) {
      current.name = String(updates.name).trim();
    }
    if (updates.categoryName !== undefined || updates.categorySlug !== undefined || updates.categoryId !== undefined) {
      const categories = Array.isArray(db.categories) ? db.categories : [...FURNITURE_CATEGORIES];
      const targetKey = String(updates.categorySlug || updates.categoryId || updates.categoryName)
        .trim()
        .toLowerCase();
      const matchedCat = categories.find(
        (c) =>
          c.id === updates.categoryId ||
          c.slug.toLowerCase() === targetKey ||
          c.name.toLowerCase() === String(updates.categoryName || '').trim().toLowerCase()
      );
      if (matchedCat) {
        current.categoryId = matchedCat.id;
        current.categoryName = matchedCat.name;
        current.categorySlug = matchedCat.slug;
      }
    }
    if (updates.price !== undefined) current.price = Number(updates.price);
    if (updates.originalPrice !== undefined) {
      current.originalPrice =
        updates.originalPrice && Number(updates.originalPrice) > 0
          ? Number(updates.originalPrice)
          : undefined;
      current.isExclusiveOffer = Boolean(
        current.originalPrice && current.originalPrice > current.price
      );
    }
    if (updates.shortDescription !== undefined) {
      current.shortDescription = String(updates.shortDescription);
    }
    if (updates.description !== undefined) {
      current.description = String(updates.description);
    }
    if (updates.availability !== undefined) {
      current.availability = updates.availability;
      current.availabilityLabel =
        updates.availability === 'IN_STOCK' ? 'In Stock' : 'Made to Measure';
    }
    if (updates.paySmallSmallEligible !== undefined) {
      current.paySmallSmall.eligible = Boolean(updates.paySmallSmallEligible);
    }
    if (updates.depositPercentage !== undefined) {
      current.paySmallSmall.depositPercentage = Number(updates.depositPercentage);
    }
    if (updates.dimensions !== undefined && current.sizes.length > 0) {
      current.sizes[0] = {
        ...current.sizes[0],
        dimensions: String(updates.dimensions),
      };
    }
    if (Array.isArray(updates.images)) {
      current.images = updates.images.map((img: string) => String(img).trim()).filter(Boolean);
    }

    db.products[idx] = current;
    saveDb(db);

    return NextResponse.json({
      product: current,
      categories: db.categories,
      message: `Updated "${current.name}".`,
    });
  } catch {
    return NextResponse.json({ error: 'Unable to update product.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = request.cookies.get('caf_session')?.value;
  const session = parseSessionToken(token);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Access denied. Administrator authorisation required.' },
      { status: session ? 403 : 401 }
    );
  }

  const db = readDb();
  if (!Array.isArray(db.products)) db.products = [];

  const initialLen = db.products.length;
  db.products = db.products.filter(
    (p) => p.id !== params.id && p.slug !== params.id
  );

  if (db.products.length === initialLen) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  saveDb(db);
  return NextResponse.json({
    message: 'Product removed from catalog.',
    remainingCount: db.products.length,
    categories: db.categories,
  });
}
