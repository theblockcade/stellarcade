"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, User } from 'lucide-react';
import { ApiClient } from '../services/typed-api-sdk';
import { AlertBanner } from './AlertBanner';
import GlobalStateStore from '../services/global-state-store';
import { useWalletStatus } from '../hooks/useWalletStatus';
import type { UserProfile } from '../types/api-client';
import './ProfileSettings.css';

export const profileStore = new GlobalStateStore();

const formatDate = (value?: string): string => {
  if (!value) return '—';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getStoreToken = () => {
  const token = profileStore.getState().auth.token ?? null;
  if (token) return token;
  if (process.env.NODE_ENV === 'development') {
    return 'test-jwt-token';
  }
  return null;
};

const createApiClient = () => {
  return new ApiClient({
    baseUrl: typeof window !== 'undefined' ? window.location.origin : '',
    sessionStore: {
      getToken: () => getStoreToken(),
    },
  });
};

function shortenAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const ProfileSettings: React.FC = () => {
  const walletStatus = useWalletStatus();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [copied, setCopied] = useState(false);
  const [xlmBalance, setXlmBalance] = useState<string | null>(null);

  const store = useRef<GlobalStateStore>(profileStore);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Load profile ---
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const persisted = store.current.selectProfile();
      if (persisted) {
        setProfile(persisted);
        setUsername(persisted.username ?? '');
        setLoading(false);
        return;
      }

      const client = createApiClient();
      const result = await client.getProfile();
      if (result.success) {
        setProfile(result.data);
        setUsername(result.data.username ?? '');
        store.current.dispatch({ type: 'PROFILE_SET', payload: { profile: result.data } });
      } else if (walletStatus.address) {
        const localProfile: UserProfile = {
          address: walletStatus.address,
          username: `Player_${walletStatus.address.slice(-4)}`,
          createdAt: new Date().toISOString(),
        };
        setProfile(localProfile);
        setUsername(localProfile.username);
      } else {
        setError(result.error.message);
      }

      setLoading(false);
    };

    loadProfile();
  }, [walletStatus.address]);

  // --- Fetch XLM balance ---
  useEffect(() => {
    if (!walletStatus.capabilities.isConnected || !walletStatus.address) {
      setXlmBalance(null);
      return;
    }

    let isMounted = true;
    const fetchBalance = async () => {
      try {
        const network = (walletStatus.network || '').toUpperCase();
        const isTestnet = network.includes('TEST');
        const horizonUrl = isTestnet
          ? 'https://horizon-testnet.stellar.org'
          : 'https://horizon.stellar.org';

        const res = await fetch(`${horizonUrl}/accounts/${walletStatus.address}`);
        if (!res.ok) return;
        const data = (await res.json()) as { balances?: Array<{ asset_type: string; balance: string }> };
        const native = data.balances?.find((b) => b.asset_type === 'native');
        if (native && isMounted) {
          const num = parseFloat(native.balance);
          setXlmBalance(num.toLocaleString(undefined, { maximumFractionDigits: 2 }));
        }
      } catch {
        // Non-fatal — horizon may be unreachable or account may not exist yet
      }
    };

    void fetchBalance();
    const interval = setInterval(() => void fetchBalance(), 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [walletStatus.capabilities.isConnected, walletStatus.address, walletStatus.network]);

  // --- Load profile from Cloud API ---
  useEffect(() => {
    const loadProfile = async () => {
      console.log('[ProfileSettings] loadProfile starting for address:', walletStatus.address);
      setLoading(true);
      setError(null);

      const client = createApiClient();
      console.log('[ProfileSettings] Calling client.getProfile()...');
      const result = await client.getProfile();
      console.log('[ProfileSettings] client.getProfile() result:', result);

      if (result?.success && result?.data) {
        console.log('[ProfileSettings] Cloud profile loaded successfully:', result.data);
        setProfile(result.data);
        setUsername(result.data.username ?? '');
        store.current.dispatch({ type: 'PROFILE_SET', payload: { profile: result.data } });
      } else {
        console.log('[ProfileSettings] Cloud profile not found or returned error, checking local fallback...');
        const persisted = store.current.selectProfile();
        if (persisted) {
          console.log('[ProfileSettings] Using local persisted profile:', persisted);
          setProfile(persisted);
          setUsername(persisted.username ?? '');
        } else if (walletStatus.address) {
          const defaultProfile: UserProfile = {
            address: walletStatus.address,
            username: `Player_${walletStatus.address.slice(-4)}`,
            createdAt: new Date().toISOString(),
          };
          console.log('[ProfileSettings] Using default wallet profile:', defaultProfile);
          setProfile(defaultProfile);
          setUsername(defaultProfile.username);
        }
      }

      setLoading(false);
    };

    loadProfile();
  }, [walletStatus.address]);

  // --- Derived state ---
  const walletMeta = useMemo(() => ({
    connected: walletStatus.capabilities.isConnected,
    address: walletStatus.address || '',
    network: walletStatus.network || 'Unknown',
  }), [walletStatus]);

  const hasDraftChanges = Boolean(profile && username.trim() !== (profile.username ?? '').trim());

  // --- Handlers ---
  const handleSave = async () => {
    console.log('[ProfileSettings] handleSave triggered!');
    setError(null);
    setSuccess(null);

    const trimmed = username.trim();
    if (!trimmed) {
      console.warn('[ProfileSettings] Username input is empty!');
      setError('Username is required.');
      return;
    }

    const targetAddress = profile?.address || walletStatus.address || 'G_GUEST_PLAYER';
    console.log('[ProfileSettings] Preparing update profile payload -> Address:', targetAddress, '| Username:', trimmed);
    setSaving(true);

    try {
      const client = createApiClient();
      console.log('[ProfileSettings] Sending updateProfile API POST request...');
      const result = await client.updateProfile({
        address: targetAddress,
        username: trimmed,
      });

      console.log('[ProfileSettings] API updateProfile response received:', result);

      if (result?.success) {
        console.log('[ProfileSettings] Profile successfully updated in cloud:', result.data);
        setProfile(result.data);
        setUsername(result.data.username ?? trimmed);
        store.current.dispatch({ type: 'PROFILE_SET', payload: { profile: result.data } });
        setSuccess('Profile saved successfully to cloud.');
      } else {
        const errMsg = result?.error?.message || 'Failed to save to cloud API.';
        console.error('[ProfileSettings] updateProfile failed with error:', errMsg);
        setError(errMsg);
      }
    } catch (err) {
      console.error('[ProfileSettings] updateProfile caught unexpected exception:', err);
      setError('Failed to update cloud profile.');
    } finally {
      console.log('[ProfileSettings] handleSave finished. Setting saving to false.');
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!walletMeta.address) return;
    try {
      await navigator.clipboard.writeText(walletMeta.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Non-fatal
    }
  };

  // --- Avatar initials ---
  const avatarInitial = useMemo(() => {
    if (!mounted) return '?';
    if (username) return username.charAt(0).toUpperCase();
    if (walletMeta.address) return walletMeta.address.charAt(0).toUpperCase();
    return '?';
  }, [mounted, username, walletMeta.address]);

  return (
    <section className="profile-page" aria-labelledby="profile-settings-heading">
      <h1 id="profile-settings-heading" className="profile-page-title">Profile Settings</h1>

      {error && (
        <AlertBanner variant="error" message={error} testId="profile-settings-error" />
      )}
      {success && (
        <AlertBanner variant="success" message={success} testId="profile-settings-success" />
      )}

      {/* ── Player Identity Card ── */}
      <div className="profile-identity-card" data-testid="profile-identity-card">
        <div className="profile-avatar" data-testid="profile-avatar">
          <span className="profile-avatar__initial">{avatarInitial}</span>
        </div>

        <div className="profile-info">
          <form
            onSubmit={(evt) => {
              evt.preventDefault();
              void handleSave();
            }}
            className="profile-username-form"
          >
            <div className="profile-input-group">
              <input
                id="profile-username"
                className="profile-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter display name"
                aria-label="Username"
                data-testid="profile-username-input"
              />
              <button
                type="submit"
                className={`profile-save-btn ${saving ? 'profile-save-btn--saving' : ''}`}
                disabled={!username.trim() || saving}
                data-testid="profile-settings-save"
              >
                {saving
                  ? (profile?.username ? 'Updating…' : 'Saving…')
                  : (profile?.username ? 'Update Profile' : 'Save Profile')}
              </button>
            </div>
            <p className="profile-persistence-caption">
              Your display name is linked to your connected Stellar wallet address.
            </p>
          </form>

          {mounted && walletMeta.address && (
            <div className="profile-address-row">
              <span className="profile-address-text" data-testid="profile-address">
                {shortenAddress(walletMeta.address)}
              </span>
              <button
                type="button"
                className="profile-address-copy"
                onClick={() => void handleCopy()}
                title="Copy full address"
                aria-label="Copy wallet address"
                data-testid="profile-address-copy"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          )}

          {mounted && walletMeta.connected && (
            <span className="profile-network-badge" data-testid="profile-network-badge">
              <span className="profile-network-dot" aria-hidden="true" />
              {walletMeta.network}
            </span>
          )}

          {mounted && (
            <div className="profile-social-row">
              {profile?.telegramLinked || profile?.telegramHandle || profile?.telegramUserId ? (
                <span className="profile-telegram-badge profile-telegram-badge--linked" data-testid="profile-telegram-linked">
                  <span className="profile-telegram-dot" aria-hidden="true" />
                  Telegram: {profile.telegramHandle || `@user_${profile.telegramUserId || 'linked'}`}
                </span>
              ) : (
                <a
                  href="/link"
                  className="profile-telegram-badge profile-telegram-badge--unlinked"
                  data-testid="profile-telegram-unlinked"
                >
                  + Link Telegram Bot
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Wallet Overview ── */}
      <div>
        <h2 className="profile-section-title">Wallet</h2>
        <div className="profile-wallet-row" data-testid="profile-wallet-row">
          <div className="profile-wallet-item profile-wallet-item--balance">
            <span className="profile-wallet-label">Balance</span>
            <span className="profile-wallet-value" data-testid="profile-wallet-balance">
              {mounted && xlmBalance !== null ? `${xlmBalance} XLM` : '—'}
            </span>
          </div>
          <div className="profile-wallet-item">
            <span className="profile-wallet-label">Status</span>
            <span className="profile-wallet-value">
              {mounted && walletMeta.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="profile-wallet-item">
            <span className="profile-wallet-label">Network</span>
            <span className="profile-wallet-value">{mounted ? walletMeta.network : 'Unknown'}</span>
          </div>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div>
        <h2 className="profile-section-title">Stats</h2>
        <div className="profile-stats-grid" data-testid="profile-stats-grid">
          <div className="profile-stat-card">
            <span className="profile-stat-label">Games Played</span>
            <span className="profile-stat-value">—</span>
            <span className="profile-stat-caption">Coming soon</span>
          </div>
          <div className="profile-stat-card">
            <span className="profile-stat-label">Win Rate</span>
            <span className="profile-stat-value">—</span>
            <span className="profile-stat-caption">Coming soon</span>
          </div>
          <div className="profile-stat-card">
            <span className="profile-stat-label">XLM Wagered</span>
            <span className="profile-stat-value">—</span>
            <span className="profile-stat-caption">Coming soon</span>
          </div>
          <div className="profile-stat-card">
            <span className="profile-stat-label">Member Since</span>
            <span className="profile-stat-value" data-testid="profile-member-since">
              {formatDate(profile?.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileSettings;
