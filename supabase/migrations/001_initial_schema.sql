-- ============================================================
-- NexaFlow Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── Enums ──
CREATE TYPE plan_type AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE user_role AS ENUM ('admin', 'member', 'viewer');
CREATE TYPE integration_status AS ENUM ('connected', 'expired', 'error');
CREATE TYPE workflow_status AS ENUM ('draft', 'active', 'paused', 'failed');
CREATE TYPE run_status AS ENUM ('running', 'success', 'failed', 'needs_approval');
CREATE TYPE txn_type AS ENUM ('purchase', 'usage', 'refund', 'monthly_grant');

-- ── Organizations ──
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan plan_type NOT NULL DEFAULT 'free',
  credit_balance INTEGER NOT NULL DEFAULT 100,
  monthly_credit_limit INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Users (profile linked to auth.users) ──
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'member',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Integrations ──
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  auth_token_enc TEXT,
  status integration_status NOT NULL DEFAULT 'connected',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Workflows ──
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  nl_description TEXT,
  agent_plan_json JSONB,
  status workflow_status NOT NULL DEFAULT 'draft',
  trigger_type TEXT NOT NULL DEFAULT 'webhook',
  success_rate DECIMAL NOT NULL DEFAULT 0,
  avg_execution_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Workflow Runs ──
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  status run_status NOT NULL DEFAULT 'running',
  steps_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  credits_consumed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ── Credit Transactions ──
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type txn_type NOT NULL,
  amount INTEGER NOT NULL,
  razorpay_payment_id TEXT,
  workflow_run_id UUID REFERENCES workflow_runs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──
CREATE INDEX idx_users_org ON users(org_id);
CREATE INDEX idx_integrations_org ON integrations(org_id);
CREATE INDEX idx_workflows_org ON workflows(org_id);
CREATE INDEX idx_workflow_runs_workflow ON workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_started ON workflow_runs(started_at DESC);
CREATE INDEX idx_credit_transactions_org ON credit_transactions(org_id);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at DESC);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own org
CREATE POLICY "Users can view own org"
  ON organizations FOR SELECT
  USING (id IN (SELECT org_id FROM users WHERE users.id = auth.uid()));

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Org-scoped read policies
CREATE POLICY "Users can view org integrations"
  ON integrations FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users can view org workflows"
  ON workflows FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users can insert org workflows"
  ON workflows FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users can update org workflows"
  ON workflows FOR UPDATE
  USING (org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users can view workflow runs"
  ON workflow_runs FOR SELECT
  USING (workflow_id IN (
    SELECT w.id FROM workflows w
    JOIN users u ON u.org_id = w.org_id
    WHERE u.id = auth.uid()
  ));

CREATE POLICY "Users can view org credit transactions"
  ON credit_transactions FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid()));

-- ============================================================
-- Database Functions
-- ============================================================

-- Atomic credit deduction (called from n8n via service_role)
CREATE OR REPLACE FUNCTION deduct_credits(
  p_org_id UUID,
  p_amount INTEGER,
  p_run_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT credit_balance, monthly_credit_limit
  INTO v_balance, v_limit
  FROM organizations
  WHERE id = p_org_id
  FOR UPDATE;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  UPDATE organizations
  SET credit_balance = credit_balance - p_amount
  WHERE id = p_org_id;

  INSERT INTO credit_transactions (org_id, type, amount, workflow_run_id)
  VALUES (p_org_id, 'usage', -p_amount, p_run_id);

  v_balance := v_balance - p_amount;

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_balance,
    'low_balance', v_balance < (v_limit * 0.2)
  );
END;
$$;

-- Credit top-up after Razorpay payment (called from n8n via service_role)
CREATE OR REPLACE FUNCTION topup_credits(
  p_org_id UUID,
  p_amount INTEGER,
  p_razorpay_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  UPDATE organizations
  SET credit_balance = credit_balance + p_amount
  WHERE id = p_org_id
  RETURNING credit_balance INTO v_balance;

  INSERT INTO credit_transactions (org_id, type, amount, razorpay_payment_id)
  VALUES (p_org_id, 'purchase', p_amount, p_razorpay_id);

  RETURN jsonb_build_object('success', true, 'new_balance', v_balance);
END;
$$;

-- ============================================================
-- Auth Trigger: auto-create org + user profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_name TEXT;
BEGIN
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO organizations (name)
  VALUES (v_name || '''s Workspace')
  RETURNING id INTO v_org_id;

  INSERT INTO users (id, org_id, email, full_name, role)
  VALUES (NEW.id, v_org_id, NEW.email, v_name, 'admin');

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
