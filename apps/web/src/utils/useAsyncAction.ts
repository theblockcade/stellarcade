import { AsyncStatus, AsyncActionResult } from "../types/async";

export function validateAsyncAction(action: unknown): asserts action is (...args: any[]) => Promise<any> {
  if (typeof action !== "function") {
    throw new Error("Async action must be a function");
  }
}

export function createInitialState<T, E = Error>(): AsyncActionResult<T, E> {
  return {
    status: "idle",
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    isIdle: true,
    isPendingSubmit: false,
  };
}

export function transitionState<T, E = Error>(
  status: AsyncStatus,
  data: T | null = null,
  error: E | null = null
): AsyncActionResult<T, E> {
  const isLoading = status === "loading";
  return {
    status,
    data,
    error,
    isLoading,
    isSuccess: status === "success",
    isError: status === "error",
    isIdle: status === "idle",
    isPendingSubmit: isLoading,
  };
}

export function canCommitAsyncAction(
  executionId: number,
  latestExecutionId: number,
  isMounted: boolean
): boolean {
  return isMounted && executionId === latestExecutionId;
}

export function cancelAsyncAction(latestExecutionId: number): number {
  return latestExecutionId + 1;
}

export function guardDependency<T>(dependency: T | undefined | null, name: string): T {
  if (dependency === undefined || dependency === null) {
    throw new Error(`Required dependency '${name}' is missing`);
  }
  return dependency;
}
