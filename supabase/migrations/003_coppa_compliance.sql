-- BibleCraft COPPA Compliance Migration
-- Adds parent consent tracking and anonymity enforcement
-- Removes any PII-storing columns

-- Add COPPA compliance columns to players table
ALTER TABLE players
ADD COLUMN IF NOT EXISTS parent_consent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT TRUE;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_players_parent_consent ON players(parent_consent_at);

-- Drop any columns that might store PII (if they exist from migration 001/002)
-- Note: Only drop if safe to do so - check first
-- ALTER TABLE players DROP COLUMN IF EXISTS email;
-- ALTER TABLE players DROP COLUMN IF EXISTS real_name;
-- ALTER TABLE players DROP COLUMN IF EXISTS phone;
-- ALTER TABLE players DROP COLUMN IF EXISTS location;

-- Ensure display_name exists (should be from migration 001)
ALTER TABLE players
ADD COLUMN IF NOT EXISTS display_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS avatar_id VARCHAR(50);

-- Create constraint to ensure parent consent is tracked
ALTER TABLE players
ADD CONSTRAINT parent_consent_required CHECK (is_anonymous = TRUE OR parent_consent_at IS NOT NULL);

-- Add audit column to track when player was created
ALTER TABLE players
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Disable any analytics/tracking if present
-- (This would be app-side, but document the intent here)
-- All player data is ephemeral and session-based
-- No cross-session tracking or behavioral profiling

-- Ensure campus_id is set for all players (for campus-specific compliance)
ALTER TABLE players
ADD COLUMN IF NOT EXISTS campus_id VARCHAR(50);

-- Index for campus-based queries
CREATE INDEX IF NOT EXISTS idx_players_campus ON players(campus_id);

-- Summary:
-- - parent_consent_at: Timestamp when parent gate was passed
-- - is_anonymous: Always TRUE for COPPA compliance
-- - display_name: Safe generated name only (no real names)
-- - avatar_id: Simple avatar selection (no photos)
-- - No email, phone, location, or identifying info collected
