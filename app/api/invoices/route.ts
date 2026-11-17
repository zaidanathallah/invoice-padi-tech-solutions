import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        i.*,
        c.name as client_name,
        c.email as client_email,
        c.address as client_address
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      ORDER BY i.created_at DESC
    `);

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('API GET /api/invoices error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const connection = await pool.getConnection();
  try {
    const body = await req.json();
    const {
      id,
      invoice_no,
      created_by_user_id,
      client_id,
      issue_date,
      due_date,
      status,
      sub_total,
      tax,
      tax_rate,
      discount,
      grand_total,
      notes,
      items,
    } = body;

    await connection.beginTransaction();

    // Insert Invoice
    await connection.query(
      `INSERT INTO invoices (
        id, invoice_no, created_by_user_id, client_id, company_id, issue_date, due_date,
        status, sub_total, tax, tax_rate, discount, grand_total, notes, sync_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SYNCED', NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        invoice_no = VALUES(invoice_no),
        client_id = VALUES(client_id),
        company_id = VALUES(company_id),
        issue_date = VALUES(issue_date),
        due_date = VALUES(due_date),
        status = VALUES(status),
        sub_total = VALUES(sub_total),
        tax = VALUES(tax),
        tax_rate = VALUES(tax_rate),
        discount = VALUES(discount),
        grand_total = VALUES(grand_total),
        notes = VALUES(notes),
        sync_status = 'SYNCED',
        updated_at = NOW()`,
      [
        id,
        invoice_no,
        created_by_user_id || 'usr-admin-01',
        client_id,
        body.company_id || 'cmp-01',
        issue_date,
        due_date,
        status || 'UNPAID',
        sub_total,
        tax,
        tax_rate,
        discount,
        grand_total,
        notes || '',
      ]
    );

    // Delete existing items for this invoice
    await connection.query(`DELETE FROM invoice_items WHERE invoice_id = ?`, [id]);

    // Insert items
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await connection.query(
          `INSERT INTO invoice_items (id, invoice_id, description, qty, price, discount, total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            id,
            item.description,
            item.qty,
            item.price,
            item.discount || 0,
            item.total,
          ]
        );
      }
    }

    await connection.commit();
    connection.release();

    return NextResponse.json({ success: true, id, message: 'Invoice saved to MySQL' });
  } catch (error: any) {
    await connection.rollback();
    connection.release();
    console.error('API POST /api/invoices error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
