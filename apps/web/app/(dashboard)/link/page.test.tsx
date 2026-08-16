import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const connect = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => {
      const params: Record<string, string> = {
        challenge: "test-challenge-abc",
        platform: "telegram",
        userId: "944872850",
      };
      return params[key] ?? null;
    },
  }),
}));

vi.mock("@/hooks/useWalletStatus", () => ({
  useWalletStatus: () => ({
    address: "GALICE1234567890",
    capabilities: { isConnected: true },
    connect,
  }),
}));

const signMessage = vi.fn().mockResolvedValue("c2ln");
vi.mock("@/services/freighter-adapter", () => ({
  default: { signMessage },
}));

function mockFetchSequence(responses: Array<{ status: number; body: unknown }>): void {
  const mock = vi.fn();
  for (const r of responses) {
    mock.mockResolvedValueOnce({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: async () => r.body,
    } as Response);
  }
  global.fetch = mock;
}

const { default: LinkPage } = await import("./page.js");

describe("LinkPage — Telegram sync on sign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signMessage.mockResolvedValue("c2ln");
  });

  it("syncs telegram fields even with no cached username in the store", async () => {
    mockFetchSequence([
      { status: 201, body: { address: "GALICE1234567890", createdAt: "2026-01-01" } },
      {
        status: 200,
        body: {
          address: "GALICE1234567890",
          telegramLinked: true,
          telegramUserId: "944872850",
          createdAt: "2026-01-01",
        },
      },
    ]);

    render(<LinkPage />);
    fireEvent.click(screen.getByText("Sign Challenge with Freighter"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    const [createCall, updateCall] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(createCall[0]).toContain("/users/create");
    expect(updateCall[0]).toContain("/users/update");

    const updateBody = JSON.parse(updateCall[1].body as string);
    expect(updateBody).toEqual(
      expect.objectContaining({
        address: "GALICE1234567890",
        telegramUserId: "944872850",
        telegramHandle: "@user_944872850",
      })
    );
    // No cached username — must not invent one.
    expect(updateBody.username).toBeUndefined();
  });

  it("shows the copyable /link command once signing succeeds, regardless of sync outcome", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    render(<LinkPage />);
    fireEvent.click(screen.getByText("Sign Challenge with Freighter"));

    await waitFor(
      () => {
        expect(screen.getByText(/Challenge signed successfully/)).toBeInTheDocument();
      },
      { timeout: 10_000 }
    );
  }, 15_000);
});
