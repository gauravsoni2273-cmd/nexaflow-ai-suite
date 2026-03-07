import { useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Lightbulb, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useWorkflowRuns } from "@/hooks/useWorkflowRuns";
import { useOrg } from "@/hooks/useOrg";
import { formatDuration } from "@/lib/helpers";
import { Skeleton } from "@/components/ui/skeleton";

const tabs = ["7d", "30d", "90d"];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("30d");
  const { workflows, loading: wfLoading } = useWorkflows();
  const { runs, loading: runsLoading } = useWorkflowRuns();
  const { loading: orgLoading } = useOrg();

  const loading = wfLoading || runsLoading || orgLoading;

  const now = Date.now();
  const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const filteredRuns = runs.filter((r) => {
    const diff = now - new Date(r.started_at).getTime();
    return diff <= daysMap[activeTab] * 86400000;
  });

  const chartData = buildChartData(filteredRuns);

  const creditsByWorkflow = workflows
    .map((w) => {
      const wfRuns = runs.filter((r) => r.workflow_id === w.id);
      const totalCredits = wfRuns.reduce((s, r) => s + r.credits_consumed, 0);
      return { name: w.name.length > 20 ? w.name.slice(0, 20) + "\u2026" : w.name, credits: totalCredits };
    })
    .sort((a, b) => b.credits - a.credits)
    .slice(0, 5);

  const totalRuns = filteredRuns.length;
  const successRuns = filteredRuns.filter((r) => r.status === "success").length;
  const avgSuccessRate = totalRuns > 0 ? ((successRuns / totalRuns) * 100).toFixed(1) : "0.0";
  const totalCreditsConsumed = filteredRuns.reduce((s, r) => s + r.credits_consumed, 0);
  const avgExecMs = workflows.length > 0
    ? workflows.reduce((s, w) => s + w.avg_execution_ms, 0) / workflows.length
    : 0;

  const summaryMetrics = [
    { label: "Total Runs", value: totalRuns.toLocaleString() },
    { label: "Credits Consumed", value: totalCreditsConsumed.toLocaleString() },
    { label: "Avg Execution Time", value: avgExecMs > 0 ? formatDuration(avgExecMs) : "\u2014" },
    { label: "Success Rate", value: `${avgSuccessRate}%` },
  ];

  const insights = generateInsights(workflows, runs);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryMetrics.map((m) => (
          <div key={m.label} className="surface-card p-5">
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <>
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <p className="mt-1 text-2xl font-bold font-mono text-foreground">{m.value}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {runs.length === 0 && !loading ? (
        <div className="surface-card flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No analytics data yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Analytics will populate once your workflows start executing. Deploy a workflow to get started.
          </p>
        </div>
      ) : (
        <>
          {chartData.length > 0 && (
            <div className="surface-card p-6">
              <h2 className="mb-4 text-sm font-semibold text-foreground">Execution Volume & Success Rate</h2>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="agSucc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(173,100%,45%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(173,100%,45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,30%,17%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(226,14%,41%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(226,14%,41%)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(224,42%,10%)", border: "1px solid hsl(224,30%,17%)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="total" stroke="hsl(226,14%,60%)" fill="none" strokeWidth={1} strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="success" stroke="hsl(173,100%,45%)" fill="url(#agSucc)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {creditsByWorkflow.length > 0 && creditsByWorkflow.some((c) => c.credits > 0) && (
            <div className="surface-card p-6">
              <h2 className="mb-4 text-sm font-semibold text-foreground">Credits by Workflow (Top 5)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={creditsByWorkflow} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,30%,17%)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(226,14%,41%)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(226,14%,60%)" }} axisLine={false} tickLine={false} width={140} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(224,42%,10%)", border: "1px solid hsl(224,30%,17%)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="credits" fill="hsl(36,100%,64%)" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {workflows.length > 0 && (
            <div className="surface-card overflow-x-auto">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-sm font-semibold text-foreground">Workflow Health</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Workflow</th>
                    <th className="px-6 py-3 font-medium">Success Rate</th>
                    <th className="px-6 py-3 font-medium">Avg Duration</th>
                    <th className="px-6 py-3 font-medium">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {workflows.map((w) => {
                    const healthScore = Math.round(w.success_rate * 0.95);
                    return (
                      <tr key={w.id} className="border-b border-border last:border-0 transition-colors hover:surface-hover">
                        <td className="px-6 py-3 font-medium text-foreground">{w.name}</td>
                        <td className="px-6 py-3 font-mono text-primary">{w.success_rate}%</td>
                        <td className="px-6 py-3 font-mono text-muted-foreground">{formatDuration(w.avg_execution_ms)}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <Progress value={healthScore} className={`h-1.5 w-16 bg-secondary [&>div]:${healthScore > 80 ? "bg-primary" : healthScore > 60 ? "bg-warning" : "bg-destructive"}`} />
                            <span className={`font-mono text-xs ${healthScore > 80 ? "text-primary" : healthScore > 60 ? "text-warning" : "text-destructive"}`}>{healthScore}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {insights.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-semibold text-foreground">AI Insights</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {insights.map((insight, i) => (
              <div key={i} className="surface-card border-l-2 border-l-warning p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <p className="text-sm text-secondary leading-relaxed">{insight}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function buildChartData(runs: { status: string; started_at: string }[]) {
  const buckets: Record<string, { success: number; total: number }> = {};
  for (const run of runs) {
    const date = new Date(run.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!buckets[date]) buckets[date] = { success: 0, total: 0 };
    buckets[date].total++;
    if (run.status === "success") buckets[date].success++;
  }
  return Object.entries(buckets).map(([date, counts]) => ({ date, ...counts }));
}

function generateInsights(workflows: { name: string; success_rate: number }[], runs: { credits_consumed: number }[]) {
  const insights: string[] = [];
  if (workflows.length === 0) return insights;
  const bestWorkflow = workflows.reduce((best, w) => w.success_rate > (best?.success_rate ?? 0) ? w : best, workflows[0]);
  if (bestWorkflow && bestWorkflow.success_rate > 90) {
    insights.push(`${bestWorkflow.name} has a ${bestWorkflow.success_rate}% success rate \u2014 consider using it as a template for other workflows.`);
  }
  const worstWorkflow = workflows.reduce((worst, w) => w.success_rate < (worst?.success_rate ?? 100) ? w : worst, workflows[0]);
  if (worstWorkflow && worstWorkflow.success_rate < 80) {
    insights.push(`${worstWorkflow.name} has a low success rate (${worstWorkflow.success_rate}%). Consider adding error handling or retry logic.`);
  }
  const totalCredits = runs.reduce((s, r) => s + r.credits_consumed, 0);
  if (totalCredits > 0) {
    insights.push(`Total credit consumption: ${totalCredits.toLocaleString()} credits. Monitor usage to optimize costs.`);
  }
  return insights;
}
