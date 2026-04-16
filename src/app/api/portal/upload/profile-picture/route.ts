import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const serviceSupabase = createServiceRoleClient();

    const { data: business } = await serviceSupabase
      .from("businesses")
      .select("id, name, trade, service_area")
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Bedrijf niet gevonden" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Geen bestand ontvangen" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Alleen JPG, PNG of WebP toegestaan" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Bestand is groter dan 5 MB" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Validate actual file content via magic bytes
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    const isWebp = bytes.length > 11 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
      && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

    if (!isJpeg && !isPng && !isWebp) {
      return NextResponse.json({ error: "Ongeldig bestandsformaat" }, { status: 400 });
    }

    // If Meta is not yet verified, nothing to do — return pending
    if (!process.env.WHATSAPP_ACCESS_TOKEN) {
      console.log("[Upload] WHATSAPP_ACCESS_TOKEN not set — logo upload deferred");
      return NextResponse.json({ pending: true });
    }

    // Find the pool number assigned to this business to get meta_phone_number_id
    const { data: poolRow } = await serviceSupabase
      .from("phone_number_pool")
      .select("meta_phone_number_id")
      .eq("assigned_business_id", business.id)
      .eq("status", "assigned")
      .maybeSingle();

    if (!poolRow?.meta_phone_number_id) {
      console.log("[Upload] No meta_phone_number_id for business — logo upload deferred");
      return NextResponse.json({ pending: true });
    }

    const { uploadProfilePictureToMeta, setWhatsAppProfile } = await import("@/lib/twilio/whatsapp");

    const handle = await uploadProfilePictureToMeta(
      poolRow.meta_phone_number_id,
      buffer,
      file.type
    );

    if (!handle) {
      return NextResponse.json({ error: "Upload naar Meta mislukt" }, { status: 500 });
    }

    // Store the handle on the business record
    await serviceSupabase
      .from("businesses")
      .update({ whatsapp_profile_picture_handle: handle })
      .eq("id", business.id);

    // Apply it to the WhatsApp profile
    const about = [business.name, business.trade, business.service_area]
      .filter(Boolean)
      .join(" — ");

    await setWhatsAppProfile(poolRow.meta_phone_number_id, {
      about,
      profilePictureHandle: handle,
    }).catch((err) => {
      console.error("[Upload] setWhatsAppProfile failed (non-fatal):", err);
    });

    console.log(`[Upload] Profile picture set for business ${business.id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}
