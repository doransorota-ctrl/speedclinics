import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerSupabaseClient();

  // 1. Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  // 2. Find their business
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (bizError || !business) {
    return NextResponse.json(
      { error: "Bedrijf niet gevonden" },
      { status: 404 }
    );
  }

  // 3. Leads this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count: leadsThisMonth } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id)
    .gte("created_at", startOfMonth);

  // 4. Appointments count
  const { count: appointmentsCount } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("status", "appointment_set");

  // 5. Average response time
  const { data: responseTimes } = await supabase
    .from("leads")
    .select("created_at, first_response_at")
    .eq("business_id", business.id)
    .not("first_response_at", "is", null);

  let avgResponseTime: number | null = null;
  if (responseTimes && responseTimes.length > 0) {
    const totalMinutes = responseTimes.reduce((sum, lead) => {
      const diff =
        new Date(lead.first_response_at).getTime() -
        new Date(lead.created_at).getTime();
      return sum + diff / (1000 * 60);
    }, 0);
    avgResponseTime = Math.round(totalMinutes / responseTimes.length);
  }

  return NextResponse.json({
    leadsThisMonth: leadsThisMonth ?? 0,
    appointmentsCount: appointmentsCount ?? 0,
    avgResponseTime,
  });
}
