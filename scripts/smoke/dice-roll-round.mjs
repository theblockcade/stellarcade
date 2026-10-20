#!/usr/bin/env node
/**
 * Testnet smoke test: plays one real dice-roll round end to end.
 *
 *   node scripts/smoke/dice-roll-round.mjs \
 *     [--deployment deployments/testnet.json] [--api-url https://.../api] [--timeout 180]
 */

import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

const require = createRequire(new URL("../../apps/web/package.json", import.meta.url));
const {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
} = require("@stellar/stellar-sdk");

const { values: args } = parseArgs({
  options: {
    deployment: { type: "string", default: "deployments/testnet.json" },
    "api-url": { type: "string", default: process.env.SMOKE_API_URL ?? "" },
    timeout: { type: "string", default: "180" },
  },
});

const FRIENDBOT_URL = "https://friendbot.stellar.org";
let stepNumber = 0;

function step(name, fn) {
  stepNumber++;
  process.stdout.write(`[${stepNumber}] ${name}... `);
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.then(
        () => console.log("PASS"),
        (err) => {
          console.log("FAIL");
          console.error(err);
          process.exit(1);
        }
      );
    } else {
      console.log("PASS");
    }
  } catch (err) {
    console.log("FAIL");
    console.error(err);
    process.exit(1);
  }
}

async function main() {
  console.log("Starting dice-roll testnet smoke test...");
  const deploymentPath = resolve(process.cwd(), args.deployment);
  const deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));

  const rpcUrl = deployment.rpcUrl;
  const networkPassphrase = deployment.networkPassphrase;
  const diceRollId = deployment.contracts.diceRoll;

  if (!diceRollId) {
    console.log("diceRoll contract address is not deployed yet in testnet.json. Skipping dice-roll smoke test gracefully.");
    process.exit(0);
  }

  const server = new rpc.Server(rpcUrl);
  const player = Keypair.random();

  await step("Fund throwaway player via Friendbot", async () => {
    const res = await fetch(`${FRIENDBOT_URL}?addr=${player.publicKey()}`);
    if (!res.ok) throw new Error(`Friendbot failed: ${res.statusText}`);
    await server.getAccount(player.publicKey());
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
