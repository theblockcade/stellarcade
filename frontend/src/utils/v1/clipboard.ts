import { type AppError, ErrorDomain, ErrorSeverity } from '../../types/errors';

export type ClipboardWriteMethod = 'clipboard-api' | 'exec-command';
export type ClipboardWriteFailureReason = 'unsupported' | 'write-failed';

export interface ClipboardWriteSuccess {
  ok: true;
  method: ClipboardWriteMethod;
}

export interface ClipboardWriteFailure {
  ok: false;
  reason: ClipboardWriteFailureReason;
  error: AppError;
}

export type ClipboardWriteResult = ClipboardWriteSuccess | ClipboardWriteFailure;

export interface ClipboardWriteOptions {
  navigator?: Navigator;
  document?: Document;
}

export function isClipboardWriteSupported(
  options: ClipboardWriteOptions = {},
): boolean {
  return hasClipboardApi(options.navigator) || hasExecCommand(options.document);
}

export async function writeToClipboard(
  value: string,
  options: ClipboardWriteOptions = {},
): Promise<ClipboardWriteResult> {
  const navigatorRef = options.navigator ?? getNavigator();
  const documentRef = options.document ?? getDocument();
  const methodsTried: ClipboardWriteMethod[] = [];

  if (hasClipboardApi(navigatorRef)) {
    methodsTried.push('clipboard-api');

    try {
      await navigatorRef.clipboard.writeText(value);
      return {
        ok: true,
        method: 'clipboard-api',
      };
    } catch (error) {
      if (!hasExecCommand(documentRef)) {
        return {
          ok: false,
          reason: 'write-failed',
          error: createClipboardWriteFailedError(error, methodsTried),
        };
      }
    }
  }

  if (hasExecCommand(documentRef)) {
    methodsTried.push('exec-command');

    try {
      const copied = copyWithExecCommand(value, documentRef);
      if (copied) {
        return {
          ok: true,
          method: 'exec-command',
        };
      }

      return {
        ok: false,
        reason: 'write-failed',
        error: createClipboardWriteFailedError(
          new Error('document.execCommand("copy") returned false.'),
          methodsTried,
        ),
      };
    } catch (error) {
      return {
        ok: false,
        reason: 'write-failed',
        error: createClipboardWriteFailedError(error, methodsTried),
      };
    }
  }

  return {
    ok: false,
    reason: 'unsupported',
    error: createClipboardUnsupportedError(methodsTried),
  };
}

function copyWithExecCommand(value: string, documentRef: Document): boolean {
  if (!documentRef.body) {
    throw new Error('Document body is not available for clipboard fallback.');
  }

  const textarea = documentRef.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';

  documentRef.body.appendChild(textarea);

  const activeElement =
    documentRef.activeElement instanceof HTMLElement
      ? documentRef.activeElement
      : null;

  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, value.length);

  try {
    return documentRef.execCommand('copy');
  } finally {
    documentRef.body.removeChild(textarea);
    activeElement?.focus();
  }
}

function hasClipboardApi(navigatorRef?: Navigator): navigatorRef is Navigator & {
  clipboard: Clipboard;
} {
  return typeof navigatorRef?.clipboard?.writeText === 'function';
}

function hasExecCommand(documentRef?: Document): documentRef is Document {
  return (
    typeof documentRef?.execCommand === 'function' &&
    typeof documentRef?.createElement === 'function'
  );
}

function createClipboardUnsupportedError(
  methodsTried: ClipboardWriteMethod[],
): AppError {
  return {
    code: 'UNKNOWN',
    domain: ErrorDomain.UNKNOWN,
    severity: ErrorSeverity.USER_ACTIONABLE,
    message: 'Copy is not supported in this environment.',
    context: {
      feature: 'clipboard',
      methodsTried,
    },
  };
}

function createClipboardWriteFailedError(
  raw: unknown,
  methodsTried: ClipboardWriteMethod[],
): AppError {
  return {
    code: 'UNKNOWN',
    domain: ErrorDomain.UNKNOWN,
    severity: ErrorSeverity.RETRYABLE,
    message: 'Unable to copy to clipboard. Please try again.',
    originalError: raw,
    context: {
      feature: 'clipboard',
      methodsTried,
    },
    retryAfterMs: 1000,
  };
}

function getNavigator(): Navigator | undefined {
  return typeof globalThis.navigator === 'undefined' ? undefined : globalThis.navigator;
}

function getDocument(): Document | undefined {
  return typeof globalThis.document === 'undefined' ? undefined : globalThis.document;
}
