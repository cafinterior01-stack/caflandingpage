import { NextRequest, NextResponse } from 'next/server';
import { readDb, saveDb, parseSessionToken, OrderRecord } from '@/lib/db-store';
import { calculatePaySmallSmall } from '@/lib/format';
import { CartItem, InstalmentScheduleItem } from '@/types';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('caf_session')?.value;
  const session = parseSessionToken(token);
  const { searchParams } = new URL(request.url);
  const emailFilter = searchParams.get('email')?.toLowerCase().trim();

  const db = readDb();

  if (session?.role === 'ADMIN') {
    return NextResponse.json({ orders: db.orders });
  }

  if (session) {
    const userOrders = db.orders.filter(
      (o) =>
        o.userId === session.id ||
        o.customerEmail.toLowerCase() === session.email.toLowerCase()
    );
    return NextResponse.json({ orders: userOrders });
  }

  if (emailFilter) {
    const matching = db.orders.filter(
      (o) => o.customerEmail.toLowerCase() === emailFilter
    );
    return NextResponse.json({ orders: matching });
  }

  return NextResponse.json({ orders: [] });
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('caf_session')?.value;
    const session = parseSessionToken(token);
    const body = await request.json();

    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      city,
      state,
      deliveryNotes,
      items,
      deliveryFee = 0,
      discountAmount = 0,
      promoCode,
      paymentMethod = 'PAYSTACK',
      paymentReference,
    } = body;

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !deliveryAddress ||
      !city ||
      !state ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Please complete all required customer, delivery, and cart details.' },
        { status: 400 }
      );
    }

    const cartItems = items as CartItem[];
    const subtotalFullValue = cartItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const totalOrderValue = Math.max(
      0,
      subtotalFullValue + Number(deliveryFee) - Number(discountAmount)
    );

    const hasPaySmallSmall = cartItems.some(
      (item) => item.paymentPlan === 'PAY_SMALL_SMALL'
    );

    const itemsDepositTotal = cartItems.reduce(
      (sum, item) =>
        sum +
        (item.paymentPlan === 'PAY_SMALL_SMALL' && item.initialDepositPerUnit
          ? item.initialDepositPerUnit
          : item.unitPrice) *
          item.quantity,
      0
    );

    const payableTodayAmount = Math.max(
      0,
      itemsDepositTotal + Number(deliveryFee) - Number(discountAmount)
    );
    const remainingBalance = Math.max(0, totalOrderValue - payableTodayAmount);

    let instalmentSchedule: InstalmentScheduleItem[] = [];
    if (hasPaySmallSmall && remainingBalance > 0) {
      const maxMonths = Math.max(
        ...cartItems.map((i) => i.instalmentMonths || 3)
      );
      const calc = calculatePaySmallSmall(
        totalOrderValue,
        maxMonths,
        (payableTodayAmount / totalOrderValue) * 100,
        payableTodayAmount
      );
      instalmentSchedule = calc.schedule;
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `CAF-2026-${randomNum}`;
    const generatedRef =
      paymentReference ||
      `CAF-${paymentMethod.slice(0, 4)}-${Date.now().toString().slice(-6)}`;

    const newOrder: OrderRecord = {
      id: `ord-${Date.now()}`,
      orderNumber,
      userId: session?.id,
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim().toLowerCase(),
      customerPhone: String(customerPhone).trim(),
      deliveryAddress: String(deliveryAddress).trim(),
      city: String(city).trim(),
      state: String(state).trim(),
      deliveryNotes: deliveryNotes ? String(deliveryNotes).trim() : '',
      items: cartItems,
      hasPaySmallSmall,
      subtotalFullValue,
      deliveryFee: Number(deliveryFee),
      discountAmount: Number(discountAmount),
      promoCode: promoCode || undefined,
      totalOrderValue,
      payableTodayAmount,
      remainingBalance,
      // Strict compliance: never mark payment as verified until confirmed by webhook or admin
      amountPaidVerified: 0,
      paymentMethod,
      paymentReference: generatedRef,
      paymentStatus: 'AWAITING_VERIFICATION',
      instalmentApprovalStatus: hasPaySmallSmall
        ? 'PENDING_ADMIN_REVIEW'
        : 'NOT_APPLICABLE',
      orderStatus: 'PENDING_VERIFICATION',
      instalmentSchedule,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const db = readDb();
    db.orders.unshift(newOrder);

    // Record initial payment submission as PENDING_VERIFICATION (never auto-completed)
    db.instalmentPayments.unshift({
      id: `pay-${Date.now()}`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      instalmentNumber: 0,
      label: hasPaySmallSmall
        ? 'Initial Deposit (Awaiting Gateway/Admin Verification)'
        : 'Full Order Payment (Awaiting Verification)',
      amount: payableTodayAmount,
      paymentMethod,
      paymentReference: generatedRef,
      status: 'PENDING_VERIFICATION',
      submittedAt: new Date().toISOString(),
      notes: 'Submitted at checkout. Pending verification.',
    });

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      type: hasPaySmallSmall ? 'APPROVAL_STATUS' : 'ORDER_UPDATE',
      title: hasPaySmallSmall
        ? 'Pay Small Small Application Received — Under CAF Review'
        : 'Order Registered — Awaiting Payment Verification',
      message: hasPaySmallSmall
        ? `Order ${newOrder.orderNumber} has been queued for CAF Interiors instalment review. Initial deposit of ₦${payableTodayAmount.toLocaleString('en-NG')} is awaiting payment confirmation.`
        : `Order ${newOrder.orderNumber} is registered. Once payment reference ${generatedRef} is verified, production/dispatch will commence.`,
      channel: 'DASHBOARD',
      createdAt: new Date().toISOString(),
      isRead: false,
    });

    saveDb(db);

    return NextResponse.json(
      {
        order: newOrder,
        message: hasPaySmallSmall
          ? 'Order and Pay Small Small plan submitted for CAF Interiors verification.'
          : 'Order created and awaiting payment verification.',
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to create order. Please try again.' },
      { status: 500 }
    );
  }
}

