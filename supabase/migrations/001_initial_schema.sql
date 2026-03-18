-- BibleCraft Initial Database Schema
-- Version: 1.0
-- Multi-campus game platform for ages 5-8

-- ─────────────────────────────────────────────────────────────────
-- 1. CAMPUSES
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE, -- futures-north, futures-south, etc.
  region TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Chicago',
  kids_pastor_id UUID, -- Future FK to auth.users
  content_mode TEXT NOT NULL DEFAULT 'default', -- 'default' or 'override'
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CHECK (content_mode IN ('default', 'override'))
);

CREATE INDEX idx_campuses_code ON campuses(code);
CREATE INDEX idx_campuses_active ON campuses(active);

-- ─────────────────────────────────────────────────────────────────
-- 2. WEEKLY CONTENT (Pastor inputs: 7 data points)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE weekly_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- ISO 8601 date: 2026-03-22

  -- 7 Core Content Inputs
  theme TEXT NOT NULL, -- "Courage"
  virtue TEXT NOT NULL, -- "Bravery"
  bible_story_title TEXT NOT NULL, -- "David and Goliath"
  bible_story_reference TEXT NOT NULL, -- "1 Samuel 17"
  bible_story_summary TEXT NOT NULL, -- Story description
  memory_verse_text TEXT NOT NULL, -- Full verse text
  memory_verse_reference TEXT NOT NULL, -- "Joshua 1:9"
  bottom_line TEXT NOT NULL, -- "God is bigger than anything you face"
  application TEXT NOT NULL, -- How it applies to kids' lives

  -- Generated Content (JSON)
  generated_content JSONB,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'approved', 'published'
  created_by UUID, -- FK to auth.users
  approved_by UUID, -- FK to auth.users
  approved_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(campus_id, week_start),
  CHECK (status IN ('draft', 'approved', 'published'))
);

CREATE INDEX idx_weekly_content_campus ON weekly_content(campus_id);
CREATE INDEX idx_weekly_content_week ON weekly_content(week_start);
CREATE INDEX idx_weekly_content_status ON weekly_content(status);
CREATE INDEX idx_weekly_content_campus_week ON weekly_content(campus_id, week_start);

-- ─────────────────────────────────────────────────────────────────
-- 3. GENERATED CONTENT (AI-generated game assets)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_content_id UUID NOT NULL REFERENCES weekly_content(id) ON DELETE CASCADE,

  -- Build Scene
  build_scene_config JSONB NOT NULL, -- Pieces, positions, narration

  -- Verse Quest
  verse_quest_config JSONB NOT NULL, -- Rounds, hidden words, difficulty

  -- Explore Adventure
  explore_adventure_config JSONB NOT NULL, -- Scenes, choices, outcomes

  -- Hero Card
  hero_card_config JSONB NOT NULL, -- Name, virtue, power, art

  -- Team Mission
  team_mission_config JSONB NOT NULL, -- Goals, deadline, rewards

  -- Narration Scripts
  narration_scripts JSONB, -- Voice-over scripts

  -- Parent Summary
  parent_summary JSONB, -- Weekly email content

  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  regenerated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_generated_content_weekly ON generated_content(weekly_content_id);

-- ─────────────────────────────────────────────────────────────────
-- 4. CAMPUS CONTENT OVERRIDES
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE campus_content_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,

  -- Which fields are being overridden
  override_theme BOOLEAN DEFAULT false,
  override_virtue BOOLEAN DEFAULT false,
  override_bible_story BOOLEAN DEFAULT false,
  override_memory_verse BOOLEAN DEFAULT false,
  override_bottom_line BOOLEAN DEFAULT false,
  override_application BOOLEAN DEFAULT false,
  override_team_mission BOOLEAN DEFAULT false,

  -- Override values
  theme TEXT,
  virtue TEXT,
  bible_story_title TEXT,
  bible_story_reference TEXT,
  bible_story_summary TEXT,
  memory_verse_text TEXT,
  memory_verse_reference TEXT,
  bottom_line TEXT,
  application TEXT,
  team_mission_config JSONB,

  created_by UUID, -- FK to auth.users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(campus_id, week_start)
);

CREATE INDEX idx_overrides_campus ON campus_content_overrides(campus_id);
CREATE INDEX idx_overrides_week ON campus_content_overrides(week_start);

-- ─────────────────────────────────────────────────────────────────
-- 5. PLAYERS (Kids - COPPA compliant, no PII)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,

  -- Parent-set display name (no real name, no PII)
  display_name TEXT NOT NULL,
  avatar_url TEXT, -- Asset URL to avatar
  avatar_id TEXT, -- Which avatar selected (emoji or asset)

  age_mode TEXT NOT NULL DEFAULT 'explorer', -- 'explorer' or 'adventurer'

  active BOOLEAN NOT NULL DEFAULT true,
  last_active_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CHECK (age_mode IN ('explorer', 'adventurer'))
);

CREATE INDEX idx_players_campus ON players(campus_id);
CREATE INDEX idx_players_active ON players(active);

-- ─────────────────────────────────────────────────────────────────
-- 6. PLAYER PROGRESS (XP, Level, Streaks)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE player_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,

  -- Level & XP
  level INTEGER NOT NULL DEFAULT 1, -- Level 1-8
  xp_total INTEGER NOT NULL DEFAULT 0,
  xp_session INTEGER NOT NULL DEFAULT 0, -- XP in current week

  -- Streaks
  current_streak INTEGER NOT NULL DEFAULT 0, -- Days in current streak
  longest_streak INTEGER NOT NULL DEFAULT 0,
  streak_paused BOOLEAN DEFAULT false, -- Grace period allows pause without reset
  last_active_date DATE,

  -- Stats
  builds_completed INTEGER NOT NULL DEFAULT 0,
  verses_memorized INTEGER NOT NULL DEFAULT 0,
  adventures_completed INTEGER NOT NULL DEFAULT 0,
  team_missions_contributed INTEGER NOT NULL DEFAULT 0,

  -- Collected Heroes (array of hero IDs)
  heroes_collected UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],

  -- Badges (text array)
  badges_earned TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_progress_player ON player_progress(player_id);
CREATE INDEX idx_progress_level ON player_progress(level);

-- ─────────────────────────────────────────────────────────────────
-- 7. HERO CARD COLLECTION
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE heroes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL UNIQUE,
  virtue TEXT NOT NULL,
  verse_text TEXT NOT NULL,
  verse_reference TEXT NOT NULL,
  story_summary TEXT NOT NULL,

  rarity TEXT NOT NULL, -- 'common', 'rare', 'epic', 'legendary'
  power_name TEXT NOT NULL, -- E.g., "Faith Strike"
  power_description TEXT NOT NULL,

  icon_emoji TEXT, -- E.g., "👑"
  art_asset_url TEXT, -- Image URL
  art_prompt TEXT, -- For AI generation

  is_seasonal BOOLEAN DEFAULT false,
  season TEXT, -- 'advent', 'easter', 'vbs', etc.

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
);

CREATE INDEX idx_heroes_rarity ON heroes(rarity);
CREATE INDEX idx_heroes_seasonal ON heroes(is_seasonal);

-- ─────────────────────────────────────────────────────────────────
-- 8. HERO CARD COLLECTION (Player-specific)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE hero_card_collection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  hero_id UUID NOT NULL REFERENCES heroes(id) ON DELETE CASCADE,

  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_gold_variant BOOLEAN DEFAULT false, -- Rarer variant
  is_diamond_variant BOOLEAN DEFAULT false, -- Ultra-rare variant

  UNIQUE(player_id, hero_id)
);

CREATE INDEX idx_collection_player ON hero_card_collection(player_id);
CREATE INDEX idx_collection_hero ON hero_card_collection(hero_id);

-- ─────────────────────────────────────────────────────────────────
-- 9. KINGDOM TILES (Kingdom map progress per player)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE kingdom_tiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,

  bible_story_reference TEXT,
  verse_text TEXT,
  verse_reference TEXT,

  icon_emoji TEXT,

  status TEXT NOT NULL DEFAULT 'locked', -- 'locked', 'current', 'completed'
  completed_at TIMESTAMP WITH TIME ZONE,

  xp_earned INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CHECK (status IN ('locked', 'current', 'completed'))
);

CREATE INDEX idx_tiles_player ON kingdom_tiles(player_id);
CREATE INDEX idx_tiles_status ON kingdom_tiles(status);

-- ─────────────────────────────────────────────────────────────────
-- 10. TEAMS (Per-campus team for group missions)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,

  name TEXT NOT NULL, -- E.g., "Faith Builders"
  description TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(campus_id, name)
);

CREATE INDEX idx_teams_campus ON teams(campus_id);

-- ─────────────────────────────────────────────────────────────────
-- 11. TEAM MEMBERS (Join table)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(team_id, player_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_player ON team_members(player_id);

-- ─────────────────────────────────────────────────────────────────
-- 12. TEAM MISSIONS (Weekly team challenges)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE team_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,

  title TEXT NOT NULL, -- "The Courage Challenge"
  description TEXT,

  -- Goals (JSONB for flexibility)
  goals JSONB NOT NULL, -- { builds_required: 15, verses_required: 5, adventures_required: 10 }

  -- Progress tracking
  builds_completed INTEGER DEFAULT 0,
  verses_memorized INTEGER DEFAULT 0,
  adventures_finished INTEGER DEFAULT 0,

  -- Deadline
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Rewards
  reward_description TEXT,
  reward_xp INTEGER,
  unlock_bonus_content BOOLEAN DEFAULT false,
  bonus_content_id UUID, -- FK to generated_content (bonus scene)

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(team_id, week_start)
);

CREATE INDEX idx_missions_team ON team_missions(team_id);
CREATE INDEX idx_missions_week ON team_missions(week_start);
CREATE INDEX idx_missions_deadline ON team_missions(deadline);

-- ─────────────────────────────────────────────────────────────────
-- 13. TEAM MISSION CONTRIBUTIONS
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE team_mission_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_mission_id UUID NOT NULL REFERENCES team_missions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  builds_contributed INTEGER DEFAULT 0,
  verses_contributed INTEGER DEFAULT 0,
  adventures_contributed INTEGER DEFAULT 0,

  contributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(team_mission_id, player_id)
);

CREATE INDEX idx_contributions_mission ON team_mission_contributions(team_mission_id);
CREATE INDEX idx_contributions_player ON team_mission_contributions(player_id);

-- ─────────────────────────────────────────────────────────────────
-- 14. LEADERBOARDS (Per-campus leaderboards)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,

  -- Rankings by category
  rank_xp_earned INTEGER,
  rank_builds_completed INTEGER,
  rank_verses_memorized INTEGER,
  rank_streak_days INTEGER,

  -- Values
  xp_earned INTEGER DEFAULT 0,
  builds_completed INTEGER DEFAULT 0,
  verses_memorized INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,

  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(campus_id, player_id, week_start)
);

CREATE INDEX idx_leaderboards_campus ON leaderboards(campus_id);
CREATE INDEX idx_leaderboards_week ON leaderboards(week_start);
CREATE INDEX idx_leaderboards_xp ON leaderboards(rank_xp_earned);

-- ─────────────────────────────────────────────────────────────────
-- 15. PLAYER ACTIVITY LOG
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE player_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  activity_type TEXT NOT NULL, -- 'build_completed', 'verse_memorized', 'hero_collected', 'adventure_completed'

  xp_earned INTEGER DEFAULT 0,

  -- Context
  content_reference TEXT, -- hero id, build id, etc.
  data JSONB, -- Additional event data

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CHECK (activity_type IN ('build_completed', 'verse_memorized', 'hero_collected', 'adventure_completed', 'level_up', 'streak_milestone', 'mission_completed'))
);

CREATE INDEX idx_activity_player ON player_activity(player_id);
CREATE INDEX idx_activity_type ON player_activity(activity_type);
CREATE INDEX idx_activity_created ON player_activity(created_at);

-- ─────────────────────────────────────────────────────────────────
-- 16. DAILY TREASURE CHESTS
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE daily_treasure_chests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  date_claimed DATE NOT NULL,

  -- Rarity & Contents
  rarity TEXT NOT NULL DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  reward_name TEXT NOT NULL,
  reward_icon TEXT,

  xp_reward INTEGER,
  is_streak_bonus BOOLEAN DEFAULT false,
  streak_day INTEGER, -- Which day of streak

  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(player_id, date_claimed),
  CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
);

CREATE INDEX idx_chest_player ON daily_treasure_chests(player_id);
CREATE INDEX idx_chest_date ON daily_treasure_chests(date_claimed);

-- ─────────────────────────────────────────────────────────────────
-- SEED DATA: 21 FUTURES CHURCH CAMPUSES
-- ─────────────────────────────────────────────────────────────────

INSERT INTO campuses (name, code, region, timezone) VALUES
('Futures North', 'futures-north', 'North', 'America/Chicago'),
('Futures South', 'futures-south', 'South', 'America/Chicago'),
('Futures East', 'futures-east', 'East', 'America/Chicago'),
('Futures CBD', 'futures-cbd', 'Central', 'America/Chicago'),
('Futures West', 'futures-west', 'West', 'America/Chicago'),
('Futures Coast', 'futures-coast', 'Coastal', 'America/Chicago'),
('Futures Hills', 'futures-hills', 'Hills', 'America/Chicago'),
('Futures Central', 'futures-central', 'Central', 'America/Chicago'),
('Futures Springs', 'futures-springs', 'Springs', 'America/Chicago'),
('Futures Valley', 'futures-valley', 'Valley', 'America/Chicago'),
('Futures Downtown', 'futures-downtown', 'Downtown', 'America/Chicago'),
('Futures Midtown', 'futures-midtown', 'Midtown', 'America/Chicago'),
('Futures Uptown', 'futures-uptown', 'Uptown', 'America/Chicago'),
('Futures Westside', 'futures-westside', 'Westside', 'America/Chicago'),
('Futures Eastside', 'futures-eastside', 'Eastside', 'America/Chicago'),
('Futures Northside', 'futures-northside', 'Northside', 'America/Chicago'),
('Futures Southside', 'futures-southside', 'Southside', 'America/Chicago'),
('Futures Riverside', 'futures-riverside', 'Riverside', 'America/Chicago'),
('Futures Lakeside', 'futures-lakeside', 'Lakeside', 'America/Chicago'),
('Futures Parkside', 'futures-parkside', 'Parkside', 'America/Chicago'),
('Futures Station', 'futures-station', 'Station', 'America/Chicago');

-- ─────────────────────────────────────────────────────────────────
-- SEED DATA: 12 Base Heroes
-- ─────────────────────────────────────────────────────────────────

INSERT INTO heroes (name, virtue, verse_text, verse_reference, story_summary, rarity, power_name, power_description, icon_emoji, is_seasonal) VALUES
('David', 'Courage', 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.', 'Joshua 1:9', 'A young shepherd who defeated a giant because he trusted God more than he feared the enemy.', 'legendary', 'Faith Strike', 'Face any challenge with confidence', '👑', false),
('Noah', 'Obedience', 'Noah did everything just as God commanded him.', 'Genesis 6:22', 'Built an ark when no one else believed rain was coming, trusting God through doubt and ridicule.', 'rare', 'Ark Builder', 'Create shelter and protection', '🧓', false),
('Esther', 'Bravery', 'Perhaps you were made for such a time as this.', 'Esther 4:14', 'Risked her life to save her people from destruction through courage and wise planning.', 'epic', 'Royal Courage', 'Turn danger into opportunity', '👩', false),
('Moses', 'Faith', 'By faith he left Egypt, not fearing the king''s anger.', 'Hebrews 11:27', 'Led God''s people out of slavery and through the Red Sea, trusting God at every step.', 'rare', 'Parting Seas', 'Overcome impossible obstacles', '🧔', false),
('Daniel', 'Devotion', 'My God sent his angel, and he shut the mouths of the lions.', 'Daniel 6:22', 'Prayed to God even when it meant being thrown to the lions, never compromising his faith.', 'rare', 'Lion''s Protection', 'Defend your faith against all odds', '🦁', false),
('Ruth', 'Loyalty', 'Where you go I will go, and where you stay I will stay.', 'Ruth 1:16', 'Left everything behind to stay with her family and follow God, showing true loyalty.', 'common', 'Loyal Heart', 'Build strong bonds with others', '🌾', false),
('Elijah', 'Power', 'Then the fire of the Lord fell and burned up the sacrifice.', '1 Kings 18:38', 'Called down fire from heaven to prove God is real and powerful beyond measure.', 'epic', 'Holy Fire', 'Channel divine power', '🔥', false),
('Joshua', 'Leadership', 'Be strong and courageous. Do not be afraid.', 'Joshua 1:9', 'Led God''s people into the promised land with courage, strategy, and trust in God.', 'rare', 'Commander''s Wisdom', 'Lead others with confidence', '🛡️', false),
('Samson', 'Strength', 'The Spirit of the Lord came powerfully upon him.', 'Judges 14:6', 'Given supernatural strength to protect God''s people, showing that true power comes from God.', 'legendary', 'Divine Strength', 'Overcome the strongest enemies', '💪', false),
('Samuel', 'Listening', 'Speak, Lord, for your servant is listening.', '1 Samuel 3:10', 'Heard God''s voice as a child and became a great prophet, proving God speaks to the humble.', 'common', 'God''s Ear', 'Hear wisdom and truth', '👶', false),
('Jonah', 'Repentance', 'From inside the fish Jonah prayed to the Lord his God.', 'Jonah 2:1', 'Ran from God, got swallowed by a fish, and learned to obey and serve God.', 'common', 'Redemption''s Call', 'Turn around and change course', '🐋', false),
('Mary', 'Trust', 'I am the Lord''s servant. May it be to me according to your word.', 'Luke 1:38', 'Said yes to God''s impossible plan and became the mother of Jesus, showing ultimate trust.', 'epic', 'Holy Trust', 'Accept God''s perfect plan', '⭐', false);

-- ─────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ─────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_content_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE heroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_card_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE kingdom_tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_mission_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_treasure_chests ENABLE ROW LEVEL SECURITY;

-- Campuses: Admins can view all, others can view public
CREATE POLICY "campuses_select_public" ON campuses FOR SELECT
  USING (active = true);

CREATE POLICY "campuses_admin_all" ON campuses FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Weekly Content: Visible to players of that campus
CREATE POLICY "weekly_content_select" ON weekly_content FOR SELECT
  USING (
    status = 'published' OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "weekly_content_insert_admin" ON weekly_content FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "weekly_content_update_admin" ON weekly_content FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Generated Content: Public read access
CREATE POLICY "generated_content_select" ON generated_content FOR SELECT
  USING (true);

-- Players: Users can only see their own progress, admins see all
CREATE POLICY "players_select_own" ON players FOR SELECT
  USING (
    auth.uid() = id OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "players_select_campus" ON players FOR SELECT
  USING (
    campus_id IN (
      SELECT id FROM campuses WHERE active = true
    )
  );

CREATE POLICY "players_insert_own" ON players FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "players_update_own" ON players FOR UPDATE
  USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');

-- Player Progress: Users see their own, admins see all
CREATE POLICY "progress_select_own" ON player_progress FOR SELECT
  USING (
    player_id IN (SELECT id FROM players WHERE id = auth.uid()) OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "progress_insert_own" ON player_progress FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "progress_update_own" ON player_progress FOR UPDATE
  USING (
    player_id IN (SELECT id FROM players WHERE id = auth.uid()) OR
    auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (
    player_id IN (SELECT id FROM players WHERE id = auth.uid()) OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Heroes: All public
CREATE POLICY "heroes_select_all" ON heroes FOR SELECT
  USING (true);

-- Hero Collection: Users see their own
CREATE POLICY "collection_select_own" ON hero_card_collection FOR SELECT
  USING (
    player_id IN (SELECT id FROM players WHERE id = auth.uid()) OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Kingdom Tiles: Users see their own
CREATE POLICY "tiles_select_own" ON kingdom_tiles FOR SELECT
  USING (
    player_id IN (SELECT id FROM players WHERE id = auth.uid()) OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Teams: Campus members and admins
CREATE POLICY "teams_select" ON teams FOR SELECT
  USING (true);

-- Team Members: Campus members can see
CREATE POLICY "team_members_select" ON team_members FOR SELECT
  USING (
    team_id IN (SELECT id FROM teams) OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Team Missions: Campus members and admins
CREATE POLICY "missions_select" ON team_missions FOR SELECT
  USING (
    team_id IN (SELECT id FROM teams) OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Leaderboards: Public within campus
CREATE POLICY "leaderboards_select" ON leaderboards FOR SELECT
  USING (
    campus_id IN (SELECT id FROM campuses WHERE active = true)
  );

-- Player Activity: Users see their own
CREATE POLICY "activity_select_own" ON player_activity FOR SELECT
  USING (
    player_id IN (SELECT id FROM players WHERE id = auth.uid()) OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Daily Treasure Chests: Users see their own
CREATE POLICY "chests_select_own" ON daily_treasure_chests FOR SELECT
  USING (
    player_id IN (SELECT id FROM players WHERE id = auth.uid()) OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- ─────────────────────────────────────────────────────────────────
-- UTILITY FUNCTIONS
-- ─────────────────────────────────────────────────────────────────

-- Function to get XP required for each level
CREATE OR REPLACE FUNCTION get_xp_for_level(level_num INT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE level_num
    WHEN 1 THEN 0
    WHEN 2 THEN 100
    WHEN 3 THEN 300
    WHEN 4 THEN 600
    WHEN 5 THEN 1000
    WHEN 6 THEN 1500
    WHEN 7 THEN 2200
    WHEN 8 THEN 3000
    ELSE 3000
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get level name
CREATE OR REPLACE FUNCTION get_level_name(level_num INT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE level_num
    WHEN 1 THEN 'Seedling'
    WHEN 2 THEN 'Explorer'
    WHEN 3 THEN 'Builder'
    WHEN 4 THEN 'Disciple'
    WHEN 5 THEN 'Warrior'
    WHEN 6 THEN 'Guardian'
    WHEN 7 THEN 'Champion'
    WHEN 8 THEN 'Kingdom Leader'
    ELSE 'Unknown'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate current level from XP
CREATE OR REPLACE FUNCTION calculate_level_from_xp(total_xp INT)
RETURNS INTEGER AS $$
BEGIN
  IF total_xp >= 3000 THEN RETURN 8;
  ELSIF total_xp >= 2200 THEN RETURN 7;
  ELSIF total_xp >= 1500 THEN RETURN 6;
  ELSIF total_xp >= 1000 THEN RETURN 5;
  ELSIF total_xp >= 600 THEN RETURN 4;
  ELSIF total_xp >= 300 THEN RETURN 3;
  ELSIF total_xp >= 100 THEN RETURN 2;
  ELSE RETURN 1;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update player last_active_at on activity
CREATE OR REPLACE FUNCTION update_player_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE players
  SET last_active_at = NOW()
  WHERE id = NEW.player_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_active
AFTER INSERT ON player_activity
FOR EACH ROW
EXECUTE FUNCTION update_player_last_active();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_timestamp_campuses
BEFORE UPDATE ON campuses FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_timestamp_weekly_content
BEFORE UPDATE ON weekly_content FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_timestamp_overrides
BEFORE UPDATE ON campus_content_overrides FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_timestamp_players
BEFORE UPDATE ON players FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_timestamp_progress
BEFORE UPDATE ON player_progress FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_timestamp_teams
BEFORE UPDATE ON teams FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_timestamp_missions
BEFORE UPDATE ON team_missions FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_timestamp_kingdom_tiles
BEFORE UPDATE ON kingdom_tiles FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ─────────────────────────────────────────────────────────────────
-- SCHEMA COMPLETE
-- ─────────────────────────────────────────────────────────────────
