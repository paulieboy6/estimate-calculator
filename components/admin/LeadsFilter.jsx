"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function LeadsFilter({ clients, value }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      defaultValue={value}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) {
          params.set("client", e.target.value);
        } else {
          params.delete("client");
        }
        const query = params.toString();
        router.push(query ? `/admin/leads?${query}` : "/admin/leads");
      }}
      className="bg-[#26221f] border border-[#3a3532] rounded-md px-3 py-2 text-sm"
    >
      <option value="">All clients</option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.business_name}
        </option>
      ))}
    </select>
  );
}
