import { supabaseServer } from "@/lib/supabase/server";
import { formatUSD } from "@/lib/trades";
import LeadsFilter from "@/components/admin/LeadsFilter";

export const dynamic = "force-dynamic";

async function getClients() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("clients")
    .select("id, business_name, slug")
    .order("business_name");
  if (error) throw new Error(`Could not load clients: ${error.message}`);
  return data || [];
}

async function getLeads(clientId) {
  const supabase = supabaseServer();
  let query = supabase
    .from("leads")
    .select(
      "id, name, phone, email, trade, tier, size, estimate_low, estimate_high, created_at, client:clients(business_name, slug)"
    )
    .order("created_at", { ascending: false });

  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load leads: ${error.message}`);
  return data || [];
}

export default async function AdminLeadsPage({ searchParams }) {
  const params = await searchParams;
  const clientFilter = params?.client || "";

  const [clients, leads] = await Promise.all([getClients(), getLeads(clientFilter || null)]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Leads</h1>
        <LeadsFilter clients={clients} value={clientFilter} />
      </div>

      {leads.length === 0 && <p className="text-sm text-[#a8a29e]">No leads yet.</p>}

      <div className="space-y-2">
        {leads.map((lead) => (
          <div key={lead.id} className="border border-[#3a3532] bg-[#26221f] rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">{lead.name}</p>
              <p className="text-xs text-[#6b6560]">
                {new Date(lead.created_at).toLocaleString()}
              </p>
            </div>
            <p className="text-sm text-[#a8a29e]">
              {lead.trade} · {lead.tier} · {lead.size} units ·{" "}
              {formatUSD(lead.estimate_low)}–{formatUSD(lead.estimate_high)}
            </p>
            <p className="text-sm text-[#a8a29e]">
              {lead.phone}
              {lead.email ? ` · ${lead.email}` : ""}
              {lead.client ? ` · ${lead.client.business_name}` : " · generic demo page"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
