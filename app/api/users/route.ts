import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';
import crypto from 'crypto';
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

// Server-side hashing function for extra security (hashing client_hash with server salt)
function hashOnServer(clientHash: string): string {
  const salt = process.env.PASSWORD_SALT || 'padi-invoice-generator-saas-salt-123';
  return crypto.createHash('sha256').update(clientHash + salt).digest('hex');
}

let isMigrated = false;
async function runMigrations() {
  if (isMigrated) return;
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip VARCHAR(45) NULL");
  } catch (e) {
    try {
      await pool.query("ALTER TABLE users ADD COLUMN registration_ip VARCHAR(45) NULL");
    } catch (_) {}
  }
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(64) NULL");
  } catch (e) {
    try {
      await pool.query("ALTER TABLE users ADD COLUMN device_fingerprint VARCHAR(64) NULL");
    } catch (_) {}
  }
  isMigrated = true;
}

async function isDisposableOrInvalid(emailDomain: string): Promise<boolean> {
  const blockedDomains = [
    "tempmail.com", "temp-mail.org", "generator.email", "yopmail.com",
    "mailinator.com", "guerrillamail.com", "trashmail.com", "dispostable.com",
    "sharklasers.com", "guerrillamailblock.com", "guerrillamail.net", 
    "guerrillamail.org", "guerrillamail.biz", "10minutemail.com", 
    "10minutemail.co.za", "10minutemail.net", "getairmail.com", 
    "throwawaymail.com", "tempmailaddress.com", "temp-mail.ru", 
    "tempmail.net", "tempmail.casa", "tempmail.monster", "tempmail.website", 
    "maildrop.cc", "mintemail.com", "disposable.com", "disposablemail.com",
    "aminating.com", "inboxkitten.com", "moakt.cc", "armyspy.com", "cuvox.de",
    "boun.cr", "dodgit.com", "fakeinbox.com", "harakirimail.com", "mailnesia.com",
    "mailcatch.com", "mytrashmail.com", "incognitomail.com"
  ];

  if (blockedDomains.includes(emailDomain)) {
    return true;
  }

  const blockedKeywords = ["temp", "disposable", "throwaway", "mailinator", "yopmail", "sharklasers", "guerrillamail"];
  if (blockedKeywords.some(kw => emailDomain.includes(kw))) {
    return true;
  }
  
  try {
    const mxRecords = await resolveMx(emailDomain);
    if (!mxRecords || mxRecords.length === 0) {
      return true; // No MX records = invalid domain
    }
    
    const disposableMxKeywords = ["mailinator", "yopmail", "moakt", "inboxkitten", "guerrillamail", "temp", "disposable", "trash"];
    for (const record of mxRecords) {
      const exchange = record.exchange.toLowerCase();
      if (disposableMxKeywords.some(kw => exchange.includes(kw))) {
        return true;
      }
    }
  } catch (error) {
    // If DNS resolution fails, domain might be invalid or disposable without correct DNS
    return true;
  }
  
  return false;
}

export async function GET(req: Request) {
  await runMigrations();
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      const [rows] = await pool.query('SELECT id, name, email, role, registration_ip, device_fingerprint FROM users');
      return NextResponse.json({ success: true, data: rows });
    }

    const [rows]: any = await pool.query(
      'SELECT id, name, email, role, registration_ip, device_fingerprint FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error: any) {
    console.error('API GET /api/users error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await runMigrations();
  try {
    const body = await req.json();
    const { id, name, email, role, password_hash, device_fingerprint, device_id } = body; 

    // Fallback: Read device_id cookie from headers
    const cookieHeader = req.headers.get("cookie");
    let cookieDeviceId = "";
    if (cookieHeader) {
      const match = cookieHeader.match(/(^|;)\s*device_id\s*=\s*([^;]+)/);
      if (match) {
        cookieDeviceId = match[2];
      }
    }

    const finalFingerprint = device_id || device_fingerprint || cookieDeviceId;

    if (!email || !password_hash) {
      return NextResponse.json({ success: false, error: 'Email and password hash are required' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();
    const emailDomain = emailLower.split("@")[1] || "";

    // Get client IP address
    const xForwardedFor = req.headers.get("x-forwarded-for");
    const xRealIp = req.headers.get("x-real-ip");
    const rawIp = xForwardedFor || xRealIp || "127.0.0.1";
    const clientIp = rawIp.split(',')[0].trim();

    // Check if this is a NEW registration (user doesn't exist yet)
    const [existingUser]: any = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [emailLower]
    );

    if (existingUser.length === 0) {
      // 1. Validate disposable email
      const isDisposable = await isDisposableOrInvalid(emailDomain);
      if (isDisposable) {
        return NextResponse.json(
          { success: false, error: "Pendaftaran menggunakan email sementara (temp-mail) dilarang!" },
          { status: 400 }
        );
      }

      // 2. Prevent duplicate device fingerprints (1 device = 1 account)
      if (finalFingerprint) {
        const [dupFingerprint]: any = await pool.query(
          "SELECT id, email FROM users WHERE device_fingerprint = ?",
          [finalFingerprint]
        );
        if (dupFingerprint.length > 0) {
          return NextResponse.json(
            { success: false, error: "Pendaftaran gagal: Perangkat ini sudah pernah digunakan untuk mendaftar akun." },
            { status: 400 }
          );
        }
      }

      // 3. Prevent duplicate IP registrations (1 network connection = 1 account)
      if (clientIp && clientIp !== "127.0.0.1" && clientIp !== "localhost" && clientIp !== "::1") {
        const [dupIp]: any = await pool.query(
          "SELECT id, email FROM users WHERE registration_ip = ?",
          [clientIp]
        );
        if (dupIp.length > 0) {
          return NextResponse.json(
            { success: false, error: "Jaringan/Koneksi ini sudah digunakan untuk mendaftar akun!" },
            { status: 400 }
          );
        }
      }
    }

    // Hash the client_hash on server before inserting
    const serverHash = hashOnServer(password_hash);

    await pool.query(
      `INSERT INTO users (id, name, email, role, password_hash, registration_ip, device_fingerprint, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password_hash = VALUES(password_hash),
         role = VALUES(role)`,
      [id, name, emailLower, role || 'USER', serverHash, clientIp, finalFingerprint || null]
    );

    return NextResponse.json({ success: true, message: 'User registered/updated in MySQL successfully' });
  } catch (error: any) {
    console.error('API POST /api/users error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
