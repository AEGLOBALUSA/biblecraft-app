/**
 * BibleCraft Database Types
 * Auto-generated types matching Supabase schema
 * Version: 1.0
 */

// ─────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────

export type ContentMode = 'default' | 'override';
export type WeeklyContentStatus = 'draft' | 'approved' | 'published';
export type AgeModeType = 'explorer' | 'adventurer';
export type HeroRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type TileStatus = 'locked' | 'current' | 'completed';
export type ActivityType =
  | 'build_completed'
  | 'verse_memorized'
  | 'hero_collected'
  | 'adventure_completed'
  | 'level_up'
  | 'streak_milestone'
  | 'mission_completed';
export type TreasureRarity = 'common' | 'rare' | 'epic' | 'legendary';

// ─────────────────────────────────────────────────────────────────
// CAMPUSES
// ─────────────────────────────────────────────────────────────────

export interface Campus {
  id: string;
  name: string;
  code: string;
  region: string | null;
  timezone: string;
  kids_pastor_id: string | null;
  content_mode: ContentMode;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────
// WEEKLY CONTENT (7 pastor inputs + AI generation)
// ─────────────────────────────────────────────────────────────────

export interface BibleStory {
  title: string;
  reference: string;
  summary: string;
}

export interface MemoryVerse {
  text: string;
  reference: string;
}

export interface WeeklyContent {
  id: string;
  campus_id: string;
  week_start: string; // ISO date: 2026-03-22
  theme: string;
  virtue: string;
  bible_story_title: string;
  bible_story_reference: string;
  bible_story_summary: string;
  memory_verse_text: string;
  memory_verse_reference: string;
  bottom_line: string;
  application: string;
  generated_content: GeneratedContentConfig | null;
  status: WeeklyContentStatus;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────
// GENERATED CONTENT (AI-produced game assets)
// ─────────────────────────────────────────────────────────────────

export interface BuildPieceConfig {
  emoji: string;
  name: string;
  position: string;
  order: number;
}

export interface BuildSceneConfig {
  scene_id: string;
  background: string;
  pieces: BuildPieceConfig[];
  completion_narration: string;
  verse_reveal: {
    reference: string;
    text: string;
  };
}

export interface VerseQuestRound {
  type: 'full_display' | 'blanks' | 'mostly_hidden' | 'full_recall';
  mode?: 'tap_along' | 'voice_or_type';
  hidden_words?: string[];
  visible_words?: string[];
  choices_include_distractors?: boolean;
}

export interface VerseQuestConfig {
  verse: string;
  reference: string;
  rounds: VerseQuestRound[];
}

export interface AdventureChoice {
  text: string;
  virtue?: string | null;
  advances?: boolean;
  is_scripture?: boolean;
  ref?: string;
  teaches?: string;
}

export interface AdventureScene {
  narration: string;
  choices: AdventureChoice[];
}

export interface ExploreAdventureConfig {
  story_id: string;
  scenes: AdventureScene[];
  conclusion: string;
}

export interface HeroCardConfig {
  hero: string;
  title: string;
  virtue: string;
  power: string;
  verse: string;
  story_summary: string;
  rarity: HeroRarity;
  art_prompt: string;
}

export interface TeamMissionGoals {
  builds_completed?: number;
  verses_memorized?: number;
  adventures_finished?: number;
  [key: string]: number | undefined;
}

export interface TeamMissionConfig {
  mission_title: string;
  description: string;
  goals: TeamMissionGoals;
  bronze_threshold?: number; // 0.3 = 30%
  silver_threshold?: number; // 0.6 = 60%
  gold_threshold?: number;   // 1.0 = 100%
  bronze_reward?: string;
  silver_reward?: string;
  gold_reward?: string;
  milestone_25?: string;
  milestone_50?: string;
  milestone_75?: string;
  milestone_100?: string;
  team_celebration?: string;
  reward: string;
  deadline: string; // ISO timestamp
}

export interface GeneratedContentConfig {
  build_scene: BuildSceneConfig;
  verse_quest: VerseQuestConfig;
  explore_adventure: ExploreAdventureConfig;
  hero_card: HeroCardConfig;
  team_mission: TeamMissionConfig;
  narration_scripts?: Record<string, string>;
  parent_summary?: Record<string, unknown>;
}

export interface GeneratedContent {
  id: string;
  weekly_content_id: string;
  build_scene_config: BuildSceneConfig;
  verse_quest_config: VerseQuestConfig;
  explore_adventure_config: ExploreAdventureConfig;
  hero_card_config: HeroCardConfig;
  team_mission_config: TeamMissionConfig;
  narration_scripts: Record<string, string> | null;
  parent_summary: Record<string, unknown> | null;
  generated_at: string;
  regenerated_at: string | null;
}

// ─────────────────────────────────────────────────────────────────
// CAMPUS CONTENT OVERRIDES
// ─────────────────────────────────────────────────────────────────

export interface CampusContentOverride {
  id: string;
  campus_id: string;
  week_start: string;
  override_theme: boolean;
  override_virtue: boolean;
  override_bible_story: boolean;
  override_memory_verse: boolean;
  override_bottom_line: boolean;
  override_application: boolean;
  override_team_mission: boolean;
  theme: string | null;
  virtue: string | null;
  bible_story_title: string | null;
  bible_story_reference: string | null;
  bible_story_summary: string | null;
  memory_verse_text: string | null;
  memory_verse_reference: string | null;
  bottom_line: string | null;
  application: string | null;
  team_mission_config: TeamMissionConfig | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────
// PLAYERS (Kids - COPPA compliant)
// ─────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  campus_id: string;
  display_name: string;
  avatar_url: string | null;
  avatar_id: string | null;
  age_mode: AgeModeType;
  active: boolean;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────
// PLAYER PROGRESS (XP, Level, Streaks)
// ─────────────────────────────────────────────────────────────────

export interface PlayerProgress {
  id: string;
  player_id: string;
  level: number; // 1-8
  xp_total: number;
  xp_session: number;
  current_streak: number;
  longest_streak: number;
  streak_paused: boolean;
  last_active_date: string | null;
  builds_completed: number;
  verses_memorized: number;
  adventures_completed: number;
  team_missions_contributed: number;
  heroes_collected: string[];
  badges_earned: string[];
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────
// HEROES & COLLECTIONS
// ─────────────────────────────────────────────────────────────────

export interface Hero {
  id: string;
  name: string;
  virtue: string;
  verse_text: string;
  verse_reference: string;
  story_summary: string;
  rarity: HeroRarity;
  power_name: string;
  power_description: string;
  icon_emoji: string | null;
  art_asset_url: string | null;
  art_prompt: string | null;
  is_seasonal: boolean;
  season: string | null;
  created_at: string;
}

export interface HeroCardCollectionItem {
  id: string;
  player_id: string;
  hero_id: string;
  collected_at: string;
  is_gold_variant: boolean;
  is_diamond_variant: boolean;
}

// ─────────────────────────────────────────────────────────────────
// KINGDOM TILES
// ─────────────────────────────────────────────────────────────────

export interface KingdomTile {
  id: string;
  player_id: string;
  title: string;
  description: string | null;
  bible_story_reference: string | null;
  verse_text: string | null;
  verse_reference: string | null;
  icon_emoji: string | null;
  status: TileStatus;
  completed_at: string | null;
  xp_earned: number;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────
// TEAMS & TEAM MISSIONS
// ─────────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  campus_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  player_id: string;
  joined_at: string;
}

export interface TeamMission {
  id: string;
  team_id: string;
  week_start: string;
  title: string;
  description: string | null;
  goals: TeamMissionGoals;
  builds_completed: number;
  verses_memorized: number;
  adventures_finished: number;
  deadline: string;
  completed_at: string | null;
  reward_description: string | null;
  reward_xp: number | null;
  unlock_bonus_content: boolean;
  bonus_content_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMissionContribution {
  id: string;
  team_mission_id: string;
  player_id: string;
  builds_contributed: number;
  verses_contributed: number;
  adventures_contributed: number;
  contributed_at: string;
}

// ─────────────────────────────────────────────────────────────────
// LEADERBOARDS
// ─────────────────────────────────────────────────────────────────

export interface Leaderboard {
  id: string;
  campus_id: string;
  player_id: string;
  week_start: string;
  rank_xp_earned: number | null;
  rank_builds_completed: number | null;
  rank_verses_memorized: number | null;
  rank_streak_days: number | null;
  xp_earned: number;
  builds_completed: number;
  verses_memorized: number;
  streak_days: number;
  calculated_at: string;
}

// ─────────────────────────────────────────────────────────────────
// ACTIVITY & EVENTS
// ─────────────────────────────────────────────────────────────────

export interface PlayerActivity {
  id: string;
  player_id: string;
  activity_type: ActivityType;
  xp_earned: number;
  content_reference: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────
// DAILY TREASURE CHESTS
// ─────────────────────────────────────────────────────────────────

export interface DailyTreasureChest {
  id: string;
  player_id: string;
  date_claimed: string;
  rarity: TreasureRarity;
  reward_name: string;
  reward_icon: string | null;
  xp_reward: number | null;
  is_streak_bonus: boolean;
  streak_day: number | null;
  opened_at: string;
}

// ─────────────────────────────────────────────────────────────────
// VIEW TYPES (for joined/enriched data)
// ─────────────────────────────────────────────────────────────────

export interface PlayerWithProgress extends Player {
  progress: PlayerProgress;
}

export interface HeroWithCollection extends Hero {
  collected_by_player?: boolean;
  variant?: 'standard' | 'gold' | 'diamond';
}

export interface TeamMissionWithTeam extends TeamMission {
  team: Team;
  campus: Campus;
}

export interface LeaderboardEntry extends Leaderboard {
  player: Player;
}

export interface WeeklyContentWithGenerated extends WeeklyContent {
  campus: Campus;
  generated: GeneratedContent | null;
  override: CampusContentOverride | null;
}

// ─────────────────────────────────────────────────────────────────
// API PAYLOAD TYPES
// ─────────────────────────────────────────────────────────────────

/**
 * What the pastor inputs - the 7 data points
 */
export interface PastorWeeklyInput {
  campus_id: string;
  week_of: string; // ISO date
  theme: string;
  virtue: string;
  bible_story: {
    title: string;
    reference: string;
    summary: string;
  };
  memory_verse: {
    text: string;
    reference: string;
  };
  bottom_line: string;
  application: string;
}

/**
 * Response when generating content
 */
export interface GenerateContentResponse {
  success: boolean;
  weekly_content_id: string;
  generated_content: GeneratedContent;
  status: 'draft' | 'approved' | 'published';
}

/**
 * Campus stats for dashboard
 */
export interface CampusStats {
  campus_id: string;
  campus_name: string;
  active_kids: number;
  total_kids: number;
  builds_this_week: number;
  verses_memorized_this_week: number;
  avg_daily_time_minutes: number;
  kids_with_7_day_streak: number;
  team_mission_completion_percent: number;
  using_default_content: boolean;
}

/**
 * Global HQ stats
 */
export interface HQStats {
  total_campuses: number;
  total_kids: number;
  total_active_kids: number;
  active_percentage: number;
  campuses_using_overrides: number;
  global_builds_this_week: number;
  global_verses_memorized: number;
  global_avg_streak_days: number;
  campus_stats: CampusStats[];
}

/**
 * Player profile for app
 */
export interface PlayerProfile extends Player {
  campus: Campus;
  progress: PlayerProgress;
  heroes_collected: Hero[];
  current_level_name: string;
  current_level_xp_required: number;
  xp_until_next_level: number;
}

/**
 * Team status with members
 */
export interface TeamStatus extends Team {
  members: (TeamMember & { player: Player })[];
  current_mission: (TeamMission & {
    contribution: TeamMissionContribution | null;
    goals_progress: {
      builds: number;
      verses: number;
      adventures: number;
    };
  }) | null;
}

// ─────────────────────────────────────────────────────────────────
// DATABASE
// ─────────────────────────────────────────────────────────────────

/**
 * Tables type registry
 */
export interface Database {
  public: {
    Tables: {
      campuses: { Row: Campus; Insert: Omit<Campus, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Campus, 'id' | 'created_at' | 'updated_at'>> };
      weekly_content: { Row: WeeklyContent; Insert: Omit<WeeklyContent, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<WeeklyContent, 'id' | 'created_at' | 'updated_at'>> };
      generated_content: { Row: GeneratedContent; Insert: Omit<GeneratedContent, 'id' | 'generated_at'>; Update: Partial<Omit<GeneratedContent, 'id' | 'generated_at'>> };
      campus_content_overrides: { Row: CampusContentOverride; Insert: Omit<CampusContentOverride, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<CampusContentOverride, 'id' | 'created_at' | 'updated_at'>> };
      players: { Row: Player; Insert: Omit<Player, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Player, 'id' | 'created_at' | 'updated_at'>> };
      player_progress: { Row: PlayerProgress; Insert: Omit<PlayerProgress, 'id' | 'updated_at'>; Update: Partial<Omit<PlayerProgress, 'id' | 'updated_at'>> };
      heroes: { Row: Hero; Insert: Omit<Hero, 'id' | 'created_at'>; Update: Partial<Omit<Hero, 'id' | 'created_at'>> };
      hero_card_collection: { Row: HeroCardCollectionItem; Insert: Omit<HeroCardCollectionItem, 'id' | 'collected_at'>; Update: Partial<Omit<HeroCardCollectionItem, 'id' | 'collected_at'>> };
      kingdom_tiles: { Row: KingdomTile; Insert: Omit<KingdomTile, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<KingdomTile, 'id' | 'created_at' | 'updated_at'>> };
      teams: { Row: Team; Insert: Omit<Team, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Team, 'id' | 'created_at' | 'updated_at'>> };
      team_members: { Row: TeamMember; Insert: Omit<TeamMember, 'id' | 'joined_at'>; Update: Partial<Omit<TeamMember, 'id' | 'joined_at'>> };
      team_missions: { Row: TeamMission; Insert: Omit<TeamMission, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<TeamMission, 'id' | 'created_at' | 'updated_at'>> };
      team_mission_contributions: { Row: TeamMissionContribution; Insert: Omit<TeamMissionContribution, 'id' | 'contributed_at'>; Update: Partial<Omit<TeamMissionContribution, 'id' | 'contributed_at'>> };
      leaderboards: { Row: Leaderboard; Insert: Omit<Leaderboard, 'id' | 'calculated_at'>; Update: Partial<Omit<Leaderboard, 'id' | 'calculated_at'>> };
      player_activity: { Row: PlayerActivity; Insert: Omit<PlayerActivity, 'id' | 'created_at'>; Update: Partial<Omit<PlayerActivity, 'id' | 'created_at'>> };
      daily_treasure_chests: { Row: DailyTreasureChest; Insert: Omit<DailyTreasureChest, 'id' | 'opened_at'>; Update: Partial<Omit<DailyTreasureChest, 'id' | 'opened_at'>> };
    };
    Views: {};
    Functions: {
      get_xp_for_level: { Args: { level_num: number }; Returns: number };
      get_level_name: { Args: { level_num: number }; Returns: string };
      calculate_level_from_xp: { Args: { total_xp: number }; Returns: number };
    };
  };
}
