"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function submitLead({
  clientId,
  name,
  phone,
  email,
  trade,
  tier,
  size,
  estimateLow,
  estimateHigh,
}) {
  const supabase = supabaseServer();
  const { error } = await supabase.from("leads").insert({
    client_id: clientId || null,
    name,
    phone,
    email: email || null,
    trade,
    tier,
    size,
    estimate_low: estimateLow,
    estimate_high: estimateHigh,
  });

  if (error) {
    throw new Error(`Could not save lead: ${error.message}`);
  }
}
