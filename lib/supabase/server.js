import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the secret key (sb_secret_...). This key
// has full database access and must never be sent to the browser — every
// file that imports this module has to stay on the server (Server
// Components, Server Actions, Route Handlers). The `server-only` import
// above makes Next.js throw a build error if a Client Component ever tries
// to import it.
export function supabaseServer() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY environment variables. " +
        "Add them to .env.local (see .env.local.example)."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
