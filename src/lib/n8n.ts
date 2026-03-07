import type { AgentPlan } from "@/types/database";

const N8N_BASE = import.meta.env.VITE_N8N_WEBHOOK_BASE_URL ?? "";

export async function generateWorkflow(params: {
  org_id: string;
  user_id: string;
  nl_description: string;
}): Promise<AgentPlan> {
  if (!N8N_BASE) {
    throw new Error("N8N webhook URL not configured. Set VITE_N8N_WEBHOOK_BASE_URL in .env");
  }
  const res = await fetch(`${N8N_BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error(`Workflow generation failed: ${res.statusText}`);
  }
  return res.json();
}

export async function executeWorkflow(params: {
  workflow_id: string;
  trigger_data?: Record<string, unknown>;
}): Promise<{ run_id: string }> {
  if (!N8N_BASE) {
    throw new Error("N8N webhook URL not configured. Set VITE_N8N_WEBHOOK_BASE_URL in .env");
  }
  const res = await fetch(`${N8N_BASE}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error(`Workflow execution failed: ${res.statusText}`);
  }
  return res.json();
}
