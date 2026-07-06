import EstimateCalculator from "@/components/EstimateCalculator";

// Generic demo page — shows all four trades with default pricing. Each real
// contractor client gets their own scoped page at /c/[slug] instead.
export default function Home() {
  return <EstimateCalculator />;
}
