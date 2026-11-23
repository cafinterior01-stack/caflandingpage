import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = readDb();
  const order = db.orders.find(
    (o) =>
      o.id === params.id ||
      o.orderNumber.toLowerCase() === params.id.toLowerCase()
  );

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ order });
}

