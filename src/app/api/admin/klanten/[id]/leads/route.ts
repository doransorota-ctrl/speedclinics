import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

/** GET — Leads for a specific business */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const serviceSupabase = createServiceRoleClient();
  const { data, error } = await serviceSupabase
    .from("leads")
    .select("id, customer_name, customer_phone, status, urgency, problem_summary, appointment_start, created_at")
    .eq("business_id", params.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: "Kon leads niet ophalen" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
