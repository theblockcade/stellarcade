/**
 * Reusable input validators and guards for Stellarcade.
 */

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationError };

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  field?: string;
  context?: Record<string, unknown>;
}

export enum ValidationErrorCode {
  Required = "REQUIRED",
  InvalidType = "INVALID_TYPE",
  OutOfRange = "OUT_OF_RANGE",
  InvalidFormat = "INVALID_FORMAT",
  InvalidEnum = "INVALID_ENUM",
  TooShort = "TOO_SHORT",
  TooLong = "TOO_LONG",
  InvalidAddress = "INVALID_ADDRESS",
  InvalidHash = "INVALID_HASH",
}

export interface WagerBounds {
  min: bigint;
  max: bigint;
}

export const DEFAULT_WAGER_BOUNDS: Readonly<WagerBounds> = Object.freeze({
  min: 10_000_000n, // 1 XLM
  max: 10_000_000_000n, // 1000 XLM
});

export function validateWager(
  value: bigint | string | number | null | undefined,
  bounds: Readonly<WagerBounds> = DEFAULT_WAGER_BOUNDS
): ValidationResult<bigint> {
  if (value === null || value === undefined || value === "") {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.Required,
        message: "Wager amount is required",
        field: "wager",
      },
    };
  }

  let parsed: bigint;
  try {
    parsed = typeof value === "bigint" ? value : BigInt(value);
  } catch {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.InvalidType,
        message: "Wager must be a valid integer",
        field: "wager",
        context: { value },
      },
    };
  }

  if (parsed <= 0n) {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.OutOfRange,
        message: "Wager must be greater than zero",
        field: "wager",
        context: { value: parsed.toString(), min: "1" },
      },
    };
  }

  if (parsed < bounds.min) {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.OutOfRange,
        message: `Wager must be at least ${bounds.min} stroops`,
        field: "wager",
        context: { value: parsed.toString(), min: bounds.min.toString() },
      },
    };
  }

  if (parsed > bounds.max) {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.OutOfRange,
        message: `Wager cannot exceed ${bounds.max} stroops`,
        field: "wager",
        context: { value: parsed.toString(), max: bounds.max.toString() },
      },
    };
  }

  return { success: true, data: parsed };
}

export function validateGameId(
  value: bigint | string | number | null | undefined
): ValidationResult<bigint> {
  if (value === null || value === undefined || value === "") {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.Required,
        message: "Game ID is required",
        field: "gameId",
      },
    };
  }

  let parsed: bigint;
  try {
    parsed = typeof value === "bigint" ? value : BigInt(value);
  } catch {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.InvalidType,
        message: "Game ID must be a valid integer",
        field: "gameId",
        context: { value },
      },
    };
  }

  if (parsed < 0n) {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.OutOfRange,
        message: "Game ID must be non-negative",
        field: "gameId",
        context: { value: parsed.toString() },
      },
    };
  }

  return { success: true, data: parsed };
}

export function validateBadgeId(
  value: bigint | string | number | null | undefined
): ValidationResult<bigint> {
  if (value === null || value === undefined || value === "") {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.Required,
        message: "Badge ID is required",
        field: "badgeId",
      },
    };
  }

  let parsed: bigint;
  try {
    parsed = typeof value === "bigint" ? value : BigInt(value);
  } catch {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.InvalidType,
        message: "Badge ID must be a valid integer",
        field: "badgeId",
        context: { value },
      },
    };
  }

  if (parsed < 0n) {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.OutOfRange,
        message: "Badge ID must be non-negative",
        field: "badgeId",
        context: { value: parsed.toString() },
      },
    };
  }

  return { success: true, data: parsed };
}

export function validateEnum<T extends string>(
  value: T | null | undefined,
  allowedValues: readonly T[],
  fieldName: string = "value"
): ValidationResult<T> {
  if (value === null || value === undefined || (value as string) === "") {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.Required,
        message: `${fieldName} is required`,
        field: fieldName,
      },
    };
  }

  if (!allowedValues.includes(value)) {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.InvalidEnum,
        message: `${fieldName} must be one of: ${allowedValues.join(", ")}`,
        field: fieldName,
        context: { value, allowedValues: [...allowedValues] },
      },
    };
  }

  return { success: true, data: value };
}

export function validateStellarAddress(
  value: string | null | undefined
): ValidationResult<string> {
  if (!value || value.trim() === "") {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.Required,
        message: "Stellar address is required",
        field: "address",
      },
    };
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith("G")) {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.InvalidAddress,
        message: "Stellar address must start with 'G'",
        field: "address",
        context: { value: trimmed },
      },
    };
  }

  if (trimmed.length !== 56) {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.InvalidAddress,
        message: "Stellar address must be exactly 56 characters",
        field: "address",
        context: { value: trimmed, length: trimmed.length },
      },
    };
  }

  if (!/^[A-Z2-7]{56}$/.test(trimmed)) {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.InvalidAddress,
        message: "Stellar address contains invalid characters",
        field: "address",
        context: { value: trimmed },
      },
    };
  }

  return { success: true, data: trimmed };
}

/**
 * Boolean form of {@link validateStellarAddress}, for places that only need
 * to know whether a stored key is a real wallet.
 *
 * The profile store was seeded with a `G_GUEST_PLAYER` sentinel by an older
 * code path that fell back to that literal when no wallet was connected. It
 * is not an account, but it occupied a username and so blocked a real wallet
 * from claiming that name.
 */
export function isStellarPublicKey(value: unknown): value is string {
  return typeof value === "string" && validateStellarAddress(value).success;
}

export function validateContractAddress(
  value: string | null | undefined
): ValidationResult<string> {
  if (!value || value.trim() === "") {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.Required,
        message: "Contract address is required",
        field: "contractAddress",
      },
    };
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith("C")) {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.InvalidAddress,
        message: "Contract address must start with 'C'",
        field: "contractAddress",
        context: { value: trimmed },
      },
    };
  }

  if (trimmed.length !== 56) {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.InvalidAddress,
        message: "Contract address must be exactly 56 characters",
        field: "contractAddress",
        context: { value: trimmed, length: trimmed.length },
      },
    };
  }

  if (!/^[A-Z2-7]{56}$/.test(trimmed)) {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.InvalidAddress,
        message: "Contract address contains invalid characters",
        field: "contractAddress",
        context: { value: trimmed },
      },
    };
  }

  return { success: true, data: trimmed };
}

export function validateSha256Hash(
  value: string | null | undefined
): ValidationResult<string> {
  if (!value || value.trim() === "") {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.Required,
        message: "Hash is required",
        field: "hash",
      },
    };
  }

  const trimmed = value.trim().toLowerCase();

  if (trimmed.length !== 64) {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.InvalidHash,
        message: "SHA-256 hash must be exactly 64 characters",
        field: "hash",
        context: { value: trimmed, length: trimmed.length },
      },
    };
  }

  if (!/^[0-9a-f]{64}$/.test(trimmed)) {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.InvalidHash,
        message: "Hash must contain only hexadecimal characters (0-9, a-f)",
        field: "hash",
        context: { value: trimmed },
      },
    };
  }

  return { success: true, data: trimmed };
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
