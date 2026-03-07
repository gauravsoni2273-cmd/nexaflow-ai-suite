import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Workflow } from "@/types/database";

interface TestRunOptions {
  workflow: Workflow;
  orgId: string;
  onComplete: () => void;
}

export async function handleTestRun({ workflow, orgId, onComplete }: TestRunOptions) {
  if (!workflow.agent_plan_json) {
    toast.error("This workflow has no execution plan.");
    return;
  }

  const plan = typeof workflow.agent_plan_json === "string"
    ? JSON.parse(workflow.agent_plan_json)
    : workflow.agent_plan_json;

  toast.info(`Running "${workflow.name}"...`);

  // 1. Create a run record
  const { data: run, error: runError } = await supabase
    .from("workflow_runs")
    .insert({
      workflow_id: workflow.id,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (runError || !run) {
    toast.error("Failed to start test run");
    return;
  }

  // 2. Simulate execution (1-3 seconds)
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1500));

  // 3. Generate step results
  const steps = (plan.steps ?? []).map((step: { step_number: number; platform: string; action: string; estimated_credits?: number }) => ({
    step_number: step.step_number,
    platform: step.platform,
    status: Math.random() > 0.15 ? "success" : "failed",
    response_summary: `${step.action} — completed`,
    duration_ms: Math.floor(Math.random() * 800) + 200,
    credits: step.estimated_credits || 2,
  }));

  const successSteps = steps.filter((s: { status: string }) => s.status === "success");
  const totalCredits = successSteps.reduce((sum: number, s: { credits: number }) => sum + s.credits, 0);
  const allSuccess = steps.every((s: { status: string }) => s.status === "success");

  // 4. Update the run record
  await supabase
    .from("workflow_runs")
    .update({
      status: allSuccess ? "success" : "failed",
      steps_json: steps,
      credits_consumed: totalCredits,
      completed_at: new Date().toISOString(),
      error_message: allSuccess ? null : `Step ${steps.find((s: { status: string }) => s.status === "failed")?.step_number} failed`,
    })
    .eq("id", run.id);

  // 5. Deduct credits
  if (totalCredits > 0) {
    await supabase.rpc("deduct_credits", {
      p_org_id: orgId,
      p_amount: totalCredits,
      p_run_id: run.id,
    });
  }

  // 6. Update workflow success rate
  const { data: allRuns } = await supabase
    .from("workflow_runs")
    .select("status")
    .eq("workflow_id", workflow.id);

  if (allRuns && allRuns.length > 0) {
    const successCount = allRuns.filter((r) => r.status === "success").length;
    const successRate = (successCount / allRuns.length) * 100;
    await supabase
      .from("workflows")
      .update({ success_rate: Math.round(successRate * 10) / 10 })
      .eq("id", workflow.id);
  }

  // 7. Show result
  if (allSuccess) {
    toast.success(`"${workflow.name}" completed! ${totalCredits} credits used.`);
  } else {
    toast.error(`"${workflow.name}" had failures. ${totalCredits} credits used.`);
  }

  // 8. Trigger refetch
  onComplete();
}
