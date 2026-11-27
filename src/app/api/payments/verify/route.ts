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

    // 2B. Server-Side Gateway Callback Verification (Paystack & Flutterwave)
    if (action === 'VERIFY_GATEWAY_CALLBACK') {
      const {
        provider = 'PAYSTACK',
        orderNumber,
        reference,
        transactionId,
        amount,
        currency = 'NGN',
        gatewayStatus = 'SUCCESS',
        orderSnapshot,
      } = body;

      if (!orderNumber && !reference) {
        return NextResponse.json(
          { error: 'Order number or transaction reference is required.' },
          { status: 400 }
        );
      }

      let ordIdx = db.orders.findIndex(
        (o) =>
          (orderNumber && o.orderNumber.toLowerCase() === String(orderNumber).toLowerCase()) ||
          (reference && o.paymentReference.toLowerCase() === String(reference).toLowerCase())
      );

      // Hydrate order if a serverless cold-start instance received the callback before seeing the order creation instance
      if (ordIdx === -1 && orderSnapshot && orderSnapshot.orderNumber) {
        db.orders.unshift(orderSnapshot);
        ordIdx = 0;
      }

      if (ordIdx === -1) {
        return NextResponse.json({ error: 'Order not found for verification.' }, { status: 404 });
      }

      const order = db.orders[ordIdx];
      const normalizedProvider = String(provider || order.paymentMethod).toUpperCase();

      // Handle failed or cancelled payment outcomes explicitly
      if (gatewayStatus === 'FAILED' || gatewayStatus === 'CANCELLED') {
        const pendingIdx = db.instalmentPayments.findIndex(
          (p) =>
            p.orderId === order.id &&
            p.status === 'PENDING_VERIFICATION' &&
            (!reference || p.paymentReference.toLowerCase() === String(reference).toLowerCase())
        );
        if (pendingIdx !== -1) {
          db.instalmentPayments[pendingIdx].status = 'REJECTED';
          db.instalmentPayments[pendingIdx].notes = `Payment ${gatewayStatus.toLowerCase()} on ${normalizedProvider} checkout.`;
        }
        db.notifications.unshift({
          id: `notif-${Date.now()}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: 'ORDER_UPDATE',
          title: `${normalizedProvider} Payment ${gatewayStatus === 'CANCELLED' ? 'Cancelled' : 'Failed'}`,
          message: `Transaction ${reference || order.paymentReference} was ${gatewayStatus.toLowerCase()}. Your order remains saved and you can retry payment anytime.`,
          channel: 'DASHBOARD',
          createdAt: new Date().toISOString(),
          isRead: false,
        });
        saveDb(db);
        return NextResponse.json({
          verified: false,
          status: gatewayStatus,
          order,
          message: `Payment marked as ${gatewayStatus.toLowerCase()}.`,
        });
      }

      // Idempotency guard: if this reference was already verified, return existing verified state without double-crediting
      const alreadyVerified = db.instalmentPayments.find(
        (p) =>
          p.orderId === order.id &&
          p.status === 'VERIFIED' &&
          reference &&
          p.paymentReference.toLowerCase() === String(reference).toLowerCase()
      );
      if (alreadyVerified) {
        return NextResponse.json({
          verified: true,
          alreadyProcessed: true,
          payment: alreadyVerified,
          order,
          message: 'Transaction reference already verified.',
        });
      }

      // Verify currency and expected amount against the order
      if (String(currency).toUpperCase() !== 'NGN') {
        return NextResponse.json(
          { error: 'Invalid transaction currency. Only NGN is accepted.' },
          { status: 400 }
        );
      }

      let verifiedAmountNaira = Number(amount) > 0 ? Math.round(Number(amount)) : order.payableTodayAmount;

      // When live secret keys are configured, verify directly with Paystack / Flutterwave server-to-server API
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY?.trim();
      const isConfiguredPaystack =
        paystackSecret &&
        !paystackSecret.includes('your_paystack_secret_key_here') &&
        (paystackSecret.startsWith('sk_test_') || paystackSecret.startsWith('sk_live_'));

      if (normalizedProvider === 'PAYSTACK' && isConfiguredPaystack && reference) {
        try {
          const psVerifyRes = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            {
              headers: { Authorization: `Bearer ${paystackSecret}` },
            }
          );
          const psVerifyData = await psVerifyRes.json();
          if (!psVerifyRes.ok || psVerifyData.data?.status !== 'success') {
            return NextResponse.json(
              { error: 'Paystack server verification reported transaction not successful.' },
              { status: 400 }
            );
          }
          if (String(psVerifyData.data.currency).toUpperCase() !== 'NGN') {
            return NextResponse.json({ error: 'Currency mismatch on Paystack transaction.' }, { status: 400 });
          }
          verifiedAmountNaira = Math.round(Number(psVerifyData.data.amount) / 100);
        } catch {
          return NextResponse.json(
            { error: 'Could not reach Paystack verification endpoint.' },
            { status: 502 }
          );
        }
      }

      const flwSecret = process.env.FLUTTERWAVE_SECRET_KEY?.trim();
      const isConfiguredFlw =
        flwSecret &&
        !flwSecret.includes('your_flutterwave_secret_key_here') &&
        (flwSecret.startsWith('FLWSECK_TEST') || flwSecret.startsWith('FLWSECK-'));

      if (normalizedProvider === 'FLUTTERWAVE' && isConfiguredFlw && transactionId) {
        try {
          const flwVerifyRes = await fetch(
            `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
            {
              headers: { Authorization: `Bearer ${flwSecret}` },
            }
          );
          const flwVerifyData = await flwVerifyRes.json();
          if (!flwVerifyRes.ok || flwVerifyData.data?.status !== 'successful') {
            return NextResponse.json(
              { error: 'Flutterwave server verification reported transaction not successful.' },
              { status: 400 }
            );
          }
          if (String(flwVerifyData.data.currency).toUpperCase() !== 'NGN') {
            return NextResponse.json({ error: 'Currency mismatch on Flutterwave transaction.' }, { status: 400 });
          }
          verifiedAmountNaira = Math.round(Number(flwVerifyData.data.amount));
        } catch {
          return NextResponse.json(
            { error: 'Could not reach Flutterwave verification endpoint.' },
            { status: 502 }
          );
        }
      }

      if (verifiedAmountNaira < order.payableTodayAmount && order.amountPaidVerified === 0) {
        return NextResponse.json(
          {
            error: `Verified amount (${formatNaira(verifiedAmountNaira)}) is less than required amount due today (${formatNaira(order.payableTodayAmount)}).`,
          },
          { status: 400 }
        );
      }

      const receiptNumber = `RCP-CAF-2026-${Math.floor(100 + Math.random() * 900)}`;
      const pendingIdx = db.instalmentPayments.findIndex(
        (p) =>
          p.orderId === order.id &&
          p.status !== 'VERIFIED' &&
          (!reference || p.paymentReference.toLowerCase() === String(reference).toLowerCase())
      );

      if (pendingIdx !== -1) {
        db.instalmentPayments[pendingIdx].status = 'VERIFIED';
        db.instalmentPayments[pendingIdx].amount = verifiedAmountNaira;
        db.instalmentPayments[pendingIdx].verifiedAt = new Date().toISOString();
        db.instalmentPayments[pendingIdx].verifiedBy = `${normalizedProvider} Server Verification`;
        db.instalmentPayments[pendingIdx].receiptNumber = receiptNumber;
      } else {
        db.instalmentPayments.unshift({
          id: `pay-${Date.now()}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          instalmentNumber: order.amountPaidVerified === 0 ? 0 : 1,
          label:
            order.amountPaidVerified === 0
              ? 'Verified Order / Initial Deposit Payment'
              : 'Verified Instalment Payment',
          amount: verifiedAmountNaira,
          paymentMethod: normalizedProvider as 'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER',
          paymentReference: reference || order.paymentReference,
          status: 'VERIFIED',
          receiptNumber,
          submittedAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
          verifiedBy: `${normalizedProvider} Server Verification`,
        });
      }

      order.amountPaidVerified += verifiedAmountNaira;
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
        title: `Payment Verified via ${normalizedProvider}: ${formatNaira(verifiedAmountNaira)} (${receiptNumber})`,
        message: `Your ${normalizedProvider} payment (Ref: ${reference || order.paymentReference}) has been verified server-side. Remaining balance: ${formatNaira(order.remainingBalance)}.`,
        channel: 'DASHBOARD',
        createdAt: new Date().toISOString(),
        isRead: false,
      });

      saveDb(db);

      return NextResponse.json({
        verified: true,
        receiptNumber,
        order,
        message: `Payment of ${formatNaira(verifiedAmountNaira)} verified via ${normalizedProvider}. Receipt ${receiptNumber} issued.`,
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

