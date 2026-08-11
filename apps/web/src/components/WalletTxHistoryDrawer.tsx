"use client";

import React from "react";
import { Drawer } from "./Drawer";
import "./WalletTxHistoryDrawer.css";

export interface WalletTxEntry {
  id: string;
  type: "buy" | "sell" | "transfer";
  asset: string;
  amount: string;
  price?: string;
  timestamp: string;
  status: "confirmed" | "pending" | "failed";
  txHash?: string;
}

export interface WalletTxHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  walletAddress: string;
  transactions: WalletTxEntry[];
  testId?: string;
}

export const WalletTxHistoryDrawer: React.FC<WalletTxHistoryDrawerProps> = ({
  open,
  onClose,
  walletAddress,
  transactions,
  testId = "wallet-tx-history-drawer",
}) => {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Transaction History"
      side="right"
      testId={testId}
    >
      <div className="wallet-tx-history-drawer" data-testid={`${testId}-content`}>
        <p className="wallet-tx-history-drawer__address" data-testid={`${testId}-address`}>
          {walletAddress}
        </p>

        {transactions.length === 0 ? (
          <div data-testid={`${testId}-empty`} style={{ textAlign: "center", color: "var(--sc-text-dim)", padding: "1.5rem" }}>
            No transactions found for this wallet.
          </div>
        ) : (
          <ul className="wallet-tx-history-drawer__list" data-testid={`${testId}-list`}>
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="wallet-tx-history-drawer__item"
                data-testid={`${testId}-item-${tx.id}`}
              >
                <div className="wallet-tx-history-drawer__details">
                  <div className="wallet-tx-history-drawer__row">
                    <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{tx.type}</span>
                    <span style={{ color: "var(--sc-accent, #00f0ff)" }}>{tx.amount} {tx.asset}</span>
                  </div>
                  <div className="wallet-tx-history-drawer__row">
                    <span style={{ fontSize: "0.6875rem", color: "var(--sc-text-dim)" }}>
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`wallet-tx-history-drawer__status wallet-tx-history-drawer__status--${tx.status}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  );
};

export default WalletTxHistoryDrawer;
