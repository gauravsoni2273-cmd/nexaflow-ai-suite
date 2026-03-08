import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Zap, CheckCircle, Coins, TrendingUp, Plus, Play, Plug, CreditCard, Lightbulb } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useWorkflowRuns } from "@/hooks/useWorkflowRuns";
import { useOrg } from "@/hooks/useOrg";

import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { handleTestRun } from "@/lib/testRun";
import { timeAgo } from "@/lib/helpers";
import WelcomeModal from "@/components/WelcomeModal";
import type { Workflow } from "@/types/database";

function StatusBadge({ status }: { status: string }) {
  const cls = status === "success" ? "badge-success" : status === "failed" ? "badge-failed" : status === "running" ? "badge-running" : "badge-approval";
  return <span className={cls}>{status === "needs_approval" ? "approval" : status}</span>;
}

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 60},${20 - ((v - min) / range) * 18}`).join(" ");
  return (
    <svg viewBox="0 0 60 22" className="h-5 w-14">
      <polyline points={points} fill="none" stroke="hsl(173,100%,45%)" strokeWidth="1.5" />
    </svg>
  );
}

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

export default function Dashboard() {
  const { workflows, loading: wfLoading, refetch: refetchWorkflows } = useWorkflows();
  const { runs, loading: runsLoading, refetch: refetchRuns } = useWorkflowRuns();
  const { org, loading: orgLoading, refetch: refetchOrg } = useOrg();
  const { profile } = useAuth();
  const [runningTestId, setRunningTestId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  const activeWorkflows = workflows.filter((w) => w.status === "active");
  const activeCount = activeWorkflows.length;
  const creditBalance = org?.credit_balance ?? 0;
  const creditLimit = org?.monthly_credit_limit ?? 100;

  const successRuns = runs.filter((r) => r.status === "success").length;
  const avgSuccessRate = runs.length > 0
    ? ((successRuns / runs.length) * 100).toFixed(1)
    : "\u2014";

  const runSparkline = runs.length > 1
    ? runs.slice(0, 12).map((r) => r.credits_consumed).reverse()
    : undefined;

  const loading = wfLoading || runsLoading || orgLoading;
  const chartData = runs.length > 0 ? buildChartData(runs) : [];
  const getWorkflowName = (wfId: string) => workflows.find((w) => w.id === wfId)?.name ?? "Unknown Workflow";
  const hasWorkflowsNoRuns = workflows.length > 0 && runs.length === 0;

  // Welcome modal — show when onboarding not yet completed
  useEffect(() => {
    if (!loading && profile && profile.onboarding_completed === false) {
      setShowWelcome(true);
    }
  }, [loading, profile]);

  const onTestRun = async (workflow: Workflow) => {
    if (!org || runningTestId) return;
    setRunningTestId(workflow.id);
    await handleTestRun({
      workflow,
      orgId: org.id,
      onComplete: () => {
        refetchOrg();
        refetchRuns();
        refetchWorkflows();
        setRunningTestId(null);
      },
    });
  };

  const numericValue = (v: string) => {
    const n = parseFloat(v.replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  };

  const metrics = [
    { label: "Active Workflows", value: String(activeCount), numeric: activeCount, trend: activeCount > 0 ? `+${activeCount}` : undefined, icon: Activity },
    { label: "Total Runs", value: String(runs.length), numeric: runs.length, sparkline: runSparkline, icon: Zap },
    { label: "Success Rate", value: avgSuccessRate === "\u2014" ? "\u2014" : `${avgSuccessRate}%`, numeric: numericValue(String(avgSuccessRate)), suffix: avgSuccessRate !== "\u2014" ? "%" : "", icon: CheckCircle },
    { label: "Credits Remaining", value: creditBalance.toLocaleString(), numeric: creditBalance, total: creditLimit, remaining: creditBalance, icon: Coins },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-foreground">
        {profile?.full_name ? `Welcome back, ${profile.full_name.split(" ")[0]}!` : "Dashboard"}
      </h1>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="surface-card p-5 hover:-translate-y-0.5 hover:border-[#00E5CC]/20 transition-all duration-300">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{m.label}</span>
                  <m.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-2xl font-bold font-mono text-foreground">
                    {m.value === "\u2014" ? "\u2014" : <><AnimatedNumber value={m.numeric} />{m.suffix || ""}</>}
                  </span>
                  {m.trend && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-primary">
                      <TrendingUp className="h-3 w-3" />
                      {m.trend}
                    </span>
                  )}
                  {m.sparkline && <MiniSparkline data={m.sparkline} />}
                </div>
                {m.total !== undefined && (
                  <div className="mt-3">
                    <Progress value={m.total > 0 ? (m.remaining! / m.total) * 100 : 0} className={`h-1.5 bg-secondary ${(m.remaining! / m.total!) * 100 < 20 ? "[&>div]:bg-destructive" : (m.remaining! / m.total!) * 100 < 50 ? "[&>div]:bg-warning" : "[&>div]:bg-primary"}`} />
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className={`font-mono ${(m.remaining! / m.total!) * 100 < 20 ? "text-destructive" : (m.remaining! / m.total!) * 100 < 50 ? "text-warning" : "text-primary"}`}>{m.remaining!.toLocaleString()}</span> / {m.total.toLocaleString()}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {!loading && (
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard/workflows/new">
            <Button size="sm" className="gradient-primary text-primary-foreground">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Workflow
            </Button>
          </Link>
          {activeWorkflows.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="border-border"
              disabled={!!runningTestId}
              onClick={() => onTestRun(activeWorkflows[0])}
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {runningTestId ? "Running..." : `Run "${activeWorkflows[0].name.slice(0, 20)}"`}
            </Button>
          )}
          <Link to="/dashboard/integrations">
            <Button size="sm" variant="outline" className="border-border">
              <Plug className="mr-1.5 h-3.5 w-3.5" />
              Connect Tool
            </Button>
          </Link>
          <Link to="/dashboard/settings">
            <Button size="sm" variant="outline" className="border-border">
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              Buy Credits
            </Button>
          </Link>
        </div>
      )}

      {/* HAS WORKFLOWS BUT NO RUNS: Prompt to test */}
      {!loading && hasWorkflowsNoRuns && (
        <div className="surface-card p-6 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Play className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground">Your workflows are ready!</h3>
          <p className="mt-2 text-sm text-muted-foreground">Run a test to see analytics and validate your automation.</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            {activeWorkflows.slice(0, 2).map((wf) => (
              <Button
                key={wf.id}
                className="gradient-primary text-primary-foreground"
                disabled={!!runningTestId}
                onClick={() => onTestRun(wf)}
              >
                <Play className="mr-2 h-4 w-4" />
                {runningTestId === wf.id ? "Running..." : `Test "${wf.name.slice(0, 25)}"`}
              </Button>
            ))}
            <Link to="/dashboard/workflows/new">
              <Button variant="outline" className="border-border">
                <Plus className="mr-2 h-4 w-4" />
                Create Another
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ACTIVE USER: Chart + Runs Table */}
      {chartData.length > 0 && (
        <div className="surface-card p-6 hover:-translate-y-0.5 hover:border-[#00E5CC]/20 transition-all duration-300">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Workflow Executions</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(173,100%,45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(173,100%,45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,30%,17%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(226,14%,41%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(226,14%,41%)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(224,42%,10%)", border: "1px solid hsl(224,30%,17%)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "hsl(225,20%,93%)" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="success" stroke="hsl(173,100%,45%)" fill="url(#successGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="failed" stroke="hsl(0,100%,71%)" fill="hsl(0,100%,71%,0.05)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Runs Table */}
      {runs.length > 0 && (
        <div className="surface-card hover:-translate-y-0.5 hover:border-[#00E5CC]/20 transition-all duration-300">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">Recent Workflow Runs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Workflow</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Credits</th>
                  <th className="px-6 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {runs.slice(0, 8).map((run) => (
                  <tr key={run.id} className="border-b border-border last:border-0 transition-colors hover:surface-hover">
                    <td className="px-6 py-3 font-medium text-foreground">{getWorkflowName(run.workflow_id)}</td>
                    <td className="px-6 py-3"><StatusBadge status={run.status} /></td>
                    <td className="px-6 py-3 font-mono text-warning">{run.credits_consumed}</td>
                    <td className="px-6 py-3 text-muted-foreground text-xs">{timeAgo(run.started_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {runs.length >= 5 && workflows.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-semibold text-foreground">AI Recommendations</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {generateRecommendations(workflows, runs).map((rec, i) => (
              <div key={i} className="surface-card p-5 hover:-translate-y-0.5 hover:border-[#00E5CC]/20 transition-all duration-300">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{rec.workflow}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${rec.impact === "Critical" ? "badge-failed" : rec.impact === "High" ? "badge-approval" : "badge-running"}`}>
                    {rec.impact}
                  </span>
                </div>
                <p className="mb-3 text-xs text-muted-foreground leading-relaxed">{rec.issue}</p>
                <div className="flex items-start gap-2 rounded-lg bg-background p-3">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                  <p className="text-xs text-secondary">{rec.fix}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {runs.length > 0 && runs.length < 5 && (
        <div className="surface-card border-l-2 border-l-warning p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-sm text-secondary">Run more workflows to unlock AI-powered optimization recommendations.</p>
          </div>
        </div>
      )}

      <WelcomeModal open={showWelcome} onClose={() => setShowWelcome(false)} />
    </motion.div>
  );
}

function buildChartData(runs: { status: string; started_at: string }[]) {
  const buckets: Record<string, { success: number; failed: number }> = {};
  for (const run of runs) {
    const date = new Date(run.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!buckets[date]) buckets[date] = { success: 0, failed: 0 };
    if (run.status === "success") buckets[date].success++;
    else if (run.status === "failed") buckets[date].failed++;
  }
  return Object.entries(buckets)
    .map(([date, counts]) => ({ date, ...counts }))
    .slice(-30);
}

function generateRecommendations(workflows: Workflow[], runs: { status: string; workflow_id: string; credits_consumed: number }[]) {
  const recs: { workflow: string; issue: string; fix: string; impact: string }[] = [];
  for (const wf of workflows) {
    const wfRuns = runs.filter((r) => r.workflow_id === wf.id);
    const failCount = wfRuns.filter((r) => r.status === "failed").length;
    if (wfRuns.length > 0 && failCount / wfRuns.length > 0.3) {
      recs.push({
        workflow: wf.name,
        issue: `Failure rate is ${Math.round((failCount / wfRuns.length) * 100)}% over ${wfRuns.length} runs`,
        fix: "Add retry logic or check integration credentials for failing steps.",
        impact: failCount / wfRuns.length > 0.5 ? "Critical" : "High",
      });
    }
  }
  const bestWf = workflows.reduce((b, w) => w.success_rate > (b?.success_rate ?? 0) ? w : b, workflows[0]);
  if (bestWf && bestWf.success_rate > 90 && recs.length < 3) {
    recs.push({
      workflow: bestWf.name,
      issue: `${bestWf.success_rate}% success rate \u2014 top performing workflow`,
      fix: "Consider using this as a template for similar automation patterns.",
      impact: "Medium",
    });
  }
  return recs.slice(0, 3);
}
