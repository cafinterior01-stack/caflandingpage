import { NextRequest, NextResponse } from 'next/server';
import { readDb, saveDb } from '@/lib/db-store';

export const dynamic = 'force-dynamic';

/**
 * Server-Side Payment Initialization Endpoint for Paystack & Flutterwave
 * - Never exposes PAYSTACK_SECRET_KEY or FLUTTERWAVE_SECRET_KEY to frontend code.
 * - Prevents duplicate payment initialization for already-verified orders.
 * - Calls Paystack (https://api.paystack.co/transaction/initialize) or
 *   Flutterwave (https://api.flutterwave.com/v3/payments) when real secret keys are configured.
 * - Falls back to the built-in CAF Interiors Hosted Gateway Checkout page (/checkout/gateway)
 *   when running in test/development mode without live secret keys so Paystack & Flutterwave
 *   checkout always redirects properly to a hosted payment screen.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber, provider: rawProvider, amountOverride, instalmentNumber = 0 } = body;

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Order number is required to initialize payment.' },
        { status: 400 }
      );
    }

    const db = readDb();
    const ordIdx = db.orders.findIndex(
      (o) =>
        o.orderNumber.toLowerCase() === String(orderNumber).trim().toLowerCase() ||
        o.id === orderNumber
    );

    if (ordIdx === -1) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const order = db.orders[ordIdx];

    if (order.paymentStatus === 'PAID_VERIFIED' && order.remainingBalance <= 0) {
      return NextResponse.json(
        { error: 'This order has already been paid and verified in full.' },
        { status: 400 }
      );
    }

    const provider = String(rawProvider || order.paymentMethod || 'PAYSTACK')
      .toUpperCase()
      .trim() as 'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER';

    const amountNaira =
      amountOverride && Number(amountOverride) > 0
        ? Math.round(Number(amountOverride))
        : Math.round(order.payableTodayAmount);

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(request.url).origin;

    // Ensure unique reference per transaction attempt while reusing pending reference if appropriate
    const reference =
      order.paymentReference && order.amountPaidVerified === 0 && Number(instalmentNumber) === 0
        ? order.paymentReference
        : `CAF-${provider.slice(0, 4)}-${Date.now().toString().slice(-6)}-${Math.random()
            .toString(36)
            .slice(2, 5)
            .toUpperCase()}`;

    // Update or create pending payment record so retries do not create duplicate pending records
    const existingPendingIdx = db.instalmentPayments.findIndex(
      (p) =>
        p.orderId === order.id &&
        p.status === 'PENDING_VERIFICATION' &&
        p.instalmentNumber === Number(instalmentNumber)
    );

    if (existingPendingIdx !== -1) {
      db.instalmentPayments[existingPendingIdx].paymentMethod = provider;
      db.instalmentPayments[existingPendingIdx].paymentReference = reference;
      db.instalmentPayments[existingPendingIdx].amount = amountNaira;
    } else {
      db.instalmentPayments.unshift({
        id: `pay-${Date.now()}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        instalmentNumber: Number(instalmentNumber),
        label:
          Number(instalmentNumber) === 0
            ? order.hasPaySmallSmall
              ? 'Initial Deposit (Awaiting Gateway Verification)'
              : 'Full Order Payment (Awaiting Gateway Verification)'
            : `Instalment #${instalmentNumber} Payment`,
        amount: amountNaira,
        paymentMethod: provider,
        paymentReference: reference,
        status: 'PENDING_VERIFICATION',
        submittedAt: new Date().toISOString(),
        notes: `Initialized ${provider} transaction (${reference}).`,
      });
    }

    order.paymentMethod = provider;
    if (Number(instalmentNumber) === 0) {
      order.paymentReference = reference;
    }
    order.updatedAt = new Date().toISOString();
    db.orders[ordIdx] = order;
    saveDb(db);

    const callbackUrl = `${origin}/checkout/success?order=${encodeURIComponent(
      order.orderNumber
    )}&provider=${encodeURIComponent(provider)}&reference=${encodeURIComponent(reference)}`;

    // 1. PAYSTACK SERVER-SIDE INITIALIZATION
    if (provider === 'PAYSTACK') {
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY?.trim();
      const isConfiguredKey =
        paystackSecret &&
        !paystackSecret.includes('your_paystack_secret_key_here') &&
        (paystackSecret.startsWith('sk_test_') || paystackSecret.startsWith('sk_live_'));

      if (isConfiguredKey) {
        try {
          const psRes = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${paystackSecret}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: order.customerEmail,
              amount: amountNaira * 100, // Paystack requires amount in Kobo
              currency: 'NGN',
              reference,
              callback_url: callbackUrl,
              metadata: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                instalmentNumber,
              },
            }),
          });
          const psData = await psRes.json();
          if (psRes.ok && psData.status && psData.data?.authorization_url) {
            return NextResponse.json({
              provider: 'PAYSTACK',
              mode: paystackSecret.startsWith('sk_live_') ? 'LIVE' : 'TEST',
              authorizationUrl: psData.data.authorization_url,
              reference,
              orderNumber: order.orderNumber,
            });
          }
        } catch {
          // Fall through to hosted test gateway screen if external network call fails
        }
      }

      // Hosted Paystack Test Checkout Redirect URL when live PAYSTACK_SECRET_KEY is not yet configured
      const hostedTestUrl = `${origin}/checkout/gateway?provider=PAYSTACK&order=${encodeURIComponent(
        order.orderNumber
      )}&reference=${encodeURIComponent(reference)}&amount=${amountNaira}`;

      return NextResponse.json({
        provider: 'PAYSTACK',
        mode: 'HOSTED_TEST',
        authorizationUrl: hostedTestUrl,
        reference,
        orderNumber: order.orderNumber,
      });
    }

    // 2. FLUTTERWAVE SERVER-SIDE INITIALIZATION
    if (provider === 'FLUTTERWAVE') {
      const flwSecret = process.env.FLUTTERWAVE_SECRET_KEY?.trim();
      const isConfiguredFlw =
        flwSecret &&
        !flwSecret.includes('your_flutterwave_secret_key_here') &&
        (flwSecret.startsWith('FLWSECK_TEST') || flwSecret.startsWith('FLWSECK-'));

      if (isConfiguredFlw) {
        try {
          const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${flwSecret}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tx_ref: reference,
              amount: amountNaira,
              currency: 'NGN',
              redirect_url: callbackUrl,
              customer: {
                email: order.customerEmail,
                phonenumber: order.customerPhone,
                name: order.customerName,
              },
              meta: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                instalmentNumber,
              },
              customizations: {
                title: 'CAF Interiors Luxury Marketplace',
                description: `Order ${order.orderNumber} Payment`,
              },
            }),
          });
          const flwData = await flwRes.json();
          if (flwRes.ok && flwData.status === 'success' && flwData.data?.link) {
            return NextResponse.json({
              provider: 'FLUTTERWAVE',
              mode: flwSecret.startsWith('FLWSECK_TEST') ? 'TEST' : 'LIVE',
              authorizationUrl: flwData.data.link,
              reference,
              orderNumber: order.orderNumber,
            });
          }
        } catch {
          // Fall through to hosted test gateway screen if external network call fails
        }
      }

      const hostedTestUrl = `${origin}/checkout/gateway?provider=FLUTTERWAVE&order=${encodeURIComponent(
        order.orderNumber
      )}&reference=${encodeURIComponent(reference)}&amount=${amountNaira}`;

      return NextResponse.json({
        provider: 'FLUTTERWAVE',
        mode: 'HOSTED_TEST',
        authorizationUrl: hostedTestUrl,
        reference,
        orderNumber: order.orderNumber,
      });
    }

    // 3. BANK TRANSFER (Direct Receipt Page)
    return NextResponse.json({
      provider: 'BANK_TRANSFER',
      mode: 'MANUAL_VERIFICATION',
      authorizationUrl: `${origin}/checkout/success?order=${encodeURIComponent(order.orderNumber)}`,
      reference,
      orderNumber: order.orderNumber,
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to initialize payment gateway session.' },
      { status: 500 }
    );
  }
}

