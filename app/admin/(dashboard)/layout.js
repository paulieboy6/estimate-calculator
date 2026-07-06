import Link from "next/link";
import { logout } from "@/app/admin/login/actions";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#1c1917] text-[#f5f0e8] font-sans">
      <div className="border-b border-[#3a3532] px-6 py-4 flex items-center justify-between">
        <nav className="flex items-center gap-5 text-sm">
          <span className="font-semibold mr-2">Admin</span>
          <Link href="/admin" className="text-[#a8a29e] hover:text-[#c98a4b]">
            Clients
          </Link>
          <Link href="/admin/leads" className="text-[#a8a29e] hover:text-[#c98a4b]">
            Leads
          </Link>
        </nav>
        <form action={logout}>
          <button type="submit" className="text-xs text-[#a8a29e] hover:text-[#c98a4b]">
            Sign out
          </button>
        </form>
      </div>
      <div className="px-6 py-8 max-w-4xl mx-auto">{children}</div>
    </div>
  );
}
