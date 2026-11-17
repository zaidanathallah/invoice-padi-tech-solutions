import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';
import crypto from 'crypto';

// Server-side hashing function for extra security (hashing client_hash with server salt)
function hashOnServer(clientHash: string): string {
  const salt = process.env.PASSWORD_SALT || 'padi-invoice-generator-saas-salt-123';
  return crypto.createHash('sha256').update(clientHash + salt).digest('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password_hash } = body; // password_hash is the client_hash from frontend

    if (!email || !password_hash) {
      return NextResponse.json({ success: false, error: 'Email and password hash are required' }, { status: 400 });
    }

    const [rows]: any = await pool.query(
      'SELECT id, name, email, role, password_hash FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const dbUser = rows[0];
    const computedServerHash = hashOnServer(password_hash);

    // Verify hashed password
    if (dbUser.password_hash !== computedServerHash) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Return user details without password hash for maximum security
    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
      }
    });
  } catch (error: any) {
    console.error('API POST /api/users/verify error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
