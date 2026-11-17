import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

let isMigrated = false;
async function runMigrations() {
  if (isMigrated) return;
  try {
    await pool.query("ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by_user_id VARCHAR(36) NULL");
  } catch (e) {
    try {
      await pool.query("ALTER TABLE companies ADD COLUMN created_by_user_id VARCHAR(36) NULL");
    } catch (_) {}
  }
  isMigrated = true;
}

export async function GET(req: Request) {
  await runMigrations();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let rows;
    if (userId) {
      // Return companies created by this user or default companies
      [rows] = await pool.query(
        `SELECT * FROM companies WHERE created_by_user_id = ? OR created_by_user_id IS NULL ORDER BY name ASC`,
        [userId]
      );
    } else {
      [rows] = await pool.query(`SELECT * FROM companies ORDER BY name ASC`);
    }
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await runMigrations();
  try {
    const body = await req.json();
    const {
      id,
      name,
      address,
      phone,
      email,
      bank_name,
      bank_account_no,
      bank_account_name,
      logo,
      created_by_user_id,
    } = body;

    if (!id || !name) {
      return NextResponse.json({ success: false, error: 'ID dan Nama Perusahaan wajib diisi' }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO companies (
        id, name, address, phone, email, bank_name, bank_account_no, bank_account_name, logo, created_by_user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        address = VALUES(address),
        phone = VALUES(phone),
        email = VALUES(email),
        bank_name = VALUES(bank_name),
        bank_account_no = VALUES(bank_account_no),
        bank_account_name = VALUES(bank_account_name),
        logo = VALUES(logo),
        created_by_user_id = VALUES(created_by_user_id)`,
      [
        id,
        name,
        address || '',
        phone || '',
        email || '',
        bank_name || '',
        bank_account_no || '',
        bank_account_name || '',
        logo || null,
        created_by_user_id || null,
      ]
    );

    return NextResponse.json({ success: true, id, message: 'Company saved to MySQL successfully' });
  } catch (error: any) {
    console.error('API POST /api/companies error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  await runMigrations();
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch (_) {}
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID Perusahaan wajib disertakan' }, { status: 400 });
    }

    await pool.query('DELETE FROM companies WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Company deleted from MySQL successfully' });
  } catch (error: any) {
    console.error('API DELETE /api/companies error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

