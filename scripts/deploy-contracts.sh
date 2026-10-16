#!/usr/bin/env bash
set -euo pipefail

# deploy-contracts.sh
# Builds, deploys, initializes, and wires the Stellarcade contract stack on Stellar testnet.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

NETWORK="testnet"
SOURCE="admin"
BUILD=false
FRESH=false
DRY_RUN=false

MIN_WAGER="10000000"     # 1 XLM (stroops)
MAX_WAGER="1000000000"   # 100 XLM (stroops)
BANKROLL="10000000000"   # 1,000 XLM (stroops)

usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --network <name>     Network to deploy to (default: testnet)"
  echo "  --source <name>      Identity / signer to use for deployment (default: admin)"
  echo "  --build              Build contracts with cargo before deploying"
  echo "  --fresh              Force a new deployment even if deployments/testnet.json exists"
  echo "  --dry-run            Validate CLI, identity, network and WASM artifacts without deploying"
  echo "  --min-wager <amount> Minimum wager in stroops (default: 10000000)"
  echo "  --max-wager <amount> Maximum wager in stroops (default: 1000000000)"
  echo "  --bankroll <amount>  Initial house bankroll in stroops (default: 10000000000)"
  echo "  -h, --help           Show this help message"
  exit 1
}

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --network)
      NETWORK="$2"; shift ;;
    --source)
      SOURCE="$2"; shift ;;
    --build)
      BUILD=true ;;
    --fresh)
      FRESH=true ;;
    --dry-run)
      DRY_RUN=true ;;
    --min-wager)
      MIN_WAGER="$2"; shift ;;
    --max-wager)
      MAX_WAGER="$2"; shift ;;
    --bankroll)
      BANKROLL="$2"; shift ;;
    -h|--help)
      usage ;;
    *)
      echo "Unknown argument: $1"
      usage ;;
  esac
  shift
done

DEPLOYMENT_DIR="${ROOT_DIR}/deployments"
DEPLOYMENT_FILE="${DEPLOYMENT_DIR}/${NETWORK}.json"
RNG_WASM="${ROOT_DIR}/contracts/target/wasm32-unknown-unknown/release/random_generator.wasm"
COIN_FLIP_WASM="${ROOT_DIR}/contracts/target/wasm32-unknown-unknown/release/coin_flip.wasm"

print_env_export() {
  local coin_flip="$1"
  local rng="$2"
  local rpc="$3"
  local net="$4"

  echo ""
  echo "=== Environment Variables for Stellarcade Apps ==="
  echo "--- apps/web/.env.local ---"
  echo "NEXT_PUBLIC_COIN_FLIP_CONTRACT_ID=${coin_flip}"
  echo "NEXT_PUBLIC_RANDOM_GENERATOR_CONTRACT_ID=${rng}"
  echo "NEXT_PUBLIC_STELLAR_NETWORK=${net}"
  echo ""
  echo "--- backend/.env ---"
  echo "COIN_FLIP_CONTRACT_ID=${coin_flip}"
  echo "RANDOM_GENERATOR_CONTRACT_ID=${rng}"
  echo "SOROBAN_RPC_URL=${rpc}"
  echo "STELLAR_NETWORK=${net}"
  echo "=================================================="
}

if [ "$DRY_RUN" = true ]; then
  echo "=== Running Stellarcade Deployment Dry-Run Validation ==="
  ERRORS=0

  if ! command -v stellar &> /dev/null; then
    echo "[!] Error: 'stellar' CLI is not installed."
    ERRORS=1
  else
    echo "[✓] 'stellar' CLI is installed: $(stellar --version 2>/dev/null || true)"
  fi

  if command -v stellar &> /dev/null; then
    if ! stellar keys ls 2>/dev/null | grep -qw "$SOURCE"; then
      echo "[!] Error: Identity '$SOURCE' not found in stellar keys."
      ERRORS=1
    else
      echo "[✓] Identity '$SOURCE' found."
    fi
  fi

  echo "Checking contract WASM artifacts..."
  for wasm in "$RNG_WASM" "$COIN_FLIP_WASM"; do
    if [ ! -f "$wasm" ]; then
      if [ "$BUILD" = true ]; then
        echo "  [i] $wasm is currently missing, but --build was specified."
      else
        echo "  [!] Missing WASM artifact: $wasm (Specify --build to compile)"
        ERRORS=1
      fi
    else
      echo "  [✓] Found: $wasm"
    fi
  done

  if [ $ERRORS -ne 0 ]; then
    echo "Dry-run validation FAILED."
    exit 1
  fi

  echo "Dry-run validation SUCCESSFUL. Environment is ready."
  exit 0
fi

# Re-run idempotency: reuse existing deployment if not --fresh
if [ "$FRESH" = false ] && [ -f "$DEPLOYMENT_FILE" ]; then
  EXISTING_COIN_FLIP=$(grep -o '"coinFlip": *"[^"]*"' "$DEPLOYMENT_FILE" | cut -d '"' -f 4 || true)
  EXISTING_RNG=$(grep -o '"randomGenerator": *"[^"]*"' "$DEPLOYMENT_FILE" | cut -d '"' -f 4 || true)
  EXISTING_RPC=$(grep -o '"rpcUrl": *"[^"]*"' "$DEPLOYMENT_FILE" | cut -d '"' -f 4 || true)

  if [ -n "$EXISTING_COIN_FLIP" ] && [ -n "$EXISTING_RNG" ]; then
    echo "[✓] Found existing active deployment in ${DEPLOYMENT_FILE}."
    echo "    Coin Flip: ${EXISTING_COIN_FLIP}"
    echo "    Random Generator: ${EXISTING_RNG}"
    echo "    (Pass --fresh to redeploy and overwrite)"
    print_env_export "$EXISTING_COIN_FLIP" "$EXISTING_RNG" "$EXISTING_RPC" "$NETWORK"
    exit 0
  fi
fi

if [ "$BUILD" = true ]; then
  echo "Building Soroban smart contracts in contracts/..."
  (cd "${ROOT_DIR}/contracts" && cargo build --target wasm32-unknown-unknown --release)
fi

if [ ! -f "$RNG_WASM" ]; then
  echo "Error: Missing $RNG_WASM. Please run with --build."
  exit 1
fi

if [ ! -f "$COIN_FLIP_WASM" ]; then
  echo "Error: Missing $COIN_FLIP_WASM. Please run with --build."
  exit 1
fi

case "$NETWORK" in
  testnet)
    RPC_URL="https://soroban-testnet.stellar.org"
    PASSPHRASE="Test SDF Network ; September 2015"
    DEFAULT_NATIVE_SAC="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
    ;;
  mainnet)
    RPC_URL="https://soroban-rpc.stellar.org"
    PASSPHRASE="Public Global Stellar Network ; July 2015"
    DEFAULT_NATIVE_SAC="CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA"
    ;;
  *)
    RPC_URL="https://soroban-testnet.stellar.org"
    PASSPHRASE="Test SDF Network ; September 2015"
    DEFAULT_NATIVE_SAC="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
    ;;
esac

ADMIN_ADDR=$(stellar keys address "$SOURCE")
ORACLE_ADDR=$(stellar keys address oracle 2>/dev/null || echo "$ADMIN_ADDR")

echo "=== Deploying Contracts to $NETWORK ==="
echo "Admin Address:  $ADMIN_ADDR"
echo "Oracle Address: $ORACLE_ADDR"

echo "[1/6] Deploying random-generator..."
RNG_ID=$(stellar contract deploy \
  --wasm "$RNG_WASM" \
  --source "$SOURCE" \
  --network "$NETWORK")
echo "      Random Generator ID: $RNG_ID"

echo "[2/6] Initializing random-generator..."
stellar contract invoke \
  --id "$RNG_ID" \
  --source "$SOURCE" \
  --network "$NETWORK" \
  -- init \
  --admin "$ADMIN_ADDR" \
  --oracle "$ORACLE_ADDR"

echo "[3/6] Resolving native XLM Stellar Asset Contract ID..."
NATIVE_SAC=$(stellar contract id asset --asset native --network "$NETWORK" 2>/dev/null || echo "$DEFAULT_NATIVE_SAC")
echo "      Native XLM SAC ID: $NATIVE_SAC"

echo "[4/6] Deploying coin-flip..."
COIN_FLIP_ID=$(stellar contract deploy \
  --wasm "$COIN_FLIP_WASM" \
  --source "$SOURCE" \
  --network "$NETWORK")
echo "      Coin Flip ID: $COIN_FLIP_ID"

echo "[5/6] Initializing coin-flip (min_wager=$MIN_WAGER, max_wager=$MAX_WAGER, edge=250bps)..."
stellar contract invoke \
  --id "$COIN_FLIP_ID" \
  --source "$SOURCE" \
  --network "$NETWORK" \
  -- init \
  --admin "$ADMIN_ADDR" \
  --rng_contract "$RNG_ID" \
  --token "$NATIVE_SAC" \
  --min_wager "$MIN_WAGER" \
  --max_wager "$MAX_WAGER" \
  --house_edge_bps 250

echo "[6/6] Wiring coin-flip with random-generator..."
stellar contract invoke \
  --id "$RNG_ID" \
  --source "$SOURCE" \
  --network "$NETWORK" \
  -- authorize \
  --admin "$ADMIN_ADDR" \
  --caller "$COIN_FLIP_ID"

echo "[+] Funding house bankroll ($BANKROLL stroops)..."
stellar contract invoke \
  --id "$COIN_FLIP_ID" \
  --source "$SOURCE" \
  --network "$NETWORK" \
  -- fund_house \
  --admin "$ADMIN_ADDR" \
  --amount "$BANKROLL"

echo "[+] Pre-committing initial seed batch to RNG queue..."
# Pre-commit 3 sample seed hashes (sha256 commitments)
SEED_HASH_1="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
SEED_HASH_2="abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
SEED_HASH_3="deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"

stellar contract invoke \
  --id "$RNG_ID" \
  --source "oracle" \
  --network "$NETWORK" \
  -- commit_seeds \
  --oracle "$ORACLE_ADDR" \
  --commitments "[\"$SEED_HASH_1\",\"$SEED_HASH_2\",\"$SEED_HASH_3\"]"

mkdir -p "$DEPLOYMENT_DIR"
DEPLOY_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat <<EOF > "$DEPLOYMENT_FILE"
{
  "network": "${NETWORK}",
  "rpcUrl": "${RPC_URL}",
  "networkPassphrase": "${PASSPHRASE}",
  "contracts": {
    "coinFlip": "${COIN_FLIP_ID}",
    "randomGenerator": "${RNG_ID}"
  },
  "nativeToken": "${NATIVE_SAC}",
  "deployedAt": "${DEPLOY_DATE}"
}
EOF

echo ""
echo "=== Deployment Successfully Completed ==="
echo "Deployment manifest written to: ${DEPLOYMENT_FILE}"
print_env_export "$COIN_FLIP_ID" "$RNG_ID" "$RPC_URL" "$NETWORK"
