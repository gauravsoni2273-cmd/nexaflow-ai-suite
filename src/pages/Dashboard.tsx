import { Link } from "react-router-dom";
import { Activity, Zap, CheckCircle, Coins, TrendingUp, BarChart3, Plus } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useWorkflowRuns } from "@/hooks/useWorkflowRuns";
import { useOrg } from "@/hooks/useOrg";
import { Skeleton } from "@/components/ui/skeleton";

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

function EmptyState({ title, description, actionLabel, actionHref }: { title: string; description: string; actionLabel?: string; actionHref?: string }) {
  return (
    <div className="surface-card flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <BarChart3 className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && actionHref && (
        <Link to={actionHref}>
          <Button className="mt-4 gradient-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { workflows, loading: wfLoading } = useWorkflows();
  const { runs, loading: runsLoading } = useWorkflowRuns();
  const { org, loading: orgLoading } = useOrg();

  const activeCount = workflows.filter((w) => w.status === "active").length;
  const creditBalance = org?.credit_balance ?? 0;
  const creditLimit = org?.monthly_credit_limit ?? 500;

  const avgSuccessRate = workflows.length > 0
    ? (workflows.reduce((sum, w) => sum + w.success_rate, 0) / workflows.length).toFixed(1)
    : "0.0";

  const runSparkline = runs.length > 1
    ? runs.slice(0, 12).map((r) => r.credits_consumed).reverse()
    : undefined;

  const metrics = [
    { label: "Active Workflows", value: String(activeCount), trend: activeCount > 0 ? `+${activeCount}` : undefined, icon: Activity },
    { label: "Runs Today", value: String(runs.length), sparkline: runSparkline, icon: Zap },
    { label: "Success Rate", value: `${avgSuccessRate}%`, icon: CheckCircle },
    { label: "Credits Remaining", value: creditBalance.toLocaleString(), total: creditLimit, remaining: creditBalance, icon: Coins },
  ];

  const loading = wfLoading || runsLoading || orgLoading;
  const chartData = runs.length > 0 ? buildChartData(runs) : [];
  const getWorkflowName = (wfId: string) => workflows.find((w) => w.id === wfId)?.name ?? "Unknown Workflow";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="surface-card p-5">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{m.label}</span>
                  <m.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-2xl font-bold font-mono text-foreground">{m.value}</span>
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
                    <Progress value={m.total > 0 ? (m.remaining! / m.total) * 100 : 0} className="h-1.5 bg-secondary [&>div]:bg-warning" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-mono text-warning">{m.remaining!.toLocaleString()}</span> / {m.total.toLocaleString()}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="surface-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Workflow Executions (30 Days)</h2>
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
      ) : !loading ? (
        <EmptyState
          title="No execution data yet"
          description="Deploy your first workflow to see execution charts and analytics here."
          actionLabel="Create Workflow"
          actionHref="/dashboard/workflows/new"
        />
      ) : null}

      {/* Recent Runs Table */}
      {runs.length > 0 ? (
        <div className="surface-card">
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
                    <td className="px-6 py-3 text-muted-foreground">{new Date(run.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <span className="text-xs text-muted-foreground">Showing {Math.min(8, runs.length)} runs</span>
          </div>
        </div>
      ) : !loading ? (
        <EmptyState
          title="No workflow runs yet"
          description="Your recent workflow executions will appear here once you deploy and run a workflow."
          actionLabel="Create Workflow"
          actionHref="/dashboard/workflows/new"
        />
      ) : null}
    </div>
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
