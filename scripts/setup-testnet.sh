#!/usr/bin/env bash
set -euo pipefail

# setup-testnet.sh
# Configures local environment and identities for Stellar Testnet.

NETWORK="testnet"
IDENTITIES=("admin" "oracle" "player1")

echo "=== Stellarcade Testnet Setup ==="

# 1. Verify stellar CLI installation
if ! command -v stellar &> /dev/null; then
  echo "Error: 'stellar' CLI is not installed."
  echo "Install it using: cargo install --locked stellar-cli --features opt"
  exit 1
fi

EXISTING_KEYS=$(stellar keys ls 2>/dev/null || true)

# 2. Generate and fund identities if they do not exist
for id in "${IDENTITIES[@]}"; do
  if echo "$EXISTING_KEYS" | grep -qw "$id"; then
    echo "[✓] Identity '$id' already exists. Skipping generation."
  else
    echo "[+] Generating and funding identity '$id' on $NETWORK..."
    stellar keys generate --fund "$id" --network "$NETWORK"
  fi
  ADDR=$(stellar keys address "$id" 2>/dev/null || echo "<unavailable>")
  echo "    Address: $ADDR"
done

echo ""
echo "=== Testnet identities are ready ==="
