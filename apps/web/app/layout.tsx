import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

/**
 * Self-hosted via next/font — no runtime request to fonts.googleapis.com,
 * unlike frontend/index.html's <link> tags (Google Fonts CDN). next/font
 * downloads Outfit at build time and serves it from our own origin.
 */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-outfit",
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
    <html lang="en" className={outfit.variable}>
      <body>{children}</body>
    </html>
  );
}
