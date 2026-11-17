import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [invoices]: any = await pool.query(
      `SELECT i.*, c.name as client_name, c.email as client_email, c.address as client_address
       FROM invoices i
       LEFT JOIN clients c ON i.client_id = c.id
       WHERE i.id = ?`,
      [id]
    );

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const [items]: any = await pool.query(
      `SELECT * FROM invoice_items WHERE invoice_id = ?`,
      [id]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...invoices[0],
        items,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (status) {
      await pool.query(
        `UPDATE invoices SET status = ?, sync_status = 'SYNCED', updated_at = NOW() WHERE id = ?`,
        [status, id]
      );
    }

    return NextResponse.json({ success: true, message: 'Status updated in MySQL' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await pool.query(`DELETE FROM invoices WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, message: 'Invoice deleted from MySQL' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
