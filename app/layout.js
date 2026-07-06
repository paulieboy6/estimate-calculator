import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Loaded globally so its CSS variable is available wherever a client picks
// the "modern sans-serif" font option (see lib/theme.js) — client pages
// pick which loaded font to use per-request, but next/font can only load
// fonts at build time, so every option has to be loaded up front here.
const modernSans = Inter({
  variable: "--font-modern-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Project Estimate Calculator",
  description: "Get a same-day ballpark range for your project.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${modernSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
