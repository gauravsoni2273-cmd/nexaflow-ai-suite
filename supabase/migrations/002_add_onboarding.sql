-- Add onboarding_completed column to users table
-- Run this if you already created tables from 001_initial_schema.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;
