import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { generateWorkflow } from "@/lib/n8n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AgentPlan } from "@/types/database";
import { platformIcons } from "@/types/database";

const fallbackSteps = [
  { platform: "hubspot", action: "Trigger: Deal stage moves to 'Closed Won'", estimated_credits: 1, require_approval: false, step_number: 1 },
  { platform: "salesforce", action: "Create account record and sync opportunity data", estimated_credits: 2, require_approval: true, step_number: 2 },
  { platform: "slack", action: "Post win notification to #sales-wins channel with deal summary", estimated_credits: 1, require_approval: false, step_number: 3 },
  { platform: "google_workspace", action: "Schedule kickoff meeting with customer success team", estimated_credits: 1, require_approval: false, step_number: 4 },
];

export default function WorkflowBuilder() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [deploying, setDeploying] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (!profile?.org_id || !user?.id) {
        throw new Error("Not authenticated");
      }
      const result = await generateWorkflow({
        org_id: profile.org_id,
        user_id: user.id,
        nl_description: prompt,
      });
      setPlan(result);
    } catch (err) {
      // Fallback: use mock plan for demo
      setPlan({
        workflow_name: prompt.slice(0, 50) || "New Workflow",
        trigger: { type: "webhook", description: "Event-based trigger" },
        steps: fallbackSteps.map((s) => ({
          ...s,
          action_type: "create" as const,
          parameters: {},
          depends_on: [],
          requires_connection: false,
          failure_action: "retry" as const,
        })),
        total_estimated_credits: fallbackSteps.reduce((a, s) => a + s.estimated_credits, 0),
        estimated_execution_seconds: 5,
        risk_level: "medium",
      });
      toast.info("Using demo plan (n8n webhook not configured)");
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!plan || !profile?.org_id || !user?.id) return;
    setDeploying(true);
    try {
      const { error } = await supabase.from("workflows").insert({
        org_id: profile.org_id,
        created_by: user.id,
        name: plan.workflow_name,
        nl_description: prompt,
        agent_plan_json: plan as unknown as Record<string, unknown>,
        status: "active",
        trigger_type: plan.trigger.type,
      });
      if (error) throw error;
      toast.success("Workflow deployed!");
      navigate("/dashboard/workflows");
    } catch (err) {
      toast.error("Failed to deploy workflow");
    } finally {
      setDeploying(false);
    }
  };

  const steps = plan?.steps ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">AI Workflow Builder</h1>

      {!plan ? (
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="surface-card p-6">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={"Describe your workflow in plain English...\n\nExample: When a deal closes in HubSpot, analyze the deal with AI, create an account in Salesforce, notify the team in Slack, and schedule a kickoff meeting in Google Calendar."}
              className="min-h-[180px] w-full resize-none rounded-lg border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            className="w-full gradient-primary text-primary-foreground"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Generating workflow...
              </div>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Generate Workflow
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Timeline */}
          <div className="flex-1 space-y-0">
            {steps.map((step, i) => {
              const icon = platformIcons[step.platform];
              return (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background font-mono text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
                  </div>
                  <div className="mb-4 flex-1 surface-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{icon?.emoji ?? "⚙️"}</span>
                      <span className="font-semibold text-foreground text-sm">{icon?.label ?? step.platform}</span>
                      {step.require_approval && (
                        <span className="badge-approval ml-auto flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Requires Approval
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-secondary">{step.action}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Cost: <span className="font-mono text-warning">{step.estimated_credits}</span> credits
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Sidebar */}
          <div className="w-72 shrink-0 space-y-4">
            <div className="surface-card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Workflow Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Steps</span>
                  <span className="font-mono text-foreground">{steps.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credits / Run</span>
                  <span className="font-mono text-warning">{plan.total_estimated_credits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approval Gates</span>
                  <span className="font-mono text-foreground">{steps.filter((s) => s.require_approval).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Level</span>
                  <span className={`font-mono ${plan.risk_level === "low" ? "text-primary" : plan.risk_level === "medium" ? "text-warning" : "text-destructive"}`}>
                    {plan.risk_level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trigger</span>
                  <span className="text-foreground">{plan.trigger.type}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleDeploy}
              disabled={deploying}
              className="w-full gradient-primary text-primary-foreground"
              size="lg"
            >
              {deploying ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Deploying...
                </div>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Deploy Workflow
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full border-border"
              onClick={() => setPlan(null)}
            >
              Start Over
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
