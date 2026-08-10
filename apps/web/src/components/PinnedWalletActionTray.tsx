import React from "react";
import "./PinnedWalletActionTray.css";

export interface WalletActionItem {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface PinnedWalletActionTrayProps {
  actions: WalletActionItem[];
  testId?: string;
}

export const PinnedWalletActionTray: React.FC<PinnedWalletActionTrayProps> = ({
  actions,
  testId = "pinned-wallet-action-tray",
}) => {
  return (
    <aside className="pinned-wallet-action-tray" data-testid={testId}>
      <span className="pinned-wallet-action-tray__label">Quick wallet actions</span>
      <div className="pinned-wallet-action-tray__actions">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={action.disabled}
            onClick={action.onClick}
            data-testid={`${testId}-${action.id}`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default PinnedWalletActionTray;
