export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface AsyncActionResult<T, E = Error> {
  status: AsyncStatus;
  data: T | null;
  error: E | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
  isPendingSubmit: boolean;
}

export interface AsyncActionOptions<T, E = Error> {
  onSuccess?: (data: T) => void | Promise<void>;
  onError?: (error: E) => void | Promise<void>;
  preventConcurrent?: boolean;
}

export interface AsyncActionManager<T, E = Error, Args extends any[] = any[]> {
  state: AsyncActionResult<T, E>;
  run: (...args: Args) => Promise<T | undefined>;
  reset: () => void;
  cancel: () => void;
}
