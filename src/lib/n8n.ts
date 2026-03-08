import type { AgentPlan } from "@/types/database";

// Evaluate at call time, not module load time
function getWebhookBase() {
  return import.meta.env.VITE_N8N_WEBHOOK_BASE_URL ?? "";
}

export async function generateWorkflow(params: {
  org_id: string;
  user_id: string;
  nl_description: string;
}): Promise<AgentPlan> {
  const webhookUrl = getWebhookBase();
  console.log("WEBHOOK URL:", webhookUrl, "length:", webhookUrl?.length);

  if (!webhookUrl || webhookUrl.length === 0) {
    throw new Error("DEMO_MODE");
  }

  const url = `${webhookUrl}/generate`;
  console.log("Calling:", url);
  console.log("Payload:", params);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  // Get raw text first for debugging
  const rawText = await res.text();
  console.log("n8n raw response:", rawText);

  if (!res.ok) {
    console.error("n8n response error:", res.status, rawText);
    throw new Error(`Workflow generation failed: ${res.status} ${res.statusText}`);
  }

  if (!rawText || rawText.length === 0) {
    throw new Error("Empty response from n8n");
  }

  const result = JSON.parse(rawText);
  console.log("n8n parsed response:", result);

  // n8n returns { success, workflow_id, agent_plan, workflow_name }
  if (result.agent_plan) {
    const plan = result.agent_plan as AgentPlan;
    // Ensure workflow_name is set (might be at wrapper level only)
    if (!plan.workflow_name && result.workflow_name) {
      plan.workflow_name = result.workflow_name;
    }
    console.log("Returning agent_plan:", JSON.stringify(plan, null, 2));
    return plan;
  }

  // Fallback: if the response itself IS the plan (direct return)
  if (result.steps && result.workflow_name) {
    return result as AgentPlan;
  }

  // Last resort: check if response is an array (n8n sometimes wraps in array)
  if (Array.isArray(result) && result.length > 0) {
    const first = result[0];
    if (first.agent_plan) {
      const plan = first.agent_plan as AgentPlan;
      if (!plan.workflow_name && first.workflow_name) {
        plan.workflow_name = first.workflow_name;
      }
      return plan;
    }
  }

  throw new Error("Unexpected response format from n8n webhook");
}

export async function executeWorkflow(params: {
  workflow_id: string;
  trigger_data?: Record<string, unknown>;
}): Promise<{ run_id: string }> {
  const webhookUrl = getWebhookBase();
  if (!webhookUrl) {
    throw new Error("N8N webhook URL not configured");
  }
  const res = await fetch(`${webhookUrl}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error(`Workflow execution failed: ${res.statusText}`);
  }
  return res.json();
}
