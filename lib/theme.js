// Curated per-client theme + font presets. Kept as plain data (no next/font
// imports here) so this can be imported directly from the "use client"
// EstimateCalculator component — the actual font files are loaded once,
// globally, in app/layout.js; this file just picks which already-loaded
// font's CSS variable to reference.

export const THEMES = {
  dark: {
    bg: "#1c1917",
    card: "#26221f",
    border: "#3a3532",
    fg: "#f5f0e8",
    muted: "#a8a29e",
    faint: "#6b6560",
  },
  light: {
    bg: "#faf8f5",
    card: "#ffffff",
    border: "#e5e0d5",
    fg: "#211d19",
    muted: "#6b645c",
    faint: "#948c7e",
  },
};

export function getTheme(themeName) {
  return THEMES[themeName] || THEMES.dark;
}

export const FONT_OPTIONS = {
  system: {
    label: "System default",
    stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  serif: {
    label: "Serif",
    stack: 'Georgia, "Times New Roman", serif',
  },
  modern: {
    label: "Modern sans-serif",
    stack: "var(--font-modern-sans), Inter, Helvetica, Arial, sans-serif",
  },
};

export function getFontStack(fontName) {
  return FONT_OPTIONS[fontName]?.stack || FONT_OPTIONS.system.stack;
}
