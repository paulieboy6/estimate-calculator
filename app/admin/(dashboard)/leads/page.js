import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { formatUSD } from "@/lib/trades";
import { setLeadContacted } from "@/app/admin/actions";
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

async function getLeads(clientId, contacted) {
  const supabase = supabaseServer();
  let query = supabase
    .from("leads")
    .select(
      "id, name, phone, email, trade, tier, size, estimate_low, estimate_high, created_at, contacted, client:clients(business_name, slug)"
    )
    .eq("contacted", contacted)
    .order("created_at", { ascending: false });

  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load leads: ${error.message}`);
  return data || [];
}

async function getCounts(clientId) {
  const supabase = supabaseServer();
  let newQuery = supabase.from("leads").select("*", { count: "exact", head: true }).eq("contacted", false);
  let contactedQuery = supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("contacted", true);

  if (clientId) {
    newQuery = newQuery.eq("client_id", clientId);
    contactedQuery = contactedQuery.eq("client_id", clientId);
  }

  const [{ count: newCount, error: newError }, { count: contactedCount, error: contactedError }] =
    await Promise.all([newQuery, contactedQuery]);
  if (newError) throw new Error(`Could not load lead counts: ${newError.message}`);
  if (contactedError) throw new Error(`Could not load lead counts: ${contactedError.message}`);

  return { newCount: newCount || 0, contactedCount: contactedCount || 0 };
}

export default async function AdminLeadsPage({ searchParams }) {
  const params = await searchParams;
  const clientFilter = params?.client || "";
  const status = params?.status === "contacted" ? "contacted" : "new";

  const [clients, leads, counts] = await Promise.all([
    getClients(),
    getLeads(clientFilter || null, status === "contacted"),
    getCounts(clientFilter || null),
  ]);

  const tabHref = (tabStatus) => {
    const p = new URLSearchParams();
    if (clientFilter) p.set("client", clientFilter);
    if (tabStatus !== "new") p.set("status", tabStatus);
    const query = p.toString();
    return query ? `/admin/leads?${query}` : "/admin/leads";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Leads</h1>
        <LeadsFilter clients={clients} value={clientFilter} />
      </div>

      <div className="flex gap-2 mb-6 border-b border-[#3a3532]">
        {[
          { key: "new", label: "New", count: counts.newCount },
          { key: "contacted", label: "Contacted", count: counts.contactedCount },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={tabHref(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              status === tab.key
                ? "border-[#c98a4b] text-[#f5f0e8]"
                : "border-transparent text-[#a8a29e] hover:text-[#f5f0e8]"
            }`}
          >
            {tab.label} ({tab.count})
          </Link>
        ))}
      </div>

      {leads.length === 0 && (
        <p className="text-sm text-[#a8a29e]">
          {status === "new" ? "No new leads." : "No contacted leads yet."}
        </p>
      )}

      <div className="space-y-2">
        {leads.map((lead) => {
          const toggleAction = setLeadContacted.bind(null, lead.id, status !== "contacted");
          return (
            <div key={lead.id} className="border border-[#3a3532] bg-[#26221f] rounded-lg px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{lead.name}</p>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-xs text-[#6b6560]">{new Date(lead.created_at).toLocaleString()}</p>
                  <form action={toggleAction}>
                    <button
                      type="submit"
                      className={`text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                        status === "contacted"
                          ? "border-[#3a3532] text-[#a8a29e] hover:border-[#6b6560] hover:text-[#f5f0e8]"
                          : "border-[#c98a4b] text-[#c98a4b] hover:bg-[#c98a4b]/10"
                      }`}
                    >
                      {status === "contacted" ? "Mark as new" : "Mark as contacted"}
                    </button>
                  </form>
                </div>
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
          );
        })}
      </div>
    </div>
  );
}
