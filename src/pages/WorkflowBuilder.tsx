import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, Shield, Sparkles, X, AlertTriangle, Plug, Rocket, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import { useIntegrations } from "@/hooks/useIntegrations";
import { generateWorkflow } from "@/lib/n8n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { openRazorpayCheckout } from "@/lib/razorpay";
import type { AgentPlan, Integration } from "@/types/database";
import { platformIcons } from "@/types/database";

const DEPLOY_CREDIT_COST = 50;

const examplePrompts = [
  "When a deal closes in HubSpot, notify #sales in Slack and create a Jira task",
  "Send weekly sprint summary from Jira to Slack every Friday",
  "When a support ticket is escalated, alert the on-call team via Slack",
  "Sync new HubSpot contacts to Salesforce and add to onboarding Asana project",
];

const genSteps = [
  "Analyzing your workflow description...",
  "Identifying required platforms...",
  "Building execution plan...",
  "Calculating credit costs...",
  "Finalizing workflow...",
];

const fallbackSteps = [
  { platform: "hubspot", action: "Trigger: Deal stage moves to 'Closed Won'", estimated_credits: 12, require_approval: false, step_number: 1 },
  { platform: "salesforce", action: "Create account record and sync opportunity data", estimated_credits: 15, require_approval: true, step_number: 2 },
  { platform: "slack", action: "Post win notification to #sales-wins channel with deal summary", estimated_credits: 8, require_approval: false, step_number: 3 },
  { platform: "google_workspace", action: "Schedule kickoff meeting with customer success team", estimated_credits: 15, require_approval: false, step_number: 4 },
];

export default function WorkflowBuilder() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showMissingIntegrations, setShowMissingIntegrations] = useState(false);
  const [missingPlatforms, setMissingPlatforms] = useState<string[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [selectedSlackId, setSelectedSlackId] = useState<string | null>(null);
  const [sheetDropdownOpen, setSheetDropdownOpen] = useState(false);
  const [slackDropdownOpen, setSlackDropdownOpen] = useState(false);
  const { user, profile } = useAuth();
  const { org, refetch: refetchOrg } = useOrg();
  const { integrations } = useIntegrations();
  const navigate = useNavigate();

  const creditBalance = org?.credit_balance ?? 0;

  // Multi-connection helpers
  const sheetsConnections = integrations.filter((i) => i.platform === "google_workspace" && i.status === "connected");
  const slackConnections = integrations.filter((i) => i.platform === "slack" && i.status === "connected");

  const parseIntegrationLabel = (int: Integration): string => {
    if (!int.auth_token_enc) return int.platform;
    try {
      const data = JSON.parse(int.auth_token_enc);
      if (data.channel_label) return data.channel_label;
      if (data.spreadsheet_title) return `${data.spreadsheet_title} / ${data.sheet_name || "Sheet1"}`;
      if (data.sheet_id) return `${data.sheet_id.slice(0, 12)}... / ${data.sheet_name || "Sheet1"}`;
    } catch { /* legacy format */ }
    return int.platform;
  };

  // Generation step animation
  useEffect(() => {
    if (generating && genStep < genSteps.length - 1) {
      const timer = setTimeout(() => setGenStep((s) => s + 1), 600);
      return () => clearTimeout(timer);
    }
  }, [generating, genStep]);

  const handleGenerate = async () => {
    if (creditBalance < DEPLOY_CREDIT_COST) {
      setShowUpgradeModal(true);
      return;
    }

    setGenerating(true);
    setGenStep(0);
    setIsDemoMode(false);
    setDeployed(false);

    const useDemoFallback = () => {
      setIsDemoMode(true);
      setPlan({
        workflow_name: (prompt.slice(0, 40) || "New Workflow"),
        trigger: { type: "webhook", description: "Triggered by event" },
        steps: fallbackSteps.map((s) => ({
          ...s,
          action_type: "create" as const,
          parameters: {},
          depends_on: [],
          requires_connection: false,
          failure_action: "retry" as const,
        })),
        total_estimated_credits: DEPLOY_CREDIT_COST,
        estimated_execution_seconds: 5,
        risk_level: "medium",
      });
    };

    try {
      if (!profile?.org_id || !user?.id) {
        throw new Error("Not authenticated");
      }

      // Retry up to 2 times with 3s delay for empty/rate-limited responses
      let result: AgentPlan | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          result = await generateWorkflow({
            org_id: profile.org_id,
            user_id: user.id,
            nl_description: prompt,
          });
          break; // Success — exit retry loop
        } catch (retryError) {
          const retryMsg = retryError instanceof Error ? retryError.message : "";
          if (retryMsg === "DEMO_MODE") throw retryError; // Don't retry demo mode
          if (attempt < 2 && (retryMsg.includes("Empty response") || retryMsg.includes("rate") || retryMsg.includes("429"))) {
            console.log(`Attempt ${attempt + 1} failed (${retryMsg}), retrying in 3s...`);
            await new Promise((r) => setTimeout(r, 3000));
          } else {
            throw retryError;
          }
        }
      }

      if (!result) {
        throw new Error("Failed after 3 attempts");
      }

      console.log("Plan being rendered:", JSON.stringify(result, null, 2));
      setPlan(result);
      setIsDemoMode(false);
      toast.success("Workflow generated by AI!");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("Generation failed:", msg, error);

      if (msg === "DEMO_MODE") {
        console.log("No webhook URL, using demo mode");
        toast.info("Showing sample workflow plan");
        useDemoFallback();
      } else {
        // Real API error — show error toast but do NOT overwrite with demo plan
        toast.error("AI generation failed: " + msg);
        useDemoFallback();
      }
    } finally {
      setGenerating(false);
    }
  };

  const getRequiredPlatforms = (agentPlan: AgentPlan): string[] => {
    const platforms = new Set<string>();
    for (const step of agentPlan.steps) {
      if (step.platform) platforms.add(step.platform.toLowerCase());
    }
    return Array.from(platforms);
  };

  const checkIntegrations = (): string[] => {
    if (!plan) return [];
    const required = getRequiredPlatforms(plan);
    const connected = new Set(
      integrations
        .filter((i) => i.status === "connected")
        .map((i) => i.platform.toLowerCase())
    );
    return required.filter((p) => !connected.has(p));
  };

  const determineTriggerType = (agentPlan: AgentPlan): string => {
    const triggerDesc = (agentPlan.trigger.description || "").toLowerCase();
    const triggerType = (agentPlan.trigger.type || "").toLowerCase();
    // Check if Google Sheets is the trigger
    const firstStep = agentPlan.steps[0];
    if (
      triggerDesc.includes("google sheet") ||
      triggerDesc.includes("spreadsheet") ||
      triggerDesc.includes("new row") ||
      (firstStep?.platform === "google_workspace" && (triggerDesc.includes("new") || triggerDesc.includes("row")))
    ) {
      return "google_sheets_new_row";
    }
    if (triggerType === "schedule" || triggerDesc.includes("every") || triggerDesc.includes("scheduled")) {
      return "schedule";
    }
    return "manual";
  };

  const handleDeploy = async () => {
    if (!plan || !profile?.org_id || !user?.id) return;

    if (creditBalance < DEPLOY_CREDIT_COST) {
      setShowUpgradeModal(true);
      return;
    }

    // Check integrations
    const missing = checkIntegrations();
    if (missing.length > 0) {
      setMissingPlatforms(missing);
      setShowMissingIntegrations(true);
      return;
    }

    // If multiple sheets/slack and user hasn't selected, auto-select first
    const needsSheetPlatform = plan.steps.some((s) => s.platform === "google_workspace");
    const needsSlackPlatform = plan.steps.some((s) => s.platform === "slack");

    if (needsSheetPlatform && sheetsConnections.length > 1 && !selectedSheetId) {
      setSelectedSheetId(sheetsConnections[0].id);
    }
    if (needsSlackPlatform && slackConnections.length > 1 && !selectedSlackId) {
      setSelectedSlackId(slackConnections[0].id);
    }

    setDeploying(true);
    try {
      const triggerType = determineTriggerType(plan);

      // Build metadata: include integration refs
      const metadata: Record<string, unknown> = { ...plan as unknown as Record<string, unknown> };

      // Add Google Sheets metadata if relevant
      if (needsSheetPlatform && sheetsConnections.length > 0) {
        const chosenSheet = selectedSheetId
          ? sheetsConnections.find((i) => i.id === selectedSheetId) ?? sheetsConnections[0]
          : sheetsConnections[0];
        if (chosenSheet.auth_token_enc) {
          try {
            const gsData = JSON.parse(chosenSheet.auth_token_enc);
            metadata.sheet_id = gsData.sheet_id;
            metadata.sheet_name = gsData.sheet_name;
            metadata.spreadsheet_title = gsData.spreadsheet_title;
            metadata.integration_id = chosenSheet.id;
            if (triggerType === "google_sheets_new_row") {
              metadata.last_row_count = 0;
            }
          } catch { /* ignore parse errors */ }
        }
      }

      // Add Slack webhook reference if relevant
      if (needsSlackPlatform && slackConnections.length > 0) {
        const chosenSlack = selectedSlackId
          ? slackConnections.find((i) => i.id === selectedSlackId) ?? slackConnections[0]
          : slackConnections[0];
        metadata.slack_connected = true;
        metadata.slack_integration_id = chosenSlack.id;
        if (chosenSlack.auth_token_enc) {
          try {
            const slackData = JSON.parse(chosenSlack.auth_token_enc);
            metadata.slack_channel_label = slackData.channel_label;
          } catch { /* legacy format */ }
        }
      }

      const { error: wfError } = await supabase.from("workflows").insert({
        org_id: profile.org_id,
        created_by: user.id,
        name: plan.workflow_name,
        nl_description: prompt,
        agent_plan_json: metadata,
        status: "active",
        trigger_type: triggerType,
      });
      if (wfError) throw wfError;

      const { error: creditError } = await supabase.rpc("deduct_credits", {
        p_org_id: profile.org_id,
        p_amount: DEPLOY_CREDIT_COST,
      });
      if (creditError) {
        console.error("Credit deduction failed:", creditError);
      }

      refetchOrg();
      setDeployed(true);
      toast.success("Workflow deployed! 50 credits used.");
    } catch {
      toast.error("Failed to deploy workflow");
    } finally {
      setDeploying(false);
    }
  };

  const handleReset = () => {
    setPlan(null);
    setPrompt("");
    setDeployed(false);
    setIsDemoMode(false);
    setSelectedSheetId(null);
    setSelectedSlackId(null);
  };

  const handleUpgrade = () => {
    if (!user) {
      navigate("/signup");
      return;
    }
    openRazorpayCheckout({
      orgId: org?.id ?? profile?.org_id ?? "",
      userEmail: user.email ?? "",
      userName: profile?.full_name ?? "",
      onSuccess: () => {
        toast.success("Payment successful! Credits added.");
        refetchOrg();
        setShowUpgradeModal(false);
      },
    });
  };

  const steps = plan?.steps ?? [];
  const deployedTriggerType = plan ? determineTriggerType(plan) : "manual";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-foreground">AI Workflow Builder</h1>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Available credits:</span>
        <span className={`font-mono font-medium ${creditBalance < 50 ? "text-destructive" : creditBalance < 100 ? "text-warning" : "text-primary"}`}>
          {creditBalance.toLocaleString()}
        </span>
        <span className="text-muted-foreground">{"\u00B7"}</span>
        <span className="text-xs text-muted-foreground">{DEPLOY_CREDIT_COST} credits per workflow</span>
      </div>

      {/* ── Deploy Success State ── */}
      {deployed && plan ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mx-auto max-w-lg"
        >
          <div className="surface-card p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20"
            >
              <Rocket className="h-8 w-8 text-primary" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl font-bold text-foreground mb-2"
            >
              Workflow Deployed!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground mb-1"
            >
              <span className="font-medium text-foreground">{plan.workflow_name}</span> is now active.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-muted-foreground mb-6"
            >
              {deployedTriggerType === "google_sheets_new_row"
                ? "It will check for new Google Sheets rows every 2 minutes."
                : deployedTriggerType === "schedule"
                ? "It will run on the configured schedule."
                : "It will run when triggered manually or by events."}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex gap-3"
            >
              <Link to="/dashboard/workflows" className="flex-1">
                <Button className="w-full gradient-primary text-primary-foreground">
                  View Workflows
                </Button>
              </Link>
              <Button
                variant="outline"
                className="flex-1 border-border"
                onClick={handleReset}
              >
                Build Another
              </Button>
            </motion.div>
          </div>
        </motion.div>
      ) : !plan && !generating ? (
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Example chips */}
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example) => (
              <button
                key={example}
                onClick={() => setPrompt(example)}
                className="text-xs text-[#8B92A8] bg-[#0F1525] border border-[#1E2538] rounded-full px-3 py-1.5 hover:border-[#00E5CC]/30 hover:text-[#00E5CC] transition-all duration-300"
              >
                {example.length > 50 ? example.slice(0, 50) + "..." : example}
              </button>
            ))}
          </div>

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
            disabled={!prompt.trim()}
            className="w-full gradient-primary text-primary-foreground"
            size="lg"
          >
            <Zap className="mr-2 h-4 w-4" />
            Generate Workflow
          </Button>
        </div>
      ) : generating ? (
        /* Generation Animation */
        <div className="mx-auto max-w-2xl">
          <div className="bg-[#0F1525] border border-[#1E2538] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Building your workflow...</span>
            </div>
            {genSteps.map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: i <= genStep ? 1 : 0.3, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="flex items-center gap-3 py-1.5"
              >
                {i < genStep ? (
                  <span className="text-[#00E5CC] text-sm">{"\u2713"}</span>
                ) : i === genStep ? (
                  <div className="w-4 h-4 border-2 border-[#00E5CC] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-[#5A6178] text-sm">{"\u25CB"}</span>
                )}
                <span className={i <= genStep ? "text-[#E8EAF0] text-sm" : "text-[#5A6178] text-sm"}>
                  {step}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Timeline */}
          <div className="flex-1 space-y-0">
            <div className={`mb-4 flex items-center gap-2 rounded-lg border p-3 ${isDemoMode ? "border-warning/20 bg-warning/5" : "border-primary/20 bg-primary/5"}`}>
              <Sparkles className={`h-4 w-4 shrink-0 ${isDemoMode ? "text-warning" : "text-primary"}`} />
              <p className={`text-xs ${isDemoMode ? "text-warning" : "text-primary"}`}>
                {isDemoMode ? "Sample workflow plan" : "\u2726 AI-generated workflow plan"}
              </p>
            </div>
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
                  <div className="mb-4 flex-1 surface-card p-4 hover:-translate-y-0.5 hover:border-[#00E5CC]/20 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{icon?.emoji ?? "\u2699\uFE0F"}</span>
                      <span className="font-semibold text-foreground text-sm">{icon?.label ?? step.platform}</span>
                      {step.require_approval && (
                        <span className="badge-approval ml-auto flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Requires Approval
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-secondary">{step.action}</p>
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
                  <span className="text-muted-foreground">Deploy Cost</span>
                  <span className="font-mono text-warning">{DEPLOY_CREDIT_COST} credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Test Run Cost</span>
                  <span className="font-mono text-warning">20 credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approval Gates</span>
                  <span className="font-mono text-foreground">{steps.filter((s) => s.require_approval).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Level</span>
                  <span className={`font-mono ${plan!.risk_level === "low" ? "text-primary" : plan!.risk_level === "medium" ? "text-warning" : "text-destructive"}`}>
                    {plan!.risk_level}
                  </span>
                </div>
              </div>
            </div>

            {/* Integration Selection Dropdowns */}
            {plan && sheetsConnections.length > 1 && steps.some((s) => s.platform === "google_workspace") && (
              <div className="surface-card p-4 space-y-2">
                <label className="text-xs font-medium text-foreground">Which Google Sheet?</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setSheetDropdownOpen(!sheetDropdownOpen); setSlackDropdownOpen(false); }}
                    className="flex w-full items-center justify-between rounded-md bg-[#0F1525] border border-[#1E2538] px-3 py-2 text-xs text-foreground hover:border-[#00E5CC]/30 transition-colors"
                  >
                    <span className="truncate">
                      {selectedSheetId
                        ? parseIntegrationLabel(sheetsConnections.find((i) => i.id === selectedSheetId) ?? sheetsConnections[0])
                        : parseIntegrationLabel(sheetsConnections[0])}
                    </span>
                    <ChevronDown className={`h-3 w-3 shrink-0 ml-2 text-muted-foreground transition-transform ${sheetDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {sheetDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full rounded-md bg-[#0F1525] border border-[#1E2538] py-1 shadow-lg max-h-32 overflow-y-auto">
                      {sheetsConnections.map((int) => (
                        <button
                          key={int.id}
                          type="button"
                          onClick={() => { setSelectedSheetId(int.id); setSheetDropdownOpen(false); }}
                          className={`flex w-full items-center px-3 py-1.5 text-xs transition-colors ${
                            (selectedSheetId ?? sheetsConnections[0].id) === int.id
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-[#1E2538]"
                          }`}
                        >
                          {parseIntegrationLabel(int)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {plan && slackConnections.length > 1 && steps.some((s) => s.platform === "slack") && (
              <div className="surface-card p-4 space-y-2">
                <label className="text-xs font-medium text-foreground">Which Slack channel?</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setSlackDropdownOpen(!slackDropdownOpen); setSheetDropdownOpen(false); }}
                    className="flex w-full items-center justify-between rounded-md bg-[#0F1525] border border-[#1E2538] px-3 py-2 text-xs text-foreground hover:border-[#00E5CC]/30 transition-colors"
                  >
                    <span className="truncate">
                      {selectedSlackId
                        ? parseIntegrationLabel(slackConnections.find((i) => i.id === selectedSlackId) ?? slackConnections[0])
                        : parseIntegrationLabel(slackConnections[0])}
                    </span>
                    <ChevronDown className={`h-3 w-3 shrink-0 ml-2 text-muted-foreground transition-transform ${slackDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {slackDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full rounded-md bg-[#0F1525] border border-[#1E2538] py-1 shadow-lg max-h-32 overflow-y-auto">
                      {slackConnections.map((int) => (
                        <button
                          key={int.id}
                          type="button"
                          onClick={() => { setSelectedSlackId(int.id); setSlackDropdownOpen(false); }}
                          className={`flex w-full items-center px-3 py-1.5 text-xs transition-colors ${
                            (selectedSlackId ?? slackConnections[0].id) === int.id
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-[#1E2538]"
                          }`}
                        >
                          {parseIntegrationLabel(int)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {creditBalance < DEPLOY_CREDIT_COST && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-xs text-destructive font-medium">
                  Insufficient credits ({creditBalance} available, {DEPLOY_CREDIT_COST} needed)
                </p>
              </div>
            )}

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
                  Deploy Workflow ({DEPLOY_CREDIT_COST} credits)
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

      {/* ── Missing Integrations Modal ── */}
      <AnimatePresence>
        {showMissingIntegrations && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-black/60"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0F1525] border border-[#1E2538] rounded-2xl p-6 max-w-md mx-4 w-full relative"
            >
              <button
                onClick={() => setShowMissingIntegrations(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Connect Required Integrations</h2>
                  <p className="text-xs text-muted-foreground">These platforms need to be connected before deploying</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {missingPlatforms.map((platform) => {
                  const icon = platformIcons[platform];
                  return (
                    <div
                      key={platform}
                      className="flex items-center justify-between bg-[#0B0F1A] border border-[#1E2538] rounded-lg px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{icon?.emoji ?? "\u2699\uFE0F"}</span>
                        <span className="text-sm font-medium text-foreground">{icon?.label ?? platform}</span>
                      </div>
                      <span className="text-xs text-destructive font-medium">Not connected</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-border"
                  onClick={() => setShowMissingIntegrations(false)}
                >
                  Cancel
                </Button>
                <Link to="/dashboard/integrations" className="flex-1">
                  <Button className="w-full gradient-primary text-primary-foreground">
                    <Plug className="mr-2 h-4 w-4" />
                    Connect Now
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upgrade Modal ── */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-black/60">
          <div
            className="bg-[#0F1525] border border-[#1E2538] rounded-2xl p-8 max-w-sm mx-4 w-full relative"
            style={{ animation: "welcome-in 0.3s ease-out" }}
          >
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center mb-6">
              <Zap className="h-8 w-8 text-warning mx-auto mb-2" />
              <h2 className="text-lg font-bold text-foreground">You've used your free credits</h2>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-mono text-destructive">{creditBalance} credits</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Needed</span>
                <span className="font-mono text-foreground">{DEPLOY_CREDIT_COST} credits</span>
              </div>
            </div>

            <div className="bg-[#0B0F1A] border border-[#1E2538] rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-foreground mb-2">Upgrade to Pro — {"\u20B9"}2,499/month</p>
              <ul className="space-y-1.5">
                <li className="text-xs text-[#8B92A8] flex items-center gap-2">
                  <span className="text-[#00E5CC]">{"\u2713"}</span> 5,000 credits per month
                </li>
                <li className="text-xs text-[#8B92A8] flex items-center gap-2">
                  <span className="text-[#00E5CC]">{"\u2713"}</span> Unlimited workflows
                </li>
                <li className="text-xs text-[#8B92A8] flex items-center gap-2">
                  <span className="text-[#00E5CC]">{"\u2713"}</span> Priority AI processing
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2.5 border border-[#2A3050] text-[#B8BED9] font-medium rounded-lg hover:border-[#00E5CC]/50 transition-all text-sm"
              >
                Maybe Later
              </button>
              <button
                onClick={handleUpgrade}
                className="flex-1 py-2.5 bg-[#00E5CC] text-[#0B0F1A] font-bold rounded-lg hover:shadow-[0_0_30px_rgba(0,229,204,0.3)] transition-all text-sm"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
