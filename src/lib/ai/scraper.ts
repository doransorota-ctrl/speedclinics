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

  // Remove non-content elements
  $("script, style, nav, footer, header, iframe, noscript, svg, [role=navigation]").remove();

  const title = $("title").text().trim() || $("h1").first().text().trim() || url;

  // Extract meaningful text
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
  const links = new Set<string>();

  $("a[href]").each((_, el) => {
    try {
      const href = $(el).attr("href");
      if (!href) return;
      const resolved = new URL(href, baseUrl);
      if (resolved.hostname === base.hostname && !resolved.hash) {
        // Clean URL — no query params, no fragments
        resolved.search = "";
        links.add(resolved.toString());
      }
    } catch {
      // Invalid URL, skip
    }
  });

  const arr: string[] = [];
  links.forEach((l) => arr.push(l));
  return arr;
}

/** Split text into chunks of roughly maxChars characters, splitting on sentence boundaries */
export function chunkText(text: string, maxChars = 500): string[] {
  if (text.length <= maxChars) return [text];

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence;
  }

  if (current.trim()) chunks.push(current.trim());

  return chunks.filter((c) => c.length > 30); // Skip tiny fragments
}

/** Generate embeddings for text chunks using OpenAI */
async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  // Batch in groups of 100 (OpenAI limit)
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

/** Scrape a website, chunk the content, embed it, and store in Supabase */
export async function indexWebsite(
  businessId: string,
  websiteUrl: string
): Promise<{ pages: number; chunks: number }> {
  const supabase = createServiceRoleClient();

  // 1. Fetch the main page to discover links
  const mainRes = await fetch(websiteUrl, {
    headers: { "User-Agent": "ClyniqBot/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  const mainHtml = await mainRes.text();
  const allLinks = findInternalLinks(mainHtml, websiteUrl);

  // Include the main URL + discovered links (max 30 pages)
  const urls = [websiteUrl, ...allLinks].slice(0, 30);
  const uniqueUrls = urls.filter((url, i) => urls.indexOf(url) === i);

  // 2. Fetch all pages
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

  // 3. Chunk all pages
  const allChunks: { url: string; title: string; content: string; chunkIndex: number }[] = [];
  for (const page of pages) {
    const chunks = chunkText(page.content);
    chunks.forEach((content, i) => {
      allChunks.push({
        url: page.url,
        title: page.title,
        content,
        chunkIndex: i,
      });
    });
  }

  if (allChunks.length === 0) {
    return { pages: 0, chunks: 0 };
  }

  // 4. Generate embeddings
  const embeddings = await embedTexts(allChunks.map((c) => c.content));

  // 5. Delete old chunks for this business
  await supabase
    .from("website_chunks")
    .delete()
    .eq("business_id", businessId);

  // 6. Insert new chunks with embeddings
  const rows = allChunks.map((chunk, i) => ({
    business_id: businessId,
    url: chunk.url,
    title: chunk.title,
    content: chunk.content,
    embedding: JSON.stringify(embeddings[i]),
    chunk_index: chunk.chunkIndex,
  }));

  // Insert in batches of 50
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
