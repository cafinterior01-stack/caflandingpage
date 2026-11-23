import { NextRequest, NextResponse } from 'next/server';
import { readDb, saveDb, hashPassword, createSessionToken, UserRecord } from '@/lib/db-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, address, city, state } = body;

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'Full name, email, phone number, and password are required.' },
        { status: 400 }
      );
    }

    const db = readDb();
    const normalizedEmail = String(email).toLowerCase().trim();

    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const newUser: UserRecord = {
      id: `usr-${Date.now()}`,
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(String(password)),
      role: 'CUSTOMER',
      phone: String(phone).trim(),
      address: address ? String(address).trim() : '',
      city: city ? String(city).trim() : '',
      state: state ? String(state).trim() : 'Lagos',
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDb(db);

    const token = createSessionToken(newUser);
    const { passwordHash: _ph, ...safeUser } = newUser;

    const response = NextResponse.json({ user: safeUser, message: 'Registration successful.' }, { status: 201 });
    response.cookies.set('caf_session', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 14,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Unable to process registration.' }, { status: 500 });
  }
}

