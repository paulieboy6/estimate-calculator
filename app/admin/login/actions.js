"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, createSessionToken, isCorrectPassword } from "@/lib/auth";

export async function login(formData) {
  const password = formData.get("password");

  if (!isCorrectPassword(password)) {
    redirect("/admin/login?error=1");
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/admin");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}
