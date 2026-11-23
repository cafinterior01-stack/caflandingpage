import { NextRequest, NextResponse } from 'next/server';
import {
  readDb,
  saveDb,
  parseSessionToken,
  CustomFurnitureEnquiryRecord,
} from '@/lib/db-store';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('caf_session')?.value;
  const session = parseSessionToken(token);
  const { searchParams } = new URL(request.url);
  const enquiryNumber = searchParams.get('enquiryNumber')?.trim();

  const db = readDb();

  if (enquiryNumber) {
    const found = db.customEnquiries.find(
      (e) =>
        e.enquiryNumber.toLowerCase() === enquiryNumber.toLowerCase() ||
        e.id === enquiryNumber
    );
    if (!found) {
      return NextResponse.json(
        { error: `No custom enquiry found matching "${enquiryNumber}". Try CAF-CUS-2026-401.` },
        { status: 404 }
      );
    }
    const quotation = db.quotations.find(
      (q) => q.enquiryId === found.id || q.id === found.quotationId
    );
    return NextResponse.json({ enquiry: found, quotation: quotation || null });
  }

  if (session?.role === 'ADMIN') {
    return NextResponse.json({
      enquiries: db.customEnquiries,
      quotations: db.quotations,
    });
  }

  if (session) {
    const myEnquiries = db.customEnquiries.filter(
      (e) =>
        e.userId === session.id ||
        e.customerEmail.toLowerCase() === session.email.toLowerCase()
    );
    const myIds = new Set(myEnquiries.map((e) => e.id));
    const myQuotations = db.quotations.filter((q) => myIds.has(q.enquiryId));
    return NextResponse.json({
      enquiries: myEnquiries,
      quotations: myQuotations,
    });
  }

  return NextResponse.json({
    enquiries: db.customEnquiries,
    quotations: db.quotations,
  });
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
      category,
      referencePictures = [],
      sketchImages = [],
      measurements,
      preferredMaterials,
      colorsAndFinishing,
      requirementsDescription,
      location,
      paySmallSmallRequested = true,
    } = body;

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !category ||
      !measurements ||
      !preferredMaterials ||
      !colorsAndFinishing ||
      !requirementsDescription ||
      !location
    ) {
      return NextResponse.json(
        { error: 'Please complete all required custom furniture specifications and contact details.' },
        { status: 400 }
      );
    }

    const randomId = Math.floor(100 + Math.random() * 900);
    const enquiryNumber = `CAF-CUS-2026-${randomId}`;

    const newEnquiry: CustomFurnitureEnquiryRecord = {
      id: `enq-${Date.now()}`,
      enquiryNumber,
      userId: session?.id,
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim().toLowerCase(),
      customerPhone: String(customerPhone).trim(),
      category: String(category).trim(),
      referencePictures: Array.isArray(referencePictures) ? referencePictures : [],
      sketchImages: Array.isArray(sketchImages) ? sketchImages : [],
      measurements: String(measurements).trim(),
      preferredMaterials: String(preferredMaterials).trim(),
      colorsAndFinishing: String(colorsAndFinishing).trim(),
      requirementsDescription: String(requirementsDescription).trim(),
      location: String(location).trim(),
      paySmallSmallRequested: Boolean(paySmallSmallRequested),
      status: 'SUBMITTED_FOR_REVIEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const db = readDb();
    db.customEnquiries.unshift(newEnquiry);
    saveDb(db);

    return NextResponse.json(
      {
        enquiry: newEnquiry,
        message: `Custom furniture request ${enquiryNumber} submitted! Our administrator & master makers will prepare your quotation.`,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to submit custom furniture request.' },
      { status: 500 }
    );
  }
}

