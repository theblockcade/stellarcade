import type { Metadata } from "next";
import { Chakra_Petch, JetBrains_Mono, Orbitron, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-chakra-petch",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/* Scoped to the "StellarCade" wordmark only (app/landing/nav.tsx) — not a
   general heading font. See app/test for the font-selection rationale. */
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-orbitron",
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
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${chakraPetch.variable} ${jetbrainsMono.variable} ${orbitron.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
