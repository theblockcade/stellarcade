import {
  isClipboardWriteSupported,
  writeToClipboard,
} from '@/utils/v1/clipboard';

describe('clipboard utility', () => {
  const originalExecCommandDescriptor = Object.getOwnPropertyDescriptor(
    document,
    'execCommand',
  );

  afterEach(() => {
    if (originalExecCommandDescriptor) {
      Object.defineProperty(document, 'execCommand', originalExecCommandDescriptor);
    } else {
      Reflect.deleteProperty(document, 'execCommand');
    }
  });

  it('writes with the Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    const result = await writeToClipboard('stellar', {
      navigator: {
        clipboard: {
          writeText,
        },
      } as unknown as Navigator,
      document: {} as Document,
    });

    expect(writeText).toHaveBeenCalledWith('stellar');
    expect(result).toEqual({
      ok: true,
      method: 'clipboard-api',
    });
  });

  it('falls back to execCommand when the Clipboard API is unavailable', async () => {
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    const result = await writeToClipboard('fallback copy', {
      navigator: {} as unknown as Navigator,
      document,
    });

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(result).toEqual({
      ok: true,
      method: 'exec-command',
    });
  });

  it('falls back to execCommand when the Clipboard API write fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('permission denied'));
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    const result = await writeToClipboard('fallback after rejection', {
      navigator: {
        clipboard: {
          writeText,
        },
      } as unknown as Navigator,
      document,
    });

    expect(writeText).toHaveBeenCalledWith('fallback after rejection');
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(result).toEqual({
      ok: true,
      method: 'exec-command',
    });
  });

  it('returns an unsupported result when no copy method exists', async () => {
    const result = await writeToClipboard('no support', {
      navigator: {} as unknown as Navigator,
      document: {} as Document,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected clipboard write to fail.');
    }

    expect(result.reason).toBe('unsupported');
    expect(result.error.code).toBe('CLIPBOARD_NOT_SUPPORTED');
    expect(result.error.domain).toBe('ui');
    expect(result.error.message).toBe('Copy is not supported in this environment.');
  });

  it('returns a failure result when execCommand fallback cannot copy', async () => {
    const execCommand = vi.fn().mockReturnValue(false);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    const result = await writeToClipboard('copy failure', {
      navigator: {} as unknown as Navigator,
      document,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected clipboard write to fail.');
    }

    expect(result.reason).toBe('write-failed');
    expect(result.error.code).toBe('CLIPBOARD_ERROR');
    expect(result.error.message).toBe('Unable to copy to clipboard. Please try again.');
  });

  it('detects supported and unsupported environments', () => {
    expect(
      isClipboardWriteSupported({
        navigator: {
          clipboard: {
            writeText: vi.fn(),
          },
        } as unknown as Navigator,
      }),
    ).toBe(true);

    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn(),
    });

    expect(
      isClipboardWriteSupported({
        document,
      }),
    ).toBe(true);

    expect(
      isClipboardWriteSupported({
        navigator: {} as unknown as Navigator,
        document: {} as Document,
      }),
    ).toBe(false);
  });
});
