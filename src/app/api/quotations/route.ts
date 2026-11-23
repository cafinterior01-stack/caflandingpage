import { NextRequest, NextResponse } from 'next/server';
import { readDb, saveDb, parseSessionToken, QuotationRecord, QuotationItemRecord } from '@/lib/db-store';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('caf_session')?.value;
  const session = parseSessionToken(token);
  const db = readDb();

  if (session?.role === 'ADMIN') {
    return NextResponse.json({ quotations: db.quotations });
  }

  if (session) {
    const myQuotations = db.quotations.filter(
      (q) => q.customerEmail.toLowerCase() === session.email.toLowerCase()
    );
    return NextResponse.json({ quotations: myQuotations });
  }

  return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('caf_session')?.value;
    const session = parseSessionToken(token);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only CAF Interiors Administrators can issue official quotations.' },
        { status: session ? 403 : 401 }
      );
    }

    const body = await request.json();

    const {
      enquiryId,
      items = [],
      deliveryAndInstallationFee = 75000,
      paySmallSmallEligible = true,
      requiredDepositAmount,
      estimatedLeadTime = '14 – 21 Business Days',
      adminNotes = 'Prepared by CAF Interiors Bespoke Manufacturing Desk.',
      validUntil = '2026-12-31',
    } = body;

    const db = readDb();
    const enqIdx = db.customEnquiries.findIndex(
      (e) => e.id === enquiryId || e.enquiryNumber.toLowerCase() === String(enquiryId).toLowerCase()
    );

    if (enqIdx === -1) {
      return NextResponse.json({ error: 'Target custom furniture enquiry not found.' }, { status: 404 });
    }

    const enquiry = db.customEnquiries[enqIdx];
    const parsedItems: QuotationItemRecord[] = (items as QuotationItemRecord[]).map((it) => ({
      description: String(it.description),
      quantity: Number(it.quantity || 1),
      unitPrice: Number(it.unitPrice || 0),
      total: Number(it.quantity || 1) * Number(it.unitPrice || 0),
    }));

    const subtotal = parsedItems.reduce((sum, i) => sum + i.total, 0);
    const totalQuotedAmount = subtotal + Number(deliveryAndInstallationFee);
    const deposit =
      requiredDepositAmount !== undefined && Number(requiredDepositAmount) > 0
        ? Number(requiredDepositAmount)
        : Math.round(totalQuotedAmount * 0.4);

    const quotationNumber = `QTN-CAF-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newQuotation: QuotationRecord = {
      id: `qtn-${Date.now()}`,
      quotationNumber,
      enquiryId: enquiry.id,
      enquiryNumber: enquiry.enquiryNumber,
      customerName: enquiry.customerName,
      customerEmail: enquiry.customerEmail,
      items: parsedItems,
      subtotal,
      deliveryAndInstallationFee: Number(deliveryAndInstallationFee),
      totalQuotedAmount,
      paySmallSmallEligible: Boolean(paySmallSmallEligible),
      requiredDepositAmount: deposit,
      estimatedLeadTime: String(estimatedLeadTime),
      adminNotes: String(adminNotes),
      validUntil: String(validUntil),
      customerDecision: 'PENDING_CUSTOMER_ACCEPTANCE',
      createdAt: new Date().toISOString(),
    };

    db.quotations.unshift(newQuotation);
    enquiry.status = 'QUOTATION_SENT';
    enquiry.quotationId = newQuotation.id;
    enquiry.updatedAt = new Date().toISOString();
    db.customEnquiries[enqIdx] = enquiry;

    saveDb(db);

    return NextResponse.json(
      {
        quotation: newQuotation,
        enquiry,
        message: `Official Quotation ${quotationNumber} sent to ${enquiry.customerName}.`,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to generate quotation.' }, { status: 500 });
  }
}

