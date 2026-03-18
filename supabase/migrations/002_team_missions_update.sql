-- VerseCraft Team Missions Update
-- Version: 2.0
-- Adds tiered reward structure and celebration messaging for child-appropriate missions

-- ─────────────────────────────────────────────────────────────────
-- 1. ADD NEW COLUMNS FOR TIERED REWARDS
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE team_missions
ADD COLUMN bronze_threshold FLOAT DEFAULT 0.3,
ADD COLUMN silver_threshold FLOAT DEFAULT 0.6,
ADD COLUMN gold_threshold FLOAT DEFAULT 1.0,
ADD COLUMN reward_tier TEXT DEFAULT 'none' CHECK (reward_tier IN ('none', 'bronze', 'silver', 'gold')),
ADD COLUMN celebration_message TEXT;

-- ─────────────────────────────────────────────────────────────────
-- 2. UPDATE STATUS CHECK CONSTRAINT TO REMOVE 'expired', ADD 'celebrated'
-- ─────────────────────────────────────────────────────────────────

-- First, we need to handle the existing constraint by dropping and recreating
-- (Note: PostgreSQL doesn't allow direct ALTER of CHECK constraints)
-- The original constraint doesn't exist in the schema, so we're documenting
-- the intended status values that should be in use:
-- 'active' (in progress), 'completed', 'celebrated' (week ended and acknowledged)

-- ─────────────────────────────────────────────────────────────────
-- 3. CREATE INDEX FOR REWARD TIER LOOKUPS
-- ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_missions_reward_tier ON team_missions(reward_tier);

-- ─────────────────────────────────────────────────────────────────
-- 4. ADD MIGRATION TRACKING
-- ─────────────────────────────────────────────────────────────────

-- Update timestamps for tracking migration
UPDATE team_missions
SET updated_at = NOW()
WHERE updated_at IS NULL;
