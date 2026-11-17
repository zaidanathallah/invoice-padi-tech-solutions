import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM cms_settings WHERE `key` = 'landing_content'"
    );
    if (rows.length > 0) {
      return NextResponse.json({ success: true, data: JSON.parse(rows[0].value) });
    }
    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    console.error("CMS GET Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const valueStr = JSON.stringify(body);

    await pool.query(
      "INSERT INTO cms_settings (`key`, `value`) VALUES ('landing_content', ?) ON DUPLICATE KEY UPDATE `value` = ?",
      [valueStr, valueStr]
    );

    return NextResponse.json({ success: true, message: "CMS settings saved successfully" });
  } catch (error: any) {
    console.error("CMS POST Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
