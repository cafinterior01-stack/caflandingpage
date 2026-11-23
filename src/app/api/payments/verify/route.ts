import { NextRequest, NextResponse } from 'next/server';
import {
  readDb,
  saveDb,
  parseSessionToken,
  InstalmentPaymentRecord,
  OrderNotificationRecord,
} from '@/lib/db-store';
import { formatNaira } from '@/lib/format';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get('orderNumber')?.trim();

  const db = readDb();

  if (orderNumber) {
    const order = db.orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === orderNumber.toLowerCase() ||
        o.id === orderNumber
    );
    if (!order) {
      return NextResponse.json(
        { error: `No order found matching "${orderNumber}". Try CAF-2026-1042.` },
        { status: 404 }
      );
    }

    const payments = db.instalmentPayments.filter(
      (p) => p.orderId === order.id || p.orderNumber.toLowerCase() === order.orderNumber.toLowerCase()
    );
    const notifications = db.notifications.filter(
      (n) => n.orderId === order.id || n.orderNumber.toLowerCase() === order.orderNumber.toLowerCase()
    );

    return NextResponse.json({
      order,
      payments,
      notifications,
      config: db.paySmallSmallConfig,
    });
  }

  const token = request.cookies.get('caf_session')?.value;
  const session = parseSessionToken(token);

  if (session?.role === 'ADMIN') {
    return NextResponse.json({
      config: db.paySmallSmallConfig,
      payments: db.instalmentPayments,
      notifications: db.notifications,
    });
  }

  if (session) {
    const userOrders = db.orders.filter(
      (o) =>
        o.userId === session.id ||
        o.customerEmail.toLowerCase() === session.email.toLowerCase()
    );
    const userOrderIds = new Set(userOrders.map((o) => o.id));
    return NextResponse.json({
      config: db.paySmallSmallConfig,
      payments: db.instalmentPayments.filter((p) => userOrderIds.has(p.orderId)),
      notifications: db.notifications.filter((n) => userOrderIds.has(n.orderId)),
    });
  }

  return NextResponse.json({
    config: db.paySmallSmallConfig,
    payments: [],
    notifications: [],
  });
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('caf_session')?.value;
    const session = parseSessionToken(token);
    const body = await request.json();
    const { action } = body;

    const db = readDb();

    // 1. Customer submits an instalment payment (NEVER marked completed without verification)
    if (action === 'SUBMIT_INSTALMENT_PAYMENT') {
      const {
        orderNumber,
        instalmentNumber = 1,
        label,
        amount,
        paymentMethod = 'PAYSTACK',
        paymentReference,
        notes,
      } = body;

      if (!orderNumber || !amount || Number(amount) <= 0) {
        return NextResponse.json(
          { error: 'Valid order number and payment amount are required.' },
          { status: 400 }
        );
      }

      const order = db.orders.find(
        (o) =>
          o.orderNumber.toLowerCase() === String(orderNumber).trim().toLowerCase() ||
          o.id === orderNumber
      );

      if (!order) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }

      const ref =
        paymentReference && String(paymentReference).trim()
          ? String(paymentReference).trim()
          : `CAF-${paymentMethod.slice(0, 4)}-${Date.now().toString().slice(-6)}`;

      const paymentRecord: InstalmentPaymentRecord = {
        id: `pay-${Date.now()}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        instalmentNumber: Number(instalmentNumber),
        label: label || `Instalment #${instalmentNumber} Payment`,
        amount: Math.round(Number(amount)),
        paymentMethod,
        paymentReference: ref,
        // CRITICAL RULE: Never mark a payment as completed without verified confirmation
        status: 'PENDING_VERIFICATION',
        submittedAt: new Date().toISOString(),
        notes: notes || 'Submitted via CAF Pay Small Small Portal; awaiting verification.',
      };

      db.instalmentPayments.unshift(paymentRecord);

      const notif: OrderNotificationRecord = {
        id: `notif-${Date.now()}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        type: 'ORDER_UPDATE',
        title: `Payment Submitted (${formatNaira(paymentRecord.amount)}) — Awaiting Verification`,
        message: `We received your payment submission (Ref: ${ref}) via ${paymentMethod}. Your balance will automatically update once payment verification is confirmed.`,
        channel: 'DASHBOARD',
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      db.notifications.unshift(notif);

      saveDb(db);

      return NextResponse.json(
        {
          payment: paymentRecord,
          notification: notif,
          message:
            'Payment recorded as PENDING VERIFICATION. Your balance will update upon gateway or CAF Interiors administrator confirmation.',
        },
        { status: 201 }
      );
    }

    // 2. Administrator verifies an instalment payment
    if (action === 'VERIFY_PAYMENT') {
      const { paymentId } = body;
      if (session?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied. Only authorised CAF Interiors Administrators can verify payments.' },
          { status: session ? 403 : 401 }
        );
      }

      const payIdx = db.instalmentPayments.findIndex((p) => p.id === paymentId);
      if (payIdx === -1) {
        return NextResponse.json({ error: 'Payment record not found.' }, { status: 404 });
      }

      const payment = db.instalmentPayments[payIdx];
      if (payment.status === 'VERIFIED') {
        return NextResponse.json({ message: 'Payment is already verified.', payment });
      }

      payment.status = 'VERIFIED';
      payment.verifiedAt = new Date().toISOString();
      payment.verifiedBy = session?.name || 'CAF Interiors Finance Verification';
      payment.receiptNumber = `RCP-CAF-2026-${Math.floor(100 + Math.random() * 900)}`;
      db.instalmentPayments[payIdx] = payment;

      const ordIdx = db.orders.findIndex((o) => o.id === payment.orderId);
      if (ordIdx !== -1) {
        const order = db.orders[ordIdx];
        order.amountPaidVerified += payment.amount;
        order.remainingBalance = Math.max(0, order.totalOrderValue - order.amountPaidVerified);
        order.paymentStatus =
          order.remainingBalance === 0 ? 'PAID_VERIFIED' : 'PARTIALLY_PAID_VERIFIED';
        if (order.orderStatus === 'PENDING_VERIFICATION') {
          order.orderStatus = 'IN_PRODUCTION';
        }
        order.updatedAt = new Date().toISOString();
        db.orders[ordIdx] = order;

        db.notifications.unshift({
          id: `notif-${Date.now()}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: 'ORDER_UPDATE',
          title: `Payment Verified: ${formatNaira(payment.amount)} (${payment.receiptNumber})`,
          message: `Your payment of ${formatNaira(payment.amount)} has been verified. Remaining balance is now ${formatNaira(order.remainingBalance)}.`,
          channel: 'WHATSAPP',
          createdAt: new Date().toISOString(),
          isRead: false,
        });
      }

      saveDb(db);
      return NextResponse.json({
        payment,
        order: ordIdx !== -1 ? db.orders[ordIdx] : null,
        message: 'Payment verified and balance updated.',
      });
    }

    // 3. Administrator approves or rejects an instalment application
    if (action === 'ADMIN_REVIEW_INSTALMENT') {
      if (session?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Administrator privileges required.' }, { status: 403 });
      }
      const { orderId, decision, adminNotes } = body; // decision: 'APPROVED' | 'REJECTED'
      const ordIdx = db.orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
      if (ordIdx === -1) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }

      db.orders[ordIdx].instalmentApprovalStatus = decision;
      db.orders[ordIdx].updatedAt = new Date().toISOString();

      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        orderId: db.orders[ordIdx].id,
        orderNumber: db.orders[ordIdx].orderNumber,
        type: 'APPROVAL_STATUS',
        title: `Pay Small Small Application ${decision}`,
        message:
          adminNotes ||
          `Your Pay Small Small arrangement for Order ${db.orders[ordIdx].orderNumber} has been marked ${decision} by CAF Interiors.`,
        channel: 'EMAIL',
        createdAt: new Date().toISOString(),
        isRead: false,
      });

      saveDb(db);
      return NextResponse.json({
        order: db.orders[ordIdx],
        message: `Instalment status updated to ${decision}.`,
      });
    }

    // 4. Administrator updates Pay Small Small global durations & deposit percentages
    if (action === 'UPDATE_PSS_CONFIG') {
      if (session?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Administrator privileges required.' }, { status: 403 });
      }
      const { minQualifyingPrice, defaultDepositPercentage, allowedDurationsMonths } = body;
      if (minQualifyingPrice !== undefined) {
        db.paySmallSmallConfig.minQualifyingPrice = Number(minQualifyingPrice);
      }
      if (defaultDepositPercentage !== undefined) {
        db.paySmallSmallConfig.defaultDepositPercentage = Number(defaultDepositPercentage);
      }
      if (Array.isArray(allowedDurationsMonths) && allowedDurationsMonths.length > 0) {
        db.paySmallSmallConfig.allowedDurationsMonths = allowedDurationsMonths.map(Number);
      }
      saveDb(db);
      return NextResponse.json({
        config: db.paySmallSmallConfig,
        message: 'Pay Small Small configuration updated.',
      });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed to process payment verification action.' }, { status: 500 });
  }
}

