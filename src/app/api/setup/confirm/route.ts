import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifySetupToken } from "@/lib/setup-token";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) return NextResponse.json({ error: "No token" }, { status: 400 });

    const result = verifySetupToken(token);
    if (!result) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });

    const supabase = createServiceRoleClient();
    await supabase
      .from("businesses")
      .update({ forwarding_confirmed: true })
      .eq("twilio_number", result.number);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Setup] Confirm error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
