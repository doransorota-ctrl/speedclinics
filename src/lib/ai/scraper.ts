import * as cheerio from "cheerio";
import OpenAI from "openai";
import { createServiceRoleClient } from "@/lib/supabase/server";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.AI_API_KEY });
}

/** Fetch and extract text content from a URL */
async function fetchPage(url: string): Promise<{ title: string; content: string }> {
  const res = await fetch(url, {
    headers: { "User-Agent": "ClyniqBot/1.0" },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  $("script, style, nav, footer, header, iframe, noscript, svg, [role=navigation]").remove();

  const title = $("title").text().trim() || $("h1").first().text().trim() || url;

  const content = $("main, article, .content, [role=main], body")
    .first()
    .text()
    .replace(/\s+/g, " ")
    .trim();

  return { title, content };
}

/** Find all internal links on a page */
function findInternalLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const seen: Record<string, boolean> = {};
  const links: string[] = [];

  $("a[href]").each((_, el) => {
    try {
      const href = $(el).attr("href");
      if (!href) return;
      const resolved = new URL(href, baseUrl);
      if (resolved.hostname === base.hostname && !resolved.hash) {
        resolved.search = "";
        const clean = resolved.toString();
        if (!seen[clean]) {
          seen[clean] = true;
          links.push(clean);
        }
      }
    } catch {
      // Invalid URL
    }
  });

  return links;
}

/** Detect section type from URL path and content */
function detectSectionType(url: string, content: string): string {
  const path = new URL(url).pathname.toLowerCase();
  if (path.includes("tarieven") || path.includes("prijs") || path.includes("pricing")) return "pricing";
  if (path.includes("behandeling") || path.includes("treatment")) return "treatment";
  if (path.includes("faq") || path.includes("veelgestelde")) return "faq";
  if (path.includes("contact")) return "contact";
  if (path.includes("team") || path.includes("over-ons") || path.includes("about")) return "about";
  if (content.includes("€") && content.includes(",-")) return "pricing";
  return "general";
}

/** Detect treatment name from URL path */
function detectTreatmentName(url: string): string | null {
  const path = new URL(url).pathname.toLowerCase();
  const treatmentMatch = path.match(/behandelingen?\/([\w-]+)/);
  if (treatmentMatch) {
    return treatmentMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return null;
}

/** Split text into chunks with overlap, splitting on sentence boundaries */
export function chunkText(text: string, maxChars = 2000, overlapChars = 200): string[] {
  if (text.length <= maxChars) return text.length > 50 ? [text] : [];

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = "";
  let overlapBuffer = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      overlapBuffer = current.slice(-overlapChars);
      current = overlapBuffer;
    }
    current += sentence;
  }

  if (current.trim().length > 50) chunks.push(current.trim());

  return chunks;
}

/** Generate embeddings for text chunks */
async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const embeddings: number[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const res = await getOpenAI().embeddings.create({
      model: "text-embedding-3-small",
      input: batch,
    });
    embeddings.push(...res.data.map((d) => d.embedding));
  }

  return embeddings;
}

/** Scrape a website, chunk, embed, and store with metadata */
export async function indexWebsite(
  businessId: string,
  websiteUrl: string
): Promise<{ pages: number; chunks: number }> {
  const supabase = createServiceRoleClient();

  const mainRes = await fetch(websiteUrl, {
    headers: { "User-Agent": "ClyniqBot/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  const mainHtml = await mainRes.text();
  const allLinks = findInternalLinks(mainHtml, websiteUrl);

  const urls = [websiteUrl, ...allLinks].slice(0, 30);
  const uniqueUrls = urls.filter((url, i) => urls.indexOf(url) === i);

  const pages: { url: string; title: string; content: string }[] = [];
  for (const url of uniqueUrls) {
    try {
      const page = await fetchPage(url);
      if (page.content.length > 50) {
        pages.push({ url, ...page });
      }
    } catch (err) {
      console.warn(`[Scraper] Skipping ${url}:`, err);
    }
  }

  const allChunks: { url: string; title: string; content: string; chunkIndex: number; sectionType: string; treatmentName: string | null }[] = [];
  for (const page of pages) {
    const chunks = chunkText(page.content);
    const sectionType = detectSectionType(page.url, page.content);
    const treatmentName = detectTreatmentName(page.url);
    chunks.forEach((content, i) => {
      allChunks.push({
        url: page.url,
        title: page.title,
        content,
        chunkIndex: i,
        sectionType,
        treatmentName,
      });
    });
  }

  if (allChunks.length === 0) {
    return { pages: 0, chunks: 0 };
  }

  const embeddings = await embedTexts(allChunks.map((c) => c.content));

  await supabase.from("website_chunks").delete().eq("business_id", businessId);

  const rows = allChunks.map((chunk, i) => ({
    business_id: businessId,
    url: chunk.url,
    title: chunk.title,
    content: chunk.content,
    embedding: JSON.stringify(embeddings[i]),
    chunk_index: chunk.chunkIndex,
    section_type: chunk.sectionType,
    treatment_name: chunk.treatmentName,
  }));

  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase.from("website_chunks").insert(batch);
    if (error) {
      console.error("[Scraper] Insert error:", error);
      throw new Error(`Failed to insert chunks: ${error.message}`);
    }
  }

  return { pages: pages.length, chunks: allChunks.length };
}
