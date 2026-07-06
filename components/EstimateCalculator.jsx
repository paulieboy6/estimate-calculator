"use client";

import { useLayoutEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ChevronRight, Phone, Mail, User, CheckCircle2, ShieldCheck } from "lucide-react";
import { getEffectiveTrades, formatUSD } from "@/lib/trades";
import { readableColor, contrastingNeutral } from "@/lib/color";
import { getTheme, getFontStack } from "@/lib/theme";
import { submitLead } from "@/app/actions";

// window.top can't change during a session, so no real subscription is
// needed — this only exists to satisfy useSyncExternalStore's signature.
function subscribeToNothing() {
  return () => {};
}

function isInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true; // cross-origin access throws => definitely embedded
  }
}

function isInIframeServerSnapshot() {
  return false;
}

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
  const isEmbedded = useSyncExternalStore(
    subscribeToNothing,
    isInIframe,
    isInIframeServerSnapshot
  );

  const trade = tradeKey ? trades.find((t) => t.key === tradeKey) : null;
  const tier = trade && tierKey ? trade.tiers.find((t) => t.key === tierKey) : null;

  const sizeNum = parseFloat(size);
  const validSize = !isNaN(sizeNum) && sizeNum > 0;
  const canGoToLead = validSize && !!tier;

  let rangeLow = 0;
  let rangeHigh = 0;
  if (trade && tier && validSize) {
    const tierLow = tier.low !== undefined ? tier.low : trade.low * (tier.mult ?? 1);
    const tierHigh = tier.high !== undefined ? tier.high : trade.high * (tier.mult ?? 1);
    rangeLow = Math.round((tierLow * sizeNum) / 50) * 50;
    rangeHigh = Math.round((tierHigh * sizeNum) / 50) * 50;
  }

  const accent = branding?.brandColor || "#c98a4b";
  const theme = getTheme(branding?.theme);
  const fontStack = getFontStack(branding?.font);
  const businessName = branding?.businessName;
  const logoUrl = branding?.logoUrl;
  const phoneNumber = branding?.phoneNumber;
  const serviceArea = branding?.serviceArea;
  const licensedInsured = branding?.licensedInsured;
  // Every "a local contractor will follow up" style sentence below uses
  // this — the client's own business name wherever we have one, falling
  // back to generic wording only on the branding-less "/" demo page.
  const providerLabel = businessName || "A local contractor";
  const whatToExpect = [
    { n: "1", label: "Pick your project" },
    { n: "2", label: "See your range instantly" },
    { n: "3", label: `${businessName || "A local pro"} confirms details` },
  ];

  // Two separate contrast checks, since the same accent color sits on two
  // different surfaces: directly on the page background (eyebrow label,
  // step numbers, "start over" link) or as the fill behind a CTA button
  // (whose own text needs to read against the accent itself). Text inside
  // cards just uses the theme's own fg color — cards are always the same
  // "lightness family" as the page background within a theme, so one
  // color works everywhere.
  const accentOnBg = readableColor(accent, { background: theme.bg });
  const onAccent = contrastingNeutral(accent);

  // The wrapper only guarantees the visible viewport height (and mobile
  // browsers' collapsing address bars, plus elastic overscroll bounce, can
  // briefly reveal whatever's behind it). Sync <body> itself to the same
  // color so there's never a gap showing the default page background.
  useLayoutEffect(() => {
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = theme.bg;
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, [theme.bg]);

  // isEmbedded (above) drops the full-viewport height and generous
  // standalone-page padding when in an iframe on a client's own site, so the
  // widget blends into the host page instead of looking like its own
  // boxed-in section.

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
      className={`bg-[var(--bg)] text-[var(--fg)] flex flex-col items-center ${
        isEmbedded ? "px-3 py-4" : "min-h-dvh px-4 py-10"
      }`}
      style={{
        "--accent": accent,
        "--bg": theme.bg,
        "--card": theme.card,
        "--card-border": theme.border,
        "--fg": theme.fg,
        "--fg-muted": theme.muted,
        "--fg-faint": theme.faint,
        fontFamily: fontStack,
      }}
    >
      <div className="w-full max-w-2xl flex flex-col flex-1">
        {/* Identity bar */}
        {(logoUrl || businessName || phoneNumber) && (
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={businessName || "Logo"}
                  className="h-10 w-10 rounded-md object-contain bg-[var(--card)] border border-[var(--card-border)] p-1 shrink-0"
                />
              )}
              {businessName && (
                <span className="font-semibold truncate text-[var(--fg)]">{businessName}</span>
              )}
            </div>
            {phoneNumber && (
              <a
                href={`tel:${phoneNumber.replace(/[^\d+]/g, "")}`}
                className="flex items-center gap-1.5 text-sm font-medium border border-[var(--card-border)] rounded-full pl-2.5 pr-3.5 py-1.5 whitespace-nowrap hover:border-[var(--accent)] transition-colors text-[var(--fg)] shrink-0"
              >
                <Phone className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={2} />
                {phoneNumber}
              </a>
            )}
          </div>
        )}

        {/* Header */}
        <div className="mb-8 border-b border-[var(--card-border)] pb-6">
          <p className="text-xs tracking-[0.2em] uppercase mb-2" style={{ color: accentOnBg }}>
            Ballpark, not a bid
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--fg)]">
            Get a same-day project range
          </h1>
          <p className="text-sm text-[var(--fg-muted)] mt-2 leading-relaxed">
            Answer three questions and see what jobs like yours typically run.{" "}
            {providerLabel} follows up with a firm quote.
          </p>
        </div>

        {/* Step: trade select */}
        {step === "trade" && (
          <div>
            <div className="grid grid-cols-1 gap-3">
              {trades.length === 0 && (
                <p className="text-sm text-[var(--fg-muted)]">
                  No project types are configured yet for this page.
                </p>
              )}
              {trades.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => selectTrade(t.key)}
                    className="group flex items-center justify-between border border-[var(--card-border)] hover:border-[var(--accent)] bg-[var(--card)] rounded-lg px-5 py-4 transition-colors text-left"
                  >
                    <span className="flex items-center gap-4">
                      <Icon className="w-5 h-5 text-[var(--accent)]" strokeWidth={1.5} />
                      <span>
                        <span className="block font-medium text-[var(--fg)]">{t.label}</span>
                        <span className="block text-xs text-[var(--fg-muted)]">
                          {formatUSD(t.low)}–{formatUSD(t.high)} per {t.unit}
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-[var(--fg-faint)] group-hover:text-[var(--accent)] transition-colors" />
                  </button>
                );
              })}
            </div>

            {trades.length > 0 && (
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-4">
                {whatToExpect.map((s) => (
                  <div key={s.n} className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2.5">
                    <span
                      className="flex items-center justify-center w-7 h-7 rounded-full border border-[var(--card-border)] text-xs font-medium shrink-0"
                      style={{ color: accentOnBg }}
                    >
                      {s.n}
                    </span>
                    <span className="text-sm text-[var(--fg-muted)]">{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: details */}
        {step === "details" && trade && (
          <div>
            <button
              onClick={() => setStep("trade")}
              className="text-xs text-[var(--fg-muted)] hover:text-[var(--accent)] mb-5"
            >
              ← Choose a different project type
            </button>
            <h2 className="text-lg font-semibold mb-4 text-[var(--fg)]">{trade.label}</h2>

            {trade.fields.map((f) => (
              <div key={f.key} className="mb-5">
                <label className="block text-sm text-[var(--fg-muted)] mb-1.5">{f.label}</label>
                <div className="flex items-center border border-[var(--card-border)] bg-[var(--card)] rounded-md overflow-hidden focus-within:border-[var(--accent)]">
                  <input
                    type="number"
                    min="0"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder={f.placeholder}
                    className="flex-1 bg-transparent px-4 py-2.5 outline-none text-[var(--fg)] placeholder-[var(--fg-faint)]"
                  />
                  <span className="px-4 text-sm text-[var(--fg-faint)] border-l border-[var(--card-border)]">
                    {f.suffix}
                  </span>
                </div>
              </div>
            ))}

            <div className="mb-6">
              <label className="block text-sm text-[var(--fg-muted)] mb-2">Material / finish</label>
              <div className="grid grid-cols-1 gap-2">
                {trade.tiers.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTierKey(t.key)}
                    style={
                      tierKey === t.key
                        ? { backgroundColor: `color-mix(in oklab, ${accent} 12%, ${theme.card})` }
                        : undefined
                    }
                    className={`text-left px-4 py-2.5 rounded-md border transition-colors text-[var(--fg)] ${
                      tierKey === t.key
                        ? "border-[var(--accent)]"
                        : "border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--fg-faint)]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {validSize && tier && (
              <div className="border border-[var(--card-border)] rounded-lg p-5 mb-6 bg-[var(--card)]">
                <p className="text-xs uppercase tracking-wide text-[var(--fg-muted)] mb-1">
                  Estimated range
                </p>
                <p className="text-2xl font-bold text-[var(--fg)]">
                  {formatUSD(rangeLow)} – {formatUSD(rangeHigh)}
                </p>
                <p className="text-xs text-[var(--fg-faint)] mt-2">
                  Based on typical {trade.label.toLowerCase()} costs. Final price depends on site
                  conditions, permits, and access.
                </p>
              </div>
            )}

            <button
              disabled={!canGoToLead}
              onClick={goToLead}
              style={canGoToLead ? { color: onAccent } : undefined}
              className="w-full bg-[var(--accent)] disabled:bg-[var(--card-border)] disabled:text-[var(--fg-faint)] font-medium py-3 rounded-md transition-opacity hover:opacity-90 disabled:hover:opacity-100"
            >
              Get this range sent to me
            </button>
          </div>
        )}

        {/* Step: lead capture */}
        {step === "lead" && (
          <div>
            <button
              onClick={() => setStep("details")}
              className="text-xs text-[var(--fg-muted)] hover:text-[var(--accent)] mb-5"
            >
              ← Back
            </button>
            <h2 className="text-lg font-semibold mb-1 text-[var(--fg)]">Where should we send it?</h2>
            <p className="text-sm text-[var(--fg-muted)] mb-5">
              {providerLabel} will follow up to confirm details and firm up pricing.
            </p>
            <form onSubmit={submit} className="space-y-3">
              <div className="flex items-center border border-[var(--card-border)] bg-[var(--card)] rounded-md px-4 py-2.5 focus-within:border-[var(--accent)]">
                <User className="w-4 h-4 text-[var(--fg-faint)] mr-3" />
                <input
                  required
                  value={lead.name}
                  onChange={(e) => setLead({ ...lead, name: e.target.value })}
                  placeholder="Full name"
                  className="flex-1 bg-transparent outline-none placeholder-[var(--fg-faint)] text-[var(--fg)]"
                />
              </div>
              <div className="flex items-center border border-[var(--card-border)] bg-[var(--card)] rounded-md px-4 py-2.5 focus-within:border-[var(--accent)]">
                <Phone className="w-4 h-4 text-[var(--fg-faint)] mr-3" />
                <input
                  required
                  type="tel"
                  value={lead.phone}
                  onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                  placeholder="Phone number"
                  className="flex-1 bg-transparent outline-none placeholder-[var(--fg-faint)] text-[var(--fg)]"
                />
              </div>
              <div className="flex items-center border border-[var(--card-border)] bg-[var(--card)] rounded-md px-4 py-2.5 focus-within:border-[var(--accent)]">
                <Mail className="w-4 h-4 text-[var(--fg-faint)] mr-3" />
                <input
                  type="email"
                  value={lead.email}
                  onChange={(e) => setLead({ ...lead, email: e.target.value })}
                  placeholder="Email (optional)"
                  className="flex-1 bg-transparent outline-none placeholder-[var(--fg-faint)] text-[var(--fg)]"
                />
              </div>
              {submitError && <p className="text-xs text-red-400">{submitError}</p>}
              <button
                type="submit"
                disabled={submitting}
                style={{ color: onAccent }}
                className="w-full bg-[var(--accent)] disabled:opacity-60 font-medium py-3 rounded-md hover:opacity-90 transition-opacity"
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
            <h2 className="text-xl font-semibold mb-2 text-[var(--fg)]">
              Sent, {lead.name.split(" ")[0] || "there"}.
            </h2>
            <p className="text-sm text-[var(--fg-muted)] mb-6 leading-relaxed">
              Your {trade.label.toLowerCase()} range of{" "}
              <span className="text-[var(--fg)] font-medium">
                {formatUSD(rangeLow)} – {formatUSD(rangeHigh)}
              </span>{" "}
              is on its way. {providerLabel} will reach out at {lead.phone} to confirm details.
            </p>
            <button onClick={reset} className="text-sm hover:underline" style={{ color: accentOnBg }}>
              Start another estimate
            </button>
          </div>
        )}

        {/* Footer */}
        {(serviceArea || licensedInsured) && (
          <div className="mt-10 pt-6 border-t border-[var(--card-border)] text-center">
            {serviceArea && <p className="text-xs text-[var(--fg-faint)]">Serving {serviceArea}</p>}
            {licensedInsured && (
              <p className="text-xs text-[var(--fg-faint)] mt-1.5 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Licensed &amp; Insured
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
