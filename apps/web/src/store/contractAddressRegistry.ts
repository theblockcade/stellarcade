/**
 * Contract Address Registry
 *
 * Centralises lookup of deployed Soroban contract addresses. All addresses are
 * validated on construction so callers can rely on a fail-fast, early-error
 * model rather than discovering bad addresses at RPC call time.
 */

import { SorobanClientError } from "../types/errors";

/** Keys for every Soroban contract deployed by StellarCade. */
export interface ContractAddresses {
  prizePool: string;
  achievementBadge: string;
  accessControl: string;
  coinFlip: string;
  randomGenerator: string;
}

/**
 * Soroban contract addresses start with 'C' and are 56 characters long
 * (base32-encoded contract ID).
 */
const CONTRACT_ADDRESS_RE = /^C[A-Z2-7]{55}$/;

function isValidContractAddress(addr: string): boolean {
  return CONTRACT_ADDRESS_RE.test(addr);
}

export class ContractAddressRegistry {
  private readonly addresses: ContractAddresses;

  constructor(addresses: ContractAddresses) {
    this.addresses = addresses;
  }

  static fromEnv(): ContractAddressRegistry {
    const e: Record<string, string | undefined> =
      typeof process !== "undefined" ? process.env : {};

    const required: Array<[keyof ContractAddresses, string, string]> = [
      ["prizePool", "NEXT_PUBLIC_PRIZE_POOL_CONTRACT_ID", "VITE_PRIZE_POOL_CONTRACT_ID"],
      ["achievementBadge", "NEXT_PUBLIC_ACHIEVEMENT_BADGE_CONTRACT_ID", "VITE_ACHIEVEMENT_BADGE_CONTRACT_ID"],
      ["accessControl", "NEXT_PUBLIC_ACCESS_CONTROL_CONTRACT_ID", "VITE_ACCESS_CONTROL_CONTRACT_ID"],
      ["coinFlip", "NEXT_PUBLIC_COIN_FLIP_CONTRACT_ID", "VITE_COIN_FLIP_CONTRACT_ID"],
      ["randomGenerator", "NEXT_PUBLIC_RANDOM_GENERATOR_CONTRACT_ID", "VITE_RANDOM_GENERATOR_CONTRACT_ID"],
    ];

    const resolved: Partial<ContractAddresses> = {};

    for (const [key, nextEnvVar, viteEnvVar] of required) {
      const value = e[nextEnvVar] || e[viteEnvVar];
      if (!value || value === "C...") {
        throw SorobanClientError.addressNotFound(key);
      }
      resolved[key] = value;
    }

    const registry = new ContractAddressRegistry(resolved as ContractAddresses);
    registry.validate();
    return registry;
  }

  static fromObject(addresses: ContractAddresses): ContractAddressRegistry {
    const registry = new ContractAddressRegistry(addresses);
    registry.validate();
    return registry;
  }

  getAddress(contractName: keyof ContractAddresses): string {
    const addr = this.addresses[contractName];
    if (!addr || addr === "C...") {
      throw SorobanClientError.addressNotFound(contractName);
    }
    return addr;
  }

  validate(): void {
    for (const [key, addr] of Object.entries(this.addresses)) {
      if (!addr || addr === "C...") {
        throw SorobanClientError.addressNotFound(key);
      }
      if (!isValidContractAddress(addr)) {
        throw SorobanClientError.invalidParam(
          key,
          `"${addr}" is not a valid Soroban contract address (must be 56 chars, start with 'C')`
        );
      }
    }
  }

  toObject(): Readonly<ContractAddresses> {
    return { ...this.addresses };
  }
}
