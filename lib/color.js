// WCAG relative-luminance contrast check, used to keep client-branded text
// readable against a client's page background regardless of how light or
// dark their brand color and background color are.

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

// Returns `color` as-is if it contrasts enough against `background`.
// Otherwise falls back to whichever of a light or dark neutral contrasts
// better against that background — since background is admin-configurable,
// a single hardcoded fallback (e.g. always-light) would itself become
// unreadable on a light background.
export function readableColor(color, { background = "#1c1917", minContrast = 4.5 } = {}) {
  const light = "#f5f0e8";
  const dark = "#1c1917";
  try {
    if (contrastRatio(color, background) >= minContrast) return color;
  } catch {
    // fall through — `color` wasn't a parseable hex, pick a safe fallback below
  }
  try {
    return contrastRatio(light, background) >= contrastRatio(dark, background) ? light : dark;
  } catch {
    return light;
  }
}
