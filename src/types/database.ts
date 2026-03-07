// ── Enums ──
export type PlanType = 'free' | 'pro' | 'enterprise';
export type UserRole = 'admin' | 'member' | 'viewer';
export type IntegrationStatus = 'connected' | 'expired' | 'error';
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'failed';
export type RunStatus = 'running' | 'success' | 'failed' | 'needs_approval';
export type TxnType = 'purchase' | 'usage' | 'refund' | 'monthly_grant';

// ── Core Tables ──
export interface Organization {
  id: string;
  name: string;
  plan: PlanType;
  credit_balance: number;
  monthly_credit_limit: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  org_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Integration {
  id: string;
  org_id: string;
  platform: string;
  auth_token_enc: string | null;
  status: IntegrationStatus;
  last_synced_at: string | null;
  created_at: string;
}

export interface Workflow {
  id: string;
  org_id: string;
  created_by: string;
  name: string;
  nl_description: string | null;
  agent_plan_json: AgentPlan | null;
  status: WorkflowStatus;
  trigger_type: string;
  success_rate: number;
  avg_execution_ms: number;
  created_at: string;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: RunStatus;
  steps_json: StepResult[];
  credits_consumed: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface CreditTransaction {
  id: string;
  org_id: string;
  type: TxnType;
  amount: number;
  razorpay_payment_id: string | null;
  workflow_run_id: string | null;
  created_at: string;
}

// ── Agent Plan (stored in workflows.agent_plan_json) ──
export interface AgentPlan {
  workflow_name: string;
  trigger: {
    type: 'webhook' | 'schedule' | 'event';
    description: string;
  };
  steps: AgentStep[];
  total_estimated_credits: number;
  estimated_execution_seconds: number;
  risk_level: 'low' | 'medium' | 'high';
}

export interface AgentStep {
  step_number: number;
  platform: string;
  action: string;
  action_type: 'create' | 'update' | 'read' | 'delete' | 'notify';
  parameters: Record<string, unknown>;
  depends_on: number[];
  require_approval: boolean;
  requires_connection: boolean;
  estimated_credits: number;
  failure_action: 'retry' | 'skip' | 'abort';
}

export interface StepResult {
  step_number: number;
  platform: string;
  status: 'success' | 'failed' | 'skipped';
  response_summary: string;
  duration_ms: number;
  credits: number;
}

// ── Display-only types (used by UI charts) ──
export interface DailyMetric {
  date: string;
  success: number;
  failed: number;
  total: number;
}

// ── Platform icons mapping ──
export const platformIcons: Record<string, { emoji: string; label: string }> = {
  slack: { emoji: '\u{1F4AC}', label: 'Slack' },
  salesforce: { emoji: '\u2601\uFE0F', label: 'Salesforce' },
  hubspot: { emoji: '\u{1F7E0}', label: 'HubSpot' },
  jira: { emoji: '\u{1F537}', label: 'Jira' },
  google_workspace: { emoji: '\u{1F4E7}', label: 'Google Workspace' },
  asana: { emoji: '\u{1F3AF}', label: 'Asana' },
  notion: { emoji: '\u{1F4DD}', label: 'Notion' },
  github: { emoji: '\u{1F419}', label: 'GitHub' },
};
