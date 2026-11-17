import pool from "@/lib/mysql";
import { DEFAULT_CMS_CONTENT } from "@/lib/cms-defaults";
import LandingClient from "./LandingClient";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  let cmsContent = DEFAULT_CMS_CONTENT;
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM cms_settings WHERE `key` = 'landing_content'"
    );
    if (rows.length > 0) {
      const parsed = JSON.parse(rows[0].value);
      cmsContent = { ...DEFAULT_CMS_CONTENT, ...parsed };
    }
  } catch (error) {
    console.error("Failed to query CMS settings in server:", error);
  }

  return <LandingClient initialContent={cmsContent} />;
}
