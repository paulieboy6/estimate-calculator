import { TRADE_KEYS, TRADES } from "@/lib/trades";

const inputClass =
  "w-24 bg-[#1c1917] border border-[#3a3532] rounded px-2 py-1 text-[#f5f0e8] outline-none focus:border-[#c98a4b]";

// Renders one collapsible-looking fieldset per trade: a checkbox to enable
// the trade for this client, an editable base $/unit rate (for trades whose
// tiers are a multiplier), and one row per tier with its own checkbox and,
// for trades like remediation whose tiers carry their own $ range, editable
// low/high inputs. Field names follow trade_<key> / tier_<key>_<tierKey> /
// rate_<key>_{low,high} / tierrate_<key>_<tierKey>_{low,high} — read by
// saveClientConfig in app/admin/actions.js.
export default function ClientConfigFields({ current = {} }) {
  const tradeKeys = current.tradeKeys || [];
  const tierKeysByTrade = current.tierKeys || {};
  const overrides = current.overrides || {};

  return (
    <div className="space-y-4">
      {TRADE_KEYS.map((tradeKey) => {
        const trade = TRADES[tradeKey];
        const tradeEnabled = tradeKeys.includes(tradeKey);
        const enabledTiers = tierKeysByTrade[tradeKey];
        const hasMultTiers = trade.tiers.some((t) => t.low === undefined);
        const tradeOverride = overrides[tradeKey];

        return (
          <fieldset key={tradeKey} className="border border-[#3a3532] rounded-lg p-4">
            <label className="flex items-center gap-2 font-medium mb-3">
              <input type="checkbox" name={`trade_${tradeKey}`} defaultChecked={tradeEnabled} />
              {trade.label}
            </label>

            {hasMultTiers && (
              <div className="flex items-center gap-2 mb-3 text-sm">
                <span className="w-40 text-[#a8a29e]">Base rate ({trade.unit})</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name={`rate_${tradeKey}_low`}
                  defaultValue={tradeOverride?.low ?? trade.low}
                  className={inputClass}
                />
                <span>–</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name={`rate_${tradeKey}_high`}
                  defaultValue={tradeOverride?.high ?? trade.high}
                  className={inputClass}
                />
              </div>
            )}

            <div className="space-y-2 pl-1">
              {trade.tiers.map((tier) => {
                const tierEnabled =
                  !enabledTiers || enabledTiers.length === 0 || enabledTiers.includes(tier.key);
                const tierOverride = overrides[`${tradeKey}:${tier.key}`];
                const hasOwnRate = tier.low !== undefined;

                return (
                  <div key={tier.key} className="flex items-center gap-2 text-sm">
                    <label className="flex items-center gap-2 w-64">
                      <input
                        type="checkbox"
                        name={`tier_${tradeKey}_${tier.key}`}
                        defaultChecked={tierEnabled}
                      />
                      {tier.label}
                    </label>
                    {hasOwnRate ? (
                      <>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name={`tierrate_${tradeKey}_${tier.key}_low`}
                          defaultValue={tierOverride?.low ?? tier.low}
                          className={inputClass}
                        />
                        <span>–</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name={`tierrate_${tradeKey}_${tier.key}_high`}
                          defaultValue={tierOverride?.high ?? tier.high}
                          className={inputClass}
                        />
                      </>
                    ) : (
                      <span className="text-[#6b6560] text-xs">×{tier.mult} of base rate</span>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
