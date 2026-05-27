import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EntityActionShortcuts } from '../components/v1/EntityActionShortcuts';
import { PinnedWalletActionTray } from '../components/v1/PinnedWalletActionTray';
import { ResumeTaskBanner } from '../components/v1/ResumeTaskBanner';
import { StatusPill } from '../components/v1/StatusPill';
import { WalletBalanceDeltaCards } from '../components/v1/WalletBalanceDeltaCards';
import GlobalStateStore from '../services/global-state-store';
import { useWalletStatus } from '../hooks/v1/useWalletStatus';
import type { PendingTransactionSnapshot } from '../types/global-state';
import type { PivotLink } from '../components/v1/QuickPivotLinks';

interface WalletDetailProps {
  walletId?: string;
}

function formatPendingTaskLabel(snapshot: PendingTransactionSnapshot | null): string {
  if (!snapshot) {
    return 'Pending wallet task';
  }
  return snapshot.operation.replace(/[._]/g, ' ');
}

const WalletDetail: React.FC<WalletDetailProps> = ({ walletId = 'wallet_123' }) => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [pendingTransaction, setPendingTransaction] = useState<PendingTransactionSnapshot | null>(null);
  const [showPendingTaskBanner, setShowPendingTaskBanner] = useState(false);
  const walletStatus = useWalletStatus();
  const storeRef = useRef<GlobalStateStore | null>(null);
  const previousWalletStatusRef = useRef(walletStatus.status);
  const previousReconnectAtRef = useRef(walletStatus.lastReconnectAt);

  if (!storeRef.current) {
    storeRef.current = new GlobalStateStore();
  }

  useEffect(() => {
    const store = storeRef.current!;
    setPendingTransaction(store.getState().pendingTransaction ?? null);
    return store.subscribe((state) => {
      setPendingTransaction(state.pendingTransaction ?? null);
    });
  }, []);

  useEffect(() => {
    if (walletStatus.sessionDropped && pendingTransaction) {
      setShowPendingTaskBanner(true);
    }
  }, [pendingTransaction, walletStatus.sessionDropped]);

  useEffect(() => {
    const previousStatus = previousWalletStatusRef.current;
    const previousReconnectAt = previousReconnectAtRef.current;

    if (
      pendingTransaction &&
      previousStatus === 'RECONNECTING' &&
      walletStatus.status === 'CONNECTED' &&
      walletStatus.lastReconnectAt !== null &&
      walletStatus.lastReconnectAt !== previousReconnectAt
    ) {
      setShowPendingTaskBanner(true);
    }

    previousWalletStatusRef.current = walletStatus.status;
    previousReconnectAtRef.current = walletStatus.lastReconnectAt;
  }, [pendingTransaction, walletStatus.lastReconnectAt, walletStatus.status]);

  const pivotLinks: PivotLink[] = useMemo(
    () => [
      { id: 'contracts', label: 'Related Contracts', onClick: () => setActiveSection('contracts'), icon: 'DOC', badge: 5 },
      { id: 'transactions', label: 'Transaction History', onClick: () => setActiveSection('transactions'), icon: 'TX', badge: 23 },
      { id: 'analytics', label: 'Analytics Dashboard', href: `/analytics/wallet/${walletId}`, icon: 'ANL', external: true },
      { id: 'settings', label: 'Wallet Settings', onClick: () => setActiveSection('settings'), icon: 'CFG' },
      { id: 'export', label: 'Export Data', onClick: () => console.log('Export wallet data'), icon: 'EXP', disabled: true },
    ],
    [walletId],
  );

  const shortcutAlerts = useMemo(
    () => [
      {
        id: 'pending-wallet-task',
        title: pendingTransaction ? 'Wallet action can be resumed' : 'Wallet actions stay resumable',
        description: pendingTransaction
          ? `Return to ${formatPendingTaskLabel(pendingTransaction)} without losing context after a wallet interruption.`
          : 'When a wallet confirmation is interrupted, the latest pending task appears here so the user can jump back in.',
        variant: pendingTransaction ? ('warning' as const) : ('info' as const),
        action: pendingTransaction
          ? {
              label: 'Open transaction history',
              onClick: () => {
                setActiveSection('transactions');
                setShowPendingTaskBanner(false);
              },
            }
          : undefined,
      },
      {
        id: 'export-fallback',
        title: 'Export actions are staged',
        description:
          'Record shortcuts stay visible even when one downstream action is unavailable, so detail-page navigation remains predictable.',
        variant: 'info' as const,
      },
    ],
    [pendingTransaction],
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'contracts':
        return (
          <div className="wallet-detail__content">
            <h2>Related Smart Contracts</h2>
            <p>Contracts associated with this wallet...</p>
          </div>
        );
      case 'transactions':
        return (
          <div className="wallet-detail__content">
            <h2>Transaction History</h2>
            <p>Recent transactions for this wallet...</p>
            {pendingTransaction ? (
              <p data-testid="wallet-detail-pending-transaction">
                Pending wallet task: {formatPendingTaskLabel(pendingTransaction)} is{' '}
                {pendingTransaction.phase.toLowerCase().replace(/_/g, ' ')}.
              </p>
            ) : null}
          </div>
        );
      case 'settings':
        return (
          <div className="wallet-detail__content">
            <h2>Wallet Settings</h2>
            <p>Configure wallet preferences and security settings...</p>
          </div>
        );
      default:
        return (
          <div className="wallet-detail__content">
            <h2>Wallet Overview</h2>
            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: '0.5rem' }}>
                <h3>Balance</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7de2d1' }}>1,234.56 XLM</p>
              </div>
              <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: '0.5rem' }}>
                <h3>Status</h3>
                <StatusPill tone="success" label="Active" />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }} aria-labelledby="wallet-details-heading">
      <header style={{ marginBottom: '2rem' }}>
        <h1 id="wallet-details-heading">Wallet Details</h1>
        <p style={{ color: '#a8b5c8', fontFamily: 'monospace' }}>{walletId}</p>
      </header>

      {showPendingTaskBanner && pendingTransaction ? (
        <div style={{ marginBottom: '1.25rem' }}>
          <ResumeTaskBanner
            taskName={formatPendingTaskLabel(pendingTransaction)}
            onResume={() => {
              setActiveSection('transactions');
              setShowPendingTaskBanner(false);
            }}
            onDismiss={() => setShowPendingTaskBanner(false)}
            testId="wallet-detail-resume-pending-task"
          />
        </div>
      ) : null}

      <section style={{ marginBottom: '2rem' }} aria-label="Wallet quick navigation">
        <EntityActionShortcuts
          title="Wallet shortcuts"
          description="Jump between related wallet records and recover interrupted actions from a single, predictable module."
          links={pivotLinks}
          alerts={shortcutAlerts}
          headingLevel={2}
          testId="wallet-detail-shortcuts"
        />
      </section>

      <section aria-label="Wallet comparison snapshot" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Balance delta comparison</h2>
        <WalletBalanceDeltaCards
          left={{ id: 'current', label: 'Current wallet', currentBalance: 1234.56, previousBalance: 1180.2 }}
          right={{ id: 'comparison', label: 'Comparison wallet', currentBalance: 1088.12, previousBalance: 1114.55 }}
          testId="wallet-balance-delta-cards"
        />
      </section>

      <section aria-label="Wallet detail content">{renderContent()}</section>

      <div style={{ marginTop: '1.5rem' }}>
        <PinnedWalletActionTray
          actions={[
            { id: 'refresh-session', label: 'Refresh session', onClick: () => console.log('refresh wallet session') },
            { id: 'repeat-last-transfer', label: 'Repeat last transfer', onClick: () => console.log('repeat last transfer') },
            { id: 'reconnect-wallet', label: 'Reconnect wallet', onClick: () => console.log('reconnect wallet') },
          ]}
        />
      </div>
    </main>
  );
};

export default WalletDetail;
