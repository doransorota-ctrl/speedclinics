import { verifySetupToken } from "@/lib/setup-token";
import { NextRequest } from "next/server";

/**
 * GET /api/setup/verify?t={token}
 * Verifies a signed setup token and returns the Twilio number.
 * Public endpoint — token itself provides authentication.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");
  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 400 });
  }

  const result = verifySetupToken(token);
  if (!result) {
    return Response.json({ error: "expired" }, { status: 410 });
  }

  return Response.json({ number: result.number });
}
