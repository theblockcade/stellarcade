import { NextResponse } from 'next/server';
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
  createdAt: string;
}

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

export async function POST(request: Request) {
  try {
    const rawText = await request.text();
    const body = rawText ? JSON.parse(rawText) : {};
    const { address, username } = body || {};

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const profiles = readProfiles();
    const chosenName = username ? username.trim() : `Player_${address.slice(-4)}`;

    // Enforce uniqueness if explicit username provided
    if (username) {
      const normalized = chosenName.toLowerCase();
      const duplicate = Object.values(profiles).find(
        (p) => p.address !== address && p.username?.trim().toLowerCase() === normalized
      );
      if (duplicate) {
        return NextResponse.json(
          { error: 'This username is already taken.' },
          { status: 409, headers: corsHeaders }
        );
      }
    }

    const profile = {
      address,
      username: chosenName,
      createdAt: new Date().toISOString(),
    };

    profiles[address] = profile;
    writeProfiles(profiles);

    return NextResponse.json(profile, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create profile';
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
