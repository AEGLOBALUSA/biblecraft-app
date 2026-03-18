import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Campus, Hero, PlayerProgress, WeeklyContent, Leaderboard } from './database.types';

/**
 * Fetch all campuses from Supabase
 */
export function useSupabaseCampuses() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCampuses() {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('campuses')
          .select('*')
          .eq('active', true)
          .order('name');

        if (err) throw err;
        setCampuses(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch campuses'));
        console.error('Error fetching campuses:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCampuses();
  }, []);

  return { campuses, loading, error };
}

/**
 * Fetch all hero cards from Supabase
 */
export function useSupabaseHeroes() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchHeroes() {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('heroes')
          .select('*')
          .order('name');

        if (err) throw err;
        setHeroes(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch heroes'));
        console.error('Error fetching heroes:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHeroes();
  }, []);

  return { heroes, loading, error };
}

/**
 * Fetch and manage player progress
 */
export function usePlayerProgress(playerId: string | null) {
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!playerId) {
      setProgress(null);
      setLoading(false);
      return;
    }

    async function fetchProgress() {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('player_progress')
          .select('*')
          .eq('player_id', playerId)
          .single();

        if (err) throw err;
        setProgress(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch player progress'));
        console.error('Error fetching player progress:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [playerId]);

  // Helper to update progress
  const updateProgress = async (updates: Partial<PlayerProgress>) => {
    if (!playerId || !progress) return;
    try {
      const { data, error: err } = await supabase
        .from('player_progress')
        .update(updates)
        .eq('player_id', playerId)
        .select()
        .single();

      if (err) throw err;
      setProgress(data);
      return data;
    } catch (err) {
      console.error('Error updating player progress:', err);
      throw err;
    }
  };

  return { progress, loading, error, updateProgress };
}

/**
 * Fetch current week's content for a campus
 */
export function useWeeklyContent(campusId: string | null) {
  const [content, setContent] = useState<WeeklyContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!campusId) {
      setContent(null);
      setLoading(false);
      return;
    }

    async function fetchContent() {
      try {
        setLoading(true);
        // Get the Monday of this week
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        const weekStart = monday.toISOString().split('T')[0];

        const { data, error: err } = await supabase
          .from('weekly_content')
          .select('*')
          .eq('campus_id', campusId)
          .eq('week_start', weekStart)
          .eq('status', 'published')
          .single();

        if (err && err.code !== 'PGRST116') throw err; // PGRST116 = no rows
        setContent(data || null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch weekly content'));
        console.error('Error fetching weekly content:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [campusId]);

  return { content, loading, error };
}

/**
 * Fetch leaderboard for a campus (current week)
 */
export function useLeaderboard(campusId: string | null, limit: number = 10) {
  const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!campusId) {
      setLeaderboard([]);
      setLoading(false);
      return;
    }

    async function fetchLeaderboard() {
      try {
        setLoading(true);
        // Get the Monday of this week
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        const weekStart = monday.toISOString().split('T')[0];

        const { data, error: err } = await supabase
          .from('leaderboards')
          .select('*')
          .eq('campus_id', campusId)
          .eq('week_start', weekStart)
          .order('rank_xp_earned')
          .limit(limit);

        if (err) throw err;
        setLeaderboard(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch leaderboard'));
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [campusId, limit]);

  return { leaderboard, loading, error };
}
