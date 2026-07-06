"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { PORTAL_COOKIE_NAME, createPortalSessionToken, verifyPortalPassword } from "@/lib/portalAuth";

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
