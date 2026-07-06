"use client";

import { useRouter } from "next/navigation";

export default function LeadsFilter({ clients, value }) {
  const router = useRouter();

  return (
    <select
      defaultValue={value}
      onChange={(e) => {
        const clientId = e.target.value;
        router.push(clientId ? `/admin/leads?client=${clientId}` : "/admin/leads");
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
