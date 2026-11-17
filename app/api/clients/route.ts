import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let rows;
    if (userId) {
      // Return only clients created by this specific user
      [rows] = await pool.query(
        `SELECT * FROM clients WHERE created_by_user_id = ? OR created_by_user_id IS NULL ORDER BY name ASC`,
        [userId]
      );
    } else {
      [rows] = await pool.query(`SELECT * FROM clients ORDER BY name ASC`);
    }
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, email, phone, address, created_by_user_id } = body;

    await pool.query(
      `INSERT INTO clients (id, name, email, phone, address, created_by_user_id, created_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), 'SYNCED')
       ON DUPLICATE KEY UPDATE 
         name=VALUES(name), 
         email=VALUES(email), 
         phone=VALUES(phone), 
         address=VALUES(address),
         created_by_user_id=VALUES(created_by_user_id)`,
      [id, name, email || '', phone || '', address || '', created_by_user_id || null]
    );

    return NextResponse.json({ success: true, id, message: 'Client created in MySQL' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
