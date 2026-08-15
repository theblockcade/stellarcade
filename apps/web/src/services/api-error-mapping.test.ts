import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiClient } from "./typed-api-sdk";

const WALLET = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

function mockFetch(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
      headers: new Headers({ "Content-Type": "application/json" }),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

/*
 * The app's own route handlers reply `{ "error": "<message>" }` — a string at
 * `body.error`. The mapper only read `body.error.message` and `body.message`,
 * so every one of those responses reached the UI as the useless
 * "Request failed with status 409", hiding what the user had to change.
 */
describe("ApiClient surfaces server error messages", () => {
  it("reads a string body.error on a 409", async () => {
    mockFetch(409, { error: "This username is already taken. Please choose a different name." });

    const client = new ApiClient({ sessionStore: { getToken: () => "t" } });
    const result = await client.createProfile({ address: WALLET, username: "taken" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toMatch(/already taken/i);
      expect(result.error.message).not.toMatch(/Request failed with status/);
      expect(result.error.status).toBe(409);
    }
  });

  it("reads a string body.error on a 400", async () => {
    mockFetch(400, { error: "You must confirm you are 18 or over to play." });

    const client = new ApiClient({ sessionStore: { getToken: () => "t" } });
    const result = await client.createProfile({ address: WALLET, username: "nova_runner" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toMatch(/18 or over/i);
      expect(result.error.message).not.toBe("Validation failed.");
    }
  });

  it("exposes the handler's machine-readable code as serverCode", async () => {
    mockFetch(409, {
      error: "A profile already exists for this address.",
      code: "PROFILE_EXISTS",
    });

    const client = new ApiClient({ sessionStore: { getToken: () => "t" } });
    const result = await client.createProfile({ address: WALLET, username: "nova_runner" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("API_CONFLICT");
      expect(result.error.serverCode).toBe("PROFILE_EXISTS");
    }
  });

  it("still falls back to a status message when the body carries none", async () => {
    mockFetch(409, {});

    const client = new ApiClient({ sessionStore: { getToken: () => "t" } });
    const result = await client.createProfile({ address: WALLET, username: "nova_runner" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toMatch(/status 409/);
    }
  });
});
