export interface CleanableSubentry {
  id: string;
  type: "trustline" | "signer" | "data_entry" | "claimable_balance";
  assetCode?: string;
  assetIssuer?: string;
  balance?: string;
  description: string;
  lockedReserveXlm: number; // 0.5 XLM standard Stellar base reserve per subentry
  canReclaim: boolean;
  blockReason?: string;
}

export interface HygieneScanResult {
  accountPublicKey: string;
  totalSubentries: number;
  totalLockedReserveXlm: number;
  reclaimableSubentries: CleanableSubentry[];
  reclaimableReserveXlm: number;
  scannedAt: string;
}

export const SAMPLE_HYGIENE_ACCOUNTS: Record<string, CleanableSubentry[]> = {
  "GBBD47IF6LWK7P7MDEVSCADEPLAYERHYGIENE777SAMPLEPUBLICKEY": [
    {
      id: "tl-stale-arcade-token",
      type: "trustline",
      assetCode: "CADE-OLD",
      assetIssuer: "GDQNY3PBOJOKYZSRMK2S7LHHGWZIUISD4QBUGHRKEHD7VHISSGE2T456",
      balance: "0.0000000",
      description: "Stale Arcade Season 1 Reward Trustline (Zero Balance)",
      lockedReserveXlm: 0.5,
      canReclaim: true,
    },
    {
      id: "tl-event-badge-drop",
      type: "trustline",
      assetCode: "HACK2024",
      assetIssuer: "GBBD47IF6LWK7P7MDYTDTTCC45SDHBHZ6PO2J2456YI777SAMPLEKEY",
      balance: "0.0000000",
      description: "Expired Hackathon Reward Trustline (Zero Balance)",
      lockedReserveXlm: 0.5,
      canReclaim: true,
    },
    {
      id: "signer-expired-session",
      type: "signer",
      description: "Expired Ephemeral Session Key (Session ended >30d ago)",
      lockedReserveXlm: 0.5,
      canReclaim: true,
    },
    {
      id: "tl-active-cade",
      type: "trustline",
      assetCode: "CADE",
      assetIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K77777",
      balance: "1250.5000000",
      description: "Active StellarCade Native Token (Non-zero Balance)",
      lockedReserveXlm: 0.5,
      canReclaim: false,
      blockReason: "Cannot remove trustline while holding a non-zero balance (1,250.50 CADE).",
    },
  ],
};

export function scanAccountHygiene(accountPublicKey: string): HygieneScanResult {
  const trimmed = accountPublicKey.trim();
  const subentries = SAMPLE_HYGIENE_ACCOUNTS[trimmed] || [
    {
      id: "tl-sample-zero-1",
      type: "trustline",
      assetCode: "OLDREWARD",
      assetIssuer: "GCKF7...MOCK",
      balance: "0.0000000",
      description: "Zero-balance unused reward trustline",
      lockedReserveXlm: 0.5,
      canReclaim: true,
    },
    {
      id: "signer-sample-stale",
      type: "signer",
      description: "Inactive delegated bot session authorization",
      lockedReserveXlm: 0.5,
      canReclaim: true,
    },
  ];

  const totalSubentries = subentries.length;
  const totalLockedReserveXlm = totalSubentries * 0.5;
  const reclaimableSubentries = subentries.filter((s) => s.canReclaim);
  const reclaimableReserveXlm = reclaimableSubentries.reduce(
    (acc, curr) => acc + curr.lockedReserveXlm,
    0
  );

  return {
    accountPublicKey: trimmed,
    totalSubentries,
    totalLockedReserveXlm,
    reclaimableSubentries,
    reclaimableReserveXlm,
    scannedAt: new Date().toISOString(),
  };
}
