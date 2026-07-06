import { Hammer, Fence, Layers } from "lucide-react";

// ---- Trade/tier catalog ----
// All figures are rough national averages ($/unit) — the defaults here are used
// whenever a client hasn't set their own numbers in the `pricing` table.
// Contractor-specific overrides live in Supabase and are edited from /admin.
export const TRADES = {
  decking: {
    label: "Decking",
    icon: Layers,
    unit: "sq ft",
    low: 25,
    high: 45,
    fields: [{ key: "size", label: "Deck size", suffix: "sq ft", placeholder: "e.g. 300" }],
    tiers: [
      { key: "pressure", label: "Pressure-treated wood", mult: 1 },
      { key: "composite", label: "Composite", mult: 1.6 },
      { key: "hardwood", label: "Hardwood", mult: 2.1 },
    ],
  },
  fencing: {
    label: "Fencing",
    icon: Fence,
    unit: "linear ft",
    low: 18,
    high: 35,
    fields: [{ key: "size", label: "Fence length", suffix: "linear ft", placeholder: "e.g. 150" }],
    tiers: [
      { key: "chainlink", label: "Chain link", mult: 0.7 },
      { key: "wood", label: "Wood privacy", mult: 1 },
      { key: "vinyl", label: "Vinyl", mult: 1.4 },
      { key: "wroughtiron", label: "Wrought iron / aluminum", mult: 2.2 },
    ],
  },
  concrete: {
    label: "Concrete flatwork",
    icon: Hammer,
    unit: "sq ft",
    low: 8,
    high: 16,
    fields: [{ key: "size", label: "Slab area", suffix: "sq ft", placeholder: "e.g. 500" }],
    tiers: [
      { key: "basic", label: "Broom finish", mult: 1 },
      { key: "stamped", label: "Stamped / decorative", mult: 1.9 },
      { key: "colored", label: "Colored / integral", mult: 1.5 },
    ],
  },
  remediation: {
    label: "Water / Mold / Fire Remediation",
    icon: Hammer,
    unit: "sq ft affected",
    low: 3,
    high: 30,
    fields: [{ key: "size", label: "Affected area", suffix: "sq ft", placeholder: "e.g. 400" }],
    tiers: [
      { key: "water_clean", label: "Water damage — clean water", low: 3, high: 4 },
      { key: "water_contaminated", label: "Water damage — gray/black (contaminated)", low: 4, high: 7.5 },
      { key: "mold", label: "Mold remediation", low: 15, high: 30 },
      { key: "fire", label: "Fire / smoke damage cleanup", low: 4, high: 7 },
    ],
  },
};

export const TRADE_KEYS = Object.keys(TRADES);

// Applies a client's trade/tier visibility and price overrides to the base
// catalog above. Called client-side (inside EstimateCalculator) and
// server-side (inside admin pages) — both environments import TRADES
// themselves, so the returned trade objects (which include icon components)
// never need to cross a server/client boundary as props.
//
// overrides keys: `${tradeKey}` for a trade-level low/high (multiplier
// tiers), or `${tradeKey}:${tierKey}` for a specific tier's own low/high.
export function getEffectiveTrades({ tradeKeys, tierKeys, overrides } = {}) {
  // null/undefined ("not specified") means "show every trade" — used by the
  // generic "/" demo page. An explicit empty array means a client that's been
  // set up with zero enabled trades, and should show none, not fall back.
  const keys = tradeKeys == null ? TRADE_KEYS : tradeKeys;
  const tierKeyMap = tierKeys || {};
  const overrideMap = overrides || {};

  return keys
    .filter((key) => TRADES[key])
    .map((key) => {
      const trade = TRADES[key];
      const allowedTiers = tierKeyMap[key];
      const tradeOverride = overrideMap[key];
      const tiers = trade.tiers
        .filter((t) => !allowedTiers || allowedTiers.length === 0 || allowedTiers.includes(t.key))
        .map((t) => {
          const tierOverride = overrideMap[`${key}:${t.key}`];
          return tierOverride ? { ...t, low: tierOverride.low, high: tierOverride.high } : t;
        });
      return {
        ...trade,
        key,
        low: tradeOverride?.low ?? trade.low,
        high: tradeOverride?.high ?? trade.high,
        tiers,
      };
    })
    .filter((t) => t.tiers.length > 0);
}

export function formatUSD(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
