"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Business } from "@/lib/types";

interface UseBusinessResult {
  business: Business | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBusiness(): UseBusinessResult {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusiness = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Niet ingelogd");
        setLoading(false);
        return;
      }

      const { data, error: dbError } = await supabase
        .from("businesses")
        .select("id, name, trade, service_area, phone, email, plan, status, trial_starts_at, subscription_ends_at, speed_leads_active, is_active, calendar_type, onboarding_step, onboarding_completed_at, forwarding_confirmed, available_hours, twilio_number, stripe_customer_id, google_review_link, website_url, prompt_mode")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (dbError || !data) {
        setError("Bedrijf niet gevonden");
        setLoading(false);
        return;
      }

      setBusiness(data as Business);
    } catch {
      setError("Er ging iets mis");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  return { business, loading, error, refetch: fetchBusiness };
}
