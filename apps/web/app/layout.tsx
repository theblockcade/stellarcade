import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

/**
 * Self-hosted via next/font — no runtime request to fonts.googleapis.com,
 * unlike frontend/index.html's <link> tags (Google Fonts CDN). next/font
 * downloads these at build time and serves them from our own origin.
 */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

/**
 * @stellarcade/tokens' --sc-font-mono has always named "JetBrains Mono"
 * first, but nothing ever loaded it — so every monospace surface (contract
 * addresses, the /verify page's hex digests, the hero's sha256 mockup, the
 * SDK install snippet) silently fell back to generic monospace, i.e.
 * Courier New on Windows. Loading it here makes that token honest; see
 * globals.css where --sc-font-mono is re-pointed at this variable.
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const title = "StellarCade | Elite Web3 Gaming";
const description =
  "A decentralized arcade on Stellar/Soroban — provably-fair games, prize pools, quests, and tournaments.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, siteName: "StellarCade", type: "website" },
  twitter: { card: "summary", title, description },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
