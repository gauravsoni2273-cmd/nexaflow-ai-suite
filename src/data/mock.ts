import type {
  Workflow,
  WorkflowRun,
  Integration,
  CreditTransaction,
  DailyMetric,
  Organization,
  UserProfile,
} from "@/types/database";

// ── Mock Organization ──
export const mockOrg: Organization = {
  id: "org-1",
  name: "Sarah's Workspace",
  plan: "pro",
  credit_balance: 2847,
  monthly_credit_limit: 5000,
  created_at: "2025-11-01",
};

// ── Mock User Profile ──
export const mockProfile: UserProfile = {
  id: "user-1",
  org_id: "org-1",
  email: "sarah@nexaflow.io",
  full_name: "Sarah Chen",
  role: "admin",
  created_at: "2025-11-01",
};

// ── Mock Team Members ──
export const mockTeam: UserProfile[] = [
  { id: "user-1", org_id: "org-1", email: "sarah@nexaflow.io", full_name: "Sarah Chen", role: "admin", created_at: "2025-11-01" },
  { id: "user-2", org_id: "org-1", email: "alex@nexaflow.io", full_name: "Alex Rivera", role: "admin", created_at: "2025-11-05" },
  { id: "user-3", org_id: "org-1", email: "priya@nexaflow.io", full_name: "Priya Sharma", role: "member", created_at: "2025-11-10" },
  { id: "user-4", org_id: "org-1", email: "james@nexaflow.io", full_name: "James Wilson", role: "viewer", created_at: "2025-12-01" },
];

// ── Mock Workflows ──
export const mockWorkflows: Workflow[] = [
  { id: "1", org_id: "org-1", created_by: "user-1", name: "Lead Qualification Pipeline", nl_description: "Qualify leads from HubSpot", agent_plan_json: null, status: "active", trigger_type: "webhook", success_rate: 97.2, avg_execution_ms: 134000, created_at: "2025-12-01" },
  { id: "2", org_id: "org-1", created_by: "user-1", name: "Customer Onboarding Flow", nl_description: "Onboard new customers", agent_plan_json: null, status: "active", trigger_type: "event", success_rate: 99.1, avg_execution_ms: 272000, created_at: "2025-11-15" },
  { id: "3", org_id: "org-1", created_by: "user-2", name: "Invoice Processing", nl_description: "Process invoices automatically", agent_plan_json: null, status: "paused", trigger_type: "schedule", success_rate: 85.3, avg_execution_ms: 108000, created_at: "2025-10-20" },
  { id: "4", org_id: "org-1", created_by: "user-1", name: "Support Ticket Router", nl_description: "Route support tickets to right team", agent_plan_json: null, status: "active", trigger_type: "webhook", success_rate: 94.8, avg_execution_ms: 34000, created_at: "2025-09-01" },
  { id: "5", org_id: "org-1", created_by: "user-3", name: "Weekly Report Generator", nl_description: "Generate weekly reports", agent_plan_json: null, status: "failed", trigger_type: "schedule", success_rate: 42.9, avg_execution_ms: 492000, created_at: "2025-12-10" },
  { id: "6", org_id: "org-1", created_by: "user-2", name: "Deal Stage Sync", nl_description: "Sync deal stages across CRM", agent_plan_json: null, status: "active", trigger_type: "event", success_rate: 91.5, avg_execution_ms: 62000, created_at: "2025-11-01" },
];

// ── Mock Workflow Runs ──
export const mockRuns: WorkflowRun[] = [
  { id: "r1", workflow_id: "1", status: "success", steps_json: [], credits_consumed: 3, error_message: null, started_at: "2026-02-25T14:32:00Z", completed_at: "2026-02-25T14:34:08Z" },
  { id: "r2", workflow_id: "2", status: "success", steps_json: [], credits_consumed: 5, error_message: null, started_at: "2026-02-25T14:28:00Z", completed_at: "2026-02-25T14:32:21Z" },
  { id: "r3", workflow_id: "4", status: "running", steps_json: [], credits_consumed: 1, error_message: null, started_at: "2026-02-25T14:25:00Z", completed_at: null },
  { id: "r4", workflow_id: "5", status: "failed", steps_json: [], credits_consumed: 4, error_message: "Google Sheets API timeout", started_at: "2026-02-25T14:20:00Z", completed_at: "2026-02-25T14:23:45Z" },
  { id: "r5", workflow_id: "1", status: "needs_approval", steps_json: [], credits_consumed: 2, error_message: null, started_at: "2026-02-25T14:15:00Z", completed_at: null },
  { id: "r6", workflow_id: "3", status: "success", steps_json: [], credits_consumed: 3, error_message: null, started_at: "2026-02-25T14:10:00Z", completed_at: "2026-02-25T14:11:52Z" },
  { id: "r7", workflow_id: "6", status: "success", steps_json: [], credits_consumed: 2, error_message: null, started_at: "2026-02-25T14:05:00Z", completed_at: "2026-02-25T14:05:58Z" },
  { id: "r8", workflow_id: "2", status: "failed", steps_json: [], credits_consumed: 4, error_message: "Slack rate limited", started_at: "2026-02-25T14:00:00Z", completed_at: "2026-02-25T14:05:02Z" },
];

// ── Mock Integrations ──
export const mockIntegrations: Integration[] = [
  { id: "i1", org_id: "org-1", platform: "slack", auth_token_enc: null, status: "connected", last_synced_at: "2026-02-25T14:30:00Z", created_at: "2025-11-01" },
  { id: "i2", org_id: "org-1", platform: "salesforce", auth_token_enc: null, status: "connected", last_synced_at: "2026-02-25T14:27:00Z", created_at: "2025-11-01" },
  { id: "i3", org_id: "org-1", platform: "hubspot", auth_token_enc: null, status: "expired", last_synced_at: null, created_at: "2025-11-01" },
  { id: "i4", org_id: "org-1", platform: "jira", auth_token_enc: null, status: "connected", last_synced_at: "2026-02-25T13:32:00Z", created_at: "2025-11-01" },
  { id: "i5", org_id: "org-1", platform: "google_workspace", auth_token_enc: null, status: "connected", last_synced_at: "2026-02-25T14:22:00Z", created_at: "2025-11-01" },
  { id: "i6", org_id: "org-1", platform: "asana", auth_token_enc: null, status: "error", last_synced_at: "2026-02-22T10:00:00Z", created_at: "2025-11-01" },
  { id: "i7", org_id: "org-1", platform: "notion", auth_token_enc: null, status: "expired", last_synced_at: null, created_at: "2025-11-01" },
  { id: "i8", org_id: "org-1", platform: "github", auth_token_enc: null, status: "connected", last_synced_at: "2026-02-25T14:02:00Z", created_at: "2025-11-01" },
];

// ── Mock Credit Transactions ──
export const mockTransactions: CreditTransaction[] = [
  { id: "t1", org_id: "org-1", type: "usage", amount: -45, razorpay_payment_id: null, workflow_run_id: "r1", created_at: "2026-02-25" },
  { id: "t2", org_id: "org-1", type: "purchase", amount: 5000, razorpay_payment_id: "pay_abc123", workflow_run_id: null, created_at: "2026-02-01" },
  { id: "t3", org_id: "org-1", type: "usage", amount: -120, razorpay_payment_id: null, workflow_run_id: "r2", created_at: "2026-02-24" },
  { id: "t4", org_id: "org-1", type: "refund", amount: 12, razorpay_payment_id: null, workflow_run_id: "r4", created_at: "2026-02-23" },
];

// ── Mock Daily Metrics (for charts) ──
export const mockDailyMetrics: DailyMetric[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 1, i + 1);
  const total = Math.floor(Math.random() * 80) + 60;
  const success = Math.floor(total * (0.85 + Math.random() * 0.12));
  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    success,
    failed: total - success,
    total,
  };
});

export const mockSparkline = [40, 52, 48, 61, 55, 72, 68, 80, 75, 88, 82, 95];

// ── Helper: Get workflow name by ID ──
export function getWorkflowName(id: string): string {
  return mockWorkflows.find((w) => w.id === id)?.name ?? "Unknown Workflow";
}

// ── Helper: Format ms duration ──
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs.toString().padStart(2, "0")}s`;
}

// ── Helper: Time ago ──
export function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}
