/**
 * VerseCraft Authentication System
 * COPPA-Compliant: Anonymous auth with parent gate
 * No PII collection - display names only
 */

import { supabase } from './supabase';

/**
 * Create an anonymous Supabase session (no email/password needed)
 */
export async function signInAnonymously() {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error('Anonymous sign-in error:', error);
      throw error;
    }

    return {
      session: data.session,
      user: data.user,
    };
  } catch (err) {
    console.error('Failed to sign in anonymously:', err);
    throw err;
  }
}

/**
 * Create a player profile linked to the current auth user
 * This stores the display name and campus selection (no PII)
 */
export async function createPlayerProfile(
  displayName: string,
  avatarId: string,
  campusId: string
) {
  try {
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session) {
      throw new Error('No active session. Please sign in first.');
    }

    const userId = authData.session.user.id;

    // Insert player profile
    const { data, error } = await supabase
      .from('players')
      .insert({
        id: userId, // Link to auth user
        display_name: displayName,
        avatar_id: avatarId,
        campus_id: campusId,
        is_anonymous: true,
        parent_consent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create player profile:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Error creating player profile:', err);
    throw err;
  }
}

/**
 * Get the current player's profile
 */
export async function getPlayerProfile() {
  try {
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session) {
      return null;
    }

    const userId = authData.session.user.id;

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (not an error, player just doesn't exist yet)
      console.error('Failed to fetch player profile:', error);
      throw error;
    }

    return data || null;
  } catch (err) {
    console.error('Error fetching player profile:', err);
    return null;
  }
}

/**
 * Sign out the current player
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (err) {
    console.error('Error signing out:', err);
    throw err;
  }
}

/**
 * Check if user is currently authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (err) {
    console.error('Error checking auth status:', err);
    return false;
  }
}

/**
 * Get current auth session
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (err) {
    console.error('Error getting session:', err);
    return null;
  }
}

/**
 * React hook for auth state management
 * Handles checking existing sessions and managing auth flow
 */
export function useAuth() {
  const [authState, setAuthState] = React.useState<{
    session: any | null;
    player: any | null;
    loading: boolean;
    error: Error | null;
  }>({
    session: null,
    player: null,
    loading: true,
    error: null,
  });

  React.useEffect(() => {
    async function checkAuth() {
      try {
        setAuthState((prev) => ({ ...prev, loading: true }));

        // Check if already authenticated
        const session = await getSession();
        if (!session) {
          setAuthState((prev) => ({
            ...prev,
            session: null,
            player: null,
            loading: false,
          }));
          return;
        }

        // Check if player profile exists
        const player = await getPlayerProfile();
        setAuthState((prev) => ({
          ...prev,
          session,
          player,
          loading: false,
        }));
      } catch (err) {
        setAuthState((prev) => ({
          ...prev,
          error: err instanceof Error ? err : new Error('Auth check failed'),
          loading: false,
        }));
      }
    }

    checkAuth();
  }, []);

  return authState;
}

// Import React for the hook
import React from 'react';
