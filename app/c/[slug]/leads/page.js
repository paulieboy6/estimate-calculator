import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { formatUSD } from "@/lib/trades";
import { PORTAL_COOKIE_NAME, isValidPortalSession } from "@/lib/portalAuth";
import { portalLogin, portalLogout } from "./actions";

export const dynamic = "force-dynamic";

async function getClient(slug) {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("clients")
    .select("id, slug, business_name, brand_color, portal_password_hash")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

async function getLeads(clientId) {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, phone, email, trade, tier, size, estimate_low, estimate_high, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load leads: ${error.message}`);
  return data || [];
}

export default async function ClientPortalPage({ params, searchParams }) {
  const { slug } = await params;
  const search = await searchParams;
  const client = await getClient(slug);
  if (!client) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_COOKIE_NAME)?.value;
  const authed = isValidPortalSession(token, client.id, client.portal_password_hash);
  const loginWithSlug = portalLogin.bind(null, slug);

  if (!authed) {
    const hasError = search?.error === "1";
    const noPasswordSet = !client.portal_password_hash;

    return (
      <div className="min-h-dvh bg-[#1c1917] text-[#f5f0e8] font-sans flex items-center justify-center px-4">
        <form action={loginWithSlug} className="w-full max-w-sm border border-[#3a3532] bg-[#26221f] rounded-lg p-6">
          <h1 className="text-lg font-semibold mb-1">{client.business_name}</h1>
          <p className="text-sm text-[#a8a29e] mb-5">Enter your leads portal password to continue.</p>
          {noPasswordSet ? (
            <p className="text-xs text-red-400">
              No portal password has been set up for this account yet. Contact your provider.
            </p>
          ) : (
            <>
              <input
                type="password"
                name="password"
                required
                autoFocus
                placeholder="Password"
                className="w-full bg-transparent border border-[#3a3532] rounded-md px-4 py-2.5 mb-3 outline-none focus:border-[#c98a4b] placeholder-[#6b6560]"
              />
              {hasError && <p className="text-xs text-red-400 mb-3">Incorrect password.</p>}
              <button
                type="submit"
                className="w-full bg-[#c98a4b] text-[#1c1917] font-medium py-2.5 rounded-md hover:opacity-90 transition-opacity"
              >
                Sign in
              </button>
            </>
          )}
        </form>
      </div>
    );
  }

  const leads = await getLeads(client.id);
  const logoutWithSlug = portalLogout.bind(null, slug);

  return (
    <div className="min-h-dvh bg-[#1c1917] text-[#f5f0e8] font-sans px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">{client.business_name} — Leads</h1>
          <form action={logoutWithSlug}>
            <button type="submit" className="text-xs text-[#a8a29e] hover:text-[#c98a4b]">
              Sign out
            </button>
          </form>
        </div>

        {leads.length === 0 && <p className="text-sm text-[#a8a29e]">No leads yet.</p>}

        <div className="space-y-2">
          {leads.map((lead) => (
            <div key={lead.id} className="border border-[#3a3532] bg-[#26221f] rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{lead.name}</p>
                <p className="text-xs text-[#6b6560]">{new Date(lead.created_at).toLocaleString()}</p>
              </div>
              <p className="text-sm text-[#a8a29e]">
                {lead.trade} · {lead.tier} · {lead.size} units ·{" "}
                {formatUSD(lead.estimate_low)}–{formatUSD(lead.estimate_high)}
              </p>
              <p className="text-sm text-[#a8a29e]">
                {lead.phone}
                {lead.email ? ` · ${lead.email}` : ""}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
