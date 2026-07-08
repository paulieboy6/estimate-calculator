"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import {
  PORTAL_COOKIE_NAME,
  createPortalSessionToken,
  verifyPortalPassword,
  isValidPortalSession,
} from "@/lib/portalAuth";

export async function portalLogin(slug, formData) {
  const password = formData.get("password")?.toString() || "";
  const supabase = supabaseServer();
  const { data: client } = await supabase
    .from("clients")
    .select("id, portal_password_hash")
    .eq("slug", slug)
    .maybeSingle();

  if (!client || !verifyPortalPassword(password, client.portal_password_hash)) {
    redirect(`/c/${slug}/leads?error=1`);
  }

  const token = createPortalSessionToken(client.id, client.portal_password_hash);
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(`/c/${slug}/leads`);
}

export async function portalLogout(slug) {
  const cookieStore = await cookies();
  cookieStore.delete(PORTAL_COOKIE_NAME);
  redirect(`/c/${slug}/leads`);
}

export async function setPortalLeadContacted(slug, clientId, leadId, contacted) {
  const supabase = supabaseServer();

  // Server Actions are directly invocable POST endpoints once their id is in
  // the client bundle, so re-check the session here rather than trusting
  // that the page only rendered this button for an authenticated owner.
  const { data: client } = await supabase
    .from("clients")
    .select("id, portal_password_hash")
    .eq("id", clientId)
    .maybeSingle();
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_COOKIE_NAME)?.value;
  if (!client || !isValidPortalSession(token, client.id, client.portal_password_hash)) {
    redirect(`/c/${slug}/leads`);
  }

  // Scoping the update to this client_id too means even a forged leadId for
  // another client's lead silently no-ops instead of touching someone else's data.
  const { error } = await supabase
    .from("leads")
    .update({ contacted })
    .eq("id", leadId)
    .eq("client_id", clientId);
  if (error) throw new Error(`Could not update lead: ${error.message}`);

  revalidatePath(`/c/${slug}/leads`);
}
