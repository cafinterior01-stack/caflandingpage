import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db-store';

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Please enter a promotional code.' }, { status: 400 });
    }

    const db = readDb();
    const promo = db.promotions.find(
      (p) => p.active && p.code.toUpperCase() === String(code).trim().toUpperCase()
    );

    if (!promo) {
      return NextResponse.json(
        { error: 'Invalid or expired promotional code. Try CAFLUXURY5 or WELCOME50K.' },
        { status: 404 }
      );
    }

    const orderSubtotal = Number(subtotal || 0);
    if (orderSubtotal < promo.minOrderAmount) {
      return NextResponse.json(
        {
          error: `Code ${promo.code} requires a minimum order subtotal of ₦${promo.minOrderAmount.toLocaleString('en-NG')}.`,
        },
        { status: 400 }
      );
    }

    const discountAmount =
      promo.type === 'PERCENTAGE'
        ? Math.round((orderSubtotal * promo.value) / 100)
        : promo.value;

    return NextResponse.json({
      promo,
      discountAmount,
      message: `Applied ${promo.code}: ${promo.description}`,
    });
  } catch {
    return NextResponse.json({ error: 'Unable to validate promotional code.' }, { status: 500 });
  }
}

