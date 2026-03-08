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

  const url = `${N8N_BASE}/generate`;
  console.log("Webhook URL:", N8N_BASE);
  console.log("Calling:", url);
  console.log("Payload:", params);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("n8n response error:", res.status, text);
    throw new Error(`Workflow generation failed: ${res.status} ${res.statusText}`);
  }

  const result = await res.json();
  console.log("n8n response:", result);

  // n8n returns { success, workflow_id, agent_plan, workflow_name }
  if (result.agent_plan) {
    return result.agent_plan as AgentPlan;
  }

  // Fallback: if the response itself IS the plan (direct return)
  if (result.steps && result.workflow_name) {
    return result as AgentPlan;
  }

  throw new Error("Unexpected response format from n8n webhook");
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
