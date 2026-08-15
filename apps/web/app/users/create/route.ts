import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

import { isStellarPublicKey } from '@/utils/validation';

const DB_FILE = path.join(process.cwd(), '.data', 'user_profiles.json');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Wallet-Address',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

interface StoredProfile {
  address: string;
  username: string;
  createdAt: string;
  updatedAt?: string;
  /** ISO timestamp of the player's 18-or-over confirmation. */
  ageConfirmedAt?: string;
}

/** Usernames are the player's public identity, so keep them sane. */
const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]+$/;

function readProfiles(): Record<string, StoredProfile> {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // Return empty on error
  }
  return {};
}

function writeProfiles(data: Record<string, StoredProfile>) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Return on error
  }
}

/**
 * Create the profile for a wallet connecting for the first time.
 *
 * Both a username and an explicit 18-or-over confirmation are required. The
 * handler used to default the name to `Player_<last4>` when none was sent,
 * which meant a wallet could end up "registered" without its owner ever
 * choosing an identity or confirming their age.
 */
export async function POST(request: Request) {
  try {
    const rawText = await request.text();
    const body = rawText ? JSON.parse(rawText) : {};
    const { address, username, ageConfirmed } = body || {};

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    /*
     * Reject anything that is not a real Stellar public key. An older client
     * path fell back to the literal 'G_GUEST_PLAYER' when no wallet was
     * connected, which wrote a phantom account into the store that then held
     * a username hostage from the wallet that actually wanted it.
     */
    if (!isStellarPublicKey(address)) {
      return NextResponse.json(
        { error: 'A valid Stellar public key (G…) is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const chosenName = typeof username === 'string' ? username.trim() : '';

    if (!chosenName) {
      return NextResponse.json(
        { error: 'Choose a username to finish setting up your account.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (chosenName.length < USERNAME_MIN || chosenName.length > USERNAME_MAX) {
      return NextResponse.json(
        { error: `Username must be ${USERNAME_MIN}-${USERNAME_MAX} characters.` },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!USERNAME_PATTERN.test(chosenName)) {
      return NextResponse.json(
        { error: 'Username can only use letters, numbers, and . _ -' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (ageConfirmed !== true) {
      return NextResponse.json(
        { error: 'You must confirm you are 18 or over to play.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const profiles = readProfiles();

    if (profiles[address]) {
      return NextResponse.json(
        { error: 'A profile already exists for this address.', code: 'PROFILE_EXISTS' },
        { status: 409, headers: corsHeaders }
      );
    }

    const normalized = chosenName.toLowerCase();
    // Only real wallets can reserve a username; rows keyed by a non-address
    // sentinel are residue from the bug above and must not block anyone.
    const duplicate = Object.values(profiles).find(
      (p) =>
        p.address !== address &&
        isStellarPublicKey(p.address) &&
        p.username?.trim().toLowerCase() === normalized
    );
    if (duplicate) {
      return NextResponse.json(
        { error: 'This username is already taken. Please choose a different name.' },
        { status: 409, headers: corsHeaders }
      );
    }

    const now = new Date().toISOString();
    const profile: StoredProfile = {
      address,
      username: chosenName,
      createdAt: now,
      ageConfirmedAt: now,
    };

    profiles[address] = profile;
    writeProfiles(profiles);

    return NextResponse.json(profile, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create profile';
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
