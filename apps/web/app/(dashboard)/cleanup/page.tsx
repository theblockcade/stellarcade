"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Trash2,
  Coins,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "../../../src/components/ui/button";
import { useWalletStatus } from "../../../src/hooks/useWalletStatus";
import {
  scanAccountHygiene,
  SAMPLE_HYGIENE_ACCOUNTS,
  type HygieneScanResult,
  type CleanableSubentry,
} from "../../../src/utils/account-hygiene";
import styles from "./cleanup.module.css";

const DEMO_PUBLIC_KEY = "GBBD47IF6LWK7P7MDEVSCADEPLAYERHYGIENE777SAMPLEPUBLICKEY";

export default function CleanupPage() {
  const { address } = useWalletStatus();
  const [targetAddress, setTargetAddress] = useState<string>(
    address || DEMO_PUBLIC_KEY
  );
  const [scanResult, setScanResult] = useState<HygieneScanResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCleaning, setIsCleaning] = useState(false);
  const [reclaimSuccess, setReclaimSuccess] = useState<{
    reclaimedXlm: number;
    count: number;
  } | null>(null);

  const handleScan = (addressToScan: string) => {
    const res = scanAccountHygiene(addressToScan);
    setScanResult(res);
    // Select all cleanable by default
    setSelectedIds(res.reclaimableSubentries.map((s) => s.id));
    setReclaimSuccess(null);
  };

  useEffect(() => {
    handleScan(targetAddress);
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExecuteCleanup = async () => {
    if (!scanResult || selectedIds.length === 0) return;
    setIsCleaning(true);

    // Simulate batch transaction execution to remove trustlines/signers on Stellar
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
      await Promise.resolve();
    } else {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    const reclaimedAmount = selectedIds.length * 0.5;
    const remainingSubentries = scanResult.reclaimableSubentries.filter(
      (s) => !selectedIds.includes(s.id)
    );

    setScanResult({
      ...scanResult,
      totalSubentries: scanResult.totalSubentries - selectedIds.length,
      totalLockedReserveXlm: scanResult.totalLockedReserveXlm - reclaimedAmount,
      reclaimableSubentries: remainingSubentries,
      reclaimableReserveXlm: remainingSubentries.reduce((a, b) => a + b.lockedReserveXlm, 0),
    });

    setReclaimSuccess({
      reclaimedXlm: reclaimedAmount,
      count: selectedIds.length,
    });
    setSelectedIds([]);
    setIsCleaning(false);
  };

  const selectedReclaimValue = selectedIds.length * 0.5;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <Sparkles size={32} style={{ color: "var(--sc-accent)" }} />
          <h1 className={styles.title}>Account Hygiene & Reserve Recovery</h1>
        </div>
        <p className={styles.subtitle}>
          Reclaim XLM base reserves locked by zero-balance trustlines, expired event badges, and stale
          session authorizations on the Stellar network (0.5 XLM per subentry).
        </p>
      </div>

      {/* Account Scan Input */}
      <section className={styles.scanSection} aria-labelledby="scan-heading">
        <h2 id="scan-heading" className={styles.cardTitle}>
          Stellar Account Scanner
        </h2>
        <div className={styles.searchRow}>
          <input
            className={styles.input}
            type="text"
            placeholder="Enter Stellar Public Key (G...)"
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            data-testid="input-hygiene-address"
          />
          <Button
            type="button"
            onClick={() => handleScan(targetAddress)}
            data-testid="btn-scan-account"
          >
            <RotateCcw size={14} style={{ marginRight: "0.5rem" }} />
            Scan Account
          </Button>
        </div>
      </section>

      {/* Success Notification */}
      {reclaimSuccess && (
        <div className={styles.successBanner} data-testid="reclaim-success-banner">
          <CheckCircle2 size={24} />
          <div>
            <strong>Reclamation Complete!</strong>
            <p style={{ margin: "0.15rem 0 0", fontSize: "0.8125rem" }}>
              Successfully removed {reclaimSuccess.count} subentry item(s) and released +
              {reclaimSuccess.reclaimedXlm.toFixed(1)} XLM back to your spendable balance.
            </p>
          </div>
        </div>
      )}

      {/* Reserve Overview Bar */}
      {scanResult && (
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Subentries</span>
            <span className={styles.statValue} data-testid="stat-total-subentries">
              {scanResult.totalSubentries}
            </span>
            <span className={styles.statHint}>
              {(scanResult.totalLockedReserveXlm).toFixed(1)} XLM locked in base reserves
            </span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Reclaimable Reserve</span>
            <span className={styles.statValue} style={{ color: "#4ade80" }} data-testid="stat-reclaimable-xlm">
              +{scanResult.reclaimableReserveXlm.toFixed(1)} XLM
            </span>
            <span className={styles.statHint}>
              {scanResult.reclaimableSubentries.length} inactive or empty entries found
            </span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Selected for Cleanup</span>
            <span className={styles.statValue} data-testid="stat-selected-xlm">
              +{selectedReclaimValue.toFixed(1)} XLM
            </span>
            <span className={styles.statHint}>{selectedIds.length} item(s) selected</span>
          </div>
        </div>
      )}

      {/* Cleanable Subentries Card */}
      {scanResult && (
        <section className={styles.itemsCard} aria-labelledby="subentries-heading">
          <div className={styles.cardHeaderRow}>
            <h2 id="subentries-heading" className={styles.cardTitle}>
              Subentry Inventory ({scanResult.reclaimableSubentries.length} Reclaimable)
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setSelectedIds(
                  selectedIds.length === scanResult.reclaimableSubentries.length
                    ? []
                    : scanResult.reclaimableSubentries.map((s) => s.id)
                )
              }
              data-testid="btn-toggle-select-all"
            >
              {selectedIds.length === scanResult.reclaimableSubentries.length
                ? "Deselect All"
                : "Select All Reclaimable"}
            </Button>
          </div>

          {scanResult.reclaimableSubentries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--sc-text-dim)" }}>
              <ShieldCheck size={36} style={{ color: "#4ade80", margin: "0 auto 0.5rem" }} />
              <p>Account hygiene is in perfect shape! No stale or empty subentries found.</p>
            </div>
          ) : (
            <div className={styles.itemList}>
              {scanResult.reclaimableSubentries.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`${styles.itemRow} ${isSelected ? styles.itemRowSelected : ""}`}
                    data-testid={`subentry-row-${item.id}`}
                  >
                    <div className={styles.itemLeft}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        aria-label={`Select ${item.description}`}
                        data-testid={`checkbox-${item.id}`}
                      />
                      <div className={styles.itemDetails}>
                        <span className={styles.itemTitle}>{item.description}</span>
                        {item.assetCode && (
                          <span className={styles.itemSub}>
                            Asset: {item.assetCode} • Issuer: {item.assetIssuer}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={styles.itemRight}>
                      <span className={styles.reserveBadge}>
                        +{item.lockedReserveXlm.toFixed(1)} XLM
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {scanResult.reclaimableSubentries.length > 0 && (
            <div className={styles.actionFooter}>
              <div>
                <span style={{ fontWeight: 600 }}>Total Recovery Potential: </span>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>
                  +{selectedReclaimValue.toFixed(1)} XLM
                </span>
              </div>

              <Button
                type="button"
                disabled={selectedIds.length === 0 || isCleaning}
                onClick={handleExecuteCleanup}
                data-testid="btn-execute-cleanup"
              >
                <Trash2 size={14} style={{ marginRight: "0.5rem" }} />
                {isCleaning ? "Reclaiming Reserves..." : `Reclaim (${selectedIds.length}) Entries`}
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
