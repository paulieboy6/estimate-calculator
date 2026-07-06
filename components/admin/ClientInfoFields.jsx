const inputClass =
  "w-full bg-[#1c1917] border border-[#3a3532] rounded-md px-3 py-2 text-[#f5f0e8] outline-none focus:border-[#c98a4b] placeholder-[#6b6560]";

export default function ClientInfoFields({ client = {} }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm text-[#a8a29e] mb-1.5">Business name</label>
        <input
          name="business_name"
          required
          defaultValue={client.business_name || ""}
          placeholder="Acme Remediation"
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm text-[#a8a29e] mb-1.5">URL slug</label>
        <input
          name="slug"
          required
          defaultValue={client.slug || ""}
          placeholder="acme-remediation"
          className={inputClass}
        />
        <p className="text-xs text-[#6b6560] mt-1">Page will be at /c/{"{slug}"}</p>
      </div>
      <div>
        <label className="block text-sm text-[#a8a29e] mb-1.5">Brand color</label>
        <input
          type="color"
          name="brand_color"
          defaultValue={client.brand_color || "#c98a4b"}
          className="h-10 w-20 bg-[#1c1917] border border-[#3a3532] rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm text-[#a8a29e] mb-1.5">Background color</label>
        <input
          type="color"
          name="background_color"
          defaultValue={client.background_color || "#1c1917"}
          className="h-10 w-20 bg-[#1c1917] border border-[#3a3532] rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm text-[#a8a29e] mb-1.5">Logo URL (optional)</label>
        <input
          name="logo_url"
          defaultValue={client.logo_url || ""}
          placeholder="https://example.com/logo.png"
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm text-[#a8a29e] mb-1.5">Phone number (optional)</label>
        <input
          name="phone_number"
          defaultValue={client.phone_number || ""}
          placeholder="(555) 123-4567"
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm text-[#a8a29e] mb-1.5">Service area (optional)</label>
        <input
          name="service_area"
          defaultValue={client.service_area || ""}
          placeholder="Springfield and surrounding areas"
          className={inputClass}
        />
        <p className="text-xs text-[#6b6560] mt-1">Shown in the footer as &ldquo;Serving {"{this}"}&rdquo;.</p>
      </div>
      <div className="flex items-center gap-2 pt-6">
        <input
          type="checkbox"
          id="licensed_insured"
          name="licensed_insured"
          defaultChecked={client.licensed_insured || false}
        />
        <label htmlFor="licensed_insured" className="text-sm text-[#a8a29e]">
          Show &ldquo;Licensed &amp; Insured&rdquo; badge
        </label>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm text-[#a8a29e] mb-1.5">Client leads portal password</label>
        <input
          type="password"
          name="portal_password"
          placeholder={
            client.portal_password_hash
              ? "Leave blank to keep current password"
              : "Set a password to let this client view their leads"
          }
          className={inputClass}
        />
        <p className="text-xs text-[#6b6560] mt-1">
          Give this password to your client — they sign in at /c/{client.slug || "{slug}"}/leads to see
          only their own leads.
        </p>
      </div>
    </div>
  );
}
