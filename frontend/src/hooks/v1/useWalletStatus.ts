import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WalletSessionService, {
  WalletProviderAdapter,
} from "../../services/wallet-session-service";
import {
  ProviderNotFoundError,
  RejectedSignatureError,
  StaleSessionError,
  WalletSessionError,
  WalletSessionRefreshPhase,
  WalletSessionState,
} from "../../types/wallet-session";
import type {
  WalletSessionMeta,
  WalletProviderInfo,
  WalletSessionRefreshState,
} from "../../types/wallet-session";

export type WalletStatus =
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "PROVIDER_MISSING"
  | "PERMISSION_DENIED"
  | "STALE_SESSION"
  | "ERROR";

export interface WalletCapabilities {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  canConnect: boolean;
}

export interface WalletStatusError {
  code: string;
  message: string;
  recoverable: boolean;
}

export interface UseWalletStatusReturn {
  status: WalletStatus;
  address: string | null;
  network: string | null;
  provider: WalletProviderInfo | null;
  capabilities: WalletCapabilities;
  error: WalletStatusError | null;
  lastUpdatedAt: number | null;
  isRefreshing: boolean;
  refreshState: WalletSessionRefreshState;
  sessionDropped: boolean;
  lastReconnectAt: number | null;
  connect: (
    adapter?: WalletProviderAdapter,
    opts?: { network?: string },
  ) => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
}

const DEFAULT_REFRESH_STATE: WalletSessionRefreshState = {
  phase: WalletSessionRefreshPhase.IDLE,
  trigger: "manual",
  attempt: 0,
  maxAttempts: 1,
  terminal: false,
};

function deriveStatus(
  sessionState: WalletSessionState,
  error: Error | null,
): WalletStatus {
  switch (sessionState) {
    case WalletSessionState.CONNECTING:
      return "CONNECTING";
    case WalletSessionState.CONNECTED:
      return "CONNECTED";
    case WalletSessionState.RECONNECTING:
      return "RECONNECTING";
    default:
      if (!error) return "DISCONNECTED";
      if (error instanceof ProviderNotFoundError) return "PROVIDER_MISSING";
      if (error instanceof RejectedSignatureError) return "PERMISSION_DENIED";
      if (error instanceof StaleSessionError) return "STALE_SESSION";
      return "ERROR";
  }
}

function deriveCapabilities(status: WalletStatus): WalletCapabilities {
  return {
    isConnected: status === "CONNECTED",
    isConnecting: status === "CONNECTING",
    isReconnecting: status === "RECONNECTING",
    canConnect:
      status === "DISCONNECTED" ||
      status === "PROVIDER_MISSING" ||
      status === "PERMISSION_DENIED" ||
      status === "STALE_SESSION" ||
      status === "ERROR",
  };
}

function mapToStatusError(error: Error | null): WalletStatusError | null {
  if (!error) return null;
  if (error instanceof ProviderNotFoundError) {
    return { code: error.code, message: error.message, recoverable: false };
  }
  if (error instanceof RejectedSignatureError) {
    return { code: error.code, message: error.message, recoverable: true };
  }
  if (error instanceof StaleSessionError) {
    return { code: error.code, message: error.message, recoverable: true };
  }
  if (error instanceof WalletSessionError) {
    return { code: error.code, message: error.message, recoverable: false };
  }
  return {
    code: "unknown_error",
    message: error.message ?? "Unknown error",
    recoverable: false,
  };
}

export function useWalletStatus(
  service?: WalletSessionService,
): UseWalletStatusReturn {
  const svcRef = useRef<WalletSessionService | null>(service ?? null);
  if (!svcRef.current) {
    svcRef.current = new WalletSessionService();
  }

  const [sessionState, setSessionState] = useState<WalletSessionState>(
    svcRef.current.getState(),
  );
  const [meta, setMeta] = useState<WalletSessionMeta | null>(
    svcRef.current.getMeta(),
  );
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(
    svcRef.current.getMeta()?.lastActiveAt ?? null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshState, setRefreshState] = useState<WalletSessionRefreshState>(
    svcRef.current.getRefreshState?.() ?? DEFAULT_REFRESH_STATE,
  );
  const [sessionDropped, setSessionDropped] = useState(
    svcRef.current.getSessionDropped?.() ?? false,
  );
  const [lastReconnectAt, setLastReconnectAt] = useState<number | null>(
    (svcRef.current.getRefreshState?.() ?? DEFAULT_REFRESH_STATE).lastSucceededAt ??
      null,
  );

  useEffect(() => {
    const unsubscribe = svcRef.current!.subscribe(
      (state, nextMeta, nextError, nextRefreshState, dropped) => {
        setSessionState(state);
        setMeta(nextMeta ?? null);
        setError(nextError ?? null);
        setSessionDropped(Boolean(dropped));

        if (nextRefreshState) {
          setRefreshState(nextRefreshState);
          if (
            nextRefreshState.trigger === "manual" &&
            nextRefreshState.phase === WalletSessionRefreshPhase.IDLE &&
            typeof nextRefreshState.lastSucceededAt === "number"
          ) {
            setLastReconnectAt(nextRefreshState.lastSucceededAt);
          }
        }

        if (nextMeta?.lastActiveAt) {
          setLastUpdatedAt(nextMeta.lastActiveAt);
        }
      },
    );

    return () => unsubscribe();
  }, []);

  const status = useMemo(
    () => deriveStatus(sessionState, error),
    [sessionState, error],
  );
  const capabilities = useMemo(() => deriveCapabilities(status), [status]);
  const statusError = useMemo(() => mapToStatusError(error), [error]);

  const connect = useCallback(
    async (
      adapter?: WalletProviderAdapter,
      opts?: { network?: string },
    ): Promise<void> => {
      if (adapter) {
        svcRef.current!.setProviderAdapter(adapter);
      }
      await svcRef.current!.connect(opts);
    },
    [],
  );

  const disconnect = useCallback(async (): Promise<void> => {
    await svcRef.current!.disconnect();
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await svcRef.current!.reconnect();
      setLastUpdatedAt(Date.now());
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return {
    status,
    address: meta?.address ?? null,
    network: meta?.network ?? null,
    provider: meta?.provider ?? null,
    capabilities,
    error: statusError,
    lastUpdatedAt,
    isRefreshing,
    refreshState,
    sessionDropped,
    lastReconnectAt,
    connect,
    disconnect,
    refresh,
  };
}

export default useWalletStatus;
