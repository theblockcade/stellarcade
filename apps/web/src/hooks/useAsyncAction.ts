"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { AsyncActionResult, AsyncActionOptions } from "../types/async";
import {
  canCommitAsyncAction,
  cancelAsyncAction,
  validateAsyncAction,
  createInitialState,
  transitionState,
} from "../utils/useAsyncAction";

export function useAsyncAction<T, E = Error, Args extends any[] = any[]>(
  action: (...args: Args) => Promise<T>,
  options: AsyncActionOptions<T, E> = {}
): AsyncActionResult<T, E> & {
  run: (...args: Args) => Promise<T | undefined>;
  reset: () => void;
  cancel: () => void;
} {
  const [state, setState] = useState<AsyncActionResult<T, E>>(() => createInitialState<T, E>());

  const { preventConcurrent = true } = options;
  const lastExecutionId = useRef(0);
  const isMountedRef = useRef(true);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      lastExecutionId.current = cancelAsyncAction(lastExecutionId.current);
    };
  }, []);

  const reset = useCallback(() => {
    lastExecutionId.current = cancelAsyncAction(lastExecutionId.current);
    setState(createInitialState<T, E>());
  }, []);

  const cancel = useCallback(() => {
    lastExecutionId.current = cancelAsyncAction(lastExecutionId.current);
    if (isMountedRef.current) {
      setState(createInitialState<T, E>());
    }
  }, []);

  const run = useCallback(
    async (...args: Args): Promise<T | undefined> => {
      validateAsyncAction(action);

      if (preventConcurrent && state.status === "loading") {
        return undefined;
      }

      const executionId = ++lastExecutionId.current;
      setState(transitionState<T, E>("loading"));

      try {
        const result = await action(...args);

        if (canCommitAsyncAction(executionId, lastExecutionId.current, isMountedRef.current)) {
          setState(transitionState<T, E>("success", result));
          if (optionsRef.current.onSuccess) {
            await optionsRef.current.onSuccess(result);
          }
        }
        return result;
      } catch (err) {
        if (canCommitAsyncAction(executionId, lastExecutionId.current, isMountedRef.current)) {
          const typedError = err as E;
          setState(transitionState<T, E>("error", null, typedError));
          if (optionsRef.current.onError) {
            await optionsRef.current.onError(typedError);
          }
        }
        throw err;
      }
    },
    [action, preventConcurrent, state.status]
  );

  return {
    ...state,
    run,
    reset,
    cancel,
  };
}

export default useAsyncAction;
