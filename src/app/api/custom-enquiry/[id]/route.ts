import { NextRequest, NextResponse } from 'next/server';
import { readDb, saveDb } from '@/lib/db-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = readDb();
  const enquiry = db.customEnquiries.find(
    (e) =>
      e.id === params.id ||
      e.enquiryNumber.toLowerCase() === params.id.toLowerCase()
  );

  if (!enquiry) {
    return NextResponse.json({ error: 'Custom furniture request not found.' }, { status: 404 });
  }

  const quotation = db.quotations.find(
    (q) => q.enquiryId === enquiry.id || q.id === enquiry.quotationId
  );

  return NextResponse.json({ enquiry, quotation: quotation || null });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { decision, customerFeedback, status } = body;

    const db = readDb();
    const enqIdx = db.customEnquiries.findIndex(
      (e) =>
        e.id === params.id ||
        e.enquiryNumber.toLowerCase() === params.id.toLowerCase()
    );

    if (enqIdx === -1) {
      return NextResponse.json({ error: 'Custom enquiry not found.' }, { status: 404 });
    }

    const enquiry = db.customEnquiries[enqIdx];

    if (status) {
      enquiry.status = status;
    }

    const qtnIdx = db.quotations.findIndex(
      (q) => q.enquiryId === enquiry.id || q.id === enquiry.quotationId
    );

    if (decision && qtnIdx !== -1) {
      db.quotations[qtnIdx].customerDecision = decision;
      db.quotations[qtnIdx].respondedAt = new Date().toISOString();
      if (customerFeedback) {
        db.quotations[qtnIdx].customerFeedback = String(customerFeedback).trim();
      }
      if (decision === 'ACCEPTED') {
        enquiry.status = 'CUSTOMER_ACCEPTED';
      } else if (decision === 'REVISION_REQUESTED') {
        enquiry.status = 'REVISION_REQUESTED';
      }
    }

    enquiry.updatedAt = new Date().toISOString();
    db.customEnquiries[enqIdx] = enquiry;
    saveDb(db);

    return NextResponse.json({
      enquiry,
      quotation: qtnIdx !== -1 ? db.quotations[qtnIdx] : null,
      message:
        decision === 'ACCEPTED'
          ? `Quotation accepted! Your bespoke commission ${enquiry.enquiryNumber} is now ready for mobilization deposit.`
          : 'Custom enquiry updated.',
    });
  } catch {
    return NextResponse.json({ error: 'Unable to update custom enquiry.' }, { status: 500 });
  }
}

