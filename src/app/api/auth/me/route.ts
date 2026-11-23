import { NextRequest, NextResponse } from 'next/server';
import { readDb, saveDb, parseSessionToken } from '@/lib/db-store';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('caf_session')?.value;
  const session = parseSessionToken(token);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === session.id || u.email === session.email);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const { passwordHash: _ph, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get('caf_session')?.value;
  const session = parseSessionToken(token);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const updates = await request.json();
  const db = readDb();
  const idx = db.users.findIndex((u) => u.id === session.id || u.email === session.email);
  if (idx === -1) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const user = db.users[idx];
  if (updates.name) user.name = String(updates.name).trim();
  if (updates.phone) user.phone = String(updates.phone).trim();
  if (updates.address !== undefined) user.address = String(updates.address).trim();
  if (updates.city !== undefined) user.city = String(updates.city).trim();
  if (updates.state !== undefined) user.state = String(updates.state).trim();

  db.users[idx] = user;
  saveDb(db);

  const { passwordHash: _ph, ...safeUser } = user;
  return NextResponse.json({ user: safeUser, message: 'Profile updated.' });
}

