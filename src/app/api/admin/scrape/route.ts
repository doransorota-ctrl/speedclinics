import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { indexWebsite } from "@/lib/ai/scraper";

/** Admin endpoint to scrape a website for a specific business.
 *  POST /api/admin/scrape?business_id=xxx&url=https://aestec.nl
 *  Protected by CRON_SECRET header.
 */
export async function POST(request: Request) {
  // Auth check
  const secret = request.headers.get("x-cron-secret") || new URL(request.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("business_id");
  let url = searchParams.get("url");

  if (!businessId) {
    return NextResponse.json({ error: "Missing business_id" }, { status: 400 });
  }

  // If no URL provided, fetch from business
  if (!url) {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("businesses")
      .select("website_url")
      .eq("id", businessId)
      .single();
    url = data?.website_url;
  }

  if (!url) {
    return NextResponse.json({ error: "No URL provided or found on business" }, { status: 400 });
  }

  if (!url.startsWith("http")) url = `https://${url}`;

  try {
    const result = await indexWebsite(businessId, url);
    return NextResponse.json({
      ok: true,
      ...result,
      message: `${result.pages} pagina's gescraped, ${result.chunks} chunks geïndexeerd.`,
    });
  } catch (err) {
    console.error("[Admin Scrape] Error:", err);
    return NextResponse.json(
      { error: `Scraping failed: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
