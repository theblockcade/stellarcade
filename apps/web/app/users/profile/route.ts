import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

function readProfiles(): Record<string, StoredProfile> {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('[API /users/profile] Error reading profiles DB file:', e);
  }
  return {};
}

/**
 * Look up the profile for one wallet address.
 *
 * Returns 404 when that address has no profile — which is a normal, expected
 * state for a wallet connecting for the first time, and the signal the client
 * uses to run first-run onboarding.
 *
 * Two previous fallbacks were removed here, both of which produced wrong
 * identities:
 *
 *   1. When the requested address had no record, the handler returned the
 *      most recently updated profile *belonging to some other address*. A
 *      fresh wallet would therefore adopt another player's username — a
 *      cross-account identity leak, not just a cosmetic bug.
 *   2. Failing that, it synthesized `Player_<last4>`. That let an
 *      unregistered wallet appear registered, so the app never asked the
 *      player to choose a name and the invented one could collide with a
 *      name a real player had already taken.
 *
 * A profile is only ever returned to the address that owns it.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address') || request.headers.get('x-wallet-address');

  if (!address) {
    return NextResponse.json(
      { error: 'A wallet address is required.' },
      { status: 400, headers: corsHeaders }
    );
  }

  const profiles = readProfiles();
  const profile = profiles[address];

  if (!profile) {
    return NextResponse.json(
      { error: 'No profile exists for this address.', code: 'PROFILE_NOT_FOUND' },
      { status: 404, headers: corsHeaders }
    );
  }

  return NextResponse.json(profile, { headers: corsHeaders });
}
