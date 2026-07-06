// WCAG relative-luminance contrast check, used to keep client-branded text
// readable against the calculator's fixed dark background regardless of how
// light or dark a contractor's brand color is.

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hexA, hexB) {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

// Returns `color` as-is if it contrasts enough against `background`,
// otherwise returns `fallback`. minContrast 4.5 matches WCAG AA for small text.
export function readableColor(color, { background = "#1c1917", fallback = "#f5f0e8", minContrast = 4.5 } = {}) {
  try {
    return contrastRatio(color, background) >= minContrast ? color : fallback;
  } catch {
    return fallback;
  }
}
