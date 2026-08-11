import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
  getNetwork,
  signMessage as freighterSignMessage,
  signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";
import {
  ProviderNotFoundError,
  RejectedSignatureError,
  WalletSessionError,
} from "../types/wallet-session";
import type { WalletProviderAdapter } from "./wallet-session-service";
import type { WalletProviderInfo } from "../types/wallet-session";

export const FREIGHTER_PROVIDER_INFO: WalletProviderInfo = {
  id: "freighter",
  name: "Freighter",
  iconUrl: "https://stellarcade.fun/icons/freighter.svg",
  supportedNetworks: ["PUBLIC", "TESTNET", "FUTURENET", "STANDALONE"],
};

export class FreighterAdapter implements WalletProviderAdapter {
  readonly provider: WalletProviderInfo = FREIGHTER_PROVIDER_INFO;

  isAvailable(): boolean {
    if (typeof window === "undefined") return false;
    return typeof (window as any).freighter !== "undefined" || true;
  }

  async checkInstalled(): Promise<boolean> {
    try {
      const res = await isConnected();
      if (typeof res === "boolean") return res;
      if (res && typeof (res as any).isConnected === "boolean") {
        return (res as any).isConnected;
      }
      return Boolean(res);
    } catch {
      return false;
    }
  }

  async connect(): Promise<{
    address: string;
    provider: WalletProviderInfo;
    network: string;
  }> {
    const installed = await this.checkInstalled();
    if (!installed) {
      throw new ProviderNotFoundError("Freighter wallet extension not found");
    }

    try {
      const accessRes = await requestAccess();
      let address = "";
      if (typeof accessRes === "string") {
        address = accessRes;
      } else if (accessRes && typeof (accessRes as any).address === "string") {
        address = (accessRes as any).address;
      }

      if (!address) {
        const addrRes = await getAddress();
        if (typeof addrRes === "string") {
          address = addrRes;
        } else if (addrRes && typeof (addrRes as any).address === "string") {
          address = (addrRes as any).address;
        }
      }

      if (!address) {
        throw new RejectedSignatureError("Freighter access rejected or address unavailable");
      }

      let networkName = "TESTNET";
      try {
        const netRes = await getNetwork();
        if (typeof netRes === "string") {
          networkName = netRes;
        } else if (netRes && typeof (netRes as any).network === "string") {
          networkName = (netRes as any).network;
        }
      } catch {
        // Default to TESTNET if network fetch fails
      }

      return {
        address,
        provider: this.provider,
        network: networkName.toUpperCase(),
      };
    } catch (err: any) {
      if (err instanceof WalletSessionError) throw err;
      const msg = err?.message || String(err);
      if (msg.includes("User declined") || msg.includes("rejected") || msg.includes("User rejected")) {
        throw new RejectedSignatureError("User declined wallet connection");
      }
      throw new WalletSessionError("freighter_connect_error", msg);
    }
  }

  async signMessage(message: string): Promise<string> {
    const installed = await this.checkInstalled();
    if (!installed) {
      throw new ProviderNotFoundError("Freighter wallet extension not found");
    }

    try {
      const res = await freighterSignMessage(message);
      if (typeof res === "string") return res;
      if (res && typeof (res as any).signedMessage === "string") {
        return (res as any).signedMessage;
      }
      return String(res);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("User declined") || msg.includes("rejected") || msg.includes("User rejected")) {
        throw new RejectedSignatureError("User declined signing message");
      }
      throw new WalletSessionError("freighter_sign_message_error", msg);
    }
  }

  async signTransaction(xdr: string, opts?: { network?: string; networkPassphrase?: string }): Promise<string> {
    const installed = await this.checkInstalled();
    if (!installed) {
      throw new ProviderNotFoundError("Freighter wallet extension not found");
    }

    try {
      const res = await freighterSignTransaction(xdr, opts);
      if (typeof res === "string") return res;
      if (res && typeof (res as any).signedTxXdr === "string") {
        return (res as any).signedTxXdr;
      }
      return String(res);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("User declined") || msg.includes("rejected") || msg.includes("User rejected")) {
        throw new RejectedSignatureError("User declined signing transaction");
      }
      throw new WalletSessionError("freighter_sign_tx_error", msg);
    }
  }
}

export const defaultFreighterAdapter = new FreighterAdapter();
export default defaultFreighterAdapter;
