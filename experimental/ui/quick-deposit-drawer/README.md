# Quick Deposit Drawer

Experimental slide-over drawer for rapid in-game wallet funding: a QR code
for the connected wallet's address, one-click copy with a confirmation
badge, preset deposit amount buttons (10/25/100 XLM), and — when connected
to Stellar Testnet — a Friendbot funding shortcut.

## Usage

```tsx
<QuickDepositDrawer
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  walletAddress={wallet.publicKey}
  currentBalance={balance}
  onDeposit={(amount) => submitDeposit(amount)}
  isTestnet={network === 'TESTNET'}
  onFriendbotFund={() => fundFromFriendbot(wallet.publicKey)}
/>
```

## Props

| Prop | Type | Description |
|---|---|---|
| `isOpen` | `boolean` | Controls drawer visibility. |
| `onClose` | `() => void` | Called on close (backdrop click, Escape, or the × button). |
| `walletAddress` | `string` | Address rendered as a QR code and copyable text. |
| `currentBalance` | `number` | Displayed in the balance indicator. |
| `onDeposit` | `(amount: number) => Promise<void>` | Called when a preset amount button is clicked. |
| `isTestnet` | `boolean?` | Shows the Friendbot shortcut when true. |
| `onFriendbotFund` | `(() => Promise<void>)?` | Called when the Friendbot button is clicked. |

## Notes

The QR code is a deterministic placeholder pattern derived from the address
(no QR-generation dependency pulled in for this experimental component) — a
production version should swap `renderPlaceholderQr` for a real QR library.
