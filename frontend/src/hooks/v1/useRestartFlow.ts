/**
 * useRestartFlow — detect an abandoned multi-step confirmation sequence
 * and decide whether to prompt for restart-vs-resume on return (#786).
 *
 * Confirmation flows in this app are multi-step (e.g. "Review → Verify →
 * Submit") and live in `StickyActionsFooter` siblings. If a user leaves
 * mid-flow and comes back, the surface either: (a) silently keeps stale
 * state, or (b) silently restarts and loses progress. Both are confusing.
 * This hook is the brain behind a small prompt that asks the user.
 *
 * Storage: we use `sessionStorage` (per-tab) keyed by `flowId`. This is
 * sufficient because the prompt is intended for "I navigated away in this
 * tab and came back" — across-tab/across-device persistence belongs in
 * the draft-recovery service, which already exists for forms.
 */

import { useCallback, useEffect, useState } from "react";

export type RestartFlowDecision = "resume" | "restart" | "dismiss";

export interface FlowState {
  /** Unique id for the flow on a given page. */
  flowId: string;
  /** Step id the user reached before navigating away. */
  currentStepId: string;
  /** Optional descriptive label rendered in the prompt. */
  label?: string;
  /** Millisecond timestamp when the flow was last touched. */
  updatedAt: number;
}

const STORAGE_PREFIX = "stellarcade:restart-flow:";
/** Default expiry: a flow older than 30 minutes is too stale to resume. */
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
    /* swallow quota / disabled-storage errors */
  }
};

const clearFlow = (flowId: string): void => {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.removeItem(`${STORAGE_PREFIX}${flowId}`);
  } catch {
    /* swallow */
  }
};

export interface UseRestartFlowOptions {
  flowId: string;
  /** Override `now()` for testing. */
  now?: () => number;
  /** Override the default max age (30 minutes). */
  maxAgeMs?: number;
}

export interface UseRestartFlowReturn {
  /** Persisted state for the flow, if any. */
  persistedState: FlowState | null;
  /** Whether the prompt should be shown to the user. */
  showRestartPrompt: boolean;
  /** Persist progress for the active flow. */
  recordProgress: (currentStepId: string, label?: string) => void;
  /** Clear the persisted flow without prompting. */
  clear: () => void;
  /** Resolve the prompt with the user's decision. */
  resolve: (decision: RestartFlowDecision) => void;
}

export function useRestartFlow(
  options: UseRestartFlowOptions
): UseRestartFlowReturn {
  const { flowId, now = () => Date.now(), maxAgeMs = DEFAULT_MAX_AGE_MS } =
    options;

  const [persistedState, setPersistedState] = useState<FlowState | null>(null);
  const [resolved, setResolved] = useState(false);

  // On mount, hydrate from storage and decide whether to prompt.
  useEffect(() => {
    const stored = readFlow(flowId);
    if (!stored) {
      setPersistedState(null);
      return;
    }
    // Drop expired records so we don't prompt for stale flows.
    if (now() - stored.updatedAt > maxAgeMs) {
      clearFlow(flowId);
      setPersistedState(null);
      return;
    }
    setPersistedState(stored);
    setResolved(false);
    // `flowId` is the only meaningful dep; `now` / `maxAgeMs` are read on
    // mount and intentionally not re-applied.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId]);

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
