"use client";

import React from "react";
import { FileText } from "lucide-react";

import {
  LegalCode,
  LegalDocument,
  LegalLink,
  type LegalSection,
} from "../../../src/components/ui/legal-document";

const SECTIONS: LegalSection[] = [
  {
    heading: "Non-Custodial Protocol Operations",
    body: (
      <p>
        StellarCade is a non-custodial gaming and arcade protocol operating on the Stellar network
        and Soroban smart contract environment. Users interact with the protocol directly via
        self-custodied wallet software (such as Freighter). At no point does StellarCade hold,
        store, or maintain custody over private keys, user funds, or digital assets.
      </p>
    ),
  },
  {
    heading: "Provable Cryptographic Fairness",
    body: (
      <p>
        All arcade game rounds and outcomes are settled deterministically using SHA-256
        commit-reveal entropy and on-chain Soroban contract logic. Users are provided full access to
        client-side cryptographic verification tools at <LegalLink href="/verify">/verify</LegalLink>{" "}
        and through the open-source <LegalCode>@stellarcade/sdk</LegalCode>.
      </p>
    ),
  },
  {
    heading: "Network Fees & Settlement",
    body: (
      <p>
        Every interaction (submitting bets, claiming prize pool payouts, or recovering trustline
        reserves) incurs standard Stellar network base transaction fees paid directly to validators.
        Payouts and prize pool splits are enforced strictly by contract code.
      </p>
    ),
  },
  {
    heading: "User Responsibilities & Disclaimer",
    body: (
      <p>
        Users are solely responsible for securing their wallet software and secret recovery phrases.
        StellarCade protocol smart contracts are deployed as open-source code without financial
        warranty.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      icon={<FileText />}
      title="Terms & Participation"
      meta="Last updated: August 2026 · Decentralized protocol on Stellar Network"
      sections={SECTIONS}
    />
  );
}
