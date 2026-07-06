"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Phone, Mail, User, CheckCircle2 } from "lucide-react";
import { getEffectiveTrades, formatUSD } from "@/lib/trades";
import { submitLead } from "@/app/actions";

// Ported from the original estimate-calculator.jsx. Trades/tiers shown and
// their $ numbers can be scoped per-client via `tradeKeys` / `tierKeys` /
// `overrides` (all plain, serializable data passed down from a Server
// Component — see app/page.js and app/c/[slug]/page.js).
export default function EstimateCalculator({
  clientId = null,
  tradeKeys = null,
  tierKeys = null,
  overrides = null,
  branding = null,
}) {
  const trades = useMemo(
    () => getEffectiveTrades({ tradeKeys, tierKeys, overrides }),
    [tradeKeys, tierKeys, overrides]
  );

  const [tradeKey, setTradeKey] = useState(null);
  const [size, setSize] = useState("");
  const [tierKey, setTierKey] = useState(null);
  const [step, setStep] = useState("trade"); // trade -> details -> lead -> done
  const [lead, setLead] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const trade = tradeKey ? trades.find((t) => t.key === tradeKey) : null;
  const tier = trade && tierKey ? trade.tiers.find((t) => t.key === tierKey) : null;

  const sizeNum = parseFloat(size);
  const validSize = !isNaN(sizeNum) && sizeNum > 0;

  let rangeLow = 0;
  let rangeHigh = 0;
  if (trade && tier && validSize) {
    const tierLow = tier.low !== undefined ? tier.low : trade.low * (tier.mult ?? 1);
    const tierHigh = tier.high !== undefined ? tier.high : trade.high * (tier.mult ?? 1);
    rangeLow = Math.round((tierLow * sizeNum) / 50) * 50;
    rangeHigh = Math.round((tierHigh * sizeNum) / 50) * 50;
  }

  const accent = branding?.brandColor || "#c98a4b";
  const businessName = branding?.businessName;
  const logoUrl = branding?.logoUrl;

  function selectTrade(key) {
    setTradeKey(key);
    setTierKey(null);
    setSize("");
    setStep("details");
  }

  function goToLead() {
    setStep("lead");
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitLead({
        clientId,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        trade: trade.label,
        tier: tier.label,
        size: sizeNum,
        estimateLow: rangeLow,
        estimateHigh: rangeHigh,
      });
      setStep("done");
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setTradeKey(null);
    setTierKey(null);
    setSize("");
    setLead({ name: "", phone: "", email: "" });
    setSubmitError(null);
    setStep("trade");
  }

  return (
    <div
      className="min-h-screen bg-[#1c1917] text-[#f5f0e8] font-sans flex flex-col items-center px-4 py-10"
      style={{ "--accent": accent }}
    >
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-8 border-b border-[#3a3532] pb-6">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={businessName || "Logo"}
              className="h-8 mb-4 object-contain object-left"
            />
          )}
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent)] mb-2">
            {businessName || "Ballpark, not a bid"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
            Get a same-day project range
          </h1>
          <p className="text-sm text-[#a8a29e] mt-2 leading-relaxed">
            Answer three questions and see what jobs like yours typically run.
            A local contractor follows up with a firm quote.
          </p>
        </div>

        {/* Step: trade select */}
        {step === "trade" && (
          <div className="grid grid-cols-1 gap-3">
            {trades.length === 0 && (
              <p className="text-sm text-[#a8a29e]">
                No project types are configured yet for this page.
              </p>
            )}
            {trades.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => selectTrade(t.key)}
                  className="group flex items-center justify-between border border-[#3a3532] hover:border-[var(--accent)] bg-[#26221f] rounded-lg px-5 py-4 transition-colors text-left"
                >
                  <span className="flex items-center gap-4">
                    <Icon className="w-5 h-5 text-[var(--accent)]" strokeWidth={1.5} />
                    <span>
                      <span className="block font-medium">{t.label}</span>
                      <span className="block text-xs text-[#a8a29e]">
                        {formatUSD(t.low)}–{formatUSD(t.high)} per {t.unit}
                      </span>
                    </span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#6b6560] group-hover:text-[var(--accent)] transition-colors" />
                </button>
              );
            })}
          </div>
        )}

        {/* Step: details */}
        {step === "details" && trade && (
          <div>
            <button onClick={() => setStep("trade")} className="text-xs text-[#a8a29e] hover:text-[var(--accent)] mb-5">
              ← Choose a different project type
            </button>
            <h2 className="text-lg font-semibold mb-4">{trade.label}</h2>

            {trade.fields.map((f) => (
              <div key={f.key} className="mb-5">
                <label className="block text-sm text-[#a8a29e] mb-1.5">{f.label}</label>
                <div className="flex items-center border border-[#3a3532] bg-[#26221f] rounded-md overflow-hidden focus-within:border-[var(--accent)]">
                  <input
                    type="number"
                    min="0"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder={f.placeholder}
                    className="flex-1 bg-transparent px-4 py-2.5 outline-none text-[#f5f0e8] placeholder-[#6b6560]"
                  />
                  <span className="px-4 text-sm text-[#6b6560] border-l border-[#3a3532]">{f.suffix}</span>
                </div>
              </div>
            ))}

            <div className="mb-6">
              <label className="block text-sm text-[#a8a29e] mb-2">Material / finish</label>
              <div className="grid grid-cols-1 gap-2">
                {trade.tiers.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTierKey(t.key)}
                    className={`text-left px-4 py-2.5 rounded-md border transition-colors ${
                      tierKey === t.key
                        ? "border-[var(--accent)] bg-[var(--accent)]/10"
                        : "border-[#3a3532] bg-[#26221f] hover:border-[#6b6560]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {validSize && tier && (
              <div className="border border-[#3a3532] rounded-lg p-5 mb-6 bg-[#26221f]">
                <p className="text-xs uppercase tracking-wide text-[#a8a29e] mb-1">Estimated range</p>
                <p className="text-2xl font-bold" style={{ fontFamily: "Georgia, serif" }}>
                  {formatUSD(rangeLow)} – {formatUSD(rangeHigh)}
                </p>
                <p className="text-xs text-[#6b6560] mt-2">
                  Based on typical {trade.label.toLowerCase()} costs. Final price depends on site
                  conditions, permits, and access.
                </p>
              </div>
            )}

            <button
              disabled={!validSize || !tier}
              onClick={goToLead}
              className="w-full bg-[var(--accent)] disabled:bg-[#3a3532] disabled:text-[#6b6560] text-[#1c1917] font-medium py-3 rounded-md transition-opacity hover:opacity-90 disabled:hover:opacity-100"
            >
              Get this range sent to me
            </button>
          </div>
        )}

        {/* Step: lead capture */}
        {step === "lead" && (
          <div>
            <button onClick={() => setStep("details")} className="text-xs text-[#a8a29e] hover:text-[var(--accent)] mb-5">
              ← Back
            </button>
            <h2 className="text-lg font-semibold mb-1">Where should we send it?</h2>
            <p className="text-sm text-[#a8a29e] mb-5">
              A local contractor will follow up to confirm details and firm up pricing.
            </p>
            <form onSubmit={submit} className="space-y-3">
              <div className="flex items-center border border-[#3a3532] bg-[#26221f] rounded-md px-4 py-2.5 focus-within:border-[var(--accent)]">
                <User className="w-4 h-4 text-[#6b6560] mr-3" />
                <input
                  required
                  value={lead.name}
                  onChange={(e) => setLead({ ...lead, name: e.target.value })}
                  placeholder="Full name"
                  className="flex-1 bg-transparent outline-none placeholder-[#6b6560]"
                />
              </div>
              <div className="flex items-center border border-[#3a3532] bg-[#26221f] rounded-md px-4 py-2.5 focus-within:border-[var(--accent)]">
                <Phone className="w-4 h-4 text-[#6b6560] mr-3" />
                <input
                  required
                  type="tel"
                  value={lead.phone}
                  onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                  placeholder="Phone number"
                  className="flex-1 bg-transparent outline-none placeholder-[#6b6560]"
                />
              </div>
              <div className="flex items-center border border-[#3a3532] bg-[#26221f] rounded-md px-4 py-2.5 focus-within:border-[var(--accent)]">
                <Mail className="w-4 h-4 text-[#6b6560] mr-3" />
                <input
                  type="email"
                  value={lead.email}
                  onChange={(e) => setLead({ ...lead, email: e.target.value })}
                  placeholder="Email (optional)"
                  className="flex-1 bg-transparent outline-none placeholder-[#6b6560]"
                />
              </div>
              {submitError && <p className="text-xs text-red-400">{submitError}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[var(--accent)] disabled:opacity-60 text-[#1c1917] font-medium py-3 rounded-md hover:opacity-90 transition-opacity"
              >
                {submitting ? "Sending…" : "Send me the estimate"}
              </button>
            </form>
          </div>
        )}

        {/* Step: done */}
        {step === "done" && trade && tier && (
          <div className="text-center py-10">
            <CheckCircle2 className="w-10 h-10 text-[var(--accent)] mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="text-xl font-semibold mb-2">Sent, {lead.name.split(" ")[0] || "there"}.</h2>
            <p className="text-sm text-[#a8a29e] mb-6 leading-relaxed">
              Your {trade.label.toLowerCase()} range of{" "}
              <span className="text-[#f5f0e8] font-medium">
                {formatUSD(rangeLow)} – {formatUSD(rangeHigh)}
              </span>{" "}
              is on its way. A contractor will reach out at {lead.phone} to confirm details.
            </p>
            <button onClick={reset} className="text-sm text-[var(--accent)] hover:underline">
              Start another estimate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
