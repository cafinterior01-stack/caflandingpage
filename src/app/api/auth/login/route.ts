import { NextRequest, NextResponse } from 'next/server';
import { readDb, hashPassword, createSessionToken } from '@/lib/db-store';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please provide both email address and password.' },
        { status: 400 }
      );
    }

    const db = readDb();
    const normalizedEmail = String(email).toLowerCase().trim();
    const hashed = hashPassword(String(password));

    const user = db.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail && u.passwordHash === hashed
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password. Please verify your credentials.' },
        { status: 401 }
      );
    }

    const token = createSessionToken(user);
    const { passwordHash: _ph, ...safeUser } = user;

    const response = NextResponse.json({ user: safeUser, message: 'Signed in successfully.' });
    response.cookies.set('caf_session', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 14,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Authentication error occurred.' }, { status: 500 });
  }
}

