import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { addClient } from "@/app/admin/actions";
import ClientInfoFields from "@/components/admin/ClientInfoFields";
import ClientConfigFields from "@/components/admin/ClientConfigFields";

// Always render fresh from the DB — this page must never be statically
// cached at build time, since clients are added/edited constantly.
export const dynamic = "force-dynamic";

async function getClients() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("clients")
    .select("id, slug, business_name, brand_color, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load clients: ${error.message}`);
  return data || [];
}

export default async function AdminClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-xl font-semibold mb-4">Clients</h1>
        {clients.length === 0 && (
          <p className="text-sm text-[#a8a29e] mb-4">No clients yet — add the first one below.</p>
        )}
        <div className="space-y-2">
          {clients.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between border border-[#3a3532] bg-[#26221f] rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: c.brand_color }}
                />
                <div>
                  <p className="font-medium">{c.business_name}</p>
                  <a
                    href={`/c/${c.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#a8a29e] hover:text-[#c98a4b]"
                  >
                    /c/{c.slug}
                  </a>
                </div>
              </div>
              <Link
                href={`/admin/clients/${c.id}`}
                className="text-sm text-[#c98a4b] hover:underline"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Add a new client</h2>
        <form action={addClient} className="border border-[#3a3532] bg-[#26221f] rounded-lg p-5">
          <ClientInfoFields />
          <h3 className="text-sm text-[#a8a29e] mb-3 mt-2">Trades &amp; pricing</h3>
          <ClientConfigFields />
          <button
            type="submit"
            className="mt-5 bg-[#c98a4b] text-[#1c1917] font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity"
          >
            Create client
          </button>
        </form>
      </section>
    </div>
  );
}
