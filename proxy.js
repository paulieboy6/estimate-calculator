import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*"],
};

export default async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const valid = await isValidSessionToken(token);

  if (!valid) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}
