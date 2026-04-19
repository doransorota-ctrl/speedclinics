import OpenAI from "openai";
import { createServiceRoleClient } from "@/lib/supabase/server";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.AI_API_KEY });
}

/** Search for relevant treatment info using hybrid search (vector + full-text) */
export async function searchTreatmentInfo(
  businessId: string,
  query: string,
  limit = 5
): Promise<string> {
  try {
    // 1. Embed the query
    const embeddingRes = await getOpenAI().embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    const queryEmbedding = embeddingRes.data[0].embedding;

    // 2. Hybrid search via Supabase RPC
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc("match_website_chunks_hybrid", {
      query_embedding: JSON.stringify(queryEmbedding),
      query_text: query,
      p_business_id: businessId,
      match_count: limit,
    });

    if (error) {
      console.error("[Search] Hybrid RPC error, falling back to vector-only:", error);
      // Fallback to original vector-only search
      return vectorOnlySearch(businessId, queryEmbedding, limit);
    }

    if (!data || data.length === 0) {
      return "";
    }

    // 3. Format results
    return data
      .filter((r: { similarity: number }) => r.similarity > 0.01)
      .map((r: { title: string; content: string }) => {
        const title = r.title ? `[${r.title}]` : "";
        return `${title}\n${r.content}`;
      })
      .join("\n\n---\n\n");
  } catch (err) {
    console.error("[Search] Error:", err);
    return "";
  }
}

/** Fallback: vector-only search if hybrid fails */
async function vectorOnlySearch(businessId: string, embedding: number[], limit: number): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.rpc("match_website_chunks", {
    query_embedding: JSON.stringify(embedding),
    p_business_id: businessId,
    match_count: limit,
  });

  if (!data || data.length === 0) return "";

  return data
    .filter((r: { similarity: number }) => r.similarity > 0.3)
    .map((r: { title: string; content: string }) => {
      const title = r.title ? `[${r.title}]` : "";
      return `${title}\n${r.content}`;
    })
    .join("\n\n---\n\n");
}
