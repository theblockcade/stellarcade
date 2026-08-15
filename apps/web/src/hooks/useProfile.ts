"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchProfile,
  needsOnboarding,
  profileStore,
} from "../services/profile-service";
import type { UserProfile } from "../types/api-client";
import { useWalletStatus } from "./useWalletStatus";

export interface UseProfileResult {
  profile: UserProfile | null;
  isLoading: boolean;
  /** The connected wallet has no profile yet and must complete onboarding. */
  needsOnboarding: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Live view of the connected wallet's profile.
 *
 * Subscribes to the shared profileStore, so any surface that saves a profile
 * updates every other surface at once — the sidebar name changes the moment
 * the profile page saves, with no reload and no per-component fetching.
 */
export function useProfile(): UseProfileResult {
  const wallet = useWalletStatus();
  const [profile, setProfile] = useState<UserProfile | null>(() =>
    profileStore.selectProfile() ?? null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One subscription to the shared store keeps this in sync with writes made
  // anywhere else in the app.
  useEffect(() => {
    return profileStore.subscribe(() => {
      setProfile(profileStore.selectProfile() ?? null);
    });
  }, []);

  const address = wallet.address;
  const isConnected = wallet.capabilities.isConnected;

  const load = useCallback(async () => {
    if (!isConnected || !address) {
      profileStore.dispatch({ type: "PROFILE_CLEAR" });
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    const lookup = await fetchProfile(address);
    if (lookup.status === "error") {
      setError(lookup.message);
    }
    setIsLoading(false);
  }, [isConnected, address]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    profile,
    isLoading,
    // Only meaningful once a wallet is actually connected — a disconnected
    // visitor is not "un-onboarded", they simply have no wallet yet.
    needsOnboarding: isConnected && !isLoading && needsOnboarding(profile),
    error,
    refresh: load,
  };
}

export default useProfile;
