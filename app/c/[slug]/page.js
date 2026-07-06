import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import EstimateCalculator from "@/components/EstimateCalculator";

export const dynamic = "force-dynamic";

async function loadClient(slug) {
  const supabase = supabaseServer();

  const { data: client } = await supabase
    .from("clients")
    .select(
      "id, slug, business_name, logo_url, brand_color, background_color, phone_number, service_area, licensed_insured"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!client) return null;

  const [{ data: clientTrades }, { data: pricingRows }] = await Promise.all([
    supabase.from("client_trades").select("trade_key, tier_keys").eq("client_id", client.id),
    supabase.from("pricing").select("trade_key, tier_key, low, high").eq("client_id", client.id),
  ]);

  const tradeKeys = (clientTrades || []).map((row) => row.trade_key);
  const tierKeys = {};
  for (const row of clientTrades || []) {
    tierKeys[row.trade_key] = row.tier_keys || [];
  }

  const overrides = {};
  for (const row of pricingRows || []) {
    const key = row.tier_key ? `${row.trade_key}:${row.tier_key}` : row.trade_key;
    overrides[key] = { low: Number(row.low), high: Number(row.high) };
  }

  return { client, tradeKeys, tierKeys, overrides };
}

export default async function ClientPage({ params }) {
  const { slug } = await params;
  const data = await loadClient(slug);

  if (!data) notFound();

  const { client, tradeKeys, tierKeys, overrides } = data;

  return (
    <EstimateCalculator
      clientId={client.id}
      tradeKeys={tradeKeys}
      tierKeys={tierKeys}
      overrides={overrides}
      branding={{
        businessName: client.business_name,
        logoUrl: client.logo_url,
        brandColor: client.brand_color,
        backgroundColor: client.background_color,
        phoneNumber: client.phone_number,
        serviceArea: client.service_area,
        licensedInsured: client.licensed_insured,
      }}
    />
  );
}
