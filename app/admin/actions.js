"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { TRADES, TRADE_KEYS } from "@/lib/trades";
import { hashPortalPassword } from "@/lib/portalAuth";

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Reads the trade/tier checkboxes and low/high rate inputs out of a
// client-config form and replaces that client's client_trades + pricing
// rows. Shared by "add client" and "edit client" since both forms use the
// same field naming convention (see components/admin/ClientConfigFields.jsx).
async function saveClientConfig(supabase, clientId, formData) {
  const tradeRows = [];
  for (const tradeKey of TRADE_KEYS) {
    if (formData.get(`trade_${tradeKey}`) !== "on") continue;
    const tierKeys = TRADES[tradeKey].tiers
      .filter((t) => formData.get(`tier_${tradeKey}_${t.key}`) === "on")
      .map((t) => t.key);
    tradeRows.push({ client_id: clientId, trade_key: tradeKey, tier_keys: tierKeys });
  }

  const { error: deleteTradesError } = await supabase
    .from("client_trades")
    .delete()
    .eq("client_id", clientId);
  if (deleteTradesError) throw new Error(`Could not save trades: ${deleteTradesError.message}`);

  if (tradeRows.length) {
    const { error } = await supabase.from("client_trades").insert(tradeRows);
    if (error) throw new Error(`Could not save trades: ${error.message}`);
  }

  const pricingRows = [];
  for (const tradeKey of TRADE_KEYS) {
    const trade = TRADES[tradeKey];
    const rateLow = formData.get(`rate_${tradeKey}_low`);
    const rateHigh = formData.get(`rate_${tradeKey}_high`);
    if (rateLow && rateHigh) {
      pricingRows.push({
        client_id: clientId,
        trade_key: tradeKey,
        tier_key: null,
        low: Number(rateLow),
        high: Number(rateHigh),
      });
    }

    for (const tier of trade.tiers) {
      const low = formData.get(`tierrate_${tradeKey}_${tier.key}_low`);
      const high = formData.get(`tierrate_${tradeKey}_${tier.key}_high`);
      if (low && high) {
        pricingRows.push({
          client_id: clientId,
          trade_key: tradeKey,
          tier_key: tier.key,
          low: Number(low),
          high: Number(high),
        });
      }
    }
  }

  const { error: deletePricingError } = await supabase
    .from("pricing")
    .delete()
    .eq("client_id", clientId);
  if (deletePricingError) throw new Error(`Could not save pricing: ${deletePricingError.message}`);

  if (pricingRows.length) {
    const { error } = await supabase.from("pricing").insert(pricingRows);
    if (error) throw new Error(`Could not save pricing: ${error.message}`);
  }
}

export async function addClient(formData) {
  const supabase = supabaseServer();
  const businessName = formData.get("business_name")?.toString().trim();
  const slug = slugify(formData.get("slug")?.toString().trim() || businessName || "");
  const brandColor = formData.get("brand_color")?.toString() || "#c98a4b";
  const backgroundColor = formData.get("background_color")?.toString() || "#1c1917";
  const logoUrl = formData.get("logo_url")?.toString().trim() || null;
  const portalPassword = formData.get("portal_password")?.toString().trim();

  if (!businessName || !slug) {
    throw new Error("Business name and slug are required.");
  }

  const insertPayload = {
    business_name: businessName,
    slug,
    brand_color: brandColor,
    background_color: backgroundColor,
    logo_url: logoUrl,
  };
  if (portalPassword) insertPayload.portal_password_hash = hashPortalPassword(portalPassword);

  const { data: client, error } = await supabase
    .from("clients")
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw new Error(`Could not create client: ${error.message}`);

  await saveClientConfig(supabase, client.id, formData);

  revalidatePath("/admin");
  redirect(`/admin/clients/${client.id}`);
}

export async function updateClient(clientId, formData) {
  const supabase = supabaseServer();
  const businessName = formData.get("business_name")?.toString().trim();
  const slug = slugify(formData.get("slug")?.toString().trim() || businessName || "");
  const brandColor = formData.get("brand_color")?.toString() || "#c98a4b";
  const backgroundColor = formData.get("background_color")?.toString() || "#1c1917";
  const logoUrl = formData.get("logo_url")?.toString().trim() || null;
  const portalPassword = formData.get("portal_password")?.toString().trim();

  if (!businessName || !slug) {
    throw new Error("Business name and slug are required.");
  }

  const { data: existing, error: fetchError } = await supabase
    .from("clients")
    .select("slug")
    .eq("id", clientId)
    .single();
  if (fetchError) throw new Error(`Could not find client: ${fetchError.message}`);

  const updatePayload = {
    business_name: businessName,
    slug,
    brand_color: brandColor,
    background_color: backgroundColor,
    logo_url: logoUrl,
  };
  // Only touch the password hash if a new password was actually typed in —
  // leaving the field blank keeps whatever password the client already has.
  if (portalPassword) updatePayload.portal_password_hash = hashPortalPassword(portalPassword);

  const { error } = await supabase.from("clients").update(updatePayload).eq("id", clientId);
  if (error) throw new Error(`Could not update client: ${error.message}`);

  await saveClientConfig(supabase, clientId, formData);

  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath(`/c/${existing.slug}`);
  if (slug !== existing.slug) revalidatePath(`/c/${slug}`);
}
