import { NextRequest, NextResponse } from 'next/server';
import { PRODUCTS_CATALOG } from '@/lib/catalog-data';
import { readDb, saveDb } from '@/lib/db-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = readDb();
  const catalog = db.products || PRODUCTS_CATALOG;
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

  return NextResponse.json({ product, related });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    const db = readDb();
    if (!db.products) db.products = [...PRODUCTS_CATALOG];

    const idx = db.products.findIndex(
      (p) => p.id === params.id || p.slug === params.id
    );
    if (idx === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const current = db.products[idx];
    if (updates.name !== undefined) current.name = String(updates.name);
    if (updates.price !== undefined) current.price = Number(updates.price);
    if (updates.originalPrice !== undefined) {
      current.originalPrice = updates.originalPrice ? Number(updates.originalPrice) : undefined;
    }
    if (updates.shortDescription !== undefined) {
      current.shortDescription = String(updates.shortDescription);
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
    if (Array.isArray(updates.images) && updates.images.length > 0) {
      current.images = updates.images;
    }

    db.products[idx] = current;
    saveDb(db);

    return NextResponse.json({
      product: current,
      message: `Updated "${current.name}".`,
    });
  } catch {
    return NextResponse.json({ error: 'Unable to update product.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = readDb();
  if (!db.products) db.products = [...PRODUCTS_CATALOG];

  const initialLen = db.products.length;
  db.products = db.products.filter(
    (p) => p.id !== params.id && p.slug !== params.id
  );

  if (db.products.length === initialLen) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  saveDb(db);
  return NextResponse.json({ message: 'Product removed from catalog.' });
}
