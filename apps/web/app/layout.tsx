import type { Metadata } from "next";
import { JetBrains_Mono, Outfit, Orbitron } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

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
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable} ${orbitron.variable}`}>
      <body>{children}</body>
    </html>
  );
}
