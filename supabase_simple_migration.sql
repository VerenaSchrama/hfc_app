-- Supabase Migration: Add status columns to mechanisms and interventions
-- Run this in your Supabase SQL Editor

-- Add status column to mechanisms table
ALTER TABLE mechanisms 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'suggested' CHECK (status IN ('suggested', 'active', 'archived'));

-- Add status column to interventions table  
ALTER TABLE interventions
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'suggested' CHECK (status IN ('suggested', 'active', 'archived', 'completed'));

-- Add trial_period_id column to interventions table to link with trial periods
ALTER TABLE interventions
ADD COLUMN IF NOT EXISTS trial_period_id INTEGER REFERENCES trial_periods(id) ON DELETE SET NULL;

-- Create indexes for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_mechanisms_user_status ON mechanisms(user_id, status);
CREATE INDEX IF NOT EXISTS idx_interventions_user_status ON interventions(user_id, status);

-- Update any existing records to have 'suggested' status
UPDATE mechanisms SET status = 'suggested' WHERE status IS NULL;
UPDATE interventions SET status = 'suggested' WHERE status IS NULL;

-- Verify the changes
SELECT 'Migration completed successfully!' as status;
