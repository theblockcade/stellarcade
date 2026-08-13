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
  updatedAt?: string;
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

export async function GET(request: Request) {
  console.log('[API /users/profile] Received GET request');
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address') || request.headers.get('x-wallet-address');

  console.log('[API /users/profile] Address parameter:', address);

  const profiles = readProfiles();
  console.log('[API /users/profile] Current profiles in DB:', Object.keys(profiles));
  
  if (address && profiles[address]) {
    console.log('[API /users/profile] Found exact profile match for address:', profiles[address]);
    return NextResponse.json(profiles[address], { headers: corsHeaders });
  }

  // Return the most recently updated profile saved in cloud database
  const list = Object.values(profiles);
  if (list.length > 0) {
    list.sort((a, b) => {
      const timeA = Date.parse(a.updatedAt || a.createdAt || '0');
      const timeB = Date.parse(b.updatedAt || b.createdAt || '0');
      return timeB - timeA;
    });
    console.log('[API /users/profile] Returning most recently updated profile:', list[0]);
    return NextResponse.json(list[0], { headers: corsHeaders });
  }

  const fallback = {
    address: address || 'G_GUEST_PLAYER',
    username: address ? `Player_${address.slice(-4)}` : 'Player_Guest',
    createdAt: new Date().toISOString(),
  };
  console.log('[API /users/profile] No profiles in DB, returning fallback:', fallback);
  return NextResponse.json(fallback, { headers: corsHeaders });
}
