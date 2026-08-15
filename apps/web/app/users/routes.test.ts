import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { POST } from "./create/route";
import { GET } from "./profile/route";

/*
 * The create and profile handlers both read and write the same
 * .data/user_profiles.json. Vitest runs separate test FILES in parallel
 * workers, so keeping these suites in one file is what stops them clobbering
 * each other's fixture mid-run.
 */

const DB_FILE = path.join(process.cwd(), ".data", "user_profiles.json");

const WALLET_A = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const WALLET_B = "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
const EXISTING_ADDRESS = WALLET_A;
const FRESH_ADDRESS = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";

let backup: string | null = null;

function writeDb(data: unknown) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function post(body: unknown) {
  return POST(
    new Request("http://localhost/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

function get(url: string) {
  return GET(new Request(url));
}

beforeEach(() => {
  backup = fs.existsSync(DB_FILE) ? fs.readFileSync(DB_FILE, "utf-8") : null;
  writeDb({});
});

afterEach(() => {
  if (backup === null) {
    if (fs.existsSync(DB_FILE)) fs.rmSync(DB_FILE);
  } else {
    fs.writeFileSync(DB_FILE, backup, "utf-8");
  }
});

describe("GET /users/profile", () => {
  beforeEach(() => {
    writeDb({
      [EXISTING_ADDRESS]: {
        address: EXISTING_ADDRESS,
        username: "already_taken",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
        ageConfirmedAt: "2026-01-01T00:00:00.000Z",
      },
    });
  });

  it("returns the profile belonging to the requested address", async () => {
    const res = await get(`http://localhost/users/profile?address=${EXISTING_ADDRESS}`);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      address: EXISTING_ADDRESS,
      username: "already_taken",
    });
  });

  /*
   * The handler used to fall back to "the most recently updated profile" when
   * the requested address had no record, so a brand-new wallet was handed a
   * different player's username and appeared already registered.
   */
  it("404s for an address with no profile instead of returning someone else's", async () => {
    const res = await get(`http://localhost/users/profile?address=${FRESH_ADDRESS}`);
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.code).toBe("PROFILE_NOT_FOUND");
    expect(JSON.stringify(body)).not.toContain("already_taken");
    expect(JSON.stringify(body)).not.toContain(EXISTING_ADDRESS);
  });

  /* It also used to synthesize `Player_<last4>` as a last resort. */
  it("never invents a username for an unknown address", async () => {
    const res = await get(`http://localhost/users/profile?address=${FRESH_ADDRESS}`);
    const body = await res.json();
    expect(body.username).toBeUndefined();
    expect(JSON.stringify(body)).not.toMatch(/Player_/);
  });

  it("400s when no address is supplied", async () => {
    const res = await get("http://localhost/users/profile");
    expect(res.status).toBe(400);
  });

  it("reads the address from the x-wallet-address header too", async () => {
    const res = await GET(
      new Request("http://localhost/users/profile", {
        headers: { "x-wallet-address": EXISTING_ADDRESS },
      }),
    );
    expect(res.status).toBe(200);
  });
});

describe("POST /users/create", () => {
  it("creates a profile and stamps the age confirmation", async () => {
    const res = await post({ address: WALLET_A, username: "nova_runner", ageConfirmed: true });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.username).toBe("nova_runner");
    expect(body.ageConfirmedAt).toEqual(expect.any(String));
  });

  it("refuses to create without the 18+ confirmation", async () => {
    const res = await post({ address: WALLET_A, username: "nova_runner" });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringMatching(/18 or over/i),
    });
  });

  it("refuses to invent a username when none is supplied", async () => {
    const res = await post({ address: WALLET_A, ageConfirmed: true });
    expect(res.status).toBe(400);

    const stored = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    expect(stored[WALLET_A]).toBeUndefined();
  });

  /*
   * An older client path fell back to the literal 'G_GUEST_PLAYER' when no
   * wallet was connected, writing a phantom account into the store. That row
   * then held a username hostage from the wallet that actually wanted it.
   */
  it("rejects an address that is not a Stellar public key", async () => {
    const res = await post({
      address: "G_GUEST_PLAYER",
      username: "nova_runner",
      ageConfirmed: true,
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringMatching(/valid Stellar public key/i),
    });
  });

  it("does not let a non-wallet row block a real wallet's username", async () => {
    writeDb({
      G_GUEST_PLAYER: {
        address: "G_GUEST_PLAYER",
        username: "CMI-James",
        createdAt: "2026-08-13T06:23:02.640Z",
      },
    });

    const res = await post({ address: WALLET_A, username: "CMI-James", ageConfirmed: true });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ username: "CMI-James" });
  });

  it("still blocks a username held by another real wallet", async () => {
    await post({ address: WALLET_A, username: "nova_runner", ageConfirmed: true });

    const res = await post({ address: WALLET_B, username: "NOVA_RUNNER", ageConfirmed: true });
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringMatching(/already taken/i),
    });
  });

  it("reports PROFILE_EXISTS so the client can fall back to an update", async () => {
    await post({ address: WALLET_A, username: "nova_runner", ageConfirmed: true });

    const res = await post({ address: WALLET_A, username: "nova_runner", ageConfirmed: true });
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ code: "PROFILE_EXISTS" });
  });

  it("enforces the username format", async () => {
    for (const username of ["ab", "x".repeat(21), "has spaces", "bad@char"]) {
      const res = await post({ address: WALLET_A, username, ageConfirmed: true });
      expect(res.status, `expected ${username} to be rejected`).toBe(400);
    }
  });
});
