"use client";

import React from "react";
import { Lock } from "lucide-react";

import {
  LegalCode,
  LegalDocument,
  LegalLink,
  type LegalSection,
} from "../../../src/components/ui/legal-document";

const SECTIONS: LegalSection[] = [
  {
    heading: "Zero Personal Data Collection",
    body: (
      <p>
        StellarCade does not require user registration, email addresses, names, or passwords.
        Interaction is established strictly through cryptographic signatures initiated by your
        connected wallet (Freighter).
      </p>
    ),
  },
  {
    heading: "Local Device Storage",
    body: (
      <p>
        Preferences such as table density, dismissed onboarding missions, and cached session
        metadata are stored locally on your device in standard browser{" "}
        <LegalCode>localStorage</LegalCode>. No cross-site advertising cookies or invasive tracking
        pixels are used.
      </p>
    ),
  },
  {
    heading: "On-Chain Ledger Transparency",
    body: (
      <p>
        Transactions, game stakes, contract calls, and prize claims submitted through the protocol
        are broadcast to the public Stellar blockchain. Public ledger entries (including transaction
        hashes and public Stellar addresses) are permanent and publicly auditable by design.
      </p>
    ),
  },
  {
    heading: "Audit & Verification Rights",
    body: (
      <p>
        Any player can independently audit and verify game entropy, seed commitments, and contract
        state using the open-source verifier tool at <LegalLink href="/verify">/verify</LegalLink>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      icon={<Lock />}
      title="Privacy & Data Architecture"
      meta="Zero tracking · Zero custody · Client-side key isolation"
      sections={SECTIONS}
    />
  );
}
