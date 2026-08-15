import { NextResponse } from 'next/server';

import { isStellarPublicKey } from '@/utils/validation';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), '.data', 'user_profiles.json');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

interface StoredProfile {
  address: string;
  username: string;
  telegramHandle?: string;
  telegramUserId?: string;
  telegramLinked?: boolean;
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
    console.error('[API /users/update] Error reading profiles DB file:', e);
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
    console.log('[API /users/update] Successfully wrote updated profile to DB file:', DB_FILE);
  } catch (e) {
    console.error('[API /users/update] Error writing profiles DB file:', e);
  }
}

export async function POST(request: Request) {
  console.log('[API /users/update] Received POST request');
  try {
    const rawText = await request.text();
    const body = rawText ? JSON.parse(rawText) : {};
    const { address, username, telegramHandle, telegramUserId, ageConfirmed } = body || {};

    if (!address || !username) {
      return NextResponse.json(
        { error: 'Address and username are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const trimmedName = username.trim();
    const profiles = readProfiles();

    // Enforce Username Uniqueness across all registered players (case-insensitive)
    const normalizedUsername = trimmedName.toLowerCase();
    // Only real wallets reserve a username — see the note in create/route.ts
    // about the 'G_GUEST_PLAYER' sentinel rows an older client path wrote.
    const duplicate = Object.values(profiles).find(
      (p) =>
        p.address !== address &&
        isStellarPublicKey(p.address) &&
        p.username?.trim().toLowerCase() === normalizedUsername
    );

    if (duplicate) {
      console.warn(`[API /users/update] Username collision attempt for "${trimmedName}" by address ${address}`);
      return NextResponse.json(
        { error: 'This username is already taken. Please choose a different name.' },
        { status: 409, headers: corsHeaders }
      );
    }

    const existing = profiles[address] || {
      address,
      username: trimmedName,
      createdAt: new Date().toISOString(),
    };

    const updated: StoredProfile = {
      ...existing,
      username: trimmedName,
      ...(telegramHandle ? { telegramHandle } : {}),
      ...(telegramUserId ? { telegramUserId, telegramLinked: true } : {}),
      // Records the 18+ confirmation for a profile created before the age
      // gate existed. Only ever set, never cleared, and only on an explicit
      // `true` — absence must not read as consent.
      ...(ageConfirmed === true && !existing.ageConfirmedAt
        ? { ageConfirmedAt: new Date().toISOString() }
        : {}),
      updatedAt: new Date().toISOString(),
    };

    profiles[address] = updated;
    writeProfiles(profiles);

    console.log('[API /users/update] Profile updated:', updated);
    return NextResponse.json(updated, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    console.error('[API /users/update] Exception during update:', err);
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
