import OpenAI from "openai";
import { createServiceRoleClient } from "@/lib/supabase/server";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.AI_API_KEY });
}

/** Search for relevant treatment info from the website chunks using vector similarity */
export async function searchTreatmentInfo(
  businessId: string,
  query: string,
  limit = 3
): Promise<string> {
  try {
    // 1. Embed the query
    const embeddingRes = await getOpenAI().embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    const queryEmbedding = embeddingRes.data[0].embedding;

    // 2. Search for similar chunks via Supabase RPC
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc("match_website_chunks", {
      query_embedding: JSON.stringify(queryEmbedding),
      p_business_id: businessId,
      match_count: limit,
    });

    if (error) {
      console.error("[Search] RPC error:", error);
      return "";
    }

    if (!data || data.length === 0) {
      return "";
    }

    // 3. Format results as context for the AI prompt
    const results = data
      .filter((r: { similarity: number }) => r.similarity > 0.3) // Only relevant results
      .map((r: { title: string; content: string }) => {
        const title = r.title ? `[${r.title}]` : "";
        return `${title}\n${r.content}`;
      })
      .join("\n\n---\n\n");

    return results;
  } catch (err) {
    console.error("[Search] Error:", err);
    return "";
  }
}
