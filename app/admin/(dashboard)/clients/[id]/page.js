import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { updateClient } from "@/app/admin/actions";
import ClientInfoFields from "@/components/admin/ClientInfoFields";
import ClientConfigFields from "@/components/admin/ClientConfigFields";

export const dynamic = "force-dynamic";

async function getClientData(id) {
  const supabase = supabaseServer();

  const { data: client } = await supabase
    .from("clients")
    .select("id, slug, business_name, brand_color, background_color, logo_url")
    .eq("id", id)
    .maybeSingle();

  if (!client) return null;

  const [{ data: clientTrades }, { data: pricingRows }] = await Promise.all([
    supabase.from("client_trades").select("trade_key, tier_keys").eq("client_id", id),
    supabase.from("pricing").select("trade_key, tier_key, low, high").eq("client_id", id),
  ]);

  const tradeKeys = (clientTrades || []).map((r) => r.trade_key);
  const tierKeys = {};
  for (const row of clientTrades || []) tierKeys[row.trade_key] = row.tier_keys || [];

  const overrides = {};
  for (const row of pricingRows || []) {
    const key = row.tier_key ? `${row.trade_key}:${row.tier_key}` : row.trade_key;
    overrides[key] = { low: Number(row.low), high: Number(row.high) };
  }

  return { client, current: { tradeKeys, tierKeys, overrides } };
}

export default async function EditClientPage({ params }) {
  const { id } = await params;
  const data = await getClientData(id);
  if (!data) notFound();

  const { client, current } = data;
  const updateClientWithId = updateClient.bind(null, client.id);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">{client.business_name}</h1>
      <p className="text-sm text-[#a8a29e] mb-6">
        Public page:{" "}
        <a href={`/c/${client.slug}`} target="_blank" rel="noreferrer" className="text-[#c98a4b] hover:underline">
          /c/{client.slug}
        </a>
      </p>

      <form
        action={updateClientWithId}
        className="border border-[#3a3532] bg-[#26221f] rounded-lg p-5"
      >
        <ClientInfoFields client={client} />
        <h3 className="text-sm text-[#a8a29e] mb-3 mt-2">Trades &amp; pricing</h3>
        <ClientConfigFields current={current} />
        <button
          type="submit"
          className="mt-5 bg-[#c98a4b] text-[#1c1917] font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
