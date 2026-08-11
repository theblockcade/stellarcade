import { useCallback, useEffect, useState } from "react";

export type RestartFlowDecision = "resume" | "restart" | "dismiss";

export interface FlowState {
  flowId: string;
  currentStepId: string;
  label?: string;
  updatedAt: number;
}

const STORAGE_PREFIX = "stellarcade:restart-flow:";
const DEFAULT_MAX_AGE_MS = 30 * 60 * 1000;

const safeStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const readFlow = (flowId: string): FlowState | null => {
  const storage = safeStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(`${STORAGE_PREFIX}${flowId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FlowState;
    if (
      typeof parsed.flowId !== "string" ||
      typeof parsed.currentStepId !== "string" ||
      typeof parsed.updatedAt !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const writeFlow = (state: FlowState): void => {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(`${STORAGE_PREFIX}${state.flowId}`, JSON.stringify(state));
  } catch {
    // ignore
  }
};

const clearFlow = (flowId: string): void => {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.removeItem(`${STORAGE_PREFIX}${flowId}`);
  } catch {
    // ignore
  }
};

export interface UseRestartFlowOptions {
  flowId: string;
  now?: () => number;
  maxAgeMs?: number;
}

export interface UseRestartFlowReturn {
  persistedState: FlowState | null;
  showRestartPrompt: boolean;
  recordProgress: (currentStepId: string, label?: string) => void;
  clear: () => void;
  resolve: (decision: RestartFlowDecision) => void;
}

export function useRestartFlow(
  options: UseRestartFlowOptions
): UseRestartFlowReturn {
  const { flowId, now = () => Date.now(), maxAgeMs = DEFAULT_MAX_AGE_MS } =
    options;

  const [persistedState, setPersistedState] = useState<FlowState | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const stored = readFlow(flowId);
    if (!stored) {
      setPersistedState(null);
      return;
    }
    if (now() - stored.updatedAt > maxAgeMs) {
      clearFlow(flowId);
      setPersistedState(null);
      return;
    }
    setPersistedState(stored);
    setResolved(false);
  }, [flowId, maxAgeMs, now]);

  const recordProgress = useCallback(
    (currentStepId: string, label?: string) => {
      const next: FlowState = {
        flowId,
        currentStepId,
        label,
        updatedAt: now(),
      };
      writeFlow(next);
      setPersistedState(next);
    },
    [flowId, now]
  );

  const clear = useCallback(() => {
    clearFlow(flowId);
    setPersistedState(null);
    setResolved(true);
  }, [flowId]);

  const resolve = useCallback(
    (decision: RestartFlowDecision) => {
      if (decision === "restart" || decision === "dismiss") {
        clearFlow(flowId);
        setPersistedState(null);
      }
      setResolved(true);
    },
    [flowId]
  );

  return {
    persistedState,
    showRestartPrompt: persistedState !== null && !resolved,
    recordProgress,
    clear,
    resolve,
  };
}

export default useRestartFlow;
