import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { indexWebsite } from "@/lib/ai/scraper";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check — must be logged in as admin (sales mode)
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    // Check if user is admin (has a business with prompt_mode = "sales")
    const { data: adminBiz } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .eq("prompt_mode", "sales")
      .maybeSingle();

    if (!adminBiz) {
      return NextResponse.json({ error: "Geen admin-toegang" }, { status: 403 });
    }

    // Get the target business
    const serviceClient = createServiceRoleClient();
    const { data: business } = await serviceClient
      .from("businesses")
      .select("id, website_url")
      .eq("id", params.id)
      .single();

    if (!business || !business.website_url) {
      return NextResponse.json({ error: "Geen website URL ingesteld voor deze klant" }, { status: 400 });
    }

    let url = business.website_url;
    if (!url.startsWith("http")) url = `https://${url}`;

    const result = await indexWebsite(business.id, url);

    return NextResponse.json({
      ok: true,
      pages: result.pages,
      chunks: result.chunks,
    });
  } catch (err) {
    console.error("[Admin Scrape] Error:", err);
    return NextResponse.json(
      { error: `Scraping mislukt: ${err instanceof Error ? err.message : "Onbekende fout"}` },
      { status: 500 }
    );
  }
}
