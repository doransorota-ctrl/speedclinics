import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { indexWebsite } from "@/lib/ai/scraper";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const { data: business, error } = await supabase
      .from("businesses")
      .select("id, website_url")
      .eq("owner_id", user.id)
      .single();

    if (error || !business) {
      return NextResponse.json({ error: "Bedrijf niet gevonden" }, { status: 404 });
    }

    if (!business.website_url) {
      return NextResponse.json({ error: "Geen website URL ingesteld" }, { status: 400 });
    }

    // Ensure URL has protocol
    let url = business.website_url;
    if (!url.startsWith("http")) url = `https://${url}`;

    const result = await indexWebsite(business.id, url);

    return NextResponse.json({
      ok: true,
      pages: result.pages,
      chunks: result.chunks,
      message: `${result.pages} pagina's gescraped, ${result.chunks} tekstfragmenten geïndexeerd.`,
    });
  } catch (err) {
    console.error("[Scrape] Error:", err);
    return NextResponse.json(
      { error: "Scraping mislukt. Controleer of de website URL correct is." },
      { status: 500 }
    );
  }
}
